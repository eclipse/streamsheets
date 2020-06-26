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
const indexRegEx = new RegExp('^\\$?-?[a-z]+\\$?-?[0-9]+$', 'i');
const nrRegEx = /(-?\d+)/;

const regexDollar = /\$/g;
const regexAbsCol = new RegExp('^\\$-?[a-z]+', 'i');
const regexAbsRow = new RegExp('[a-z]+\\$$', 'i');


const toStr = (nr) => {
	let rest;
	let result = '';
	let number = nr;
	while (number >= 0) {
		rest = number % 26;
		number = Math.floor(number / 26) - 1;
		result = String.fromCharCode(rest + 65) + result;
	}
	return result;
};
const toNr = (str) => {
	let result = 0;
	for (let i = 0; i < str.length; i += 1) {
		// -64 to prevent 0! -> hence, -1 again on final result!!
		result += (str.charCodeAt(i) - 64) * 26 ** (str.length - 1 - i);
	}
	return result >= 0 ? result - 1 : undefined;
};

const createFromNr = (row, col, reuseidx) => {
	/* eslint-disable */
	if (row != null && col != null) {
		if (typeof col === 'string') col = SheetIndex.columnAsNr(col);
		return !reuseidx ? new SheetIndex(row, col) : reuseidx.set(row, col);
	}
	return undefined;
	/* eslint-enable */
};

const createFromStr = (str, reuseidx) => {
	let index;
	if (indexRegEx.test(str)) {
		const parts = str.split(nrRegEx);
		const col = parts[0];
		const row = parseInt(parts[1], 10);
		index = createFromNr(row, col.replace(regexDollar, ''), reuseidx);
		if (index) {
			index._isAbsCol = regexAbsCol.test(col);
			index._isAbsRow = regexAbsRow.test(col);
		}
	}
	return index;
};

class SheetIndex {
	// ('A1'), (3, 'B'), (1, 4)...
	static create(...args) {
		const last = Math.max(2, args.length) - 1;
		const reuseidx = typeof args[last] === 'object' ? args[last] : undefined;
		const row = args[0];
		const col = args[1];
		return typeof row === 'string' ? createFromStr(row, reuseidx) : createFromNr(row, col, reuseidx);
	}

	static columnAsStr(colnr) {
		const precol = Math.abs(colnr) - 1;
		return colnr < 0 ? (SheetIndex.PRE_COLUMNS[precol] || `-${toStr(precol)}`) : toStr(colnr);
	}
	static columnAsNr(colstr = '') {
		colstr = colstr.toUpperCase();
		if (colstr.startsWith('-')) {
			colstr = colstr.substring(1);
			let nr = SheetIndex.PRE_COLUMNS.indexOf(colstr);
			if (nr < 0) nr = toNr(colstr);
			return -nr - 1;
		}
		const preindex = SheetIndex.PRE_COLUMNS.indexOf(colstr);
		return preindex > -1 ? -preindex - 1 : toNr(colstr);
	}

	// better use one of provided factory methods!!
	constructor(row, col) {
		this._row = row;
		this._col = col;
		this._isAbsCol = false;
		this._isAbsRow = false;
	}

	get row() {
		return this._row;
	}

	get col() {
		return this._col;
	}

	get isColAbsolute() {
		return this._isAbsCol;
	}
	get isRowAbsolute() {
		return this._isAbsRow;
	}

	set(row, col = this._col) {
		if (typeof row === 'string') {
			return !!SheetIndex.create(row, this);
		}
		col = typeof col === 'string' ? SheetIndex.columnAsNr(col) : col;
		this._row = row;
		this._col = col;
		return this;
	}

	setTo(other) {
		this._col = other.col;
		this._row = other.row;
		this._isAbsRow = other._isAbsRow;
		this._isAbsCol = other._isAbsCol;
	}

	copy() {
		const cp = new SheetIndex(this._row, this._col);
		cp._isAbsCol = this._isAbsCol;
		cp._isAbsRow = this._isAbsRow;
		return cp;
	}

	isEqualTo(index) {
		return (
			!!index &&
			this._row === index._row &&
			this._col === index._col &&
			this._isAbsCol === index._isAbsCol &&
			this._isAbsRow === index._isAbsRow
		);
	}

	columnAsStr() {
		return SheetIndex.columnAsStr(this._col);
	}

	toString() {
		// eslint-disable-next-line max-len
		return `${this._isAbsCol ? '$' : ''}${SheetIndex.columnAsStr(this._col)}${this._isAbsRow ? '$' : ''}${this._row}`;
	}
}

// can be adjusted by app:
SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT']; // <-- THINK: isn't it better at StreamSheet?

module.exports = SheetIndex;
