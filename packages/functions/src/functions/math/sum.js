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
const {
	calculate,
	criteria,
	runFunction,
	terms: { getCellRangeFromTerm }
} = require('../../utils');

const ERROR = FunctionErrors.code;


const rangeSum = (range) =>
	range.reduce((sum, cell) => {
		if (cell != null) sum += convert.toNumberStrict(cell.value, 0);
		return sum;
	}, 0);

const sumOf = (sheet, terms) => {
	let error;
	return terms.reduce((total, term) => {
		// range or value:
		if (!error) {
			const range = getCellRangeFromTerm(term, sheet);
			const nr = !range ? convert.toNumber(term.value, ERROR.VALUE) : undefined;
			error = FunctionErrors.isError(range) || FunctionErrors.isError(nr) || FunctionErrors.isError(term.value);
			if (!error) total += range ? rangeSum(range) : nr;
		}
		return error || total;
	}, 0);
};

const sum = (sheet, ...terms) => runFunction(sheet, terms).withMinArgs(1).run(() => sumOf(sheet, terms));


const sumif = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapArgAt(2, (sumrange) => sumrange && (getCellRangeFromTerm(sumrange, sheet) || ERROR.INVALID_PARAM))
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.run((sumrange, _criteria) => calculate.sum(criteria.getNumbers(_criteria, sumrange || _criteria[0][0])));

const sumifs = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg((sumrange) => getCellRangeFromTerm(sumrange, sheet) || ERROR.INVALID_PARAM)
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.validate((sumrange, _criteria) => !criteria.hasEqualRangeShapes(_criteria, sumrange) ? ERROR.VALUE : undefined)
		.run((sumrange, _criteria) => calculate.sum(criteria.getNumbers(_criteria, sumrange)));

module.exports = {
	SUM: sum,
	SUMIF: sumif,
	SUMIFS: sumifs
};
