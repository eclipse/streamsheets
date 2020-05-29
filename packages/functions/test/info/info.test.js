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

describe('info functions', () => {
	describe('iferror', () => {
		it('should return specified error-value if given value evaluates to an error', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: `${ERROR.NA}`, B2: 35, A3: 55, B3: 0 } });
			expect(createTerm('iferror(A2, "Error")', sheet).value).toBe('Error');
			expect(createTerm('iferror(A3/B3, "Error")', sheet).value).toBe('Error');
		});
		it('should return evaluated value if it is not an error', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: 210, B2: 35, A3: 55, B3: 0, A4: null, B4: 23 } });
			expect(createTerm('iferror(A2/B2, "Error")', sheet).value).toBe(6);
			expect(createTerm('iferror(A4/B4, "Error")', sheet).value).toBe(0);
		});
		it('should return an empty string if evaluated value or return error-value is not available', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null } });
			expect(createTerm('iferror(A1, "Error")', sheet).value).toBe('');
			expect(createTerm('iferror(A4, "Error")', sheet).value).toBe('');
			expect(createTerm('iferror(1/0, A1)', sheet).value).toBe('');
		});
		// DL-1369
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iferror(D10, E10, "STOP")', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iferror(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iferror(^D10, "STOP")', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('iseven', () => {
		it('should return true if given number is even', () => {
			const sheet = new StreamSheet().sheet;
			// 2.5 is truncated to 2...
			expect(createTerm('iseven(2.5)', sheet).value).toBe(true);
			expect(createTerm('iseven(0)', sheet).value).toBe(true);
		});
		it('should return false if given number is odd', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iseven(-1)', sheet).value).toBe(false);
			expect(createTerm('iseven(5)', sheet).value).toBe(false);
		});
		it(`should return ${ERROR.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null } });
			expect(createTerm('iseven(A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('iseven(1/0)', sheet).value).toBe(ERROR.VALUE);
			// support this? currently one 12 is used and therefore it will return true...
			// expect(createTerm('iseven("12hello")', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iseven()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iseven(D10, E10)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iseven(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iseven(°D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iseven(|D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iseven("22)")', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('iserr', () => {
		it(`should return true on any error value except ${ERROR.NA}`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${ERROR.REF}`, A2: `${ERROR.NA}`, A3: 35 } });
			expect(createTerm('iserr(A1)', sheet).value).toBe(true);
			expect(createTerm(`iserr("${ERROR.DIV0}")`, sheet).value).toBe(true);
			expect(createTerm('iserr(A2)', sheet).value).toBe(false);
			expect(createTerm('iserr(A3)', sheet).value).toBe(false);
		});
		// DL-1374
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iserr(D10, E10)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iserr(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserr(^D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserr(°D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserr(|D10)', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('iserror', () => {
		it('should return true if value represents an error', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${ERROR.REF}`, A2: `${ERROR.NA}`, A3: 35 } });
			expect(createTerm('iserror(A1)', sheet).value).toBe(true);
			expect(createTerm(`iserror("${ERROR.DIV0}")`, sheet).value).toBe(true);
			expect(createTerm('iserror(A2)', sheet).value).toBe(true);
			expect(createTerm('iserror(A3)', sheet).value).toBe(false);
		});
		// DL-1374
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iserror()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iserror(D10, E10)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('iserror(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserror(^D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserror(°D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('iserror(|D10)', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('isna', () => {
		it(`should return true if value equals ${ERROR.NA}`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${ERROR.REF}`, A2: `${ERROR.NA}`, A3: 35 } });
			expect(createTerm('isna(A1)', sheet).value).toBe(false);
			expect(createTerm(`isna("${ERROR.DIV0}")`, sheet).value).toBe(false);
			expect(createTerm('isna(A2)', sheet).value).toBe(true);
			expect(createTerm('isna(A3)', sheet).value).toBe(false);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isna(D10, E10)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('isna(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('isna(°D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('isna(|D10)', sheet).value).toBe(ERROR.NAME);
		});
	});
	// DL-4099
	describe('isobject', () => {
		it('should return true for object values', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isobject(JSON(A1:B1))', sheet).value).toBe(true);
			expect(createTerm('isobject(ARRAY(A1:B1))', sheet).value).toBe(true);
			expect(createTerm('isobject(DICTIONARY(A1:B1))', sheet).value).toBe(true);
		});
		it('should return false if passed value is not object', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isobject(true)', sheet).value).toBe(false);
			expect(createTerm('isobject(false)', sheet).value).toBe(false);
			expect(createTerm('isobject(42)', sheet).value).toBe(false);
			expect(createTerm('isobject("object")', sheet).value).toBe(false);
			expect(createTerm('isobject("")', sheet).value).toBe(false);
		});
	});
	describe('isodd', () => {
		it('should return true if given number is odd', () => {
			const sheet = new StreamSheet().sheet;
			// 2.5 is truncated to 2...
			expect(createTerm('isodd(3.5)', sheet).value).toBe(true);
			expect(createTerm('isodd(1)', sheet).value).toBe(true);
			expect(createTerm('isodd(-3)', sheet).value).toBe(true);
		});
		it('should return false if given number is even', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isodd(-2)', sheet).value).toBe(false);
			expect(createTerm('isodd(0)', sheet).value).toBe(false);
			expect(createTerm('isodd(2.5)', sheet).value).toBe(false);
			expect(createTerm('isodd(6)', sheet).value).toBe(false);
		});
		it(`should return ${ERROR.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null } });
			expect(createTerm('isodd()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('isodd(A1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('isodd(1/0)', sheet).value).toBe(ERROR.VALUE);
			// support this? currently one 11 is used and therefore it will return true...
			// expect(createTerm('iseven("11hello")', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isodd(D10, E10)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('isodd(_D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('isodd(°D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('isodd(|D10)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('isodd("22)")', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('na', () => {
		it(`should return error ${ERROR.NA}`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('na()', sheet).value).toBe(ERROR.NA);
		});
		it(`should return error ${ERROR.ARGS} if any parameters are given`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('na(12)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('na(,)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('na("hi")', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('na(true)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('na(false)', sheet).value).toBe(ERROR.ARGS);
		});
	});
});
