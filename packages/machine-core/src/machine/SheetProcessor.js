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
// col -1 represents IF col.
const checkSkipRow = (cell, cursor) => {
	if (cursor.c === -1 && cell.isDefined && !cell.value) {
		cursor.r += 1;
		cursor.c = null;
		cursor.changed = true;
	}
};

const cellAt = (r, c, sheet) => {
	const row = c < 0 ? sheet._prerows[r] : sheet._rows[r];
	const col = c < 0 ? Math.abs(c) - 1 : c;
	return row && row[col];
};

const startCol = (sheet, rowidx) => {
	const prerow = sheet._prerows[rowidx];
	return prerow ? -prerow.length : 0;
};
const maxCol = (row) => (row == null ? 0 : row.length - 1);

const State = {
	READY: 1,
	PAUSED: 4
};

class Cursor {
	constructor(sheet) {
		this.sheet = sheet;
		this.reset();
	}

	isProcessed() {
		return this.r > this.maxRow || (this.r === this.maxRow && this.c != null && this.c > this.maxCol);
	}

	reset() {
		this.c = null;
		this.r = this.sheet.settings.minrow;
		this.result = undefined;
		this.changed = false;
		this.maxRow = this.sheet._rows.length - 1;
		this.maxCol = maxCol(this.sheet._rows[this.maxRow]);
	}

	setToIndex(index) {
		const row = Math.max(this.sheet.settings.minrow, index.row);
		// save backward jump => to prevent endless loops!
		this.isBackward = row < this.r || (index.col < this.c && row === this.r);
		this.r = row;
		this.c = index.col;
		this.changed = true;
	}
}

class SheetProcessor {
	constructor(sheet) {
		this._state = State.READY;
		this._cursor = new Cursor(sheet);
	}

	get isPaused() {
		return this._state === State.PAUSED;
	}
	get isProcessed() {
		return this._cursor.isProcessed();
	}
	get isStarted() {
		return this._cursor.row > 1 || this._cursor.c != null;
	}
	get isReady() {
		return this._state === State.READY;
	}

	continueAt(index) {
		this._cursor.setToIndex(index);
	}

	reset() {
		this._cursor.reset();
	}

	pause() {
		this._state = State.PAUSED;
		this._cursor.changed = true;
	}
	resume(retval) {
		this._state = State.READY;
		this._cursor.result = retval;
		this._cursor.changed = false;
		if (this._cursor.c != null) this._cursor.c += 1;
	}

	stop(retval) {
		this._state = State.READY;
		this._cursor.c = this._cursor.maxCol + 1;
		this._cursor.r = this._cursor.maxRow + 1;
		this._cursor.changed = true;
		this._cursor.result = retval;
	}
	start() {
		this._process();
		this._evaluateGraphCells(this._cursor.sheet);
	}
	_process() {
		const cursor = this._cursor;
		const sheet = cursor.sheet;
		const rows = sheet._rows;
		// we are neither dynamic in rows, nor in columns to prevent endless for-loops if cells are added permanently
		const last = rows.length;
		let lastcol = 0;
		// check at paused cell to handle change of referenced value, e.g. sleep(A1) with A1 = 500 and than A1 = 5
		if (this.isPaused) {
			// check paused cell again because its referenced values might have changed:
			const cell = cellAt(cursor.r, cursor.c, sheet);
			if (cell) cell.evaluate();
		} else {
			this._state = State.READY;
			if (this.isProcessed) cursor.reset();
			for (; cursor.r < last && !this.isPaused; ) {
				const row = rows[cursor.r];
				lastcol = row ? row.length : 0;
				cursor.c = cursor.c == null ? startCol(sheet, cursor.r) : cursor.c;
				for (; cursor.c < lastcol && !this.isPaused; ) {
					const cell = cellAt(cursor.r, cursor.c, sheet);
					if (cell) {
						cell.evaluate();
						// should we skip row?
						checkSkipRow(cell, cursor);
					}
					// break from inner column-loop if cursor was changed...
					if (cursor.changed) break;
					cursor.c += 1;
				}
				if (cursor.changed) {
					cursor.changed = false;
					// break from row-loop if paused or if jump backward to prevent endless loop...
					if (cursor.isBackward || this.isPaused) {
						cursor.isBackward = false;
						break;
					}
				} else {
					// move to next row:
					cursor.r += 1;
					cursor.c = null;
				}
			}
		}
	}
	_evaluateGraphCells(sheet) {
		sheet.graphCells.evaluating = true;
		sheet.graphCells._cells.forEach((cell) => cell.evaluate());
		sheet.graphCells.evaluating = false;
	}
}

module.exports = SheetProcessor;
