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
const { runFunction } = require('../..').utils;

const ERROR = FunctionErrors.code;

describe('runFunction', () => {
	test('runFunction creation', () => {
		const runner = runFunction();
		expect(runner).toBeDefined();
	});
	it('should support ignoring errors', () => {
		let error;
		const sheet = new StreamSheet().sheet;
		const runner = runFunction(sheet, ['hello', 'world', ERROR.NA, '!!']);
		runner
			.ignoreError()
			.mapNextArg((first) => first)
			.mapNextArg((second) => second)
			.mapNextArg((third) => third)
			.mapNextArg((last) => last)
			.run((first, second, third, last, err) => {
				expect(first).toBe('hello');
				expect(second).toBe('world');
				expect(third).toBe(ERROR.NA);
				expect(last).toBe('!!');
				error = err;
			});
		expect(error).toBeDefined();
		expect(error.code).toBe(ERROR.NA);
		expect(error.index).toBe(2);
	});
	it('should support remapping of previous mapped argument', () => {
		const sheet = new StreamSheet().sheet;
		const runner = runFunction(sheet, ['hello', 'world', '!!']);
		runner
			.mapNextArg((first) => first)
			.remapPrevArg((first, prevRes) => {
				expect(first).toBe('hello');
				expect(prevRes).toBe('hello');
				return 'hallo';
			})
			.mapNextArg((second) => second)
			.remapPrevArg((second, prevRes) => {
				expect(second).toBe('world');
				expect(prevRes).toBe('world');
				return 123;
			})
			.remapPrevArg((second, prevRes) => {
				expect(second).toBe('world');
				expect(prevRes).toBe(123);
				return false;
			})
			.remapPrevArg((second, prevRes) => {
				expect(second).toBe('world');
				expect(prevRes).toBe(false);
				return 'welt';
			})
			.mapNextArg((third) => third)
			.run((first, second, third) => {
				expect(first).toBe('hallo');
				expect(second).toBe('welt');
				expect(third).toBe('!!');
			});
	});
});
