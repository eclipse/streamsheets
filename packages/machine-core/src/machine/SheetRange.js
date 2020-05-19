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
const SheetIndex = require('./SheetIndex');
const { convert } = require('@cedalo/commons');

const sharedidx = SheetIndex.create(1, 0);
const colCharRegEx = new RegExp('^[a-z]+$', 'i');

const endRow = (sheet, endrow) => Math.min(sheet.settings.maxrow, endrow);
const startRow = (sheet, startrow) => Math.max(sheet.settings.minrow, startrow);
const endCol = (sheet, endcol) => Math.min(sheet.settings.maxcol, endcol);
const startCol = (sheet, startcol) => Math.max(sheet.settings.mincol, startcol);

const toNumber = (str) => convert.toNumber(str); // wrapped to prevent circular dependency :-/

const createRowRange = (startrow, endrow) => {
	endrow = toNumber(endrow);
	// eslint-disable-next-line
	return endrow != null ? RowRange.fromRows(startrow, endrow) : undefined; // ERROR.NAME;
};
const createColumnRange = (startcol, endcol) => {
	endcol = colCharRegEx.test(endcol) ? SheetIndex.columnAsNr(endcol) : undefined;
	// eslint-disable-next-line
	return endcol != null ? ColumnRange.fromColumns(startcol, endcol) : undefined; // ERROR.NAME;
};

class SheetRange {
	static fromRangeStr(str, sheet) {
		let range;
		const idx = str && str.split(':');
		if (idx && idx.length === 2) {
			const end = SheetIndex.create(idx[1]);
			const start = SheetIndex.create(idx[0]);
			range = start && end && SheetRange.fromStartEnd(start, end, sheet);
			if (!range) {
				const row = toNumber(idx[0]);
				const col = row == null && colCharRegEx.test(idx[0]) ? SheetIndex.columnAsNr(idx[0]) : undefined;
				if (row != null) range = createRowRange(row, idx[1]);
				else if (col != null) range = createColumnRange(col, idx[1]);
				if (range != null) range.sheet = sheet;
					// eslint-disable-next-line no-nested-ternary
					// row != null
					// 	? createRowRange(row, idx[1])
					// 	: col != null
					// 	? createColumnRange(col, idx[1])
					// 	: undefined; // ERROR.NAME);
			}
		}
		return range;
	}

	static fromStartEnd(startidx, endidx, sheet) {
		const endcol = endidx.col;
		const startcol = startidx.col;
		const end = SheetIndex.create(Math.max(startidx.row, endidx.row), Math.max(startcol, endcol));
		end._isAbsCol = endidx.col < startidx.col ? startidx._isAbsCol : endidx._isAbsCol;
		end._isAbsRow = endidx.Row < startidx.row ? startidx._isAbsRow : endidx._isAbsRow;
		const start = SheetIndex.create(Math.min(startidx.row, endidx.row), Math.min(startcol, endcol));
		start._isAbsCol = endidx.col < startidx.col ? endidx._isAbsCol : startidx._isAbsCol;
		start._isAbsRow = endidx.Row < startidx.row ? endidx._isAbsRow : startidx._isAbsRow;
		const range = new SheetRange(start, end);
		range.sheet = sheet;
		return range;
	}

	// start and end indices are inclusive...
	constructor(start, end) {
		this.endIdx = end;
		this.startIdx = start;
		this._sheet = undefined;
	}

	get sheet() {
		return this._sheet;
	}

	set sheet(sheet) {
		this._sheet = sheet;
	}

	get start() {
		return this.startIdx;
	}

	get end() {
		return this.endIdx;
	}

	get width() {
		// if end-col === start-col we have a width of 1 column
		return Math.abs(this.endIdx.col - this.startIdx.col) + 1;
	}

	get height() {
		// if end-row === start-row we have a height of 1 row
		return Math.abs(this.endIdx.row - this.startIdx.row) + 1;
	}

	isEqualTo(other) {
		return other != null && this.start.isEqualTo(other.start) && this.end.isEqualTo(other.end);
	}

	containsRow(rowidx) {
		return rowidx >= this.start.row && rowidx <= this.end.row;
	}

	containsCol(colidx) {
		return colidx >= this.start.col && colidx <= this.end.col;
	}

	contains(index) {
		return this.containsCol(index.col) && this.containsRow(index.row);
	}

	cellAt(index) {
		return this._sheet.cellAt(index);
	}

	iterateIndices(callback) {
		const endcol = this.endIdx.col;
		const endrow = this.endIdx.row;
		const startcol = this.startIdx.col;
		for (let row = this.startIdx.row; row <= endrow; row += 1) {
			for (let col = startcol; col <= endcol; col += 1) {
				callback(sharedidx.set(row, col));
			}
		}
	}

	iterateColumnIndices(callback) {
		for (let col = this.startIdx.col; col <= this.endIdx.col; col += 1) {
			callback(col);
		}
	}

