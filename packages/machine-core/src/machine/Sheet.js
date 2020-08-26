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
const Cell = require('./Cell');
const NamedCells = require('./NamedCells');
const GraphCells = require('./GraphCells');
const PropertiesManager = require('./PropertiesManager');
const ReferenceUpdater = require('./ReferenceUpdater');
const SheetIndex = require('./SheetIndex');
const SheetRange = require('./SheetRange');
const SheetProcessor = require('./SheetProcessor');
const State = require('../State');
const { SheetDrawings, SheetParser } = require('../parser/SheetParser');
const { getSheetCellsAsObject } = require('../ipc/utils');
const { updateArray } = require('../utils');


const setRowsAt = (rowidx, rows, prerows) => {
	if (!rows[rowidx]) {
		rows[rowidx] = [];
	}
	if (!prerows[rowidx]) {
		prerows[rowidx] = [];
	}
};
const toIndex = (idx) => (typeof idx === 'string' ? SheetIndex.create(idx) : idx);
const toColIndex = (idx) => (typeof idx === 'object' ? idx.col : idx); //  - 1 : idx);
const toRowIndex = (idx) => (typeof idx === 'object' ? idx.row : idx); //  - 1 : idx);

const isValidRowIdx = (settings) => (row) => row >= settings.minrow && row <= settings.maxrow;
const isValidColIdx = (settings) => (col) => col >= settings.mincol && col <= settings.maxcol;
const isValidCellIdx = (isValidRow, isValidCol) => (row, col) => isValidRow(row) && isValidCol(col);

