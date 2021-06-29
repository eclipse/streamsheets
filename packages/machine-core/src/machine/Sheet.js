/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const {	functions: { compose } } = require('@cedalo/commons');
const State = require('../State');
const { getSheetCellsAsObject } = require('../ipc/utils');
const { SheetParser } = require('../parser/SheetParser');
const Cell = require('./Cell');
const NamedCells = require('./NamedCells');
const Shapes = require('./Shapes');
const PropertiesManager = require('./PropertiesManager');
const SheetIndex = require('./SheetIndex');
const SheetProcessor = require('./SheetProcessor');
// const { updateArray } = require('../utils');
const SheetRequests = require('./SheetRequests');
const SheetEdit = require('./SheetEdit');

const ensureRowAt = (rowidx, rows) => {
	if (!rows[rowidx]) rows[rowidx] = [];
};
const toIndex = (idx) => (typeof idx === 'string' ? SheetIndex.create(idx) : idx);
// const toColIndex = (idx) => (typeof idx === 'object' ? idx.col : idx); //  - 1 : idx);
const toRowIndex = (idx) => (typeof idx === 'object' ? idx.row : idx); //  - 1 : idx);

const isValidRowIdx = (settings) => (row) => row >= settings.minrow && row <= settings.maxrow;
const isValidColIdx = (settings) => (col) => col >= settings.mincol && col <= settings.maxcol;
const isValidCellIdx = (isValidRow, isValidCol) => (row, col) => isValidRow(row) && isValidCol(col);

const rowAt = (index, sheet) => {
	const colidx = index ? index.col : 0;
	const rowidx = toRowIndex(index);
	if (sheet.isValidCellIndex(rowidx, colidx)) {
		ensureRowAt(rowidx, sheet._rows);
		ensureRowAt(rowidx, sheet._prerows);
		return colidx < 0 ? sheet._prerows[rowidx] : sheet._rows[rowidx];
	}
	return undefined;
};

const notify = (callback, cell, rowidx, colidx) => cell && callback(cell, rowidx, colidx);
const disableNotifyUpdate = (sheet) => {
	const onUpdate = sheet.onUpdate;
	sheet.onUpdate = undefined;
	return onUpdate;
};
const enableNotifyUpdate = (sheet, onUpdate, doNotify = false) => {
	sheet.onUpdate = onUpdate;
	if (doNotify) sheet._notifyUpdate();
};

const boundCells = (rows, prerows, maxcol, maxrow) => {
	const maxRowLength = maxrow + 1;
	const maxColLength = maxcol + 1;
	if (rows.length > maxRowLength) {
		rows.length = maxRowLength;
		prerows.length = maxRowLength;
	}
	rows.forEach((row) => {
		if (row.length > maxColLength) row.length = maxColLength;
	});
};

const isMachineProcessing = (machine) => machine && machine.state === State.RUNNING;


const DEF_CONF = {
	// precolumns: ['IF', 'COMMENT'], <-- THINK ABOUT ADDING THIS!!
	settings: {
		maxchars: 1000,
		minrow: 1,
		maxrow: 100,
		mincol: -SheetIndex.PRE_COLUMNS.length,
		maxcol: 50,
		protected: false
	},
	cells: {}
};

class Sheet {
	constructor(streamsheet, config = {}) {
		this._rows = [];
		this._prerows = [];
		this.settings = Object.assign({}, DEF_CONF.settings, config.settings);
		this.streamsheet = streamsheet;
		this.namedCells = new NamedCells();
		this.shapes = new Shapes(this);
		this.processor = new SheetProcessor(this);
		this.onUpdate = undefined;
		this.onCellRangeChange = undefined;
		// tmp. => need a better mechanism...
		this._forceExecution = false;
		this._isProcessing = false;
		// properties
		this.properties = PropertiesManager.of(this, config.properties);
		// helper functions:
		this.isInColRange = isValidColIdx(this.settings);
		this.isInRowRange = isValidRowIdx(this.settings);
		this.isValidCellIndex = isValidCellIdx(this.isInRowRange, this.isInColRange);
	}

	toJSON() {
		const json = {};
		json.cells = getSheetCellsAsObject(this);
		json.namedCells = this.namedCells.getDescriptors();
		json.shapes = this.shapes.toJSON();
		json.properties = this.properties.toJSON();
		json.settings = { ...this.settings };
		return json;
	}

	get isPaused() {
		return this.processor.isPaused;
	}
	get isProcessed() {
		return !this.processor.isStarted || this.processor.isProcessed;
	}
	get isProcessing() {
		return this._isProcessing || this._forceExecution;
	}
	get isReady() {
		return this.processor.isReady;
	}

	get machine() {
		return this.streamsheet ? this.streamsheet.machine : undefined;
	}

	// tmp. need a better solution for this!!!
	forceExecution(doIt) {
		const oldvalue = this._forceExecution;
		this._forceExecution = doIt;
		return oldvalue;
	}

	clear() {
		this._clearCells();
		this.namedCells.clear();
	}
	_clearCells() {
		// we are only called if cell != null
		this.iterate((cell) => cell.dispose());
		this._rows = [];
		this._prerows = [];
	}

	executeFunctions(fns) {
		// some functions only works if machine runs...
		const force = this.forceExecution(true);
		const res = fns.map((fn) => fn.value);
		this.forceExecution(force);
		return res;
	}

