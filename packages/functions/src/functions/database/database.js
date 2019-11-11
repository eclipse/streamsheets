const mcore = require('../../machinecore');
const ConditionRange = require('./ConditionRange');
const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

let sharedidx; 
mcore.getAsync().then(({ SheetIndex }) => {
	sharedidx = SheetIndex.create(1, 0);
});

const columnIndex = (range, pivot) => {
	let index = convert.toNumber(pivot, 0) - 1;
	if (index < 0) {
		range.some((cell, sheetindex) => {
			const found = cell && cell.value === pivot;
			if (found) index = sheetindex.col - range.start.col;
			return found || sheetindex.row > range.start.row;
		});
	}
	return index;
};
const forEachMatchingRow = (sheet, terms, callback) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg((dbrange) => getCellRangeFromTerm(dbrange, sheet) || Error.code.VALUE)
		.mapNextArg((pivot, dbrange) => {
			const index = columnIndex(dbrange, pivot.value);
			return index == null || index < 0 ? Error.code.VALUE : index;
		})
		.mapNextArg((criteriarange) => getCellRangeFromTerm(criteriarange, sheet) || Error.code.VALUE)
		.run((dbrange, pivot, criteriarange) => {
			const condrange = ConditionRange.fromSheetRange(criteriarange.sheet, criteriarange);
			condrange.forEachMatchingRow(dbrange, (rowidx) => {
				sharedidx.set(rowidx, dbrange.start.col + pivot);
				const cell = dbrange.sheet.cellAt(sharedidx);
				const number = cell != null ? convert.toNumber(cell.value) : null;
				if (number != null) callback(number);
			});
		});

const daverage = (sheet, ...terms) => {
	let total = 0;
	let count = 0;
	const error = forEachMatchingRow(sheet, terms, (nr) => {
		count += 1;
		total += nr;
	});
	return error || total / count;
};

const dcount = (sheet, ...terms) => {
	let count = 0;
	const error = forEachMatchingRow(sheet, terms, () => {
		count += 1;
	});
	return error || count;
};

const dmax = (sheet, ...terms) => {
	let max;
	const error = forEachMatchingRow(sheet, terms, (nr) => {
		if (max == null || nr > max) max = nr;
	});
	return error || (max != null ? max : 0);
};

const dmin = (sheet, ...terms) => {
	let min;
	const error = forEachMatchingRow(sheet, terms, (nr) => {
		if (min == null || nr < min) min = nr;
	});
	return error || (min != null ? min : Error.code.VALUE);
};

const dsum = (sheet, ...terms) => {
	let sum = 0;
	const error = forEachMatchingRow(sheet, terms, (nr) => {
		sum += nr;
	});
	return error || sum;
};

module.exports = {
	DAVERAGE: daverage,
	DCOUNT: dcount,
	DMAX: dmax,
	DMIN: dmin,
	DSUM: dsum
};
