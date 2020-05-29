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
const { runFunction } = require('../../utils');
const { binary2float, float2binary, float2hex, hex2float } = require('./buffer');

const ERROR = FunctionErrors.code;

const isBin = /^(-|\+)?([01]+)$/;
const isDec = /^(-|\+)?([0-9]+)$/;
const isHex = /^(-|\+)?([0-9a-f]+)$/i;
const isOct = /^(-|\+)?([0-7]+)$/;
const isNr = { test: (nr) => !isNaN(nr) && isFinite(nr) };
const hasValidBitLength = { test: (str) => str.length < 33 };
const hasValidStringLength = { test: (str) => str.length < 11 };
const isInRange = (min, max) => ({ test: (nr) => nr >= min && nr <= max });
const test = (tester) => (val) => FunctionErrors.isError(val) || tester.test(val) ? val : ERROR.NUM;


const getPlaces = (term) => {
	const val = term ? term.value : 0;
	const nr = val == null ? 0 : convert.toNumberStrict(val, ERROR.VALUE);
	return nr < 0 ? ERROR.NUM : nr;
}

const MAX_FOR_BASE = {
	2: 0x1 * 2 ** 9,
	8: 0x4 * 8 ** 9,
	16: 0x8 * 16 ** 9
};
const fromBase = (base) => (val) => {
	const dec = parseInt(val, base);
	const max = MAX_FOR_BASE[base] || Number.MAX_SAFE_INTEGER;
	return dec >= max ? dec - max - max : dec;
};
const fromBin = fromBase(2);
const fromDec = fromBase(10);
const fromHex = fromBase(16);
const fromOct = fromBase(8);

const toRadix = (radix) => (val) => {
	let res = FunctionErrors.isError(val);
	if (!res) {
		if (val < 0) {
			const str = (0x10000000000 + val).toString(radix);
			const length = str.length;
			res = length > 10 ? str.substring(length - 10, length) : str;
		} else {
			res = val.toString(radix);
		}
	}
	return res;
};
const toBin = toRadix(2);
const toHex = toRadix(16);
const toOct = toRadix(8);

const term2Float = (term) => {
	const value = term.value;
	return value != null && value !== '' ? parseFloat(value) : 0;
};
const term2String = term => convert.toString(term.value) || '0';
const toUpper = (val) => FunctionErrors.isError(val) || val.toUpperCase();
const padded = (length) => (val) => (length && length < val.length) ? ERROR.NUM : val.padStart(length, '0');
const paddedBits = padded(32);
const testIsNr = test(isNr);
const testLength = test(hasValidStringLength);
const testBitLength = test(hasValidBitLength);
const testIsInBinRange = test(isInRange(-512, 511));
const testIsInOctRange = test(isInRange(-536870912, 536870911));
const testIsInHexRange = test(isInRange(-549755813888, 549755813887));


const testBinStr = test(isBin);
const toBinStr = pipe(term2String, testLength, testBinStr);
const _bin2dec = pipe(fromBin, testIsNr);
const bin2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(binstr => toBinStr(binstr))
		.run(binstr => _bin2dec(binstr));

const toBitStr = pipe(term2String, testBitLength, testBinStr);
const bin2float = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((binstr) => toBitStr(binstr))
		.run((binstr) => binary2float(paddedBits(binstr)));

const _bin2hex = pipe(fromBin, toHex, toUpper);
const bin2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2hex(binstr)));

const _bin2oct = pipe(fromBin, toOct);
const bin2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2oct(binstr)));

const testDecStr = test(isDec);
const toDecStr = pipe(term2String, testDecStr);
const _dec2bin = pipe(fromDec, testIsNr, testIsInBinRange, toBin);
const dec2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2bin(decstr)));

const _dec2hex = pipe(fromDec, testIsNr, testIsInHexRange, toHex, toUpper);
const dec2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2hex(decstr)));

const _dec2oct = pipe(fromDec, testIsNr, testIsInOctRange, toOct);
const dec2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2oct(decstr)));


const toFloat = pipe(term2Float, testIsNr);
const float2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((floatstr) => toFloat(floatstr))
		.run((floatnr) => paddedBits(float2binary(floatnr)));

const floatAsHex = pipe(float2hex, toUpper);
const floatToHex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg((floatstr) => toFloat(floatstr))
		.run((floatnr) => floatAsHex(floatnr));


const testHex = test(isHex);
const toHexStr = pipe(term2String, testLength, testHex);
const _hex2bin = pipe(fromHex, testIsNr, testIsInBinRange, toBin);
const hex2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2bin(hexstr)));

const _hex2dec = pipe(fromHex, testIsNr);
const hex2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.run(hexstr => _hex2dec(hexstr));

// const _hex2bin = pipe(fromHex, testIsNr, toBin);
const hexAsFloat = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.run(hexstr => hex2float(hexstr));

const _hex2oct = pipe(fromHex, testIsNr, testIsInOctRange, toOct);
const hex2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2oct(hexstr)));


const testOct = test(isOct);
const toOctStr = pipe(term2String, testLength, testOct);
const _oct2bin = pipe(fromOct, testIsInBinRange, toBin);
const oct2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2bin(octstr)));

const _oct2dec = pipe(fromOct, testIsNr);
const oct2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(octstr => toOctStr(octstr))
		.run(octstr => _oct2dec(octstr));

const _oct2hex = pipe(fromOct, testIsNr, toHex, toUpper);
const oct2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2hex(octstr)));

		
module.exports = {
	BIN2DEC: bin2dec,
	BIN2FLOAT: bin2float,
	BIN2HEX: bin2hex,
	BIN2OCT: bin2oct,
	DEC2BIN: dec2bin,
	DEC2HEX: dec2hex,
	DEC2OCT: dec2oct,
	FLOAT2BIN: float2bin,
	FLOAT2HEX: floatToHex,
	HEX2BIN: hex2bin,
	HEX2DEC: hex2dec,
	HEX2FLOAT: hexAsFloat,
	HEX2OCT: hex2oct,
	OCT2BIN: oct2bin,
	OCT2DEC: oct2dec,
	OCT2HEX: oct2hex

/* more to come...
	complex.
	convert,
*/	
};
