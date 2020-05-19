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
const { sheet: sheetutils } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { SheetIndex } = require('@cedalo/machine-core');


const sharedrow = [];
const sharedidx = SheetIndex.create(1, 0);

const rowsFromRange = (range) => {
	const rows = [];
	let row = [];
	range.iterate((cell, index, nextrow) => {
		if (nextrow) {
			if (row.length) rows.push(row);
			row = [];
		}
		// DL-629: cell should not be copied, instead create a cell based on static value
		row.push(sheetutils.toStaticCell(cell));
	});
	if (row.length) rows.push(row);
	return rows;
};

const getLastEmptyRow = (stackrange) => {
	const { width } = stackrange;
	let rowIndex = -1;
	let emptyCellCounter = 0;
	stackrange.some((cell, index, newrow) => {
		rowIndex = index.row;
		emptyCellCounter = newrow ? 0 : emptyCellCounter;
		if (!cell || !cell.isDefined) {
			emptyCellCounter += 1;
		}
		// stop if we found a complete empty row:
		return emptyCellCounter === width;
	});
	return emptyCellCounter === width ? rowIndex : -1;
};
const rowAt = (sheet, rowIndex, start, end) => {
	sharedrow.length = 0;
	for (let col = start; col <= end; col += 1) {
		sharedidx.set(rowIndex, col);
		sharedrow.push(sheet.cellAt(sharedidx));
	}
	return sharedrow;
};
const isEmptyRowAt = (rowIndex, stackrange) => {
	let hasCell = false;
	const validIndex = stackrange.iterateRowAt(rowIndex, (cell) => {
		hasCell = hasCell || (cell != null);
	});
	return validIndex && !hasCell;
};
// passed stackrange must include header row (the first row)
const getFirstNonEmptyRow = (sheet, stackrange) => {
	const endrow = stackrange.end.row;
	const startrow = stackrange.start.row + 1;
	let rowidx;
	// eslint-disable-next-line
	for (rowidx = endrow; rowidx > startrow && isEmptyRowAt(rowidx, stackrange); rowidx -= 1) {}
	return stackrange.containsRow(rowidx) ? rowidx : -1;
};
const moveRow = (sheet, row, fromRowIdx, toRowIdx, colIndex) => {
	const toIndex = sharedidx;
	const fromIndex = SheetIndex.create(1, 0);
	row.forEach((cell, index) => {
		toIndex.set(toRowIdx, colIndex + index);
		fromIndex.set(fromRowIdx, colIndex + index);
		sheet.moveCell(fromIndex, toIndex);
	});
};
const shiftToTop = (sheet, stackrange) => {
	const endIdx = stackrange.end;
	const startIdx = stackrange.start;
	// dropped row might be used again, so copy array...
	const dropped = rowAt(sheet, startIdx.row + 1, startIdx.col, endIdx.col).map(cell => cell);
	for (let rowIndex = startIdx.row + 2; rowIndex <= endIdx.row; rowIndex += 1) {
		const row = rowAt(sheet, rowIndex, startIdx.col, endIdx.col);
		moveRow(sheet, row, rowIndex, rowIndex - 1, startIdx.col);
	}
	return dropped;
};
const shiftToBottom = (sheet, stackrange) => {
	const endIdx = stackrange.end;
	const startIdx = stackrange.start;
	// dropped row might be used again, so copy array...
	const dropped = rowAt(sheet, endIdx.row, startIdx.col, endIdx.col).map(cell => cell);
	for (let rowIndex = endIdx.row - 1; rowIndex > startIdx.row; rowIndex -= 1) {
		const row = rowAt(sheet, rowIndex, startIdx.col, endIdx.col);
		moveRow(sheet, row, rowIndex, rowIndex + 1, startIdx.col);
	}
	return dropped;
};

