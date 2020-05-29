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
const { createCellAt, createTerm } = require('../utilities');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('logical functions', () => {
	describe('and', () => {
		it(`should return ${ERROR.ARGS} if no parameters are given`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('and()', sheet).value).toBe(ERROR.ARGS);
		});
		it(`should return ${ERROR.VALUE} if reference cell(s) do not exist`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('and(A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('and(A1, B1, C1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('and(A1:A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('and(A1:D1, C5)', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-1398
		it(`should return ${ERROR.NAME} for invalid references`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('and(_A1)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('and(A1, °B1, C1)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('and(_A1:A1)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('and(^A1:D1, C5)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('and(A1:D1, °C5)', sheet).value).toBe(ERROR.NAME);
		});
		it('should return false if at least one cell value is falsy', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', false, sheet);
			createCellAt('B1', true, sheet);
			createCellAt('B2', true, sheet);
			createCellAt('C3', true, sheet);
			expect(createTerm('and(A1)', sheet).value).toBe(false);
			expect(createTerm('and(A1, B1)', sheet).value).toBe(false);
			expect(createTerm('and(A1, B1, C3)', sheet).value).toBe(false);
			expect(createTerm('and(A1:C3)', sheet).value).toBe(false);
			expect(createTerm('and(B1:C3)', sheet).value).toBe(true);
			expect(createTerm('and(B1:B2)', sheet).value).toBe(true);
			expect(createTerm('and(A1, B1:B2)', sheet).value).toBe(false);
			expect(createTerm('and(B1:B2, C3, D4)', sheet).value).toBe(true);
		});
		it('should return true if all cell values are truthy', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', true, sheet);
			createCellAt('B1', 'true', sheet);
			createCellAt('C2', 'hallo', sheet);
			createCellAt('C3', 12345, sheet);
			expect(createTerm('and(A1)', sheet).value).toBe(true);
			expect(createTerm('and(A1, B1)', sheet).value).toBe(true);
			expect(createTerm('and(A1, B1, C3)', sheet).value).toBe(true);
			expect(createTerm('and(A1:B1, C2:C3)', sheet).value).toBe(true); // ERROR.VALUE);
			expect(createTerm('and(A1:B1, C4, C2:C3)', sheet).value).toBe(true); // ERROR.VALUE);
		});
	});
	describe('if', () => {
		it('should return true value if condition is true and false value otherwise', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', true, sheet);
			createCellAt('A2', false, sheet);
			expect(createTerm('if(A1, "hello", "world")', sheet).value).toBe('hello');
			expect(createTerm('if(A2, "hello", "world")', sheet).value).toBe('world');
		});
		it('should return false as default if condition is false and no false value is provided', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A2', false, sheet);
			expect(createTerm('if(A2, "hello")', sheet).value).toBe(false);
		});
		it('should require condition and true value', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', true, sheet);
			createCellAt('A2', false, sheet);
			expect(createTerm('if()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('if(,)', sheet).value).toBe(false);
			expect(createTerm('if(A1)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('if(A1,)', sheet).value).toBe(true);
			expect(createTerm('if(A2,,)', sheet).value).toBe(false);
			expect(createTerm('if(A2,,,)', sheet).value).toBe(ERROR.ARGS);
		});
		// DL-4099
		it('should return error value if condition has an error value', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('if(NA(),true, false)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('if(NA() > "str1" ,true, false)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('if(23 < NA(),true, false)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('if(NA() == NA(),true, false)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('if("#NA" == NA(),true, false)', sheet).value).toBe(ERROR.NA);
		});
		// DL-4099
		it(`should return ${ERROR.VALUE} if condition is an object itself`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('if(JSON(A1:B1),true, false)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('or', () => {
		it(`should return ${ERROR.ARGS} if no parameters are given`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('or()', sheet).value).toBe(ERROR.ARGS);
		});
		it('should return false if no cell value is truthy', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', false, sheet);
			createCellAt('C3', false, sheet);
			expect(createTerm('or(A1)', sheet).value).toBe(false);
			expect(createTerm('or(A1,C3)', sheet).value).toBe(false);
			expect(createTerm('or(A1:C3)', sheet).value).toBe(false);
			expect(createTerm('or(A1:D4,E1)', sheet).value).toBe(false);
		});
		it('should return true if at least one cell value is truthy', () => {
			const sheet = new StreamSheet().sheet;
			createCellAt('A1', false, sheet);
			createCellAt('B1', true, sheet);
			createCellAt('C3', true, sheet);
			expect(createTerm('or(A1)', sheet).value).toBe(false);
			expect(createTerm('or(A1, B1)', sheet).value).toBe(true);
			expect(createTerm('or(A1:B1)', sheet).value).toBe(true);
			expect(createTerm('or(A1:A3, D1:E4)', sheet).value).toBe(false);
			expect(createTerm('or(A1:A3, D1:E4, C3)', sheet).value).toBe(true);
			expect(createTerm('or(A1:A3, C3, D1:E4)', sheet).value).toBe(true);
			expect(createTerm('or(A1:A3, B1:B3)', sheet).value).toBe(true);
		});
		// DL-1400
		it('should work with boolean like values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 5, B1: 0, C1: -1, A2: 'false', B2: 'true' } });
			expect(createTerm('or(A1)', sheet).value).toBe(true);
			expect(createTerm('or(B1)', sheet).value).toBe(false);
			expect(createTerm('or(C1)', sheet).value).toBe(true);
			expect(createTerm('or(A2)', sheet).value).toBe(false);
			expect(createTerm('or(B2)', sheet).value).toBe(true);
			expect(createTerm('or(A1:B2)', sheet).value).toBe(true);
			expect(createTerm('or(B1, A2)', sheet).value).toBe(false);
			expect(createTerm('or(A1,C1, B2:B2)', sheet).value).toBe(true);
			expect(createTerm('or(B1:B1, A2:A2)', sheet).value).toBe(false);
		});
		it(`should return ${ERROR.VALUE} for non boolean like values`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: '', B1: '0', C1: true, A2: '1', B2: 'hello', C2: '' }
			});
			expect(createTerm('or(A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('or(B1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('or(A2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('or(B2)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('or(C1:C2)', sheet).value).toBe(true);
			expect(createTerm('or(D1:D2)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('not', () => {
		it('should negate given value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 50, A2: 100 } });
			expect(createTerm('not(A1>100)', sheet).value).toBeTruthy();
			expect(createTerm('if(and(not(A1>1), not(a1<100)), a1, "Wrong")', sheet).value).toBe('Wrong');
			expect(createTerm('if(or(not(A2<0), not(a2>50)), a2, "Wrong")', sheet).value).toBe(100);
		});
		// DL-1400
		it('should negate boolean like values', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('not(0)', sheet).value).toBe(true);
			expect(createTerm('not(1)', sheet).value).toBe(false);
			expect(createTerm('not(-1)', sheet).value).toBe(false);
			expect(createTerm('not(4567)', sheet).value).toBe(false);
			expect(createTerm('not("false")', sheet).value).toBe(true);
			expect(createTerm('not("true")', sheet).value).toBe(false);
		});
		it(`should return ${ERROR.VALUE} for non boolean like values`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 50, A2: 100 } });
			expect(createTerm('not("")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('not("1")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('not("0")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('not("hello")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('not(A1:A2)', sheet).value).toBe(ERROR.VALUE);
			// expect(createTerm('not(hello)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('switch', () => {
		it('should return specified value for first match', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 2, A2: 3 } });
			expect(createTerm('switch(A1, 1, "Sun", 2, "Mon", 3, "Tue")', sheet).value).toBe('Mon');
			expect(createTerm('switch(A1, 1, "Sun", 7, "Mon", "weekday")', sheet).value).toBe('weekday');
			expect(createTerm('switch(A2, 1, "Sun", 2, "Mon", 3, "Tue")', sheet).value).toBe('Tue');
		});
		it(`should return a default value or ${ERROR.NA} for no match`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 'Sun' } });
			expect(createTerm('switch(A1, 1, "Sun", 2, "Mon")', sheet).value).toBe(ERROR.NA);
			expect(createTerm('switch(A1, 1, "Sun", 2, "Mon", "No match")', sheet).value).toBe('No match');
		});
	});
});
