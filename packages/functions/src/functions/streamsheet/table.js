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
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, SheetIndex } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const {	aggregations, runFunction, terms: { getCellRangeFromTerm, hasValue } } = require('../../utils');

const ERROR = FunctionErrors.code;
const sharedidx = SheetIndex.create(1, 0);

const iterateFirstTableColumn = (range, cb) => {
	const startrow = range.start.row;
	range.iterateColAt(range.start.col, (cell, index) => {
		if (index.row !== startrow) cb(cell, index);
	});
};
const iterateFirstTableRow = (range, cb) => {
	const startcol = range.start.col;
	range.iterateRowAt(range.start.row, (cell, index) => {
		if (index.col !== startcol) cb(cell, index);
	});
};
const findBottomRowIndex = (range) => {
	let rowIndex;
	iterateFirstTableColumn(range, (cell, index) => {
		if (rowIndex == null && (!cell || cell.value == null)) rowIndex = index.row;
	});
	return rowIndex;
};
const findTopRowIndex = (range) => {
	let rowIndex;
	iterateFirstTableColumn(range, (cell, index) => {
		if (rowIndex == null && cell && cell.value != null) rowIndex = index.row - 1;
	});
	return rowIndex != null && rowIndex > range.start.row ? rowIndex : undefined;
};
const findRightColumnIndex = (range) => {
	let colIndex;
	iterateFirstTableRow(range, (cell, index) => {
		if (colIndex == null && (!cell || cell.value == null)) colIndex = index.col;
	});
	return colIndex;
};
const findLeftColumnIndex = (range) => {
	let colIndex;
	iterateFirstTableRow(range, (cell, index) => {
		if (colIndex == null && cell && cell.value != null) colIndex = index.col - 1;
	});
	return colIndex != null && colIndex > range.start.col ? colIndex : undefined;
};

const moveRowsToTop = (range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	const fromIndex = sharedidx;
	const toIndex = SheetIndex.create(1, 0);
	// move rows to top;
	for (let row = start.row + 2; row <= end.row; row += 1) {
		for (let col = start.col; col <= end.col; col += 1) {
			fromIndex.set(row, col);
			toIndex.set(row - 1, col);
			sheet.moveCell(fromIndex, toIndex);
		}
	}
};
const moveColumnsToLeft = (range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	const fromIndex = sharedidx;
	const toIndex = SheetIndex.create(1, 0);
	for (let col = start.col + 2; col <= end.col; col += 1) {
		for (let row = start.row; row <= end.row; row += 1) {
			fromIndex.set(row, col);
			toIndex.set(row, col - 1);
			sheet.moveCell(fromIndex, toIndex);
		}
	}
};
const moveRowsToBottom = (range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	const fromIndex = sharedidx;
	const toIndex = SheetIndex.create(1, 0);
	// move rows to bottom;
	for (let row = end.row; row > start.row + 1; row -= 1) {
		for (let col = start.col; col <= end.col; col += 1) {
			toIndex.set(row, col);
			fromIndex.set(row - 1, col);
			sheet.moveCell(fromIndex, toIndex);
		}
	}
};
const moveColumnsToRight = (range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	const fromIndex = sharedidx;
	const toIndex = SheetIndex.create(1, 0);
	for (let col = end.col; col > start.col + 1; col -= 1) {
		for (let row = start.row; row <= end.row; row += 1) {
			toIndex.set(row, col);
			fromIndex.set(row, col - 1);
			sheet.moveCell(fromIndex, toIndex);
		}
	}
};
const createNewRowAt = (index, range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	for (let col = start.col; col <= end.col; col += 1) {
		sharedidx.set(index, col);
		sheet.setCellAt(sharedidx, undefined);
	}
};
const createNewColumnAt = (index, range) => {
	const end = range.end;
	const start = range.start;
	const sheet = range.sheet;
	for (let row = start.row; row <= end.row; row += 1) {
		sharedidx.set(row, index);
		sheet.setCellAt(sharedidx, undefined);
	}
};
const setTableValue = (value, row, col, sheet) => {
	sharedidx.set(row, col);
	sheet.setCellAt(sharedidx, new Cell(value, Term.fromValue(value)));
};
const addRowToBottom = (range, index) => {
	// insert new row at bottom:
	let bottomRow = findBottomRowIndex(range);
	if (bottomRow == null) {
		moveRowsToTop(range);
		bottomRow = range.end.row;
	}
	createNewRowAt(bottomRow, range);
	setTableValue(index, bottomRow, range.start.col, range.sheet);
	return bottomRow;
};
const addRowToTop = (range, index) => {
	// insert new row at bottom:
	let topRow = findTopRowIndex(range);
	if (topRow == null) {
		moveRowsToBottom(range);
		topRow = range.start.row + 1;
	}
	createNewRowAt(topRow, range);
	setTableValue(index, topRow, range.start.col, range.sheet);
	return topRow;
};
const addColumnToRight = (range, index) => {
	// insert new row at bottom:
	let rightColumn = findRightColumnIndex(range);
	if (rightColumn == null) {
		moveColumnsToLeft(range);
		rightColumn = range.end.col;
	}
	createNewColumnAt(rightColumn, range);
	setTableValue(index, range.start.row, rightColumn, range.sheet);
	return rightColumn;
};
const addColumnToLeft = (range, index) => {
	// insert new row at bottom:
	let leftColumn = findLeftColumnIndex(range);
	if (leftColumn == null) {
		moveColumnsToRight(range);
		leftColumn = range.start.col + 1;
	}
	createNewColumnAt(leftColumn, range);
	setTableValue(index, range.start.row, leftColumn, range.sheet);
	return leftColumn;
};

