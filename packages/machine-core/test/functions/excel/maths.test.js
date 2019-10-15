const { StreamSheet } = require('../../..');
const ERROR = require('../../../src/functions/errors');
const { createTerm } = require('../utils');

const expectNumber = (value) => ({
	toBeInRange: (min, max) => {
		expect(value).toBeGreaterThanOrEqual(min);
		expect(value).toBeLessThanOrEqual(max);
	}
});
const roundDecimals = (nr, decimals) => parseFloat(nr.toFixed(decimals));

describe('maths functions', () => {
	describe('abs', () => {
		it('should return the absolute value of given number', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: -4, A3: -7, A4: 0, A5: 2 }
			});
			expect(createTerm('abs(A2)', sheet).value).toBe(4);
			expect(createTerm('abs(A3)', sheet).value).toBe(7);
			expect(createTerm('abs(A4)', sheet).value).toBe(0);
			expect(createTerm('abs(A5)', sheet).value).toBe(2);
			expect(createTerm('abs(-5)', sheet).value).toBe(5);
			expect(createTerm('abs("-5")', sheet).value).toBe(5);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('abs(A1)', sheet).value).toBe(0);
			expect(createTerm('abs(A2)', sheet).value).toBe(0);
			expect(createTerm('abs(B2)', sheet).value).toBe(0);
			expect(createTerm('abs(C2)', sheet).value).toBe(1);
			expect(createTerm('abs(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('abs(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('abs(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('abs(C2)', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-1428
		it(`should return ${ERROR.NAME} for invalid parameter`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('abs(_2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('abs(_A2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('abs(^A2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('abs(°A2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('abs(~A2)', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('arccos', () => {
		it('should return the arccosine of given number', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: -1, A3: -0, A4: 0.5, A5: 1 }
			});
			expectNumber(createTerm('arccos(A2)', sheet).value).toBeInRange(
				3.14,
				3.15
			);
			expectNumber(createTerm('arccos(A3)', sheet).value).toBeInRange(
				1.5,
				1.6
			);
			expectNumber(createTerm('arccos(A4)', sheet).value).toBeInRange(
				1.04,
				1.05
			);
			expect(createTerm('arccos(A5)', sheet).value).toBe(0);
			expectNumber(createTerm('arccos(false)', sheet).value).toBeInRange(
				1.5,
				1.6
			);
			expect(createTerm('arccos(true)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number or not in valid range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: -1.01, C2: 1.01 }
			});
			expect(createTerm('arccos(A2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('arccos(B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('arccos(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('arcsin', () => {
		it('should return the arcsine of given number', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: -1, A3: -0, A4: 0.5, A5: 1 }
			});
			expectNumber(createTerm('arcsin(A2)', sheet).value).toBeInRange(
				-1.58,
				-1.57
			);
			expect(createTerm('arcsin(A3)', sheet).value).toBe(0);
			expectNumber(createTerm('arcsin(A4)', sheet).value).toBeInRange(
				0.52,
				0.53
			);
			expectNumber(createTerm('arcsin(A5)', sheet).value).toBeInRange(
				1.57,
				1.58
			);
			expect(createTerm('arcsin(false)', sheet).value).toBe(0);
			expectNumber(createTerm('arcsin(true)', sheet).value).toBeInRange(
				1.57,
				1.58
			);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number or not in valid range`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: -1.01, C2: 1.01 }
			});
			expect(createTerm('arcsin(A2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('arcsin(B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('arcsin(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('degrees', () => {
		it('should convert radians to degrees', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: Math.PI }
			});
			expect(createTerm('degrees(A2)', sheet).value).toBe(180);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('degrees(A1)', sheet).value).toBe(0);
			expect(createTerm('degrees(A2)', sheet).value).toBe(0);
			expect(createTerm('degrees(B2)', sheet).value).toBe(0);
			expect(createTerm('degrees(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('degrees(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('degrees(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('degrees(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('even', () => {
		it('should return given number rounded up to nearest event integer', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 1.5 } });
			expect(createTerm('even(A1)', sheet).value).toBe(0);
			expect(createTerm('even(A2)', sheet).value).toBe(2);
			expect(createTerm('even(0)', sheet).value).toBe(0);
			expect(createTerm('even(2)', sheet).value).toBe(2);
			expect(createTerm('even(3)', sheet).value).toBe(4);
			expect(createTerm('even(2.2)', sheet).value).toBe(4);
			expect(createTerm('even(-1)', sheet).value).toBe(-2);
			expect(createTerm('even(-3.2)', sheet).value).toBe(-4);
			expect(createTerm('even(-2.2)', sheet).value).toBe(-4);
			expect(createTerm('even(-2.5)', sheet).value).toBe(-4);
		});
		it('should handle boolean values', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('even(true)', sheet).value).toBe(2);
			expect(createTerm('even(false)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.VALUE} for none numeric values`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: ERROR.DIV0 }
			});
			expect(createTerm('even(A2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('even("hallo")', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('frac', () => {
		it('should round the fractional part of a given number value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 31.12345, A3: -1234.56 } });
			expect(createTerm('frac(1.2)', sheet).value).toBe(0.2);
			expect(createTerm('frac(-1.2)', sheet).value).toBe(-0.2);
			expect(createTerm('frac(42)', sheet).value).toBe(0);
			expect(createTerm('frac(A2)', sheet).value).toBe(0.12345);
			expect(createTerm('frac(A3)', sheet).value).toBe(-0.56);
			expect(createTerm('A2-frac(A2)', sheet).value).toBe(31);
		});
		it('should return 0 for undefined or empty cells', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('frac(A1)', sheet).value).toBe(0);
			expect(createTerm('frac(A2)', sheet).value).toBe(0);
			expect(createTerm('frac(B2)', sheet).value).toBe(0);
			expect(createTerm('frac(D5)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('frac(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('frac(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('frac(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('int', () => {
		it('should round given number value down to its nearest integer', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 19.5 } });
			expect(createTerm('int(8.9)', sheet).value).toBe(8);
			expect(createTerm('int(-8.9)', sheet).value).toBe(-9);
			expect(createTerm('int(A2)', sheet).value).toBe(19);
			expect(createTerm('A2-int(A2)', sheet).value).toBe(0.5);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('int(A1)', sheet).value).toBe(0);
			expect(createTerm('int(A2)', sheet).value).toBe(0);
			expect(createTerm('int(B2)', sheet).value).toBe(0);
			expect(createTerm('int(D5)', sheet).value).toBe(0);
		});
		it(`should return ${ERROR.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('int(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('int(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('int(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('mod', () => {
		it('should return the remainder after number is divided by divisor', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('mod(0,1)', sheet).value).toBe(0);
			expect(createTerm('mod(1,1)', sheet).value).toBe(0);
			expect(createTerm('mod(1,3)', sheet).value).toBe(1);
			expect(createTerm('mod(3,3)', sheet).value).toBe(0);
			expect(createTerm('mod(3,2)', sheet).value).toBe(1);
			expect(createTerm('mod(-3,2)', sheet).value).toBe(1);
		});
		// DL-2427: we might have to support MOD with floating numbers...
		it('should support floating numbers', () => {
			const sheet = new StreamSheet().sheet;
			// expected values determined with excel....
			expect(roundDecimals(createTerm('mod(1.2,1)', sheet).value, 1)).toBe(0.2);
			expect(roundDecimals(createTerm('mod(1.2,0.1)', sheet).value, 1)).toBe(0.1);
			expect(roundDecimals(createTerm('mod(1.2,0.2)', sheet).value, 1)).toBe(0.2);
			expect(roundDecimals(createTerm('mod(1.2,0.3)', sheet).value, 1)).toBe(0.0);
			expect(roundDecimals(createTerm('mod(1.2,0.4)', sheet).value, 1)).toBe(0.4);
			expect(roundDecimals(createTerm('mod(1.2,0.6)', sheet).value, 1)).toBe(0.0);
			expect(roundDecimals(createTerm('mod(1.2,1.3)', sheet).value, 1)).toBe(1.2);
			expect(roundDecimals(createTerm('mod(3.5,2.5)', sheet).value, 1)).toBe(1);
			expect(roundDecimals(createTerm('mod(3.5,2)', sheet).value, 1)).toBe(1.5);
			expect(roundDecimals(createTerm('mod(3,2.5)', sheet).value, 1)).toBe(0.5);
			expect(roundDecimals(createTerm('mod(1.2,-1.3)', sheet).value, 1)).toBe(-0.1);
			expect(roundDecimals(createTerm('mod(1.2,-0.2)', sheet).value, 1)).toBe(0.0);
			expect(roundDecimals(createTerm('mod(-1.2,-0.2)', sheet).value, 1)).toBe(-0.2);
		});
		it('should ensure that the result has same sign as divisor', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('mod(-3,2)', sheet).value).toBe(1);
			expect(createTerm('mod(3,-2)', sheet).value).toBe(-1);
		});
		it(`should return ${ERROR.DIV0} if divisor is 0`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('mod(1,0)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('mod(1,false)', sheet).value).toBe(ERROR.DIV0);
		});
		it('should work with boolean values', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('mod(true,1)', sheet).value).toBe(0);
			expect(createTerm('mod(false,1)', sheet).value).toBe(0);
			expect(createTerm('mod(1,true)', sheet).value).toBe(0);
			expect(createTerm('mod(true,true)', sheet).value).toBe(0);
			expect(createTerm('mod(false,true)', sheet).value).toBe(0);
			expect(createTerm('mod(1,false)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('mod(false,false)', sheet).value).toBe(
				ERROR.DIV0
			);
		});
		it('should return error code for none numeric values', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: ERROR.DIV0 }
			});
			expect(createTerm('mode(A2,A2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('mod("hallo",1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('mod(42, "hi")', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('odd', () => {
		it('should return given number rounded up to nearest odd integer', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 1.5 } });
			expect(createTerm('odd(A1)', sheet).value).toBe(1);
			expect(createTerm('odd(A2)', sheet).value).toBe(3);
			expect(createTerm('odd(0)', sheet).value).toBe(1);
			expect(createTerm('odd(2)', sheet).value).toBe(3);
			expect(createTerm('odd(3)', sheet).value).toBe(3);
			expect(createTerm('odd(2.2)', sheet).value).toBe(3);
			expect(createTerm('odd(-1)', sheet).value).toBe(-1);
			expect(createTerm('odd(-2)', sheet).value).toBe(-3);
			expect(createTerm('odd(-3.2)', sheet).value).toBe(-5);
			expect(createTerm('odd(-2.2)', sheet).value).toBe(-3);
			expect(createTerm('odd(-2.5)', sheet).value).toBe(-3);
		});
		it('should handle boolean values', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('odd(true)', sheet).value).toBe(1);
			expect(createTerm('odd(false)', sheet).value).toBe(1);
		});
		it(`should return ${ERROR.VALUE} for none numeric values`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: ERROR.DIV0 }
			});
			expect(createTerm('odd(A2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('odd("hallo")', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('power', () => {
		it('should return result of given number raised to a specified power', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 3.2 } });
			expect(createTerm('power(4, 0)', sheet).value).toBe(1);
			expect(createTerm('power(5, 2)', sheet).value).toBe(25);
			expect(createTerm('power(98.6, A2)', sheet).value.toFixed(3)).toBe(
				'2401077.222'
			);
			expect(createTerm('power(98.6, 3.2)', sheet).value.toFixed(3)).toBe(
				'2401077.222'
			);
			expect(createTerm('power(4, 5/4)', sheet).value.toFixed(8)).toBe(
				'5.65685425'
			);
		});
		it('should treat empty or undefined cells as 0 (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('power(A1, A1)', sheet).value).toBe(1);
			expect(createTerm('power(4, A2)', sheet).value).toBe(1);
			expect(createTerm('power(2, B2)', sheet).value).toBe(1);
			expect(createTerm('power(5, D5)', sheet).value).toBe(1);
			expect(createTerm('power(A1, 4)', sheet).value).toBe(0);
			expect(createTerm('power(A2, 5)', sheet).value).toBe(0);
			expect(createTerm('power(B2, 2)', sheet).value).toBe(0);
			expect(createTerm('power(D5, 3)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if one of given values is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('power(A2, 2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('power(4, A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('power(B2, 2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('power(C2, 2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('power(3, B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('power(2, C2)', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-1554:
		it(`should return ${ERROR.NUM} if result is invalid`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('power(200, 2000)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('power(2, 1024)', sheet).value).toBe(ERROR.NUM);
		});
	});
	describe('radians', () => {
		it('should convert degrees to radians', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 180 } });
			expect(createTerm('radians(A2)', sheet).value.toFixed(5)).toBe(
				'3.14159'
			);
			expect(createTerm('radians(180)', sheet).value.toFixed(5)).toBe(
				'3.14159'
			);
			expect(createTerm('radians(270)', sheet).value.toFixed(5)).toBe(
				'4.71239'
			);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('radians(A1)', sheet).value).toBe(0);
			expect(createTerm('radians(A2)', sheet).value).toBe(0);
			expect(createTerm('radians(B2)', sheet).value).toBe(0);
			expect(createTerm('radians(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('radians(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('radians(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('radians(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('randbetween', () => {
		it('should return a random integer between specified bottom and top values (inclusive)', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('randbetween(1, 1)', sheet).value).toBe(1);
			expectNumber(
				createTerm('randbetween(2, 5)', sheet).value
			).toBeInRange(2, 5);
			// expectNumber((createTerm('randbetween(5, 2)', sheet).value, 5, 2)).toBeTruthy();
			expectNumber(
				createTerm('randbetween(-5, 2)', sheet).value
			).toBeInRange(-5, 2);
		});
		it('should treat undefined or empty cells as 0 (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expectNumber(
				createTerm('randbetween(A1, 5)', sheet).value
			).toBeInRange(0, 5);
			// expectNumber(createTerm('randbetween(2, A1)', sheet).value).toBeInRange(2, 0);
			expectNumber(
				createTerm('randbetween(A2, 4)', sheet).value
			).toBeInRange(0, 4);
			// expectNumber(createTerm('randbetween(1, A2)', sheet).value).toBeInRange(1, 0);
			expectNumber(
				createTerm('randbetween(B2, B2)', sheet).value
			).toBeInRange(0, 0);
			expectNumber(
				createTerm('randbetween(D5, 6)', sheet).value
			).toBeInRange(0, 6);
			// expect(isInRange(createTerm('randbetween(6, D5)', sheet).value, 6, 0)).toBeTruthy();
		});
		it(`should return ${
			ERROR.VALUE
		} if one of given values is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('randbetween(A2, 2)', sheet).value).toBe(
				ERROR.VALUE
			);
			expect(createTerm('randbetween(4, A2)', sheet).value).toBe(
				ERROR.VALUE
			);
		});
		// excel behaviour:
		it(`should return ${ERROR.VALUE} if min is greater than max`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('randbetween(42, 23)', sheet).value).toBe(
				ERROR.VALUE
			);
			expect(createTerm('randbetween(1, )', sheet).value).toBe(
				ERROR.VALUE
			);
		});
		// DL-1053:
		it(`should return ${
			ERROR.ARGS
		} if wrong number of values are given (DL-1053)`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('randbetween(4)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('randbetween(1, 2, 4)', sheet).value).toBe(
				ERROR.ARGS
			);
		});
	});
	describe('round', () => {
		it('should round a number to specified digits', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 2.15 } });
			expect(createTerm('round(A2, 0)', sheet).value).toBe(2);
			expect(createTerm('round(A2, 1)', sheet).value).toBe(2.2);
			expect(createTerm('round(2.149, 1)', sheet).value).toBe(2.1);
			expect(createTerm('round(-1.476, 2)', sheet).value).toBe(-1.48);
			expect(createTerm('round(21.5, -1)', sheet).value).toBe(20);
			expect(createTerm('round(626.3, -3)', sheet).value).toBe(1000);
			expect(createTerm('round(1.98, -1)', sheet).value).toBe(0);
			expect(createTerm('round(-50.55, -2)', sheet).value).toBe(-100);
		});
		it('should treat undefined or empty cells as 0 (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('round(A1, 1)', sheet).value).toBe(0);
			expect(createTerm('round(2.34, A2)', sheet).value).toBe(2);
			expect(createTerm('round(B2, 4)', sheet).value).toBe(0);
			expect(createTerm('round(1.2345, D5)', sheet).value).toBe(1);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('round(A2, 2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('round(B2, 2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('round(C2, 0)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('sign', () => {
		it('should return the sign of given number, i.e. 1 for positive, -1 for negative number and 0 for zero', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('sign(10)', sheet).value).toBe(1);
			expect(createTerm('sign(4-4)', sheet).value).toBe(0);
			expect(createTerm('sign(-0.0001)', sheet).value).toBe(-1);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('sign(A1)', sheet).value).toBe(0);
			expect(createTerm('sign(A2)', sheet).value).toBe(0);
			expect(createTerm('sign(B2)', sheet).value).toBe(0);
			expect(createTerm('sign(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('sign(A2)', sheet).value).toBe(ERROR.VALUE);
			// we interpret emty or undefined cells as 0...
			// expect(createTerm('sign(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('sign(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('sqrt', () => {
		it('should return a positive square root', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 9 } });
			expect(createTerm('sqrt(0)', sheet).value).toBe(0);
			expect(createTerm('sqrt(16)', sheet).value).toBe(4);
			expect(createTerm('sqrt(A2)', sheet).value).toBe(3);
		});
		it(`should return ${ERROR.NUM} if given value is negative`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: -123 } });
			expect(createTerm('sqrt(A2)', sheet).value).toBe(ERROR.NUM);
			expect(createTerm('sqrt(-4)', sheet).value).toBe(ERROR.NUM);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('sqrt(A1)', sheet).value).toBe(0);
			expect(createTerm('sqrt(A2)', sheet).value).toBe(0);
			expect(createTerm('sqrt(B2)', sheet).value).toBe(0);
			expect(createTerm('sqrt(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('sqrt(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('sqrt(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('sqrt(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('trunc', () => {
		it('should return truncated integer of a given number', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 9.2345 }
			});
			expect(createTerm('trunc(0)', sheet).value).toBe(0);
			expect(createTerm('trunc(8.9)', sheet).value).toBe(8);
			expect(createTerm('trunc(-8.9)', sheet).value).toBe(-8);
			expect(createTerm('trunc(0.45)', sheet).value).toBe(0);
			expect(createTerm('trunc(A2, 3)', sheet).value).toBe(9.234);
			expect(createTerm('trunc(1.458, 2)', sheet).value).toBe(1.45);
			expect(createTerm('trunc(1.9999, 1)', sheet).value).toBe(1.9);
		});
		it('should return 0 for undefined or empty cells (DL-785)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', A2: undefined, B2: null, C2: true }
			});
			expect(createTerm('trunc(A1)', sheet).value).toBe(0);
			expect(createTerm('trunc(A2)', sheet).value).toBe(0);
			expect(createTerm('trunc(B2)', sheet).value).toBe(0);
			expect(createTerm('trunc(D5)', sheet).value).toBe(0);
		});
		it(`should return ${
			ERROR.VALUE
		} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 'hello', B2: null, C2: true }
			});
			expect(createTerm('trunc(A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('trunc(B2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('trunc(C2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
});
