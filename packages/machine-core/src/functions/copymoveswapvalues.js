const ERROR = require('./errors');
const Cell = require('../machine/Cell');
const { Term } = require('@cedalo/parser');
const runFunction = require('./_utils').runFunction;
const sheetutils = require('./_utils').sheet;


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
		.mapNextArg(source => sheetutils.getCellRangeFromTerm(source, sheet))
		.mapNextArg(target => sheetutils.getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) =>
			copyRange(source, target)
			|| copyCellValue(terms[0], target)
			|| ERROR.SOURCE);

const movevalues = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.mapNextArg(source => sheetutils.getCellRangeFromTerm(source, sheet) || ERROR.SOURCE)
		.mapNextArg(target => sheetutils.getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) => {
			const values = rangevalues(source);
			const moved = moverangevalues(values, target);
			deletemoved(moved, source);
			return true;
		});

const swapvalues = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.mapNextArg(source => sheetutils.getCellRangeFromTerm(source, sheet) || ERROR.SOURCE)
		.mapNextArg(target => sheetutils.getCellRangeFromTerm(target, sheet) || ERROR.TARGET)
		.run((source, target) => {
			const sourcevalues = rangevalues(source);
			const targetvalues = rangevalues(target);
			moverangevalues(sourcevalues, target);
			moverangevalues(targetvalues, source);
			return true;
		});

module.exports = {
	copyvalues,
	movevalues,
	swapvalues
};
