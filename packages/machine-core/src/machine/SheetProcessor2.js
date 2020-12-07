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
const doSkipRow = (cell, col) => col === -1 && cell.isDefined && !cell.value;

// const cellAt = (cursor, sheet) => {
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
	PROCESSING: 2,
	PAUSED: 4,
	PROCESSED: 8,
	STOPPED: 16
};

class Cursor {
	constructor(sheet) {
		this.c = null;
		this.r = sheet.settings.minrow;
		this.sheet = sheet;
		this.changed = false;
		this.isProcessed = false;
		// this.state = State.READY;
	}

	// get isProcessing() {
	// 	return this.state === State.PROCESSING;
	// }

	reset() {
		this.c = null;
		this.r = this.sheet.settings.minrow;
		this.changed = false;
		this.isProcessed = false;
		// this.state = State.READY;
	}

	setToIndex(index) {
		const row = Math.max(this.sheet.settings.minrow, index.row);
		// save backward jump => to prevent endless loops!
		this.isBackward = row < this.r || (index.col < this.c && row === this.r);
		this.r = row;
		this.c = index.col;
		this.changed = true;
		// return this.isBackward;
	}
}

// const reset = (cursor, sheetsettings) => {
// 	cursor.r = sheetsettings.minrow;
// 	cursor.c = null;
// 	cursor.stop = false;
// 	cursor.changed = false;
// 	cursor.paused = false;
// 	cursor.resumed = false;
// 	cursor.finished = false;
// };

// const newCursor = () => ({
// 	r: 0,
// 	c: null,
// 	stop: false,
// 	changed: false,
// 	paused: false,
// 	resumed: false,
// 	finished: false
// });

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
	// suspend() {

	// }
	pause() {
		this._state = State.PAUSED;
	}
	resume() {
		this._state = State.READY;
	}
	// start() {
	// 	if (this._state === State.STOPPED) this._cursor.reset();
	// 	this._state = State.PROCESSING;
	// }
	// stop() {
	// 	// this._state = State.STOPPED;
	// 	this._state = State.PROCESSED;
	// }

	continueAt(index) {
		this._cursor.setToIndex(index);
	}

	get isPaused() {
		return this._state === State.PAUSED;
	}
	// get isStopped() {
	// 	return this._state === State.STOPPED;
	// }
	get isProcessed() {
		// return this._state === State.PROCESSED;
		return this._cursor.isProcessed;
	}
	get isReady() {
		return this._state === State.READY;
	}

	// get isProcessing() {
	// 	return this._state === State.PROCESSING;
	// }

	// get isFinished() {
	// 	return this._state === State.STOPPED || this._cursor.processed;
	// }

	process() {
		const cursor = this._cursor;
		const sheet = cursor.sheet;
		const rows = sheet._rows;
		// we are neither dynamic in rows, nor in columns to prevent endless for-loops if cells are added permanently
		const last = rows.length;
		let lastcol = 0;
		// cursor.processed = false;
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
					if (doSkipRow(cell, cursor.c)) break;	// from inner column-loop
				}
				if (cursor.changed) break; // break from inner column-loop...
				else cursor.c += 1;
			}
			// cursor was set?
			if (cursor.changed) {
				cursor.changed = false;
				// break from row-loop if it was backward...
				if (cursor.isBackward) {
					cursor.isBackward = false;
					break;
				}
			} else {
				// now to next row:
				cursor.r += 1;
				cursor.c = null;
			}
		}
		// on end of sheet
		if (cursor.r >= last) { // && (cursor.c == null || cursor.c >= lastcol))) {
			// reset(cursor, sheet.settings);
			// cursor.reset();
			// this._state = State.PROCESSED;
			cursor.isProcessed = true;
		}
		// reset cursor if sheet is processed completely
		// if (cursor.r >= last) {
	

		// TODO: check paused state again, might was set from outside cells (DL-4482)

		// if (cursor.paused) {
		// 	cursor.stop = true;
		// } else if (!cursor.changed) { // && !cursor.paused) {
		// 	cursor.r += 1;
		// 	cursor.c = null;
		// }
		// cursor.changed = false;

		sheet.graphCells.evaluating = true;
		sheet.graphCells._cells.forEach((cell) => cell.evaluate());
		sheet.graphCells.evaluating = false;
	}
}

module.exports = SheetProcessor;
