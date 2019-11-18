const { createTerm } = require('../utils');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

describe('info functions', () => {
	describe('iferror', () => {
		it('should return specified error-value if given value evaluates to an error', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A2: `${Error.code.NA}`, B2: 35, A3: 55, B3: 0 } });
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
			expect(createTerm('iferror(D10, E10, "STOP")', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('iferror(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iferror(^D10, "STOP")', sheet).value).toBe(Error.code.NAME);
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
		it(`should return ${Error.code.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null } });
			expect(createTerm('iseven()', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('iseven(A1)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('iseven(1/0)', sheet).value).toBe(Error.code.VALUE);
			// support this? currently one 12 is used and therefore it will return true...
			// expect(createTerm('iseven("12hello")', sheet).value).toBe(Error.code.VALUE);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iseven(D10, E10)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('iseven(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iseven(°D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iseven(|D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iseven("22)")', sheet).value).toBe(Error.code.VALUE);
		});
	});
	describe('iserr', () => {
		it(`should return true on any error value except ${Error.code.NA}`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${Error.code.REF}`, A2: `${Error.code.NA}`, A3: 35 } });
			expect(createTerm('iserr(A1)', sheet).value).toBe(true);
			expect(createTerm(`iserr("${Error.code.DIV0}")`, sheet).value).toBe(true);
			expect(createTerm('iserr(A2)', sheet).value).toBe(false);
			expect(createTerm('iserr(A3)', sheet).value).toBe(false);
		});
		// DL-1374
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iserr(D10, E10)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('iserr(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserr(^D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserr(°D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserr(|D10)', sheet).value).toBe(Error.code.NAME);
		});
	});
	describe('iserror', () => {
		it('should return true if value represents an error', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${Error.code.REF}`, A2: `${Error.code.NA}`, A3: 35 } });
			expect(createTerm('iserror(A1)', sheet).value).toBe(true);
			expect(createTerm(`iserror("${Error.code.DIV0}")`, sheet).value).toBe(true);
			expect(createTerm('iserror()', sheet).value).toBe(false);
			expect(createTerm('iserror(A2)', sheet).value).toBe(true);
			expect(createTerm('iserror(A3)', sheet).value).toBe(false);
		});
		// DL-1374
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('iserror(D10, E10)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('iserror(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserror(^D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserror(°D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('iserror(|D10)', sheet).value).toBe(Error.code.NAME);
		});
	});
	describe('isna', () => {
		it(`should return true if value equals ${Error.code.NA}`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: `${Error.code.REF}`, A2: `${Error.code.NA}`, A3: 35 } });
			expect(createTerm('isna(A1)', sheet).value).toBe(false);
			expect(createTerm(`isna("${Error.code.DIV0}")`, sheet).value).toBe(false);
			expect(createTerm('isna(A2)', sheet).value).toBe(true);
			expect(createTerm('isna(A3)', sheet).value).toBe(false);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isna(D10, E10)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('isna(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('isna(°D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('isna(|D10)', sheet).value).toBe(Error.code.NAME);
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
		it(`should return ${Error.code.VALUE} if given value is not a number`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null } });
			expect(createTerm('isodd()', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('isodd(A1)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('isodd(1/0)', sheet).value).toBe(Error.code.VALUE);
			// support this? currently one 11 is used and therefore it will return true...
			// expect(createTerm('iseven("11hello")', sheet).value).toBe(Error.code.VALUE);
		});
		// DL-1375
		it('shoud return error code for invalid or to much parameters', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('isodd(D10, E10)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('isodd(_D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('isodd(°D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('isodd(|D10)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('isodd("22)")', sheet).value).toBe(Error.code.VALUE);
		});
	});
});
