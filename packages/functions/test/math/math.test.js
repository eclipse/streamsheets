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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { createTerm, createCellAt } = require('../utilities');

const ERROR = FunctionErrors.code;

const expectFixedNumber = (precision) => (receivedNr) => ({
	toBe: (expectedNr) => {
		expect(receivedNr.toFixed(precision)).toBe(expectedNr.toFixed(precision));
	}
});

describe('ceiling', () => {
	it('should round up to nearest multiple of given significance', () => {
		const sheet = new StreamSheet().sheet;
		const expectNumber = expectFixedNumber(2);
		expectNumber(createTerm('ceiling(2.5,1)', sheet).value).toBe(3);
		expectNumber(createTerm('ceiling(1.5,0.1)', sheet).value).toBe(1.5);
		expectNumber(createTerm('ceiling(0.234,0.01)', sheet).value).toBe(0.24);
		expectNumber(createTerm('ceiling(4.32, 0.05)', sheet).value).toBe(4.35);
		expectNumber(createTerm('ceiling(22.25, 0.1)', sheet).value).toBe(22.3);
		expectNumber(createTerm('ceiling(22.25, 0.5)', sheet).value).toBe(22.5);
		// returns significance if its greater than number
		expectNumber(createTerm('ceiling(3.7,4)', sheet).value).toBe(4);
		expectNumber(createTerm('ceiling(3.7,3.8)', sheet).value).toBe(3.8);
	});
	it('should work with negative significance too', () => {
		const sheet = new StreamSheet().sheet;
		const expectNumber = expectFixedNumber(2);
		expectNumber(createTerm('ceiling(-2.5,2)', sheet).value).toBe(-2);
		expectNumber(createTerm('ceiling(-22.25,1)', sheet).value).toBe(-22);
		expectNumber(createTerm('ceiling(-2.5,-2)', sheet).value).toBe(-4);
		expectNumber(createTerm('ceiling(-22.25,-0.1)', sheet).value).toBe(-22.3);
		expectNumber(createTerm('ceiling(-22.25,-1)', sheet).value).toBe(-23);
		expectNumber(createTerm('ceiling(-22.25,-5)', sheet).value).toBe(-25);
	});
	it('should work with boolean values', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('ceiling(true,2)', sheet).value).toBe(2);
		expect(createTerm('ceiling(false,2)', sheet).value).toBe(0);
		expect(createTerm('ceiling(false,true)', sheet).value).toBe(0);
		expect(createTerm('ceiling(2.5,true)', sheet).value).toBe(3);
	});
	it(`should return ${ERROR.NUM} if significance is negative and number positive`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('ceiling(2.5,-2)', sheet).value.code).toBe(ERROR.NUM);
		expect(createTerm('ceiling(2.5,-0.1)', sheet).value.code).toBe(ERROR.NUM);
	});
	it(`should return ${ERROR.VALUE} if either number or significance cannot be convert to number`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('ceiling("hello",2)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('ceiling(2.5,"world")', sheet).value.code).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.DIV0} if significance evaluates to zero`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('ceiling(2.5,)', sheet).value.code).toBe(ERROR.DIV0);
		expect(createTerm('ceiling(2.5,0)', sheet).value.code).toBe(ERROR.DIV0);
		expect(createTerm('ceiling(2.5,false)', sheet).value.code).toBe(ERROR.DIV0);
	});
	it(`should return ${ERROR.ARGS} if called with too many or too few arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('ceiling()', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('ceiling(2.5,2,4)', sheet).value.code).toBe(ERROR.ARGS);
	});
});
describe('floor', () => {
	it('should round down to nearest multiple of given significance', () => {
		const sheet = new StreamSheet().sheet;
		const expectNumber = expectFixedNumber(2);
		expectNumber(createTerm('floor(3.7,2)', sheet).value).toBe(2);
		expectNumber(createTerm('floor(3.45, 3)', sheet).value).toBe(3);
		expectNumber(createTerm('floor(1.58,0.1)', sheet).value).toBe(1.5);
		expectNumber(createTerm('floor(4.32, 0.05)', sheet).value).toBe(4.3);
		expectNumber(createTerm('floor(0.234, 0.01)', sheet).value).toBe(0.23);
		expectNumber(createTerm('floor(26.75, 1)', sheet).value).toBe(26);
		expectNumber(createTerm('floor(26.75, 0.5)', sheet).value).toBe(26.5);
		// returns 0 if significance > number
		expectNumber(createTerm('floor(3.7,4)', sheet).value).toBe(0);
	});
	it('should work with negative significance too', () => {
		const sheet = new StreamSheet().sheet;
		const expectNumber = expectFixedNumber(2);
		expectNumber(createTerm('floor(-2.5,-2)', sheet).value).toBe(-2);
		expectNumber(createTerm('floor(-45.67,2)', sheet).value).toBe(-46);
		expectNumber(createTerm('floor(-45.67,-2)', sheet).value).toBe(-44);
		expectNumber(createTerm('floor(-26.75, -0.1)', sheet).value).toBe(-26.7);
	});
	it('should work with boolean values', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('floor(true,2)', sheet).value).toBe(0);
		expect(createTerm('floor(false,2)', sheet).value).toBe(0);
		expect(createTerm('floor(false,true)', sheet).value).toBe(0);
		expect(createTerm('floor(2.5,true)', sheet).value).toBe(2);
	});
	it(`should return ${ERROR.NUM} if significance is negative and number positive`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('floor(2.5,-2)', sheet).value.code).toBe(ERROR.NUM);
		expect(createTerm('floor(2.5,-0.1)', sheet).value.code).toBe(ERROR.NUM);
	});
	it(`should return ${ERROR.VALUE} if either number or significance cannot be convert to number`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('floor("hello",2)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('floor(2.5,"world")', sheet).value.code).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.DIV0} if significance evaluates to zero`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('floor(2.5,)', sheet).value.code).toBe(ERROR.DIV0);
		expect(createTerm('floor(2.5,0)', sheet).value.code).toBe(ERROR.DIV0);
		expect(createTerm('floor(2.5,false)', sheet).value.code).toBe(ERROR.DIV0);
	});
	it(`should return ${ERROR.ARGS} if called with too many or too few arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('floor()', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('floor(2.5,2,4)', sheet).value.code).toBe(ERROR.ARGS);
	});
});
describe('log', () => {
	it('should return logarithm of given number to specified base', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log(8,2)', sheet).value).toBe(3);
		expect(createTerm('log(86,2.7182818)', sheet).value.toFixed(7)).toBe('4.4543473');
	});
	it('should use 10 as default base if none is given', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log(10)', sheet).value).toBe(1);
	});
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log()', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('log(10,23,45)', sheet).value.code).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if called with to wrong parameter values`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log(,)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('log(0)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('log(10,0)', sheet).value.code).toBe(ERROR.VALUE);
	});
});
describe('randbetween', () => {
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('randbetween(10)', sheet).value.code).toBe(ERROR.ARGS);
		// expect(createTerm('randbetween(10,23,45)', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('randbetween(10,23,5,56,67,34)', sheet).value.code).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if called with to wrong parameter values`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('randbetween(10,)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(45,23)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(5,"23hi")', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,45,)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,45,12)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,12,45,"da")', sheet).value.code).toBe(ERROR.VALUE);
	});
	it('should return an integer within given bounds', () => {
		const sheet = new StreamSheet().sheet;
		const term = createTerm('randbetween(10,30)', sheet);
		for (let i = 0; i < 1000; i += 1) {
			const value = term.value;
			expect(value).toBeGreaterThanOrEqual(10);
			expect(value).toBeLessThanOrEqual(30);
		}
	});
	it('should return an increasing integer within given delta bounds', () => {
		const sheet = new StreamSheet().sheet;
		const term = createTerm('randbetween(10,30,2,4)', sheet);
		let value = term.value;
		expect(value).toBeGreaterThanOrEqual(10);
		expect(value).toBeLessThanOrEqual(30);
		for (let i = 0; i < 1000; i += 1) {
			value = term.value;
			expect(value).toBeGreaterThanOrEqual(value);
			expect(value).toBeLessThanOrEqual(30);
		}
	});
	it('should return a decreasing integer within given delta bounds', () => {
		const sheet = new StreamSheet().sheet;
		const term = createTerm('randbetween(10,30,-2,0)', sheet);
		let value = term.value;
		expect(value).toBeGreaterThanOrEqual(10);
		expect(value).toBeLessThanOrEqual(30);
		for (let i = 0; i < 100; i += 1) {
			value = term.value;
			expect(value).toBeGreaterThanOrEqual(10);
			expect(value).toBeLessThanOrEqual(value);
		}
	});
	it('should return an increasing integer form initial value within given delta bounds', () => {
		const sheet = new StreamSheet().sheet;
		let term = createTerm('randbetween(10,30,0,0,15)', sheet);
		expect(term.value).toBe(15);
		term = createTerm('randbetween(10,30,0,1,15)', sheet);
		for (let i = 0; i < 1000; i += 1) {
			const value = term.value;
			expect(value).toBeLessThanOrEqual(30);
			expect(value).toBeGreaterThanOrEqual(15);
		}
	});
	it('should return a decreasing integer form initial value within given delta bounds', () => {
		const sheet = new StreamSheet().sheet;
		let term = createTerm('randbetween(10,30,0,0,15)', sheet);
		expect(term.value).toBe(15);
		term = createTerm('randbetween(10,30,-1, 0,15)', sheet);
		for (let i = 0; i < 1000; i += 1) {
			const value = term.value;
			expect(value).toBeLessThanOrEqual(15);
			expect(value).toBeGreaterThanOrEqual(10);
		}
	});
	it('should reset on machine start', async () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.removeAllStreamSheets();
		machine.addStreamSheet(streamsheet);
		const cell = createCellAt('A1', { formula: 'randbetween(10,30,0,1,15)' }, streamsheet.sheet);
		// perform a few steps to get over 16...
		for (let i = 0; i < 100; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await machine.step();
		}
		const cellValue = cell.value;
		expect(cellValue).toBeGreaterThan(16);
		// now start/stop machine to reset:
		await machine.start();
		await machine.stop();
		expect(cell.value).toBeLessThan(cellValue);
	});
});
describe('round',() => {
	it('should return rounded value, with specified precision', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('round(10.234,0)', sheet).value).toBe(10);
		expect(createTerm('round(10.234,2)', sheet).value).toBe(10.23);
		expect(createTerm('round(10.2345,3)', sheet).value).toBe(10.235);
		expect(createTerm('round(10.2344,3)', sheet).value).toBe(10.234);
	});
	it('should use 0 as default precision', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('round(10.234)', sheet).value).toBe(10);
		expect(createTerm('round(-210.234)', sheet).value).toBe(-210);
	});
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('round()', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('round(10.234,2,45)', sheet).value.code).toBe(ERROR.ARGS);
	});
});