const getColumnIndex = (range, index) => {
	let colIndex;
	range.iterateRowAt(range.start.row, (cell, cellidx) => {
		if (colIndex == null) colIndex = cell && cell.value === index ? cellidx.col : undefined;
	});
	return colIndex;
};
const getRowIndex = (range, index) => {
	let rowIndex;
	range.iterateColAt(range.start.col, (cell, cellidx) => {
		if (rowIndex == null) rowIndex = cell && cell.value === index ? cellidx.row : undefined;
	});
	return rowIndex;
};
const getOrAddRowIndex = (range, index, pushAt) => {
	const rowindex = getRowIndex(range, index);
	if (rowindex == null && index && pushAt !== 0) {
		return pushAt === 1 ? addRowToBottom(range, index) : addRowToTop(range, index);
	}
	return rowindex;
};
const getOrAddColumnIndex = (range, index, pushAt) => {
	const colindex = getColumnIndex(range, index);
	if (colindex == null && index && pushAt !== 0) {
		return pushAt === 1 ? addColumnToRight(range, index) : addColumnToLeft(range, index);
	}
	return colindex;
};

const toNumberOrString = (value) => {
	const nr = convert.toNumberStrict(value);
	return nr == null ? convert.toString(value, '') : nr;
};
const errorIfNull = (value) => (value == null ? ERROR.VALUE : value);

const getCellRange = (term, sheet) => {
	const range = getCellRangeFromTerm(term, sheet);
	return range && (range.width > 1 || range.height > 1) ? range : undefined;
};

const getAggregationType = (value) => {
	const nr = convert.toNumber(value);
	return nr != null && aggregations.hasMethod(nr) ? nr : ERROR.VALUE;
};

const aggregateValue = (value, aggregationType, context) => {
	if (context.aggregationType !== aggregationType) {
		context.aggregationType = aggregationType;
		context.aggregate = aggregations.createMethod(aggregationType);
	}
	return context.aggregate(value);
};

const getAggregationMethod = (type, row, col, context) => {
	const { aggregationType, rowindex, colindex} = context;
	if(aggregationType !== type || rowindex !== row || colindex !== col) {
			context.rowindex = row;
			context.colindex = col;
			context.aggregationType = type;
			context.aggregationMethod = aggregations.createMethod(type);
		}
		return context.aggregationMethod;
}

// const initContext = (context) => {
// 	if (context.aggregationType == null) {
// 		context.aggregationType = 0;
// 		context.aggregate = aggregations.createMethod(0);
// 	}
// };

const tableupdate = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(2)
		.withMaxArgs(7)
		.mapNextArg((stackrange) => getCellRange(stackrange, sheet) || ERROR.VALUE)
		.mapNextArg((valueterm) => errorIfNull(valueterm.value))
		.mapNextArg((rowindex) => (rowindex ? toNumberOrString(rowindex.value) : ''))
		.mapNextArg((colindex) => (colindex ? toNumberOrString(colindex.value) : ''))
		.mapNextArg((pushrow) => (hasValue(pushrow) ? convert.toNumber(pushrow.value, ERROR.VALUE) : 0))
		.mapNextArg((pushcolumn) => (hasValue(pushcolumn) ? convert.toNumber(pushcolumn.value, ERROR.VALUE) : 0))
		.mapNextArg((aggregationType) => (hasValue(aggregationType) ? getAggregationType(aggregationType.value) : 0))
		// .beforeRun(() => initContext(tableupdate.context))
		.run((range, value, rowindex, colindex, pushrow, pushcolumn, aggregationType) => {
			const row = getOrAddRowIndex(range, rowindex, pushrow);
			const col = getOrAddColumnIndex(range, colindex, pushcolumn);
			// never change top-left
			if (row != null && row > range.start.row && col != null && col > range.start.col) {
				// value = aggregateValue(value, aggregationType, tableupdate.context);
				const aggregate = getAggregationMethod(aggregationType, rowindex, colindex, tableupdate.context);
				value = aggregate(value); // aggregateValue(value, method);
				sharedidx.set(row, col);
				sheet.setCellAt(sharedidx, new Cell(value, Term.fromValue(value)));
			}
			return true;
		});

const tableget = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(3)
		.mapNextArg((stackrange) => getCellRange(stackrange, sheet) || ERROR.VALUE)
		.mapNextArg((rowindex) => toNumberOrString(rowindex.value))
		.mapNextArg((colindex) => toNumberOrString(colindex.value))
		.run((range, rowindex, colindex) => {
			const row = getRowIndex(range, rowindex);
			const col = getColumnIndex(range, colindex);
			if (row != null && col != null) {
				const cell = sheet.cellAt(sharedidx.set(row, col));
				return cell ? cell.value : ERROR.NA;
			}
			return ERROR.NA;
		});

module.exports = {
	'TABLE.GET': tableget,
	'TABLE.UPDATE': tableupdate
};
