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
const { Cell } = require('@cedalo/machine-core');
const { Term } = require('@cedalo/parser');
const { addAtBottom, addAtTop, isUniqueInRows, matchKeys, matchRow } = require('./stackhelper');
const { createUpdateFunction } = require('./stackupdater');

const findMatchingRows = (range, criteriarange, unique) => {
	const rows = [];
	const uniqueRows = [];
	const endrow = range.end.row;
	const isUnique = unique ? isUniqueInRows(uniqueRows) : () => true;
	const keysMatch = matchKeys(range, criteriarange);
	for (let rowidx = range.start.row + 1; rowidx <= endrow; rowidx += 1) {
		const row = [];
		range.iterateRowAt(rowidx, (cell) => row.push(cell));
		const match = matchRow(row, criteriarange, keysMatch);
		if (match && isUnique(row)) {
			rows.push(rowidx);
			uniqueRows.push(row);
		} 
	}
	return rows;
};

const createUpdateFunctions = (sourcerange, indices) => {
	const sheet = sourcerange.sheet;
	return indices.map((index) => {
		const row = [];
		sourcerange.iterateRowAt(index, (cell) => {
			row.push(createUpdateFunction(cell, sheet));
		});
		return row;
	});
};
const setRowValues = (stackrow = [], sourcerange, sourceindex, operations, matcher) => {
	const oldValues = [];
	const startidx = sourcerange.start.col;
	sourcerange.iterateRowAt(sourceindex, (cell, idx) => {
		const stackcol = matcher[idx.col - startidx];
		const rowvalue = stackrow[stackcol];
		if (cell) {
			oldValues.push(cell.value);
			cell._value = rowvalue;
		} else {
			oldValues.push(undefined);
		}
	});
	// apply to row
	sourcerange.iterateRowAt(sourceindex, (cell, idx) => {
		const fn = operations[idx.col - startidx];
		const stackcol = matcher[idx.col - startidx];
		if (cell) cell.value = fn ? fn(cell.value) : undefined;
		stackrow[stackcol] = cell ? cell.value : undefined;
	});
	// reset source values
	sourcerange.iterateRowAt(sourceindex, (cell, idx) => {
		if (cell) cell.value = oldValues[idx.col - startidx];
	});
	return stackrow;
};
// matcher: source-keys -> stack-keys
// stackrow: stack values...
const updateRowValues = (operations, sourcerange, srcindices, stackrow, matcher) => {
	srcindices.forEach((srcidx, opidx) => {
		const ops = operations[opidx] || [];
		setRowValues(stackrow, sourcerange, srcidx, ops, matcher);
	});
	return stackrow;
};

const getRowValues = (index, range) => {
	const values = [];
	range.iterateRowAt(index, (cell, idx) => {
		values[idx.col] = cell ? cell.value : undefined;
	});
	return values;
};
const updateStackRow = (index, stackrange, values) => {
	const sheet = stackrange.sheet;
	stackrange.iterateRowAt(index, (cell, idx) => {
		const value = values[idx.col];
		const newcell = value != null ? new Cell(value, Term.fromValue(value)) : undefined;
		sheet.setCellAt(idx, newcell);
	});
};
const upsert = (stackrange, sourcerange, criteriarange, addNotFound, addToBottom, unique) => {
	const stackrows = findMatchingRows(stackrange, criteriarange, unique);
	const sourcerows = findMatchingRows(sourcerange, criteriarange, unique);
	if (sourcerows.length) {
		const matcher = matchKeys(sourcerange, stackrange);
		const updateOperations = createUpdateFunctions(sourcerange, sourcerows);
		if (stackrows.length) {
			stackrows.forEach((rowidx) => {
				const row = getRowValues(rowidx, stackrange);
				const values = updateRowValues(updateOperations, sourcerange, sourcerows, row, matcher);
				updateStackRow(rowidx, stackrange, values);
			});
		} else if (addNotFound) {
			const newrows = [];
			sourcerows.forEach((rowindex, index) => {
				const operations = updateOperations[index];
				const row = setRowValues([], sourcerange, rowindex, operations, matcher).map(
					(value) => new Cell(value, Term.fromValue(value))
				);
				// addAtTop/Bottom are relative to 0!!
				newrows.push(row.filter((cell) => cell != null));
			});
			return addToBottom ? addAtBottom(stackrange, newrows) : addAtTop(stackrange, newrows);
		}
	}
	return undefined;
};
module.exports = upsert;