const insert = (sheet, stackrange, row, rowIndex, match) => {
	const endcol = stackrange.end.col;
	const startcol = stackrange.start.col;
	row.some((cell, index) => {
		index = match ? match[index] : startcol + index;
		index = index != null ? index : -1;
		const stop = index > endcol;
		if (!stop && index > -1) {
			sharedidx.set(rowIndex, index);
			sheet.setCellAt(sharedidx, cell);
		}
		return stop;
	});
};
const addAtTop = (stackrange, rows, match) => {
	const dropped = [];
	const sheet = stackrange.sheet;
	const top = stackrange.start.row + 1;
	rows.forEach((row) => {
		if (!isEmptyRowAt(top, stackrange)) {
			const droprow = shiftToBottom(sheet, stackrange);
			if (droprow) dropped.push(droprow);
		}
		insert(sheet, stackrange, row, top, match);
	});
	return dropped;
};
const addAtBottom = (stackrange, rows, match) => {
	const dropped = [];
	const sheet = stackrange.sheet;
	rows.forEach((row) => {
		let rowIndex = getLastEmptyRow(stackrange);
		if (rowIndex < 0) {
			const droprow = shiftToTop(sheet, stackrange);
			if (droprow) dropped.push(droprow);
			rowIndex = stackrange.end.row;
		}
		insert(sheet, stackrange, row, rowIndex, match);
	});
	return dropped;
};
const add = (cellrange, sourcerange, atBottom = true) => {
	// eslint-disable-next-line no-use-before-define
	const match = matchKeys(sourcerange, cellrange);
	const rows = rowsFromRange(sourcerange);
	rows.shift();
	return atBottom ? addAtBottom(cellrange, rows, match) : addAtTop(cellrange, rows, match);
};

const clear = (sheet, range) => {
	let row = 0;
	range.iterate((cell, index, nextrow) => {
		row += nextrow ? 1 : 0;
		if (row > 1 && cell) {
			sheet.setCellAt(index, undefined);
		}
	});
};

const matchKeys = (fromrange, torange) => {
	const match = [];
	const target = {};
	torange.iterateRowAt(torange.start.row, (cell, index) => {
		if (cell) target[`${cell.value}`] = index.col;
	});
	fromrange.iterateRowAt(fromrange.start.row, (cell) => {
		match.push(cell ? target[`${cell.value}`] : null);
	});
	return match;
};


const copyRowsToTarget = (cellrange, targetrange, rows) => {
	const targetsheet = targetrange.sheet;
	clear(targetsheet, targetrange);
	const match = matchKeys(cellrange, targetrange);
	const startidx = targetrange.start.row + 1;
	rows.forEach((row, index) => {
		const rowidx = startidx + index;
		if (targetrange.containsRow(rowidx)) {
			// DL-629: stack should work on static values
			row = row.map(cell => (cell ? sheetutils.toStaticCell(cell) : undefined));
			insert(targetsheet, targetrange, row, rowidx, match);
		}
	});
};

const dropRowAt = (rowidx, cellrange) => {
	const sheet = cellrange.sheet;
	cellrange.iterateRowAt(rowidx, (cell, index) => {
		sheet.setCellAt(index, undefined);
	});
};
const dropAllRows = (cellrange) => {
	let row;
	let firstrow;
	const dropped = [];
	const sheet = cellrange.sheet;
	cellrange.iterate((cell, index, nextrow) => {
		// ignore first row...
		firstrow = firstrow == null ? index.row : firstrow;
		if (index.row > firstrow) {
			if (nextrow) {
				row = [];
				dropped.push(row);
			}
			row.push(cell);
			sheet.setCellAt(index, undefined);
		}
	});
	return dropped;
};
const dropSingleRow = (cellrange, position) => {
	const sheet = cellrange.sheet;
	const endIdx = cellrange.end;
	const startIdx = cellrange.start;
	// drop row:
	const dropped = [];
	const rowIndex = position < 1 ? getFirstNonEmptyRow(sheet, cellrange) : startIdx.row + position;
	const dropIt = cellrange.iterateRowAt(rowIndex, (cell, index) => {
		dropped.push(cell);
		sheet.setCellAt(index, undefined);
	});
	if (dropIt) {
		// move below rows:
		for (let rowidx = rowIndex + 1; rowidx <= endIdx.row; rowidx += 1) {
			const row = cellrange.containsRow(rowidx) ? rowAt(sheet, rowidx, startIdx.col, endIdx.col) : [];
			row.length = cellrange.width;
			moveRow(sheet, row, rowidx, rowidx - 1, startIdx.col);
		}
		// delete last row:
		dropRowAt(endIdx.row, cellrange);
	}
	return [dropped];
};
const drop = (cellrange, pos = 1) => (pos === -1 ? dropAllRows(cellrange) : dropSingleRow(cellrange, pos));

