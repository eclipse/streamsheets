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
const { StreamSheet } = require('@cedalo/machine-core');
const { createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

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
	it(`should return ${ERROR.ARGS} if called with to less or to many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('log(10,23,45)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if called with to wrong parameter values`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('log(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('log(0)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('log(10,0)', sheet).value).toBe(ERROR.VALUE);
	});
});
describe('randbetween', () => {
	it(`should return ${ERROR.ARGS} if called with to less or to many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('randbetween(10)', sheet).value).toBe(ERROR.ARGS);
		// expect(createTerm('randbetween(10,23,45)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('randbetween(10,23,5,56,67,34)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if called with to wrong parameter values`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('randbetween(10,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(45,23)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(5,"23hi")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,45,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,45,12)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('randbetween(10,23,12,45,"da")', sheet).value).toBe(ERROR.VALUE);
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
});