	iterateRowIndices(callback) {
		for (let row = this.startIdx.row; row <= this.endIdx.row; row += 1) {
			callback(row);
		}
	}

	iterate(callback) {
		this.some((cell, index, nextrow) => {
			callback(cell, index, nextrow);
			return false;
		});
	}
	iterateRowAt(rowidx, callback) {
		const doIt = this.containsRow(rowidx);
		if (doIt) {
			const sheet = this._sheet;
			const endcol = endCol(sheet, this.end.col);
			for (let col = startCol(sheet, this.start.col); col <= endcol; col += 1) {
				sharedidx.set(rowidx, col);
				callback(sheet.cellAt(sharedidx), sharedidx);
			}
		}
		return doIt;
	}
	iterateColAt(colidx, callback) {
		const doIt = this.containsCol(colidx);
		if (doIt) {
			const sheet = this._sheet;
			const endrow = endRow(sheet, this.end.row);
			for (let row = startRow(sheet, this.start.row); row <= endrow; row += 1) {
				sharedidx.set(row, colidx);
				callback(sheet.cellAt(sharedidx), sharedidx);
			}
		}
		return doIt;
	}

	iterateByCol(callback) {
		this.someByCol((cell, index, nextcol) => {
			callback(cell, index, nextcol);
		});
	}

	reduce(callback, start) {
		this.iterate((cell, index, nextrow) => {
			start = callback(start, cell, index, nextrow);
		});
		return start;
	}

	// iterates over each cell. stops if callback returns a truthy value
	some(callback) {
		const sheet = this._sheet;
		const endrow = endRow(sheet, this.endIdx.row);
		const endcol = endCol(sheet, this.endIdx.col);
		const startcol = startCol(sheet, this.startIdx.col);
		let stop = false;
		let nextrow = false;
		for (let row = startRow(sheet, this.startIdx.row); row <= endrow && !stop; row += 1) {
			nextrow = true;
			for (let col = startcol; col <= endcol && !stop; col += 1) {
				sharedidx.set(row, col);
				stop = callback(sheet.cellAt(sharedidx), sharedidx, nextrow);
				nextrow = false;
			}
		}
		return stop;
	}

	// iterates over each cell in columns first order. stops if callback returns a truthy value
	someByCol(callback) {
		// <= RENAME!!
		const sheet = this._sheet;
		const endcol = endCol(sheet, this.endIdx.col);
		const endrow = endRow(sheet, this.endIdx.row);
		const startrow = startRow(sheet, this.startIdx.row);
		let stop = false;
		let nextcol = false;
		for (let col = startCol(sheet, this.startIdx.col); col <= endcol && !stop; col += 1) {
			nextcol = true;
			for (let row = startrow; row <= endrow && !stop; row += 1) {
				sharedidx.set(row, col);
				stop = callback(sheet.cellAt(sharedidx), sharedidx, nextcol);
				nextcol = false;
			}
		}
		return stop;
	}

	toString() {
		return `${this.startIdx.toString()}:${this.endIdx.toString()}`;
	}

	// returns string representation including sheet reference
	toReferenceString() {
		const sheet = this.sheet;
		const ref = (sheet && sheet.streamsheet) ? `${sheet.streamsheet.name}!` : ``;
		return `${ref}${this.startIdx.toString()}:${this.endIdx.toString()}`;
	}
}

class RowRange extends SheetRange {
	static fromRows(startrow, endrow) {
		const range = new RowRange(SheetIndex.create(startrow, -1), SheetIndex.create(endrow, -1));
		range.isRow = true;
		return range;
	}

	get sheet() {
		return super.sheet;
	}

	set sheet(sheet) {
		super.sheet = sheet;
		if (sheet) {
			this.startIdx.set(this.startIdx.row, sheet.settings.mincol);
			this.endIdx.set(this.endIdx.row, sheet.settings.maxcol);
		}
	}

	isEqualTo(other) {
		return other instanceof RowRange && super.isEqualTo(other);
	}

	toString() {
		return `${this.startIdx.row}:${this.endIdx.row}`;
	}
}
class ColumnRange extends SheetRange {
	static fromColumns(startcol, endcol) {
		const range = new ColumnRange(SheetIndex.create(1, startcol), SheetIndex.create(1, endcol));
		range.isColumn = true;
		return range;
	}

	get sheet() {
		return super.sheet;
	}

	set sheet(sheet) {
		super.sheet = sheet;
		if (sheet) this.endIdx.set(sheet.settings.maxrow, this.endIdx.col);
	}

	isEqualTo(other) {
		return other instanceof ColumnRange && super.isEqualTo(other);
	}

	toString() {
		const end = SheetIndex.columnAsStr(this.endIdx.col);
		const start = SheetIndex.columnAsStr(this.startIdx.col);
		return `${start}:${end}`;
	}
}

module.exports = SheetRange;
