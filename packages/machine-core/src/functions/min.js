const ERROR = require('./errors');
const sheetutils = require('./_utils').sheet;
const runFunction = require('./_utils').runFunction;


const newMin = (termOrCell, oldmin) => {
	const val = !termOrCell.value ? 0 : termOrCell.value;
	return val < oldmin ? val : oldmin;
};

const min = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => {
			let error;
			let valid = false;
			const totalMin = terms.reduce((currMin, term) => {
				const range = sheetutils.getCellRangeFromTerm(term, sheet);
				error = ERROR.isError(range);
				valid = !error && (valid || !range);
				currMin = range
					? range.reduce((acc, cell) => {
							const defined = cell && cell.isDefined;
							valid = valid || defined;
							return defined ? newMin(cell, acc) : acc;
					  }, currMin)
					: newMin(term, currMin);
				return currMin;
			}, Number.MAX_VALUE);
			return valid ? totalMin : error || 0;
		});


module.exports = min;
