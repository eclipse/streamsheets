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
const { createTerm } = require('../utilities');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('engineering functions', () => {
	describe('bin2dec', () => {
		it('should convert a binary number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2dec(0)', sheet).value).toBe(0);
			expect(createTerm('bin2dec(1010)', sheet).value).toBe(10);
			expect(createTerm('bin2dec(1100100)', sheet).value).toBe(100);
			expect(createTerm('bin2dec(1111111111)', sheet).value).toBe(-1);
			expect(createTerm('bin2dec(1111110001)', sheet).value).toBe(-15);
			expect(createTerm('bin2dec(1110011100)', sheet).value).toBe(-100);
			expect(createTerm('bin2dec(1000000000)', sheet).value).toBe(-512);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('bin2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('bin2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('bin2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a binary number or not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: '1111200', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(B3)', sheet).value).toBe(ERROR.NUM);
			// not more than 10 bits
			expect(createTerm('bin2dec(11111111111)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('bin2float', () => {
		it('should convert a float number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2float("0")', sheet).value).toBe(0);
			expect(createTerm('bin2float("01000000010010010000111111011011")', sheet).value).toBe(
				3.1415927410125732421875
			);
		});
		it('should fill missing zeros at the beginning', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2float("111")', sheet).value).toBe(
				9.809089250273719496e-45
			);
		});
		it('should tread undefined or empty cells as 0', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('bin2float(A1)', sheet).value).toBe(0);
			expect(createTerm('bin2float(A2)', sheet).value).toBe(0);
			expect(createTerm('bin2float(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a binary number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2float(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2float(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2float(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2float(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2float(B3)', sheet).value).toBe(ERROR.NUM);
		});
		// DL-3707
		it(`should return ${ERROR.NUM} if given binary number is too large or infinity`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2float("11111111100000000000000000000000")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2float("01111111100000000000000000000000")', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('bin2hex', () => {
		it('should convert a binary number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2hex(1110)', sheet).value).toBe('E');
			expect(createTerm('bin2hex(11111011, 4)', sheet).value).toBe('00FB');
			// expect(createTerm('bin2hex(1110, "5")', sheet).value).toBe('0000E');
			expect(createTerm('bin2hex(11111011, 4)', sheet).value).toBe('00FB');
			expect(createTerm('bin2hex(1111111111)', sheet).value).toBe('FFFFFFFFFF');
			expect(createTerm('bin2hex(1111110001)', sheet).value).toBe('FFFFFFFFF1');
			expect(createTerm('bin2hex(1110011100)', sheet).value).toBe('FFFFFFFF9C');
			expect(createTerm('bin2hex(1000000000)', sheet).value).toBe('FFFFFFFE00');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('bin2hex(1110, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2hex(1110, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2hex(1110, "5")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2hex(1110, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2hex(1110, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(1110, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2hex(1110, A2)', sheet).value).toBe('E');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('bin2hex(A1)', sheet).value).toBe('0');
			expect(createTerm('bin2hex(A2)', sheet).value).toBe('0');
			expect(createTerm('bin2hex(B2)', sheet).value).toBe('0');
		});
		it(`should return ${ERROR.NUM} if given value represents not a binary number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: '1111200', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(B3)', sheet).value).toBe(ERROR.NUM);
			// not more than 10 bits
			expect(createTerm('bin2hex(11111111111)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('bin2oct', () => {
		it('should convert a binary number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2oct(1001)', sheet).value).toBe('11');
			expect(createTerm('bin2oct(1001, 4)', sheet).value).toBe('0011');
			expect(createTerm('bin2oct(1100100)', sheet).value).toBe('144');
			expect(createTerm('bin2oct(1111111111)', sheet).value).toBe('7777777777');
			expect(createTerm('bin2oct(1111110001)', sheet).value).toBe('7777777761');
			expect(createTerm('bin2oct(1110011100)', sheet).value).toBe('7777777634');
			expect(createTerm('bin2oct(1000000000)', sheet).value).toBe('7777777000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
			is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('bin2oct(1001, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2oct(1001, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2oct(1001, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2oct(1001, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2oct(1001, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('bin2oct(1001, A1)', sheet).value).toBe('11');
			expect(createTerm('bin2oct(1001, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('bin2oct(1001, A2)', sheet).value).toBe('11');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('bin2oct(A1)', sheet).value).toBe('0');
			expect(createTerm('bin2oct(A2)', sheet).value).toBe('0');
			expect(createTerm('bin2oct(B2)', sheet).value).toBe('0');
		});
		it(`should return ${ERROR.NUM} if given value represents not a binary number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: '1111200', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2oct(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2oct(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2oct(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2oct(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2oct(B3)', sheet).value).toBe(ERROR.NUM);
			// not more than 10 bits
			expect(createTerm('bin2oct(11111111111)', sheet).value).toBe(ERROR.NUM);
		});
	});


	describe('dec2bin', () => {
		it('should convert a decimal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2bin(15)', sheet).value).toBe('1111');
			expect(createTerm('dec2bin(9, 4)', sheet).value).toBe('1001');
			// expect(createTerm('dec2bin(15, "8")', sheet).value).toBe('00001111');
			expect(createTerm('dec2bin(15, 8)', sheet).value).toBe('00001111');
			expect(createTerm('dec2bin(183)', sheet).value).toBe('10110111');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2bin(-0)', sheet).value).toBe('0');
			expect(createTerm('dec2bin(-1)', sheet).value).toBe('1111111111');
			expect(createTerm('dec2bin(-15)', sheet).value).toBe('1111110001');
			expect(createTerm('dec2bin(-100)', sheet).value).toBe('1110011100');
			expect(createTerm('dec2bin(-512)', sheet).value).toBe('1000000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
			is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('dec2bin(53, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2bin(53, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2bin(15, "8")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2bin(53, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2bin(53, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(53, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('dec2bin(53, A1)', sheet).value).toBe('110101');
			expect(createTerm('dec2bin(53, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2bin(53, A2)', sheet).value).toBe('110101');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('dec2bin(A1)', sheet).value).toBe('0');
			// expect(createTerm('dec2bin(A2, "3")', sheet).value).toBe('000');
			expect(createTerm('dec2bin(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('dec2bin(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a decimal number or not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(B3)', sheet).value).toBe(ERROR.NUM);
			// range is -512 to 511
			expect(createTerm('dec2bin(512)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(-513)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('dec2hex', () => {
		it('should convert a decimal number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2hex(15)', sheet).value).toBe('F');
			// expect(createTerm('dec2hex(15, "4")', sheet).value).toBe('000F');
			expect(createTerm('dec2hex(15, 4)', sheet).value).toBe('000F');
			expect(createTerm('dec2hex(183)', sheet).value).toBe('B7');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2hex(-0)', sheet).value).toBe('0');
			expect(createTerm('dec2hex(-1)', sheet).value).toBe('FFFFFFFFFF');
			expect(createTerm('dec2hex(-15)', sheet).value).toBe('FFFFFFFFF1');
			expect(createTerm('dec2hex(-54)', sheet).value).toBe('FFFFFFFFCA');
			expect(createTerm('dec2hex(549755813887)', sheet).value).toBe('7FFFFFFFFF');
			expect(createTerm('dec2hex(-549755813888)', sheet).value).toBe('8000000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
			is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('dec2hex(53, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2hex(53, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2hex(15, "4")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2hex(53, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2hex(53, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(53, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('dec2hex(53, A1)', sheet).value).toBe('35');
			expect(createTerm('dec2hex(53, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2hex(53, A2)', sheet).value).toBe('35');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('dec2hex(A1)', sheet).value).toBe('0');
			// expect(createTerm('dec2hex(A2, "3")', sheet).value).toBe('000');
			expect(createTerm('dec2hex(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('dec2hex(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a decimal number or not in valid range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(B3)', sheet).value).toBe(ERROR.NUM);
			// range is -549,755,813,888 <= .. <= 549,755,813,887
			expect(createTerm('dec2hex(549755813888)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(-549755813889)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('dec2oct', () => {
		it('should convert a decimal number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2oct(15)', sheet).value).toBe('17');
			expect(createTerm('dec2oct(15, 4)', sheet).value).toBe('0017');
			expect(createTerm('dec2oct(58, 3)', sheet).value).toBe('072');
			expect(createTerm('dec2oct(183)', sheet).value).toBe('267');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2oct(-0)', sheet).value).toBe('0');
			expect(createTerm('dec2oct(-1)', sheet).value).toBe('7777777777');
			expect(createTerm('dec2oct(-100)', sheet).value).toBe('7777777634');
			expect(createTerm('dec2oct(-536870912)', sheet).value).toBe('4000000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
			is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('dec2oct(183, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2oct(183, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2oct(15, "4")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2oct(183, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2oct(183, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(183, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('dec2oct(183, A1)', sheet).value).toBe('267');
			expect(createTerm('dec2oct(183, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('dec2oct(183, A2)', sheet).value).toBe('267');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('dec2oct(A1)', sheet).value).toBe('0');
			// expect(createTerm('dec2oct(A2, "3")', sheet).value).toBe('000');
			expect(createTerm('dec2oct(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('dec2oct(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a decimal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2oct(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(B3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(536870912)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(-536870913)', sheet).value).toBe(ERROR.NUM);
		});
	});

	describe('float2bin', () => {
		it('should convert a float number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('float2bin(0)', sheet).value).toBe('00000000000000000000000000000000');
			expect(createTerm('float2bin(3.141592653589793)', sheet).value).toBe('01000000010010010000111111011011');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('float2bin(-1)', sheet).value).toBe('10111111100000000000000000000000');
			expect(createTerm('float2bin(-3.141592653589793)', sheet).value).toBe('11000000010010010000111111011011');
		});
		it('should tread undefined or empty cells as 0', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('float2bin(A1)', sheet).value).toBe('00000000000000000000000000000000');
			expect(createTerm('float2bin(A2)', sheet).value).toBe('00000000000000000000000000000000');
			expect(createTerm('float2bin(B2)', sheet).value).toBe('00000000000000000000000000000000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('float2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2bin(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2bin(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2bin(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('float2hex', () => {
		it('should convert a float number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('float2hex(0)', sheet).value).toBe('0');
			expect(createTerm('float2hex(3.141592653589793)', sheet).value).toBe('40490FDB');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('float2hex(-1)', sheet).value).toBe('BF800000');
			expect(createTerm('float2hex(-3.141592653589793)', sheet).value).toBe('C0490FDB');
		});
		it('should tread undefined or empty cells as 0', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('float2hex(A1)', sheet).value).toBe('0');
			expect(createTerm('float2hex(A2)', sheet).value).toBe('0');
			expect(createTerm('float2hex(B2)', sheet).value).toBe('0');
		});
		it(`should return ${ERROR.NUM} if given value represents not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('float2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2hex(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2hex(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('float2hex(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});

	describe('hex2bin', () => {
		it('should convert a hexadecimal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2bin("F")', sheet).value).toBe('1111');
			expect(createTerm('hex2bin("F", 8)', sheet).value).toBe('00001111');
			expect(createTerm('hex2bin("1FF",)', sheet).value).toBe('111111111');
			expect(createTerm('hex2bin("B7",)', sheet).value).toBe('10110111');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2bin(-0)', sheet).value).toBe('0');
			expect(createTerm('hex2bin("FFFFFFFFFF")', sheet).value).toBe('1111111111');
			expect(createTerm('hex2bin("FFFFFFFFF1")', sheet).value).toBe('1111110001');
			expect(createTerm('hex2bin("FFFFFFFF9C")', sheet).value).toBe('1110011100');
			expect(createTerm('hex2bin("FFFFFFFE00")', sheet).value).toBe('1000000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
			is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('hex2bin("3A", true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2bin("3A", false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2bin(A2, "3")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2bin("3A", B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2bin("3A", -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(1001, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('hex2bin("3A", A1)', sheet).value).toBe('111010');
			expect(createTerm('hex2bin("3A", A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2bin("3A", A2)', sheet).value).toBe('111010');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('hex2bin(A1)', sheet).value).toBe('0');
			// expect(createTerm('hex2bin(A2, "3")', sheet).value).toBe('000');
			expect(createTerm('hex2bin(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('hex2bin(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(B3)', sheet).value).toBe(ERROR.NUM);
			// range FFFFFFFE00 <= .. <= 1FF (-512 <=..<= 511)
			expect(createTerm('hex2bin("FFFFFFFDFF")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin("200")', sheet).value).toBe(ERROR.NUM);

			expect(createTerm('dec2hex(549755813888)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(-549755813889)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('hex2dec', () => {
		it('should convert a hexadecimal number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2dec(0)', sheet).value).toBe(0);
			expect(createTerm('hex2dec("A5")', sheet).value).toBe(165);
			expect(createTerm('hex2dec("3DA408B9")', sheet).value).toBe(1034160313);
			expect(createTerm('hex2dec("7FFFFFFFFF")', sheet).value).toBe(549755813887);
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2dec("FFFFFFFFFF")', sheet).value).toBe(-1);
			expect(createTerm('hex2dec("FFFFFFFFCA")', sheet).value).toBe(-54);
			expect(createTerm('hex2dec("FFFFFFFF5B")', sheet).value).toBe(-165);
			expect(createTerm('hex2dec("8000000000")', sheet).value).toBe(-549755813888);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('hex2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('hex2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('hex2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(B3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec("90000000001")', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('hex2oct', () => {
		it('should convert a hexadecimal number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2oct("A")', sheet).value).toBe('12');
			expect(createTerm('hex2oct("F", 3)', sheet).value).toBe('017');
			expect(createTerm('hex2oct("A", 4)', sheet).value).toBe('0012');
			expect(createTerm('hex2oct("3B4E")', sheet).value).toBe('35516');
			expect(createTerm('hex2oct("FF3", 4)', sheet).value).toBe('7763');
			expect(createTerm('hex2oct("FFFFFFFF00")', sheet).value).toBe('7777777400');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2oct("FFFFFFFFFF")', sheet).value).toBe('7777777777');
			expect(createTerm('hex2oct("FFFFFFFFCA")', sheet).value).toBe('7777777712');
			expect(createTerm('hex2oct("FFFFFFFF5B")', sheet).value).toBe('7777777533');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('hex2oct("3A", true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2oct("3A", false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2oct(A2, "3")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2oct("3A", B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2oct("3A", -4)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('hex2oct("3A", A1)', sheet).value).toBe('72');
			expect(createTerm('hex2oct("3A", A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('hex2oct("3A", A2)', sheet).value).toBe('72');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('hex2oct(A1)', sheet).value).toBe('0');
			expect(createTerm('hex2oct(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('hex2oct(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2oct(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(B3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct("1FFFFFFF0")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct("FFDFFFFFFF")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct("2000000000")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct("8000000000")', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('hex2float', () => {
		it('should convert a hexadecimal number to float', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2float(0)', sheet).value).toBe(0);
			expect(createTerm('hex2float("40490FDB")', sheet).value).toBe(3.1415927410125732421875);
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2float("BF800000")', sheet).value).toBe(-1);
			expect(createTerm('hex2float("C0490FDB")', sheet).value).toBe(-3.1415927410125732421875);
		});
		it('should tread undefined or empty cells as 0', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('hex2float(A1)', sheet).value).toBe(0);
			expect(createTerm('hex2float(A2)', sheet).value).toBe(0);
			expect(createTerm('hex2float(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2float(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2float(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2float(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2float(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2float(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});


	describe('oct2bin', () => {
		it('should convert an octal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2bin(15)', sheet).value).toBe('1101');
			expect(createTerm('oct2bin(3, 3)', sheet).value).toBe('011');
			expect(createTerm('oct2bin(15, 8)', sheet).value).toBe('00001101');
			expect(createTerm('oct2bin(777)', sheet).value).toBe('111111111');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2bin(7777777777)', sheet).value).toBe('1111111111');
			expect(createTerm('oct2bin(7777777634)', sheet).value).toBe('1110011100');
			expect(createTerm('oct2bin(7777777667)', sheet).value).toBe('1110110111');
			expect(createTerm('oct2bin(7777777000)', sheet).value).toBe('1000000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
		is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('oct2bin(15, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2bin(15, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2bin(15, "8")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2bin(15, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2bin(15, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(15, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('oct2bin(15, A1)', sheet).value).toBe('1101');
			expect(createTerm('oct2bin(15, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2bin(15, A2)', sheet).value).toBe('1101');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('oct2bin(A1)', sheet).value).toBe('0');
			expect(createTerm('oct2bin(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('oct2bin(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not an octal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(B3)', sheet).value).toBe(ERROR.NUM);
			// -513
			expect(createTerm('oct2bin(7777776777)', sheet).value).toBe(ERROR.NUM);
			// 512
			expect(createTerm('oct2bin(1000)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('oct2dec', () => {
		it('should convert an octal number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2dec(0)', sheet).value).toBe(0);
			expect(createTerm('oct2dec("54")', sheet).value).toBe(44);
			expect(createTerm('oct2dec("0077")', sheet).value).toBe(63);
			
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2dec(7777777777)', sheet).value).toBe(-1);
			expect(createTerm('oct2dec(7777777667)', sheet).value).toBe(-73);
			expect(createTerm('oct2dec(7777777634)', sheet).value).toBe(-100);
			expect(createTerm('oct2dec(7777777533)', sheet).value).toBe(-165);
			expect(createTerm('oct2dec(7777777000)', sheet).value).toBe(-512);
			expect(createTerm('oct2dec(4000000000)', sheet).value).toBe(-536870912);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('oct2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('oct2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('oct2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not an octal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(B3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(8000000000)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('oct2hex', () => {
		it('should convert an octal number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2hex(17)', sheet).value).toBe('F');
			expect(createTerm('oct2hex(17, 4)', sheet).value).toBe('000F');
			expect(createTerm('oct2hex(100, 4)', sheet).value).toBe('0040');
			expect(createTerm('oct2hex(267)', sheet).value).toBe('B7');
			expect(createTerm('oct2hex(7777777533)', sheet).value).toBe('FFFFFFFF5B');
		});
		it('should support negative numbers', () => {
			const sheet = new StreamSheet().sheet;
			// expect(createTerm('dec2oct(-0)', sheet).value).toBe('0');
			expect(createTerm('oct2hex(7777777777)', sheet).value).toBe('FFFFFFFFFF');
			expect(createTerm('oct2hex(7777777634)', sheet).value).toBe('FFFFFFFF9C');
			expect(createTerm('oct2hex(7777777667)', sheet).value).toBe('FFFFFFFFB7');
			expect(createTerm('oct2hex(7777777000)', sheet).value).toBe('FFFFFFFE00');
			expect(createTerm('oct2hex(4000000000)', sheet).value).toBe('FFE0000000');
		});
		it(`should return ${ERROR.VALUE} if places parameter is non numeric and ${ERROR.NUM} if it is negative or 
		is smaller then result value`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: true }
			});
			expect(createTerm('oct2hex(17, true)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2hex(17, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2hex(17, "4")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2hex(17, B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2hex(17, -4)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(267, 1)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('oct2hex(17, 0)', sheet).value).toBe(ERROR.NUM);
			// expect(createTerm('oct2hex(17, A1)', sheet).value).toBe('F');
			expect(createTerm('oct2hex(17, A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('oct2hex(17, A2)', sheet).value).toBe('F');
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('oct2hex(A1)', sheet).value).toBe('0');
			expect(createTerm('oct2hex(A2, 3)', sheet).value).toBe('000');
			expect(createTerm('oct2hex(B2, 5)', sheet).value).toBe('00000');
		});
		it(`should return ${ERROR.NUM} if given value represents not an octal number or is not in range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(B3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(8000000000)', sheet).value).toBe(ERROR.NUM);
		});
	});
});
