const ERROR = require('../errors');
const { pipe } = require('../_utils').common;
const { convert, runFunction} = require('../_utils');

const isBin = /^(-|\+)?([01]+)$/;
const isDec = /^(-|\+)?([0-9]+)$/;
const isHex = /^(-|\+)?([0-9a-f]+)$/i;
const isOct = /^(-|\+)?([0-7]+)$/;


const getPlaces = (term) => {
	const val = term ? term.value : 0;
	const nr = val == null ? 0 : convert.toNumberStrict(val, ERROR.VALUE);
	return nr < 0 ? ERROR.NUM : nr;
}
// returns string value or '0' if not defined or an error
const term2String = term => convert.toString(term.value) || '0';
const fromBase = (base) => (val) => parseInt(val, base);
const toRadix = (radix) => (val) => val.toString(radix);
const toUpper = (val) => val.toUpperCase();
const padded = (length) => (val) => (length && length < val.length) ? ERROR.NUM : val.padStart(length, '0');
const checkNr = (nr) => isNaN(nr) ? ERROR.NUM : nr;
const testStr = (fn) => (str) => ERROR.isError(str) || fn.test(str) ? str : ERROR.NUM;


const toBinStr = pipe(term2String, testStr(isBin));
const _bin2dec = pipe(fromBase(2), checkNr);
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


const toDecStr = pipe(term2String, testStr(isDec));
const _dec2bin = pipe(fromBase(10), toRadix(2));
const dec2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2bin(decstr)));

const _dec2hex = pipe(fromBase(10), toRadix(16), toUpper);
const dec2hex = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2hex(decstr)));

const _dec2oct = pipe(fromBase(10), toRadix(8));
const dec2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(decstr => toDecStr(decstr))
		.mapNextArg(places => getPlaces(places))
		.run((decstr, places) => padded(places)(_dec2oct(decstr)));


const toHexStr = pipe(term2String, testStr(isHex));
const _hex2bin = pipe(fromBase(16), toRadix(2))
const hex2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2bin(hexstr)));

const _hex2dec = pipe(fromBase(16), checkNr);
const hex2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.run(hexstr => _hex2dec(hexstr));

const _hex2oct = pipe(fromBase(16), toRadix(8));
const hex2oct = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(hexstr => toHexStr(hexstr))
		.mapNextArg(places => getPlaces(places))
		.run((hexstr, places) => padded(places)(_hex2oct(hexstr)));


const toOctStr = pipe(term2String, testStr(isOct));
const _oct2bin = pipe(fromBase(8), toRadix(2))
const oct2bin = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(octstr => toOctStr(octstr))
		.mapNextArg(places => getPlaces(places))
		.run((octstr, places) => padded(places)(_oct2bin(octstr)));

const _oct2dec = pipe(fromBase(8), checkNr);
const oct2dec = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withArgCount(1)
		.mapNextArg(octstr => toOctStr(octstr))
		.run(octstr => _oct2dec(octstr));

const _oct2hex = pipe(fromBase(8), toRadix(16), toUpper);
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
