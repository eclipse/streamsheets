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
const {	calculate, criteria, runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');

const ERROR = FunctionErrors.code;

const mapRange = (sheet) => (term) => term && (getCellRangeFromTerm(term, sheet) || ERROR.DIV0);

const calcAvg = (avgrange, _criteria) => {
	const numbers = criteria.getNumbers(_criteria, avgrange || _criteria[0][0]);
	return numbers.length ? calculate.avg(numbers) : ERROR.DIV0;
};
const averageif = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.withMaxArgs(3)
		.mapArgAt(2, mapRange(sheet))
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.run(calcAvg);
const averageifs = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg(mapRange(sheet))
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.validate((avgrange, _criteria) => !criteria.hasEqualRangeShapes(_criteria, avgrange) ? ERROR.VALUE : undefined)
		.run(calcAvg);


const count = (sheet, runner) =>
	runner
		.mapRemaingingArgs((remainingTerms) => criteria.createFromTerms(remainingTerms, sheet))
		.run((_criteria) => criteria.getValues(_criteria).length);
const countif = (sheet, ...terms) => count(sheet, runFunction(sheet, terms).withArgCount(2));
const countifs = (sheet, ...terms) => count(sheet, runFunction(sheet, terms).withMinArgs(2));


module.exports = {
	AVERAGEIF: averageif,
	AVERAGEIFS: averageifs,
	COUNTIF: countif,
	COUNTIFS: countifs
};
