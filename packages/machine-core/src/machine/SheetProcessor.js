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

const reset = (cursor, sheetsettings) => {
	cursor.r = sheetsettings.minrow;
	cursor.c = null;
	cursor.stop = false;
	cursor.changed = false;
	cursor.lastUsedRow = 0;
	cursor.paused = false;
};

const newCursor = () => ({
	r: 0,
	c: null,
	stop: false,
	changed: false,
	lastUsedRow: 0,
	paused: false
});

class SheetProcessor {
	constructor(sheet) {
		this._sheet = sheet;
		this._isProcessing = false;
		this._cursor = newCursor();
		this._cursor.r = sheet.settings.minrow;
	}

	get sheet() {
		return this._sheet;
	}

	set sheet(sheet) {
		this._sheet = sheet;
	}

	getCurrentCell() {
		return cellAt(this._cursor.r, this._cursor.c, this._sheet);
	}

	start() {
		let result;
		if (!this._isProcessing) {
			this._isProcessing = true;
			this._process(this.sheet);
			this._isProcessing = false;
			({ result } = this._cursor);
			this._cursor.result = null;
		}
		return result;
	}

	pause() {
		this._cursor.paused = true;
	}

	resume() {
		// this._cursor.c += 1;
		this._cursor.paused = false;
	}

	// optional return value
	stop(retvalue) {
		// reset cursor on stop to start from beginning...
		// if (!this._cursor.paused) <-- REVIEW: was this because of return-function in repeat mode??
		reset(this._cursor, this._sheet.settings);
		this._isProcessing = false;
		// mark as changed & stopped to break from inner loop without altering row...
		this._cursor.stop = true;
		this._cursor.changed = true;
		this._cursor.result = retvalue;
	}

	_process(sheet) {
		const rows = sheet._rows;
		// we are neither dynamic in rows, nor in columns to prevent endless for-loops if cells are added permanently
		const last = rows.length;
		const cursor = this._cursor;
		let lastcol = 0;
		let skipRow = false;
		cursor.stop = false;
		cursor.changed = false;

		for (; cursor.r < last && this._isProcessing && !cursor.stop; ) {
			const row = rows[cursor.r];
			lastcol = row ? row.length : 0;
			cursor.c = cursor.c == null ? startCol(sheet, cursor.r) : cursor.c;
			for (; cursor.c < lastcol && !cursor.stop; ) {
				const cell = cellAt(cursor.r, cursor.c, sheet);
				if (cell) {
					cursor.lastUsedRow = Math.max(cursor.r, cursor.lastUsedRow);
					cell.evaluate();
					skipRow = !this._isProcessing || doSkipRow(cell, cursor.c);
				}
				if (cursor.paused) {
					cursor.stop = true;
				} else if (cursor.changed) {
					break; // break from inner for...
				} else if (skipRow) {
					cursor.r += 1;
					cursor.c = null;
					cursor.changed = true;
					skipRow = false;
					break;
				} else {
					cursor.c += 1;
				}
			}
			if (!cursor.changed && !cursor.paused) {
				cursor.r += 1;
				cursor.c = null;
			}
			cursor.changed = false;
		}
		// reset cursor if sheet is processed completely
		if (cursor.r >= last) {
			// shrink rows and prerows:
			let { lastUsedRow } = cursor;
			if (lastUsedRow > sheet._lastInsertIndex.row) {
				lastUsedRow += 1;
				sheet._rows.length = lastUsedRow;
				sheet._prerows.length = lastUsedRow;
			}
			reset(cursor, sheet.settings);
		}

		sheet.graphCells.evaluating = true;
		sheet.graphCells._cells.forEach((cell) => cell.evaluate());
		sheet.graphCells.evaluating = false;
	}

	goto(index) {
		const row = Math.max(this._sheet.settings.minrow, index.row);
		this._cursor.stop = row < this._cursor.r || (index.col < this._cursor.c && row === this._cursor.r);
		this._cursor.r = row;
		this._cursor.c = index.col;
		this._cursor.changed = true;
	}
}

module.exports = SheetProcessor;
