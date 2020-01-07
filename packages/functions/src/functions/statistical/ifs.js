const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const {
	criterion,
	runFunction,
	terms: { getCellRangeFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;

const getCriterion = (term, cond) => {
	if (!term.criterion) term.criterion = criterion.of(cond);
	return term.criterion;
};
const averageif = (sheet, ...terms) => {};
const averageifs = (sheet, ...terms) => {};
const countif = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((range) => getCellRangeFromTerm(range, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg((cond) => convert.toString(cond.value, ERROR.INVALID_PARAM))
		.run((range, cond) => {
			const crit = getCriterion(countif.term, cond);
			return range.reduce((count, cell) => {
				const val = cell != null ? cell.value : undefined;
				if (val != null && crit.isFulFilled(val)) count += 1;
				return count;
			}, 0)
		});

const countifs = (sheet, ...terms) => {};
const maxifs = (sheet, ...terms) => {};
const minifs = (sheet, ...terms) => {};
const sumif = (sheet, ...terms) => {};
const sumifs = (sheet, ...terms) => {};

module.exports = {
	AVERAGEIF: averageif,
	AVERAGEIFS: averageifs,
	COUNTIF: countif,
	COUNTIFS: countifs,
	MAXIFS: maxifs,
	MINIFS: minifs,
	SUMIF: sumif,
	SUMIFS: sumifs
};
