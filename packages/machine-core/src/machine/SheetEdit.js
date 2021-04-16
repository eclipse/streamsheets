/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { SheetParser } = require('../parser/SheetParser');
const { isEmptyCellDescriptor, isEmptyObject, updateArray } = require('../utils');
const Cell = require('./Cell');
const ReferenceUpdater = require('./ReferenceUpdater');
const SheetIndex = require('./SheetIndex');
const SheetRange = require('./SheetRange');

const toColIndex = (idx) => (typeof idx === 'object' ? idx.col : idx); //  - 1 : idx);
const toRowIndex = (idx) => (typeof idx === 'object' ? idx.row : idx); //  - 1 : idx);

const copyCell = (orgcell, action, sheet) => {
	const value = orgcell.value;
	const term =
		action === 'values' || !orgcell.hasFormula
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
const mapCell = (action) => (descriptor) => {
	const { reference } = descriptor;
	const value = action === 'values' || action === 'all' ? descriptor.value : null;
	const formula = action === 'formulas' || action === 'all' ? descriptor.formula : null;
	const properties = action === 'formats' || action === 'all' ? descriptor.properties : null;
	return { index: SheetIndex.create(reference), reference, formula, properties, value };
};
const descriptorSorter = ({ index: index1 }, { index: index2 }) => {
	const row = index1.row - index2.row;
	const col = index1.col - index2.col;
	return row !== 0 ? row : col;
};

const assignDescriptor = (descr = {}, fromDescr = {}) => {
	const newdescr = {};
	const { formula, properties, value } = descr;
	newdescr.value = value === null ? fromDescr.value : value;
	newdescr.formula = formula === null ? fromDescr.formula : formula;
	newdescr.properties = properties === null ? fromDescr.properties : properties;
	newdescr.updateRefs = formula != null;
	return newdescr;
};
const cutCells = (descriptors, sheet) => {
	const cells = [];
	descriptors.forEach((descr) => {
		const { formula, value } = sheet.cellAt(descr.index) || {};
		const reference = descr.index.toString();
		const properties = sheet.properties.getCellProperties(descr.index.row, descr.index.col).toJSON();
		cells.push({ reference, formula, value, properties: isEmptyObject(properties) ? undefined : properties });
		sheet._doSetCellAt(descr.index, undefined);
	});
	return cells;
};
const pushDescriptors = (descriptors, toArray) => (offset) => {
	descriptors.forEach((descr) => {
		const { index, formula, properties, value } = descr;
		const idx = index.copy().add(offset.row, offset.col);
		toArray.push({ index: idx, formula, properties, value });
	});
};

const doPasteCells2 = (descriptors, toRange, fromSheet, { cut, extend }) => {
	const toSheet = toRange.sheet;
	const toStart = toRange.start;
	const fromStart = descriptors[0].index;
	const fromEnd = descriptors[descriptors.length - 1].index;
	const offset = { row: toStart.row - fromStart.row, col: toStart.col - fromStart.col };
	const pastecells = [];
	const pushDescriptorsWithOffset = pushDescriptors(descriptors, pastecells);
	const round = extend ? Math.ceil : Math.floor;
	const srcWidth = fromEnd.col - fromStart.col + 1;
	const srcHeight = fromEnd.row - fromStart.row + 1;
	const repeatHor = Math.max(round(toRange.width / srcWidth), 1);
	const repeatVer = Math.max(round(toRange.height / srcHeight), 1);
	let row = offset.row;
	for (let r = 0; r < repeatVer; r += 1) {
		row += r * srcHeight;
		for (let c = 0; c < repeatHor; c += 1) {
			pushDescriptorsWithOffset({ row, col: offset.col + c * srcWidth });
		}
	}
	// finally paste
	const result = {};
	result.targetsheetId = toSheet.streamsheet.id;
	result.cellsCut = cut ? cutCells(descriptors, fromSheet) : [];
	result.cellsPasted = pastecells;
	result.cellsReplaced = pastecells.map((descr) => {
		const index = descr.index;
		const { formula, value } = toSheet.cellAt(index) || {};
		const olddescr = { reference: index.toString(), formula, value };
		const newdescr = assignDescriptor(descr, olddescr);
		const pastecell = isEmptyCellDescriptor(newdescr) ? undefined : SheetParser.createCell(newdescr, toSheet);
		if (pastecell && newdescr.updateRefs) ReferenceUpdater.updateCell(pastecell, offset);
		toSheet._doSetCellAt(index, pastecell);
		if (newdescr.properties) {
			const properties = toSheet.properties.getCellProperties(index.row, index.col).toJSON();
			toSheet.properties.setCellProperties(index.row, index.col, newdescr.properties);
			olddescr.properties = isEmptyObject(properties) ? undefined : properties;
		}
		return olddescr;
	});
	return result;
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

const SheetEdit = (BaseSheet) =>
	class extends BaseSheet {
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
			const doIt = colidx >= 0 && this.isInColRange(colidx);
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
			const doIt = this.isInRowRange(rowidx);
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
				startrow: range.start.row,
				endrow: range.end.row,
				startcol: range.start.col,
				endcol: range.end.col
			};
			const refRange = SheetRange.fromStartEnd(range.start, range.end);
			if (move === 'up') {
				offset.row = -range.height;
				cellrange.startrow = range.end.row + 1;
				cellrange.endrow = this.settings.maxrow;
				refRange.end.set(this.settings.maxrow);
			} else {
				// left
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
				startrow: range.start.row,
				endrow: range.end.row,
				startcol: range.start.col,
				endcol: range.end.col
			};
			const refRange = SheetRange.fromStartEnd(range.start, range.end);
			if (move === 'down') {
				offset.row = range.height;
				cellrange.endrow = this.settings.maxrow;
				refRange.end.set(this.settings.maxrow);
			} else {
				// right
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
		pasteCells(descriptors, trgtrange, options = {}) {
			const start = trgtrange.start;
			const trgtsheet = trgtrange.sheet;
			const { action = 'all' } = options;
			if (trgtsheet.isValidCellIndex(start.row, start.col)) {
				descriptors = descriptors.map(mapCell(action)).sort(descriptorSorter);
				return descriptors.length ? doPasteCells2(descriptors, trgtrange, this, options) : undefined;
			}
			return undefined;
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
	};
module.exports = SheetEdit;
