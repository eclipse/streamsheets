const { common: { pipe }, runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const isBin = /^(-|\+)?([01]+)$/;
const isDec = /^(-|\+)?([0-9]+)$/;
const isHex = /^(-|\+)?([0-9a-f]+)$/i;
const isOct = /^(-|\+)?([0-7]+)$/;
const isNr = { test: (nr) => !isNaN(nr) };
const hasValidStringLength = { test: (str) => str.length < 11 };
const isInRange = (min, max) => ({ test: (nr) => nr >= min && nr <= max });
const test = (tester) => (val) => FunctionErrors.isError(val) || tester.test(val) ? val : ERROR.NUM;

// const pipeAll = (...fns) => pipeCheckError(...wrapFunctions(ignoreOnError, fns));

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
}
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

const term2String = term => convert.toString(term.value) || '0';
const toUpper = (val) => FunctionErrors.isError(val) || val.toUpperCase();
const padded = (length) => (val) => (length && length < val.length) ? ERROR.NUM : val.padStart(length, '0');
const testIsNr = test(isNr);
const testLength = test(hasValidStringLength);
const testIsInBinRange = test(isInRange(-512, 511));
const testIsInOctRange = test(isInRange(-536870912, 536870911));
const testIsInHexRange = test(isInRange(-549755813888, 549755813887));


const testBinStr = test(isBin);
const toBinStr = pipe(term2String, testLength, testBinStr);
const _bin2dec = pipe(fromBase(2), testIsNr);
const bin2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(binstr => toBinStr(binstr))
		.run(binstr => _bin2dec(binstr));

const _bin2hex = pipe(fromBase(2), toRadix(16), toUpper);
const bin2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2hex(binstr)));

const _bin2oct = pipe(fromBase(2), toRadix(8));
const bin2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2oct(binstr)));

const testDecStr = test(isDec);
const toDecStr = pipe(term2String, testDecStr);
const _dec2bin = pipe(fromBase(10), testIsNr, testIsInBinRange, toRadix(2));
const dec2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2bin(decstr)));

const _dec2hex = pipe(fromBase(10), testIsNr, testIsInHexRange, toRadix(16), toUpper);
const dec2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2hex(decstr)));

const _dec2oct = pipe(fromBase(10), testIsNr, testIsInOctRange, toRadix(8));
const dec2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2oct(decstr)));


const testHex = test(isHex);
const toHexStr = pipe(term2String, testLength, testHex);
const _hex2bin = pipe(fromBase(16), testIsNr, testIsInBinRange, toRadix(2));
const hex2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2bin(hexstr)));

const _hex2dec = pipe(fromBase(16), testIsNr);
const hex2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.run(hexstr => _hex2dec(hexstr));

const _hex2oct = pipe(fromBase(16), testIsNr, testIsInOctRange, toRadix(8));
const hex2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2oct(hexstr)));


const testOct = test(isOct);
const toOctStr = pipe(term2String, testLength, testOct);
const _oct2bin = pipe(fromBase(8), testIsInBinRange, toRadix(2))
const oct2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2bin(octstr)));

const _oct2dec = pipe(fromBase(8), testIsNr);
const oct2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(octstr => toOctStr(octstr))
		.run(octstr => _oct2dec(octstr));

const _oct2hex = pipe(fromBase(8), testIsNr, toRadix(16), toUpper);
const oct2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2hex(octstr)));

		
module.exports = {
	BIN2DEC: bin2dec,
	BIN2HEX: bin2hex,
	BIN2OCT: bin2oct,
	HEX2BIN: hex2bin,
	HEX2DEC: hex2dec,
	HEX2OCT: hex2oct,
	DEC2BIN: dec2bin,
	DEC2HEX: dec2hex,
	DEC2OCT: dec2oct,
	OCT2BIN: oct2bin,
	OCT2DEC: oct2dec,
	OCT2HEX: oct2hex

/* more to come...
	complex.
	convert,
*/	
};
