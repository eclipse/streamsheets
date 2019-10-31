const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');


const newMax = (termOrCell, oldmax) => {
	const val = !termOrCell.value ? 0 : termOrCell.value;
	return val > oldmax ? val : oldmax;
};

const max = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => {
			let error;
			let valid = false;
			const totalMax = terms.reduce((currMax, term) => {
				const range = getCellRangeFromTerm(term, sheet);
				error = Error.isError(range);
				valid = !error && (valid || !range);
				currMax = range
					? range.reduce((acc, cell) => {
							const defined = cell && cell.isDefined;
							valid = valid || defined;
							return defined ? newMax(cell, acc) : acc;
					  }, currMax)
					: newMax(term, currMax);
				return currMax;
			}, -Number.MAX_VALUE);
			return valid ? totalMax : error || 0;
		});


module.exports = max;
