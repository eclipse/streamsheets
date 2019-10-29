const ERROR = require('../../src/functions/errors');
const { createTerm } = require('../utils');
const { StreamSheet } = require('@cedalo/machine-core');


describe('engineering functions', () => {
	describe('bin2dec', () => {
		it('should convert a binary number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2dec(1010)', sheet).value).toBe(10);
			expect(createTerm('bin2dec(1100100)', sheet).value).toBe(100);
			expect(createTerm('bin2dec(1111111111)', sheet).value).toBe(1023);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('bin2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('bin2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('bin2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a binary number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: '1111200', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2dec(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('bin2hex', () => {
		it('should convert a binary number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2hex(1110)', sheet).value).toBe('E');
			// expect(createTerm('bin2hex(1110, "5")', sheet).value).toBe('0000E');
			expect(createTerm('bin2hex(1111111111)', sheet).value).toBe('3FF');
			expect(createTerm('bin2hex(11111011, 4)', sheet).value).toBe('00FB');
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
		it(`should return ${ERROR.NUM} if given value represents not a binary number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: '1111200', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('bin2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('bin2hex(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('bin2oct', () => {
		it('should convert a binary number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('bin2oct(1001)', sheet).value).toBe('11');
			expect(createTerm('bin2oct(1001, 4)', sheet).value).toBe('0011');
			expect(createTerm('bin2oct(1100100)', sheet).value).toBe('144');
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
		});
	});


	describe('dec2bin', () => {
		it('should convert a decimal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2bin(15)', sheet).value).toBe('1111');
			// expect(createTerm('dec2bin(15, "8")', sheet).value).toBe('00001111');
			expect(createTerm('dec2bin(15, 8)', sheet).value).toBe('00001111');
			expect(createTerm('dec2bin(183)', sheet).value).toBe('10110111');
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
		it(`should return ${ERROR.NUM} if given value represents not a decimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2bin(B3)', sheet).value).toBe(ERROR.NUM);
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
		it(`should return ${ERROR.NUM} if given value represents not a decimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2hex(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('dec2oct', () => {
		it('should convert a decimal number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('dec2oct(15)', sheet).value).toBe('17');
			// expect(createTerm('dec2oct(15, "4")', sheet).value).toBe('0017');
			expect(createTerm('dec2oct(15, 4)', sheet).value).toBe('0017');
			expect(createTerm('dec2oct(183)', sheet).value).toBe('267');
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
		it(`should return ${ERROR.NUM} if given value represents not a decimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('dec2oct(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('dec2oct(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});


	describe('hex2bin', () => {
		it('should convert a hexadecimal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2bin("F")', sheet).value).toBe('1111');
			expect(createTerm('hex2bin("F", 8)', sheet).value).toBe('00001111');
			expect(createTerm('hex2bin("B7",)', sheet).value).toBe('10110111');
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
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2bin(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('hex2dec', () => {
		it('should convert a hexadecimal number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2dec("A5")', sheet).value).toBe(165);
			// expect(createTerm('hex2dec("FFFFFFFF5B")', sheet).value).toBe(-165);
			expect(createTerm('hex2dec("3DA408B9")', sheet).value).toBe(1034160313);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('hex2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('hex2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('hex2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2dec(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('hex2oct', () => {
		it('should convert a hexadecimal number to octal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('hex2oct("A")', sheet).value).toBe('12');
			expect(createTerm('hex2oct("A", 4)', sheet).value).toBe('0012');
			expect(createTerm('hex2oct("FF3", 4)', sheet).value).toBe('7763');
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
		it(`should return ${ERROR.NUM} if given value represents not a hexadecimal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('hex2oct(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('hex2oct(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});


	describe('oct2bin', () => {
		it('should convert an octal number to binary', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2bin(15)', sheet).value).toBe('1101');
			expect(createTerm('oct2bin(15, 8)', sheet).value).toBe('00001101');
			expect(createTerm('oct2bin(777)', sheet).value).toBe('111111111');
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
		it(`should return ${ERROR.NUM} if given value represents not an octal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2bin(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2bin(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('oct2hex', () => {
		it('should convert an octal number to hexadecimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2hex(17)', sheet).value).toBe('F');
			expect(createTerm('oct2hex(17, 4)', sheet).value).toBe('000F');
			expect(createTerm('oct2hex(267)', sheet).value).toBe('B7');
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
		it(`should return ${ERROR.NUM} if given value represents not an octal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2hex(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(B2, 3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(A3, "1")', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2hex(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('oct2dec', () => {
		it('should convert an octal number to decimal', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('oct2dec("54")', sheet).value).toBe(44);
			expect(createTerm('oct2dec("0077")', sheet).value).toBe(63);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null }
			});
			expect(createTerm('oct2dec(A1)', sheet).value).toBe(0);
			expect(createTerm('oct2dec(A2)', sheet).value).toBe(0);
			expect(createTerm('oct2dec(B2)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.NUM} if given value represents not an octal number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: 'fffAH', C2: ' ', A3: false, B3: true }
			});
			expect(createTerm('oct2dec(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(B2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(C2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(A3)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('oct2dec(B3)', sheet).value).toBe(ERROR.NUM);
		});
	});
});
