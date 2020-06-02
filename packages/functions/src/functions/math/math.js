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
const { runFunction, values: { isEven, roundNumber } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

// eslint-disable-next-line no-nested-ternary
const _sign = (nr) => (nr > 0 ? 1 : nr < 0 ? -1 : 0);

const _trunc = (nr, digits) => Math.trunc(nr * 10 ** digits) / 10 ** digits;

const toNumberOrError = (value) => {
	let nr = value != null ? convert.toNumber(value) : 0;
	nr = nr == null && typeof value === 'string' && value.length < 1 ? 0 : nr;
	return nr != null ? nr : ERROR.VALUE;
};

const roundToEvenOrOdd = (nr, doEven) => {
	const rounded = nr < 0 ? Math.floor(nr) : Math.ceil(nr);
	const useRounded =
		(doEven && isEven(rounded)) || (!doEven && !isEven(rounded));
	// eslint-disable-next-line no-nested-ternary
	return useRounded ? rounded : rounded < 0 ? rounded - 1 : rounded + 1;
};

// const roundDecimaals = (nr, decimals) => parseFloat(nr.toFixed(decimals));
// const getDecimalsCount = (nr) => {
// 	const nrstr = nr.toString();
// 	const index = nrstr.indexOf('.');
// 	return index >=0 ? nrstr.length - index : 0;
// };

// ROUNDDOWN
// ROUNDUP
// SUMIF
// EXP
// FACT
// RAND

const abs = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => Math.abs(nr));

const arccos = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.validate((nr) => (nr > 1 || nr < -1 ? ERROR.VALUE : undefined))
		.run((nr) => Math.acos(nr));
const arcsin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.validate((nr) => (nr > 1 || nr < -1 ? ERROR.VALUE : undefined))
		.run((nr) => Math.asin(nr));

const degrees = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((angle) => toNumberOrError(angle.value))
		.run((angle) => (angle / Math.PI) * 180);

const even = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => roundToEvenOrOdd(nr, true));

const frac = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => {
			// return nr % 1;				<-- problem: 1.2  => 0.1999999996
			// return nr - Math.trunc(nr);	<-- problem: 1.2  => 0.1999999996
			const fraction = nr.toString().replace(/^[^\\.]+/, '0');
			return nr < 0 ? -Number(fraction) : Number(fraction);
		});

const int = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => Math.floor(nr));

const log = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.mapNextArg((base) => base ? toNumberOrError(base.value) : 10)
		.run((nr, base) => nr !== 0 && base !== 0 ? Math.log(nr) / Math.log(base) : ERROR.VALUE);

const mod = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.mapNextArg((divisor) => toNumberOrError(divisor.value))
		.run((nr, divisor) => divisor !== 0 ? nr - (divisor * Math.floor(nr / divisor)) : ERROR.DIV0);
		// if we want to round result to a certain decimal to get e.g 0.2 instead of 0.199999996
		// .run((nr, divisor) => {
		// 	if (divisor === 0) return ERROR.DIV0;
		// 	const decimals = Math.max(getDecimalsCount(nr), getDecimalsCount(divisor));
		// 	return roundDecimaals(nr - divisor * Math.floor(nr / divisor), decimals);
		// });


const odd = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => roundToEvenOrOdd(nr, false));

const power = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((base) => toNumberOrError(base.value))
		.mapNextArg((expo) => toNumberOrError(expo.value))
		.run((base, expo) => {
			const res = base ** expo;
			return isFinite(res) ? res : ERROR.NUM;
		});

const radians = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((angle) => toNumberOrError(angle.value))
		.run((angle) => (angle / 180) * Math.PI);

const randbetween = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((min) => toNumberOrError(min.value))
		.mapNextArg((max) => toNumberOrError(max.value))
		.validate((min, max) => (max < min ? ERROR.VALUE : null))
		.run((min, max) => {
			min = Math.ceil(min);
			max = Math.floor(max);
			// return random integer between min/max inclusive!
			// eslint-disable-next-line no-mixed-operators
			return Math.floor(Math.random() * (max - min + 1)) + min;
		});

const round = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(2)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.mapNextArg((digits) => toNumberOrError(digits.value))
		.run((nr, digits) => roundNumber(nr, digits));

const sign = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.run((nr) => _sign(nr));

const sqrt = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.validate((nr) => (nr < 0 ? ERROR.NUM : nr))
		.run((nr) => Math.sqrt(nr));

const trunc = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg((nr) => toNumberOrError(nr.value))
		.mapNextArg((digits) =>
			digits != null ? toNumberOrError(digits.value) : 0
		)
		.run((nr, digits) => _trunc(nr, digits));

module.exports = {
	ABS: abs,
	ARCCOS: arccos,
	ARCSIN: arcsin,
	DEGREES: degrees,
	EVEN: even,
	FRAC: frac,
	INT: int,
	LOG: log,
	MOD: mod,
	ODD: odd,
	POWER: power,
	RADIANS: radians,
	RANDBETWEEN: randbetween,
	ROUND: round,
	SIGN: sign,
	SQRT: sqrt,
	TRUNC: trunc
};
