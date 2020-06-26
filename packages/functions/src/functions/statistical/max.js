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
const { FunctionErrors } = require('@cedalo/error-codes');
const { calculate, criteria, runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

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
				error = FunctionErrors.isError(range);
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

const maxifs = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg((maxrange) => getCellRangeFromTerm(maxrange, sheet) || ERROR.INVALID_PARAM)
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.validate((maxrange, _criteria) => !criteria.hasEqualRangeShapes(_criteria, maxrange) ? ERROR.VALUE : undefined)
		.run((maxrange, _criteria) => calculate.max(criteria.getNumbers(_criteria, maxrange)));

module.exports = {
	MAX: max,
	MAXIFS: maxifs
};