const rotateUp = (sheet, stackrange, positions) => {
	const tmprow = [];
	while (positions > 0) {
		positions -= 1;
		tmprow.length = 0;
		// DL-629: stack should work on static values
		stackrange.iterateRowAt(stackrange.start.row + 1, cell => tmprow.push(sheetutils.toStaticCell(cell)));
		shiftToTop(sheet, stackrange);
		insert(sheet, stackrange, tmprow, stackrange.end.row);
	}
};
const rotateDown = (sheet, stackrange, positions) => {
	const tmprow = [];
	while (positions < 0) {
		positions += 1;
		tmprow.length = 0;
		// DL-629: stack should work on static values
		stackrange.iterateRowAt(stackrange.end.row, cell => tmprow.push(sheetutils.toStaticCell(cell)));
		shiftToBottom(sheet, stackrange);
		insert(sheet, stackrange, tmprow, stackrange.start.row + 1);
	}
};
const rotate = (cellrange, positions = 1) => {
	const tmprow = [];
	const sheet = cellrange.sheet;
	if (positions > 0) rotateUp(sheet, cellrange, positions);
	else if (positions < 0) rotateDown(sheet, cellrange, positions);
	// return first row after rotation, it might gets copied to an optional target-range...
	if (positions !== 0) {
		cellrange.iterateRowAt(cellrange.start.row + 1, cell => tmprow.push(cell));
	}
	return tmprow;
};

const sortRows = fields => (row1, row2) => {
	let result = 0;

	// TODO use some for multiple fields
	Object.values(fields).some((field) => {
		const lt = field.ascending ? -1 : 1;
		const cell1 = row1[field.stackcolindex];
		const cell2 = row2[field.stackcolindex];
		const v1 = cell1 ? cell1.value : null;
		const v2 = cell2 ? cell2.value : null;

		if (v1 != null && v2 != null) {
			// eslint-disable-next-line
			result = (typeof v1 === typeof v2) ? (v1 === v2 ? 0 : (v1 < v2 ? lt : -lt)) : 0;
		} else {
			// eslint-disable-next-line
			result = v1 != null ? -lt : (v2 != null ? lt : 0);
		}

		return result !== 0;
	});

	return result;
};

const sortFunctionRows = order => sortRows(order);

const stackColFromSortCol = (sortcolname, stackrange) => {
	let ret;

	stackrange.iterateRowAt(stackrange.start.row, (cell, index) => {
		if (cell) {
			const stackColName = convert.toString(cell.value, '');
			if (sortcolname === stackColName) {
				ret = index.col;
			}
		}
	});

	return ret;
};

// TODO clean this up after DEMO!!
const sort = (cellrange, sortrange) => {
	// index matcher stackrange -> targetrange:
	const order = {};
	const sheet = cellrange.sheet;
	const sortsheet = sortrange.sheet;
	const nextrow = sortrange.start.row + 1;
	sortrange.iterateRowAt(sortrange.start.row, (cell, index) => {
		sharedidx.set(nextrow, index.col);
		const sortcell = cell && sortsheet.cellAt(sharedidx);
		if (sortcell) {
			const stackIndex = stackColFromSortCol(convert.toString(cell.value, ''), cellrange, sheet);
			if (stackIndex !== undefined) {
				order[`${cell.value}`] = {
					ascending: convert.toBoolean(sortcell.value, false), stackcolindex: stackIndex
				};
			}
		}
	});

	let lastRow = 0;
	const tmprows = [];
	const startcol = cellrange.start.col;

	// find used range and only sort that
	cellrange.iterateColAt(startcol, (cellCol, indexCol) => {
		cellrange.iterateRowAt(indexCol.row + 1, (cellRow, indexRow) => {
			if (cellRow && cellRow.value) {
				lastRow = indexRow.row;
			}
		});
	});

	// get current stack
	const fixedCells = [];
	cellrange.iterateColAt(startcol, (cellCol, indexCol) => {
		if (indexCol.row < lastRow) {
			const row = [];
			tmprows.push(row);
			cellrange.iterateRowAt(indexCol.row + 1, (cellRow, indexRow) => {
				row[indexRow.col] = cellRow;
				if (cellRow && cellRow.hasFormula) {
					// DL-629: stack should work on static values
					row[indexRow.col] = sheetutils.toStaticCell(cellRow);
					fixedCells.push({ cell: cellRow, row: tmprows.length - 1, col: indexRow.col });
				}
			});
		}
	});

	const sortfunc = sortFunctionRows(order);
	tmprows.sort(sortfunc);
	fixedCells.forEach((fixed) => {
		tmprows[fixed.row][fixed.col] = fixed.cell;
	});

	let row = 0;

	const rangesheet = cellrange.sheet;
	cellrange.iterateColAt(startcol, (cellCol, indexCol) => {
		if (indexCol.row < lastRow) {
			cellrange.iterateRowAt(indexCol.row + 1, (cellRow, indexRow) => {
				const cell = tmprows[row][indexRow.col];
				rangesheet.setCellAt(indexRow, cell);
			});
			row += 1;
		}
	});
	return true;
};