const rowAt = (index, sheet) => {
	const colidx = index ? index.col : 0;
	const rowidx = toRowIndex(index);
	if (sheet.isValidCellIndex(rowidx, colidx)) {
		setRowsAt(rowidx, sheet._rows, sheet._prerows);
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
const updateLastIndex = (newrow, newcol, lastIndex) => {
	lastIndex.set(Math.max(newrow, lastIndex.row), Math.max(newcol, lastIndex.col));
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

const machineState = sheet => sheet.machine && sheet.machine.state;

const copyCell = (orgcell, action, sheet) => {
	const value = orgcell.value;
	const term = action === 'values' || !orgcell.hasFormula
		? SheetParser.parseValue(value, sheet)
		: SheetParser.parse(orgcell.formula || value, sheet);
	return action === 'formulas' ? new Cell(undefined, term) : new Cell(value, term);
};
const collectCells = (trgtSheet, cells, srcSheetProps, action) => (cell, index) => {
	// collect source rows cells, with props inclusive
	const cp = cell && action !== 'formats' ? copyCell(cell, action, trgtSheet) : undefined;
	const props =
		action === 'formats' || action === 'all'
			? srcSheetProps.getCellProperties(index.row, index.col).toDiffsProperties()
			: undefined;
	if (cp || props) cells.push({ cp, props, row: index.row, col: index.col });
};
const removeCells = (sheet, rows, cols) => {
	const cellidx = SheetIndex.create(1, 0);
	for (let row = rows.start; row < rows.end; row += 1) {
		for (let col = cols.start; col < cols.end; col += 1) {
			cellidx.set(row, col);
			sheet.setCellAt(cellidx, undefined);
		}
	}
};
const doPasteCells = (cells, fromSheet, toSheet, offset, { cut, action = 'all' } = {}) => {
	const cellidx = SheetIndex.create(0, 0);
	cells.forEach((cell) => {
		cellidx.set(cell.row + offset.row, cell.col + offset.col);
		if (toSheet.isValidCellIndex(cellidx.row, cellidx.col)) {
			if (cell.cp) ReferenceUpdater.updateCell(cell.cp, offset);
			if (action !== 'formats') toSheet._doSetCellAt(cellidx, cell.cp);
			if (cell.props) {
				toSheet.properties.setCellProperties(cellidx.row, cellidx.col, cell.props);
			}
		}
		// delete source cell on cut:
		cellidx.set(cell.row, cell.col);
		if (cut) fromSheet._doSetCellAt(cellidx, undefined);
	});
};


const DEF_CONF = {
	// precolumns: ['IF', 'COMMENT'], <-- THINK ABOUT ADDING THIS!!
	settings: {
		minrow: 1,
		maxrow: 100,
		mincol: -SheetIndex.PRE_COLUMNS.length,
		maxcol: 50,
		protected: false
	},
	cells: {}
};

module.exports = class Sheet {
	constructor(streamsheet, config = {}) {
		this._rows = [];
		this._prerows = [];
		this.settings = Object.assign({}, DEF_CONF.settings, config.settings);
		this.streamsheet = streamsheet;
		this.namedCells = new NamedCells();
		this.graphCells = new GraphCells(this);
		this.processor = new SheetProcessor(this);
		this.sheetDrawings = new SheetDrawings();
		this.onUpdate = undefined;
		this.onCellRangeChange = undefined;
		// support request function:
		this._pendingRequests = new Map(); /* id, promise */
		// exists only to shrink sheet correctly after processing it. can we do better?
		this._lastInsertIndex = SheetIndex.create(1, 0);
		// tmp. => need a better mechanism...
		this._forceExecution = false;
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
		json.graphCells = this.graphCells.getDescriptors();
		json.properties = this.properties.toJSON();
		json.settings = { ...this.settings };
		return json;
	}

	get isProcessing() {
		return this.processor._isProcessing || this._forceExecution;
	}
	get isPaused() {
		return this.processor.isPaused;
	}
	get isResumed() {
		return this.processor.isResumed;
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
		this.graphCells.clear();
	}
	_clearCells() {
		// we are only called if cell != null
		this.iterate((cell) => cell.dispose());
		this._rows = [];
		this._prerows = [];
		this._pendingRequests.clear();
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
		this.settings = settings != null ? Object.assign(this.settings, settings) : this.settings;
		if (maxcol !== this.settings.maxcol || maxrow !== this.settings.maxrow) {
			boundCells(this._rows, this._prerows, this.settings.maxcol, this.settings.maxrow);
			// REVIEW: additional event to notify about cell bounds change! => need to persist with adjusted cells...
			if (this.onCellRangeChange) this.onCellRangeChange();
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

	deleteColumnsAt(index, count = 1) {
		const colidx = toColIndex(index);
		// prevent IF column from being deleted...
		const doIt = colidx >= 0 && this.isInColRange(colidx); // do not check count since remove is always possible...
		if (doIt) {
			// currently only pos. indices are allowed => no prerows adjust necessary
			this._rows.forEach((row) => row && updateArray(row, colidx, -count));
			// update refs & properties:
			ReferenceUpdater.updateColumn(this, colidx, -count);
			this.properties.onUpdateColumnsAt(index, -count);
		}
		return doIt; // return deleted row??
	}
	insertColumnsAt(index, count = 1) {
		const colidx = toColIndex(index);
		const doIt = colidx >= 0 && this.isInColRange(colidx) && this.isInColRange(this._lastInsertIndex.col + count);
		if (doIt) {
			// currently only pos. indices are allowed => no prerows adjust necessary
			this._rows.forEach((row) => row && updateArray(row, colidx, count));
			// update refs & properties:
			ReferenceUpdater.updateColumn(this, colidx, count);
			this.properties.onUpdateColumnsAt(index, count);
		}
		return doIt;
	}
	deleteRowsAt(index, count = 1) {
		const rowidx = toRowIndex(index);
		const doIt = this.isInRowRange(rowidx); // do not check count since remove is always possible...
		if (doIt) {
			updateArray(this._rows, rowidx, -count);
			updateArray(this._prerows, rowidx, -count);
			// update refs & properties:
			ReferenceUpdater.updateRow(this, rowidx, -count);
			this.properties.onUpdateRowsAt(index, -count);
		}
		return doIt; // return deleted row??
	}
	insertRowsAt(index, count = 1) {
		const rowidx = toRowIndex(index);
		const doIt = this.isInRowRange(rowidx) && this.isInRowRange(this._lastInsertIndex.row + count);
		if (doIt) {
			updateArray(this._rows, rowidx, count);
			updateArray(this._prerows, rowidx, count);
			// update refs & properties:
			ReferenceUpdater.updateRow(this, rowidx, count);
			this.properties.onUpdateRowsAt(index, count);
		}
		return doIt;
	}

	deleteCells(range, move = 'up') {
		const toIdx = SheetIndex.create(0, 0);
		const fromIdx = SheetIndex.create(0, 0);
		const offset = { row: 0, col: 0 };
		const cellrange = {
			startrow: range.start.row, endrow: range.end.row,
			startcol: range.start.col, endcol: range.end.col
		};
		const refRange = SheetRange.fromStartEnd(range.start, range.end);
		if (move === 'up') {
			offset.row = -range.height;
			cellrange.startrow = range.end.row + 1;
			cellrange.endrow = this.settings.maxrow;
			refRange.end.set(this.settings.maxrow);
		} else { // left
			offset.col = -range.width;
			cellrange.startcol = range.end.col + 1;
			cellrange.endcol = this.settings.maxcol;
			refRange.end.set(range.end.row, this.settings.maxcol);
		}

		// remove cells:
		range.iterate((cell, index) => this._doSetCellAt(index, undefined));
		// move all cells
		for (let row = cellrange.startrow; row <= cellrange.endrow; row += 1) {
			for (let col = cellrange.startcol; col <= cellrange.endcol; col += 1) {
				fromIdx.set(row, col);
				toIdx.set(fromIdx.row + offset.row, fromIdx.col + offset.col);
				const cell = this.cellAt(fromIdx.set(row, col));
				const props = this.properties.getCellProperties(fromIdx.row, fromIdx.col).toDiffsProperties();
				// properties must be set, even if there is no cell...
				this.properties.setCellProperties(toIdx.row, toIdx.col, props);
				if (cell) {
					// move this cell up...
					this._doSetCellAt(toIdx, cell);
					this._doSetCellAt(fromIdx, undefined, true);
				}
			}
		}
		// adjust references:
		ReferenceUpdater.updateAllCellReferences(this, refRange, offset);
	}

	insertCells(range, move = 'bottom') {
		const toIdx = SheetIndex.create(0, 0);
		const fromIdx = SheetIndex.create(0, 0);
		const offset = { row: 0, col: 0 };
		const cellrange = {
			startrow: range.start.row, endrow: range.end.row,
			startcol: range.start.col, endcol: range.end.col
		};
		const refRange = SheetRange.fromStartEnd(range.start, range.end);
		if (move === 'down') {
			offset.row = range.height;
			cellrange.endrow = this.settings.maxrow;
			refRange.end.set(this.settings.maxrow);
		} else { // right
			offset.col = range.width;
			cellrange.endcol = this.settings.maxcol;
			refRange.end.set(range.end.row, this.settings.maxcol);
		}

		// move all cells
		for (let row = cellrange.endrow; row >= cellrange.startrow; row -= 1) {
			for (let col = cellrange.endcol; col >= cellrange.startcol; col -= 1) {
				fromIdx.set(row, col);
				toIdx.set(fromIdx.row + offset.row, fromIdx.col + offset.col);
				const cell = this.cellAt(fromIdx.set(row, col));
				const props = this.properties.getCellProperties(fromIdx.row, fromIdx.col).toDiffsProperties();
				// properties must be set, even if there is no cell...
				this.properties.setCellProperties(toIdx.row, toIdx.col, props);
				if (cell) {
					// move this cell up...
					this._doSetCellAt(toIdx, cell);
					this._doSetCellAt(fromIdx, undefined, true);
				}
			}
		}
		// clear cell properties:
		range.iterate((cell, index) => this.properties.clearCellProperties(index.row, index.col));
		// adjust references:
		ReferenceUpdater.updateAllCellReferences(this, refRange, offset);
	}
	pasteCells(srcrange, trgtrange, options = {}) {
		const start = trgtrange.start;
		const trgtsheet = trgtrange.sheet;
		const { action = 'all' } = options;
		if (trgtsheet.isValidCellIndex(start.row, start.col)) {
			const offset = { row: start.row - srcrange.start.row, col: start.col - srcrange.start.col };
			// store original cells+properties before paste!!
			const cells = [];
			const collectCell = collectCells(trgtsheet, cells, this.properties, action);
			srcrange.iterate(collectCell);
			// paste cells
			doPasteCells(cells, this, trgtsheet, offset, options);
		}
	}
	pasteColumns(srcrange, trgtrange, options = {}) {
		const trgtCol = trgtrange.start.col;
		const trgtsheet = trgtrange.sheet;
		if (trgtsheet.isInColRange(trgtCol)) {
			const colcells = [];
			const colprops = [];
			const { cut, action = 'all' } = options;
			const offset = { row: 0, col: trgtCol - srcrange.start.col };
			const collectCell = collectCells(trgtsheet, colcells, this.properties, action);
			srcrange.iterateByCol((cell, index, nextcol) => {
				// collect source columns props
				if (nextcol && (action === 'formats' || action === 'all')) {
					const props = this.properties.getColumnProperties(index.col).toDiffsProperties();
					colprops.push({ props, col: index.col });
				}
				collectCell(cell, index);
			});
			// paste column props
			colprops.forEach(({ props, col }) => {
				trgtsheet.properties.setColumnProperties(col + offset.col, props);
				// clear props on cut...
				if (cut) this.properties.clearColumnRowProperties(col);
			});
			// remove target cells:
			if (action !== 'formats') {
				removeCells(
					trgtsheet,
					{ start: trgtsheet.settings.minrow, end: trgtsheet.settings.maxrow + 1 },
					{ start: trgtCol, end: trgtCol + srcrange.end.col - srcrange.start.col }
				);
			}
			// paste cells
			doPasteCells(colcells, this, trgtsheet, offset, options);
		}
	}
	pasteRows(srcrange, trgtrange, options = {}) {
		const trgtRow = trgtrange.start.row;
		const trgtsheet = trgtrange.sheet;
		if (trgtsheet.isInRowRange(trgtRow)) {
			const rowcells = [];
			const rowprops = [];
			const { cut, action = 'all' } = options;
			const offset = { row: trgtRow - srcrange.start.row, col: 0 };
			const collectCell = collectCells(trgtsheet, rowcells, this.properties, action);
			srcrange.iterate((cell, index, nextrow) => {
				// collect source rows props
				if (nextrow && (action === 'formats' || action === 'all')) {
					const props = this.properties.getRowProperties(index.row).toDiffsProperties();
					rowprops.push({ props, row: index.row });
				}
				collectCell(cell, index, action);
			});
			// paste row props
			rowprops.forEach(({ props, row }) => {
				trgtsheet.properties.setRowProperties(row + offset.row, props);
				// clear props on cut...
				if (cut) this.properties.clearRowProperties(row);
			});
			// remove target cells:
			if (action !== 'formats') {
				removeCells(
					trgtsheet,
					{ start: trgtRow, end: trgtRow + srcrange.end.row - srcrange.start.row },
					{ start: trgtsheet.settings.mincol, end: trgtsheet.settings.maxcol + 1 }
				);
			}
			// paste cells
			doPasteCells(rowcells, this, trgtsheet, offset, options);
		}
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
				if (cell != null) {
					cell.init(idx.row, idx.col);
					updateLastIndex(idx.row, colidx, this._lastInsertIndex);
				}
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
		if (this.onUpdate && !this.isProcessing && machineState(this) !== State.RUNNING) {
			this.onUpdate(cell, indexORname);
		}
	}

	setCells(cells = {}) {
		const keys = Object.keys(cells);
		if (keys.length) {
			const cellindex = SheetIndex.create(1, 0);
			const onUpdate = disableNotifyUpdate(this);
			keys.forEach((key) => {
				cellindex.set(key);
				const cell = SheetParser.createCell(cells[key], this);
				if (cell && cell.isDefined) {
					this._doSetCellAt(cellindex, cell);
				}
			});
			enableNotifyUpdate(this, onUpdate, true);
		}
	}

	load(conf = {}) {
		// prevent event on load:
		const onUpdate = disableNotifyUpdate(this);
		// settings is used in closure, so never overwrite it!!
		this.settings = Object.assign(this.settings, DEF_CONF.settings, conf.settings);
		// include editable-web-component:
		// this.properties = this.properties.load(conf.properties);
		// load names first, they may be referenced by sheet cells...
		this.namedCells.load(this, conf.namedCells);
		this.graphCells.load(this, conf.graphCells);
		this.loadCells(conf.cells);
		enableNotifyUpdate(this, onUpdate);
		return this;
	}

	loadCells(cells = {}) {
		this._clearCells();
		this.setCells(cells);
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

	startProcessing() {
		this._lastInsertIndex.set(1, 0);
		return this.processor.start();
	}

	pauseProcessing() {
		this.processor.pause();
	}

	resumeProcessing() {
		this.processor.resume();
	}

	// optional return value
	stopProcessing(retvalue) {
		this.processor.stop(retvalue);
	}

	continueProcessingAt(cellindex) {
		return this.processor.continueAt(cellindex);
	}

	getDrawings() {
		return this.sheetDrawings;
	}

	getPendingRequests() {
		return this._pendingRequests;
	}
};
