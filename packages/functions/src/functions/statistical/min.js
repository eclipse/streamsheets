const { FunctionErrors } = require('@cedalo/error-codes');
const { calculate, criteria, runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;


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
				const range = getCellRangeFromTerm(term, sheet);
				error = FunctionErrors.isError(range);
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

const minifs = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg((minrange) => getCellRangeFromTerm(minrange, sheet) || ERROR.INVALID_PARAM)
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.validate((minrange, _criteria) => !criteria.hasEqualRangeShapes(_criteria, minrange) ? ERROR.VALUE : undefined)
		.run((minrange, _criteria) => calculate.min(criteria.getNumbers(_criteria, minrange)));

module.exports = {
	MIN: min,
	MINIFS: minifs
};
