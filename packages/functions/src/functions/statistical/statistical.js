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
const { convert, functions: { pipe } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { calculate, runFunction, terms: onTerms } = require('../../utils');

const ERROR = FunctionErrors.code;

const testValues = (min, error) => (values) => (values.length > min ? values : error);
const doIfNoError = (fn) => (values) => FunctionErrors.isError(values) ? values : fn(values);
const collect = (numbers = []) => (value, err) => {
	if (value != null && err == null) {
		const nr = convert.toNumberStrict(value);
		if (nr != null) numbers.push(nr);
	}
	return err;
};
// stops on first error
const getNumbers = (sheet, terms) => {
	let error;
	const numbers = [];
	const collectNumbers = collect(numbers);
	onTerms.iterateValues(sheet, terms, (value, err) => {
		error = err;
		return collectNumbers(value, err);
	});
	return error || numbers;
}
const countDefinedCells = (sheet, terms) => {
	let total = 0;
	onTerms.iterateValues(sheet, terms, (value, err) => {
		if (err || value != null) total += 1;
	});
	return total;
};

const runWith = (fn, sheet, terms) => fn(getNumbers(sheet, terms));

const avg = pipe(testValues(0, ERROR.DIV0), doIfNoError(calculate.avg));
const average = (sheet, ...terms) => runFunction(sheet, terms).withMinArgs(1).run(() => runWith(avg, sheet, terms));

const cnt = pipe(doIfNoError((numbers) => numbers.length));
const count = (sheet, ...terms) => runFunction(sheet, terms).withMinArgs(1).run(() => runWith(cnt, sheet, terms));
const counta = (sheet, ...terms) => runFunction(sheet, terms).withMinArgs(1).run(() => countDefinedCells(sheet, terms));

const mx = pipe(doIfNoError(calculate.max));
const max = (sheet, ...terms) => runFunction(sheet, terms).run(() => runWith(mx, sheet, terms));

const mn = pipe(doIfNoError(calculate.min));
const min = (sheet, ...terms) => runFunction(sheet, terms).run(() => runWith(mn, sheet, terms));

const stdDev = pipe(testValues(1, ERROR.DIV0), doIfNoError(calculate.standardDerivation));
const stdev = (sheet, ...terms) => runFunction(sheet, terms).withMinArgs(1).run(() => runWith(stdDev, sheet, terms));


const correl = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((xValues) => getNumbers(sheet, xValues))
		.mapNextArg((yValues) => getNumbers(sheet, yValues))
		.validate((arrayX, arrayY) => (arrayX.length === 0 || arrayY.length === 0 ? ERROR.DIV0 : undefined))
		.validate((arrayX, arrayY) => (arrayX.length !== arrayY.length ? ERROR.NA : undefined))
		.run((arrayX, arrayY) => {
			const avgX = calculate.avg(arrayX);
			const avgY = calculate.avg(arrayY);
			let numerator = 0;
			let denominatorX = 0;
			let denominatorY = 0;
			arrayX.forEach((x, index) => {
				const y = arrayY[index];
				const varX = x - avgX;
				const varY = y - avgY;
				numerator += varX * varY;
				denominatorX += varX * varX;
				denominatorY += varY * varY;
			});
			return denominatorX !== 0 && denominatorY !== 0
				? numerator / Math.sqrt(denominatorX * denominatorY)
				: ERROR.DIV0;
		});

const forecast = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(3)
		.mapNextArg((xTerm) => (xTerm ? convert.toNumberStrict(xTerm.value, ERROR.VALUE) : ERROR.VALUE))
		.mapNextArg((yKnown) => getNumbers(sheet, yKnown))
		.mapNextArg((xKnown) => getNumbers(sheet, xKnown))
		.validate((xVal, arrayY, arrayX) =>
			arrayX.length !== arrayY.length || arrayX.length === 0 || arrayY.length === 0 ? ERROR.NA : undefined
		)
		.run((xVal, arrayY, arrayX) => {
			const avgY = calculate.avg(arrayY);
			const avgX = calculate.avg(arrayX);
			let numerator = 0;
			let denominator = 0;
			arrayX.forEach((x, index) => {
				const y = arrayY[index];
				const varX = x - avgX;
				const varY = y - avgY;
				numerator += varX * varY;
				denominator += varX * varX;
			});
			if (denominator !== 0) {
				const b = numerator / denominator;
				const a = avgY - b * avgX;
				return a + b * xVal;
			}
			return ERROR.DIV0;
		});

module.exports = {
	AVERAGE: average,
	CORREL: correl,
	COUNT: count,
	COUNTA: counta,
	FORECAST: forecast,
	MAX: max,
	MIN: min,
	'STDEV.S': stdev
};