const getCriteriaCell = (rowidx, colidx, criteriarange) =>
	colidx != null && sharedidx.set(rowidx, colidx) ? criteriarange.sheet.cellAt(sharedidx) : null;
// row matches criteriarange...
const matchRow = (row, criteriarange, indexMatch) => {
	let doMatch = false;
	const endrow = criteriarange.end.row;
	const notMatchCellCriteria = (cell, index) => {
		const rowidx = notMatchCellCriteria.rowidx;
		const criteriaidx = indexMatch[index];
		const criteriacell = getCriteriaCell(rowidx, criteriaidx, criteriarange);
		const cellvalue = cell ? cell.value : undefined;
		const criteriavalue = criteriacell ? criteriacell.value : undefined;
		return criteriavalue != null && criteriavalue !== cellvalue;
	};
	for (let rowidx = criteriarange.start.row + 1; rowidx <= endrow; rowidx += 1) {
		notMatchCellCriteria.rowidx = rowidx;
		const isFulFilled = !row.some(notMatchCellCriteria);
		doMatch = doMatch || isFulFilled;
	}
	return doMatch;
};

const isUniqueInRows = (rows) => (pivotrow) =>
	!rows.some((row) =>
		row.every((cell, index) => {
			const pivotcell = pivotrow[index];
			return cell == null ? pivotcell == null : pivotcell != null && cell.value === pivotcell.value;
		})
	);

const find = (cellrange, criteriarange, droprows = false, unique = false) => {
	const sheet = cellrange.sheet;
	const rows = [];
	const isUnique = unique ? isUniqueInRows(rows) : () => true;
	const indexMatch = matchKeys(cellrange, criteriarange);
	const filteredrows = [];
	const endrow = cellrange.end.row;
	for (let rowidx = cellrange.start.row + 1; rowidx <= endrow; rowidx += 1) {
		const row = [];
		// DL-629: stack should work on static values
		cellrange.iterateRowAt(rowidx, cell => row.push(sheetutils.toStaticCell(cell)));
		const match = matchRow(row, criteriarange, indexMatch);
		if (match && isUnique(row)) {
			rows.push(row);
			if (droprows) dropRowAt(rowidx, cellrange);
		} else {
			filteredrows.push(row);
		}
	}
	// DL-627: move rows...
	if (droprows && rows.length > 0) {
		const startrow = cellrange.start.row + 1;
		filteredrows.forEach((row, index) => {
			insert(sheet, cellrange, row, startrow + index);
		});
		// drop remaining rows...
		for (let rowidx = startrow + filteredrows.length; rowidx <= endrow; rowidx += 1) {
			dropRowAt(rowidx, cellrange);
		}
	}
	return rows;
};

module.exports = {
	add,
	addAtBottom,
	addAtTop,
	copyRowsToTarget,
	drop,
	find,
	isUniqueInRows,
	matchKeys,
	matchRow,
	rotate,
	sort
};
