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

describe('statistical functions', () => {
	describe('average', () => {
		it('should return the average of given values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 10, A3: 7, A4: 9, A5: 27, A6: 2 } });
			expect(createTerm('average(A2:A6)', sheet).value).toBe(11);
			expect(createTerm('average(A2:A2, A3:A4, A5:A6)', sheet).value).toBe(11);
			expect(createTerm('average(A2:A6, 5)', sheet).value).toBe(10);
		});
		it('should ignore values which are not a number', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 'hello', B2: null, C2: true, D2: 6, E2: 0 } });
			expect(createTerm('average(A2:D2)', sheet).value).toBe(6);
			expect(createTerm('average(A2:E2)', sheet).value).toBe(3);
			expect(createTerm('average(D2:H2)', sheet).value).toBe(3);
		});
		it(`should return ${ERROR.DIV0} if no values are available`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 'hello', B2: null, C2: true, D2: 6, E2: 0 } });
			expect(createTerm('average()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('average(A2)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('average(C22)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('average(A2:B2)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('average(A2:C2)', sheet).value).toBe(ERROR.DIV0);
		});
	});
	describe('correl', () => {
		it('should return the correlation coefficient of two cell ranges', () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 3, A3: 2, A4: 4, A5: 5, A6: 6, 
				B2: 9, B3: 7, B4: 12, B5: 15, B6: 17
			} });
			expect(createTerm('correl(A2:A6,A2:A6)', sheet).value).toBe(1);
			expect(createTerm('correl(A2:A6,B2:B6)', sheet).value.toFixed(9)).toBe('0.997054486');
			sheet.load({ cells: {
				A2: 0, A3: 14, A4: 1, A5: 10, A6: 5, 
				B2: 2, B3: 6, B4: 8, B5: 5, B6: 6,
				C2: 2, C3: 11, C4: 3, C5: 13, C6: 4
			} });
			expect(createTerm('correl(A2:A6,A2:A6)', sheet).value).toBe(1);
			expect(createTerm('correl(B2:B6,B2:B6)', sheet).value).toBe(1);
			expect(createTerm('correl(C2:C6,C2:C6)', sheet).value).toBe(1);
			expect(createTerm('correl(A2:A6,B2:B6)', sheet).value.toFixed(6)).toBe('0.191516');
			expect(createTerm('correl(A2:A6,C2:C6)', sheet).value.toFixed(6)).toBe('0.909268');
			expect(createTerm('correl(B2:B6,C2:C6)', sheet).value.toFixed(6)).toBe('0.108893');
		});
		it('must be called with exact 2 parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('correl()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('correl(A2:A6)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('correl(A2:A6, B2:B6, C2:C6)', sheet).value).toBe(ERROR.ARGS);
		});
		it('should ignore all non-number cells', () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A1: 'hello', A2: 3, A3: '', A4: 2, A5: true, A6: 4, A7: undefined, A8: 5, A9: null, A10: 6, 
				B1: 'world', B2: 9, B3: '', B4: 7, B5: false, B6: 12, B7: null, B8: 15, B9: undefined, B10: 17
			} });
			expect(createTerm('correl(A1:A10,A1:A10)', sheet).value).toBe(1);
			expect(createTerm('correl(A1:A10,B1:B10)', sheet).value.toFixed(9)).toBe('0.997054486');

		});
		it(`should return ${ERROR.NA} if given cell ranges have different size`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 3, A3: 2, A4: 4, A5: 5, A6: 6, 
				B2: 9, B3: 7, B4: 12, B5: 15, B6: 17
			} });
			expect(createTerm('correl(A2:A3,B2:B6)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('correl(A2:A6,B2:B5)', sheet).value).toBe(ERROR.NA);
		});
		it(`should return a ${ERROR.DIV0} if one of given cell range is empty or the standard deviation is 0`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 4, A3: 4, A4: 4, A5: 4, A6: 4, 
				B2: 9, B3: 7, B4: 12, B5: 15, B6: 17
			} });
			expect(createTerm('correl(A7:A12,B2:B6)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('correl(A2:A6,B7:B12)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('correl(A1:A10,A1:A10)', sheet).value).toBe(ERROR.DIV0);
		});
	});
	describe('count', () => {
		it('should count the number of cells which have a number value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 19, B2: 22.24 } });
			expect(createTerm('count(A2:B2)', sheet).value).toBe(2);
			expect(createTerm('count(5, A2:B2, 10)', sheet).value).toBe(4);
		});
		it('should ignore cells which do not have a number value', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 19, B2: 22.24, C2: null, D2: 'hello', E2: true, F2: 0, G2: '1234' }
			});
			expect(createTerm('count(C2:E2)', sheet).value).toBe(0);
			expect(createTerm('count(A2:G2)', sheet).value).toBe(3);
			expect(createTerm('count(A2:B2, C2:E2, F2)', sheet).value).toBe(3);
		});
	});
	describe('forecast', () => {
		it('should calculate a value by using existing values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 6, A3: 7, A4: 9, A5: 15, A6: 21,
				B2: 20, B3: 28, B4: 31, B5: 38, B6: 40
			} });
			expect(createTerm('forecast(30,A2:A6,B2:B6)', sheet).value.toFixed(6)).toBe('10.607253');
			sheet.load({ cells: {
				A2: 10.5, A3: 7.2, A4: 200, A5: 5.4, A6: 8.1,
				B2: -3, B3: 4, B4: 120, B5: 2, B6: 7.5
			} });
			expect(createTerm('forecast(5,A2:A6,B2:B6)', sheet).value.toFixed(7)).toBe('11.8937852');
			expect(createTerm('forecast(10,A2:A6,B2:B6)', sheet).value.toFixed(8)).toBe('20.03269866');
		});
		it('should take exactly 3 arguments', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('forecast()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('forecast(A2:A6)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('forecast(A2:A6, B2:B6)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('forecast(A2:A6, B2:B6, C2:C6, D2:D6)', sheet).value).toBe(ERROR.ARGS);
		});
		it(`should return ${ERROR.VALUE} if first parameter is non numeric`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('forecast(, B2:B6, C2:C6)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('forecast("", B2:B6, C2:C6)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('forecast("hello", B2:B6, C2:C6)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('forecast(true, B2:B6, C2:C6)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('forecast(false, B2:B6, C2:C6)', sheet).value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.NA} if given cell ranges are empty or not equal length`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 6, A3: 7, A4: 9, A5: 15, A6: 21,
				B2: 20, B3: 28, B4: 31, B5: 38, B6: 40
			} });
			expect(createTerm('forecast(30,A2:A6,B2:B4)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('forecast(30,A7:A12,B7:B12)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('forecast(30,A7:A12,B2:B6)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('forecast(30,A2:A6,B7:B12)', sheet).value).toBe(ERROR.NA);
		});
		it(`should return ${ERROR.DIV0} if variance of second cell range is 0`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: {
				A2: 6, A3: 7, A4: 9, A5: 15, A6: 21,
				B2: 4, B3: 4, B4: 4, B5: 4, B6: 4
			} });
			expect(createTerm('forecast(30,A2:A6,B2:B6)', sheet).value).toBe(ERROR.DIV0);
		});
	});
	describe('max', () => {
		it('should return the largest number in given values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 10, A3: 7, A4: 9, A5: 27, A6: 2 } });
			expect(createTerm('max(A2:A6)', sheet).value).toBe(27);
			expect(createTerm('max(5, A2:A5, 0, A6)', sheet).value).toBe(27);
			expect(createTerm('max(-5, -2, -1)', sheet).value).toBe(-1);
		});
		it('should ignore cells which do not have a number value', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 19, B2: 22, C2: null, D2: 'hello', E2: true, F2: 0 }
			});
			expect(createTerm('max(A2:F2)', sheet).value).toBe(22);
			expect(createTerm('max(A2:B2, -1, C2:E2, 42, F2)', sheet).value).toBe(42);
		});
	});
	describe('min', () => {
		it('should return the smallest number in given values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 10, A3: 7, A4: 9, A5: 27, A6: 2 } });
			expect(createTerm('min(A2:A6)', sheet).value).toBe(2);
			expect(createTerm('min(5, A2:A5, 0, A6)', sheet).value).toBe(0);
		});
		it('should ignore cells which do not have a number value', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A2: 19, B2: 22.24, C2: null, D2: 'hello', E2: true, F2: 0 }
			});
			expect(createTerm('min(A2:F2)', sheet).value).toBe(0);
			expect(createTerm('min(A2:B2, -1, C2:E2, F2)', sheet).value).toBe(-1);
		});
	});
	describe('stdev.s', () => {
		it('should return standard derivation of given samples', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A1: 'Strength',
					A2: 1345,
					A3: 1301,
					A4: 1368,
					A5: 1322,
					A6: 1310,
					A7: 1370,
					A8: 1318,
					A9: 1350,
					A10: 1303,
					A11: 1299
				}
			});
			expect(createTerm('stdev.s(A2:A11)', sheet).value.toFixed(5)).toBe('27.46392');
			expect(createTerm('stdev.s(A2, A3, A4, A5, A6, A7, A8, A9, A10, A11)', sheet).value.toFixed(2)).toBe('27.46');
		});
		it('should ignore non numbers', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A1: 'Strength',
					A2: '1345',
					A3: true,
					A4: '1368',
					A5: '1322',
					A6: false,
					A7: '1370',
					A8: '1318',
					A9: 1350,
					A10: 1303,
					A11: 1299
				}
			});
			expect(createTerm('stdev.s(A2:A11)', sheet).value.toFixed(2)).toBe('28.36');
			expect(createTerm('stdev.s(A2, A3, A4, A5, A6, A7, A8, A9, A10, A11)', sheet).value.toFixed(2)).toBe('28.36');
		});
		it(`should return  ${ERROR.DIV0} if only 1 or no value is available`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A1: 'Strength',
					A2: '1345',
					A3: '1368',
					A4: 13459
				}
			});
			expect(createTerm('stdev.s()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('stdev.s(B1)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('stdev.s(B1:B11)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('stdev.s(A2:A3)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('stdev.s(A4)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('stdev.s(A4:A4)', sheet).value).toBe(ERROR.DIV0);
			expect(createTerm('stdev.s(A2:A4)', sheet).value).toBe(ERROR.DIV0);
		});
		it('should return an error if values contain an error', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A1: 'Strength',
					A2: 1345,
					A3: 1301,
					A4: 1368,
					A5: '#VALUE!',
					// A5: 1322,
					A6: 1310,
					A7: 1370,
					A8: 1318,
					A9: 1350,
					A10: 1303,
					A11: 1299,
				}
			});
			expect(createTerm('stdev.s(A2:A5)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stdev.s(A5:A12)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stdev.s(A2:A12)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stdev.s(A2, A3, A4, A5)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stdev.s(A5, A6, A7, A8, A9, A10, A11)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stdev.s(A2, A3, A4, A5, A6, A7, A8, A9, A10, A11)', sheet).value).toBe(ERROR.VALUE);
		});
	});
});
