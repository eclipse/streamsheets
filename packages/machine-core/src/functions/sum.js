const ERROR = require('./errors');
const { convert, runFunction, sheet: sheetutils } = require('./_utils');


const rangeSum = range => range.reduce((sum, cell) => {
	if (cell != null) sum += convert.toNumberStrict(cell.value, 0);
	return sum;
}, 0);

const sumOf = (sheet, terms) => {
	let error;
	return terms.reduce((total, term) => {
		// range or value:
		if (!error) {
			const range = sheetutils.getCellRangeFromTerm(term, sheet);
			const nr = !range ? convert.toNumber(term.value, ERROR.VALUE) : undefined;
			error = ERROR.isError(range) || ERROR.isError(nr) || ERROR.isError(term.value);
			if (!error) total += range ? rangeSum(range) : nr;
		}
		return error || total;
	}, 0);
};

const sum = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => sumOf(sheet, terms));

module.exports = sum;
