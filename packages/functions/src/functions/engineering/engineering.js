const { common: { pipeCheckError }, runFunction } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const isBin = /^(-|\+)?([01]+)$/;
const isDec = /^(-|\+)?([0-9]+)$/;
const isHex = /^(-|\+)?([0-9a-f]+)$/i;
const isOct = /^(-|\+)?([0-7]+)$/;

// const pipeAll = (...fns) => pipeCheckError(...wrapFunctions(ignoreOnError, fns));

const getPlaces = (term) => {
	const val = term ? term.value : 0;
	const nr = val == null ? 0 : convert.toNumberStrict(val, ERROR.VALUE);
	return nr < 0 ? ERROR.NUM : nr;
}

const MAX_FOR_BASE = {
	2: 0x1 * 2 ** 9,
	8: 0x4 * 8 ** 9,
	16: 0x8 * 16**9
}
const fromBase = (base) => (val) => {
	const dec = parseInt(val, base);
	const max = MAX_FOR_BASE[base] || Number.MAX_SAFE_INTEGER;
	return dec >= max ? dec - max - max : dec;
}
const toRadix = (radix) => (val) => {
	if (val < 0) {
		const str = (0x10000000000 + val).toString(radix);
		const length = str.length;
		return length > 10 ? str.substring(length - 10, length) : str;
	}
	return val.toString(radix);
};
// returns string value or '0' if not defined or an error
const term2String = term => convert.toString(term.value) || '0';
const toUpper = (val) => val.toUpperCase();
const padded = (length) => (val) => (length && length < val.length) ? ERROR.NUM : val.padStart(length, '0');
const checkNr = (nr) => isNaN(nr) ? ERROR.NUM : nr;
const testStr = (fn) => (str) => FunctionErrors.isError(str) || fn.test(str) ? str : ERROR.NUM;
const testLength = (str) => str.length < 11 ? str : ERROR.NUM;

const isInBinRange = (nr) => nr > -513 && nr < 512 ? nr : ERROR.NUM;
const isInOctRange = (nr) => nr > -536870913 && nr < 536870912 ? nr : ERROR.NUM;
const isInHexRange = (nr) => nr > -549755813889 && nr < 549755813888 ? nr : ERROR.NUM;


const testBinStr = testStr(isBin);
const toBinStr = pipeCheckError(term2String, testLength, testBinStr);
const _bin2dec = pipeCheckError(fromBase(2), checkNr);
const bin2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(binstr => toBinStr(binstr))
		.run(binstr => _bin2dec(binstr));

const _bin2hex = pipeCheckError(fromBase(2), toRadix(16), toUpper);
const bin2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2hex(binstr)));

const _bin2oct = pipeCheckError(fromBase(2), toRadix(8));
const bin2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(binstr => toBinStr(binstr))
		.mapNextArg(places => getPlaces(places))
		.run((binstr, places) => padded(places)(_bin2oct(binstr)));

const testDecStr = testStr(isDec);
const toDecStr = pipeCheckError(term2String, testDecStr);
const _dec2bin = pipeCheckError(fromBase(10), checkNr, isInBinRange, toRadix(2));
const dec2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2bin(decstr)));

const _dec2hex = pipeCheckError(fromBase(10), checkNr, isInHexRange, toRadix(16), toUpper);
const dec2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2hex(decstr)));

const _dec2oct = pipeCheckError(fromBase(10), checkNr, isInOctRange, toRadix(8));
const dec2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2oct(decstr)));


const testHex = testStr(isHex);
const toHexStr = pipeCheckError(term2String, testLength, testHex);
const _hex2bin = pipeCheckError(fromBase(16), checkNr, isInBinRange, toRadix(2));
const hex2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2bin(hexstr)));

const _hex2dec = pipeCheckError(fromBase(16), checkNr);
const hex2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.run(hexstr => _hex2dec(hexstr));

const _hex2oct = pipeCheckError(fromBase(16), checkNr, isInOctRange, toRadix(8));
const hex2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2oct(hexstr)));


const testOct = testStr(isOct);
const toOctStr = pipeCheckError(term2String, testLength, testOct);
const _oct2bin = pipeCheckError(fromBase(8), isInBinRange, toRadix(2))
const oct2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2bin(octstr)));

const _oct2dec = pipeCheckError(fromBase(8), checkNr);
const oct2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(octstr => toOctStr(octstr))
		.run(octstr => _oct2dec(octstr));

const _oct2hex = pipeCheckError(fromBase(8), checkNr, toRadix(16), toUpper);
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