	updateSettings(settings) {
		const { maxcol, maxrow } = this.settings;
		if (settings != null) {
			this.settings = Object.assign(this.settings, settings);
			if (!settings.maxchars) this.settings.maxchars = -1;
			if (maxcol !== this.settings.maxcol || maxrow !== this.settings.maxrow) {
				boundCells(this._rows, this._prerows, this.settings.maxcol, this.settings.maxrow);
				// REVIEW: additional event to notify about cell bounds change! => need to persist with adjusted cells...
				if (this.onCellRangeChange) this.onCellRangeChange();
			}
		}
	}

	dispose() {
		this.clear();
	}

	isEmpty() {
		return this._rows.length < 1 && this._prerows.length < 1;
	}

	isValidIndex(index) {
		return index ? this.isValidCellIndex(toRowIndex(index), index.col) : false;
	}

	// index: string or index object
	cellAt(index, createIt) {
		const idx = toIndex(index);
		if (!idx) {
			return undefined;
		}

		const row = rowAt(idx, this);
		const colidx = idx.col < 0 ? Math.abs(idx.col) - 1 : idx.col;
		let cell = row && row[colidx];
		if (!cell && createIt) {
			cell = new Cell();
			this.setCellAt(index, cell);
		}

		return cell;
	}

	moveCell(fromIdx, toIdx) {
		this.setCellAt(toIdx, this.cellAt(fromIdx));
		this._doSetCellAt(fromIdx, undefined, true);
	}

	// note: inserts cell if none exists at specified index!!
	setCellAt(index, cell, skipDisposeOld) {
		const didIt = this._doSetCellAt(index, cell, skipDisposeOld);
		if (didIt) {
			// evaluate once?
			// this.iterate(cell => cell && cell.evaluate());
			this._notifyUpdate(cell, index);
		}
		return didIt;
	}
	_doSetCellAt(index, cell, skipDisposeOld) {
		const idx = toIndex(index);
		const row = rowAt(idx, this);
		let doIt = !!row;
		if (doIt) {
			const colidx = idx.col < 0 ? Math.abs(idx.col) - 1 : idx.col;
			const oldcell = row[colidx];
			doIt = oldcell !== cell;
			if (doIt) {
				if (oldcell && !skipDisposeOld) oldcell.dispose();
				// add cell first...
				row[colidx] = cell;
				// ...before init, since it may reference itself
				if (cell != null) cell.init(idx.row, idx.col, this);
			}
		}
		return doIt;
	}

	// TODO: think it is better to use it from outside, i.e. by object which did change sheet!!!
	_notifyUpdate(cell, indexORname) {
		// ignore notification if we process sheet, its not required because cells are send via streamsheet step event
		//  => think of removing update listener completely -> can we go with a simple dirty flag?
		//  => it looks like this was added to handle a sheet refresh on client if a single cell was entered, which
		//      might causes other cells to change too...
		// if (this.onUpdate && !this.isProcessing && machineState(this) !== State.RUNNING) {
		if (this.onUpdate && !this.isProcessing && !isMachineProcessing(this.machine)) {
			this.onUpdate(cell, indexORname);
		}
	}

	setCells(cells = {}) {
		const entries = Object.entries(cells);
		if (entries.length) {
			const cellindex = SheetIndex.create(1, 0);
			const onUpdate = disableNotifyUpdate(this);
			entries.forEach(([key, descr]) => {
				cellindex.set(key);
				const cell = descr != null ? SheetParser.createCell(cells[key], this) : undefined;
				if (!cell) this._doSetCellAt(cellindex, undefined);
				else if (cell.isDefined) this._doSetCellAt(cellindex, cell);
			});
			enableNotifyUpdate(this, onUpdate, true);
		}
	}

	load(conf = {}) {
		// prevent event on load:
		const onUpdate = disableNotifyUpdate(this);
		const settings = conf.settings;
		if (settings) {
			// maxchars for existing machines
			if (settings.maxchars == null) settings.maxchars = -1;
			// settings is used in closure, so never overwrite it!!
			this.settings = Object.assign(this.settings, DEF_CONF.settings, settings);
		}
		// include editable-web-component:
		// this.properties = this.properties.load(conf.properties);
		// load names first, they may be referenced by sheet cells...
		this.namedCells.load(this, conf.namedCells);
		this.shapes.fromJSON(conf.shapes);
		this.loadCells(conf.cells);
		enableNotifyUpdate(this, onUpdate);
		return this;
	}

	loadCells(cells = {}) {
		this._clearCells();
		this.setCells(cells);
		this.processor.reset();
		return this;
	}

	iterate(callback) {
		const rows = this._rows;
		const prerows = this._prerows;
		const last = rows.length;
		for (let r = 0; r < last; r += 1) {
			// have to iterate pre-rows in reverse order...
			const prerow = prerows[r];
			if (prerow) {
				for (let c = prerow.length; c > 0; c -= 1) {
					notify(callback, prerow[c - 1], r, -c);
				}
			}
			const row = rows[r];
			if (row) {
				for (let c = 0; c < row.length; c += 1) {
					notify(callback, row[c], r, c);
				}
			}
		}
	}

	// ALL xxxPROCESSING methods should be package private!! because they should be called via StreamSheet to
	// correctly notify trigger too!
	_continueProcessingAt(cellindex) {
		this.processor.continueAt(cellindex);
	}
	_stopProcessing(retvalue) {
		this.processor.stop(retvalue);
	}
	_startProcessing() {
		this._isProcessing = true;
		this.processor.start();
		this._isProcessing = false;
	}
	_pauseProcessing() {
		this.processor.pause();
	}
	_resumeProcessing(retval) {
		this.processor.resume(retval);
	}

	getShapes() {
		return this.shapes;
	}
}

// module.exports = SheetRequests(Sheet);
module.exports = compose(
	SheetEdit,
	SheetRequests
)(Sheet);
