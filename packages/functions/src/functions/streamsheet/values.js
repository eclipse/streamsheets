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
const { runFunction, terms: { getCellRangeFromTerm, getCellReferencesFromTerm } } = require('../../utils');
const { Term } = require('@cedalo/parser');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

// const doIt = value => value || value == null;
const newCellAt = (index, value, sheet) => {
	const cell = new Cell(value);
	sheet.setCellAt(index, cell);
	return cell;
};

const setCells = (value, cellrefs, overwrite) => {
	let res = FunctionErrors.isError(cellrefs);
	if (!res) {
		cellrefs.forEach((cellref) => {
			const cell = cellref.target || newCellAt(cellref.index, value, cellref.sheet);
			if (cell.formula == null || overwrite) {
				cell.term = Term.fromValue(value);
			} else {
				cell._value = value;
			}
		});
		res = true;
	}
	return res;
};

const moverangevalues = (values, cellrange, fill) => {
	const moved = [];
	const sheet = cellrange.sheet;
	let stop = false;
	let valuesidx = 0;
	cellrange.some((cell, index) => {
		if (valuesidx >= values.length) {
			stop = !fill;
			valuesidx = 0;
		}
		if (!stop) {
			const value = values[valuesidx]; // values.shift();
			sheet.setCellAt(index, new Cell(value, Term.fromValue(value)));
			moved.push(value);
			valuesidx += 1;
		}
		return stop; // values.length === 0;
	});
	return moved;
};
const deletemoved = (values, cellrange) => {
	const sheet = cellrange.sheet;
	cellrange.iterate((cell, index) => {
		const value = values.shift();
		if (value != null) {
			sheet.setCellAt(index, undefined);
		}
	});
};
const rangevalues = (range) => {
	const values = [];
	range.iterate((cell) => {
		const value = cell ? cell.value : '';
		values.push(value);
	});
	return values;
};

const copyRange = (sourcerange, targetrange) => {
	const doIt = sourcerange != null;
	if (doIt) {
		const values = rangevalues(sourcerange);
		moverangevalues(values, targetrange, true);
	}
	return doIt;
};
const copyCellValue = (sourceterm, targetrange) => {
	const value = sourceterm != null ? sourceterm.value : null;
	if (value != null) {
		const sheet = targetrange.sheet;
		targetrange.iterate((trgtcell, index) => {
			sheet.setCellAt(index, new Cell(value, Term.fromValue(value)));
		});
	}
	return value != null;
};

const copyvalues = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.mapNextArg(source => getCellRangeFromTerm(source, sheet))
		.mapNextArg(target => getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) =>
			copyRange(source, target)
			|| copyCellValue(terms[0], target)
			|| ERROR.SOURCE);

const movevalues = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.mapNextArg(source => getCellRangeFromTerm(source, sheet) || ERROR.SOURCE)
		.mapNextArg(target => getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) => {
			const values = rangevalues(source);
			const moved = moverangevalues(values, target);
			deletemoved(moved, source);
			return true;
		});

const setvalue = (sheet, ...terms) =>
runFunction(sheet, terms)
	.withMinArgs(3)
	.withMaxArgs(4)
	.mapNextArg(condition => !!condition.value)
	.mapNextArg(val => val.value)
	.mapNextArg(cellrefs => getCellReferencesFromTerm(cellrefs, sheet) || [])
	.mapNextArg(overwrite => convert.toBoolean(overwrite && overwrite.value, false))
	.run((condition, val, cellrefs, overwrite) => condition && setCells(val, cellrefs, overwrite) || true);

const swapvalues = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.mapNextArg(source => getCellRangeFromTerm(source, sheet) || ERROR.SOURCE)
		.mapNextArg(target => getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) => {
			const sourcevalues = rangevalues(source);
			const targetvalues = rangevalues(target);
			moverangevalues(sourcevalues, target);
			moverangevalues(targetvalues, source);
			return true;
		});


module.exports = {
	COPYVALUES: copyvalues,
	MOVEVALUES: movevalues,
	SETVALUE: setvalue,
	SWAPVALUES: swapvalues
};
