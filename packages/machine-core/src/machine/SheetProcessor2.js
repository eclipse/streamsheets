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
const State = {
	READY: 1,
	PAUSED: 4
};

class Cursor {
	constructor(sheet) {
		this.c = null;
		this.r = sheet.settings.minrow;
		this.sheet = sheet;
		this.changed = false;
		this.isProcessed = false;
	}

	reset() {
		this.c = null;
		this.r = this.sheet.settings.minrow;
		this.changed = false;
		this.isProcessed = false;
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

	done() {
		this._state = State.READY;
		this._cursor.r = Number.MAX_SAFE_INTEGER;
		this._cursor.changed = true;
		this._cursor.isProcessed = true;
	}
	// suspend() 
	pause() {
		this._state = State.PAUSED;
	}
	resume() {
		this._state = State.READY;
		if (this._cursor.c != null) this._cursor.c += 1;
	}

	continueAt(index) {
		this._cursor.setToIndex(index);
	}

	get isPaused() {
		return this._state === State.PAUSED;
	}
	get isProcessed() {
		return this._cursor.isProcessed;
	}
	get isReady() {
		return this._state === State.READY;
	}

	process() {
		const cursor = this._cursor;
		const sheet = cursor.sheet;
		const rows = sheet._rows;
		// we are neither dynamic in rows, nor in columns to prevent endless for-loops if cells are added permanently
		const last = rows.length;
		let lastcol = 0;
		if (!this.isPaused && this.isProcessed) {
			cursor.reset();
			this._state = State.READY;
		}

		for (; cursor.r < last && !this.isProcessed && !this.isPaused; ) {
			const row = rows[cursor.r];
			lastcol = row ? row.length : 0;
			cursor.c = cursor.c == null ? startCol(sheet, cursor.r) : cursor.c;
			for (; cursor.c < lastcol && !this.isProcessed && !this.isPaused; ) {
				const cell = cellAt(cursor.r, cursor.c, sheet);
				if (cell) {
					cell.evaluate();
					// should we skip row?
					checkSkipRow(cell, cursor);
				}
				if (cursor.changed) break; // break from inner column-loop...
				else if(!this.isPaused) cursor.c += 1;
			}
			// cursor was set?
			if (cursor.changed) {
				cursor.changed = false;
				// break from row-loop if it was backward to prevent endless loop...
				if (cursor.isBackward) {
					cursor.isBackward = false;
					break;
				}
			} else if (!this.isPaused) {
				// now to next row:
				cursor.r += 1;
				cursor.c = null;
			}
		}
		// on end of sheet
		if (cursor.r >= last) { // && (cursor.c == null || cursor.c >= lastcol))) {
			cursor.isProcessed = true;
		}

		sheet.graphCells.evaluating = true;
		sheet.graphCells._cells.forEach((cell) => cell.evaluate());
		sheet.graphCells.evaluating = false;
	}
}

module.exports = SheetProcessor;
