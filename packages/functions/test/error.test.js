const { FunctionErrors: Error } = require('@cedalo/error-codes');

describe('isError', () => {
	it('should return true for a valid error code', () => {
		expect(Error.isError(Error.code.ARGS)).toBeTruthy();
		expect(Error.isError(Error.code.FUNC_EXEC)).toBeTruthy();
		expect(Error.isError(Error.code.INVALID)).toBeTruthy();
		expect(Error.isError(Error.code.INVALID_PARAM)).toBeTruthy();
		expect(Error.isError(Error.code.LIST)).toBeTruthy();
		expect(Error.isError(Error.code.NO_MSG_DATA)).toBeTruthy();
		expect(Error.isError(Error.code.OUTBOX)).toBeTruthy();
		expect(Error.isError(Error.code.PROCSHEET)).toBeTruthy();
		expect(Error.isError(Error.code.RANGE)).toBeTruthy();
		expect(Error.isError(Error.code.RANGE_INVALID)).toBeTruthy();
		expect(Error.isError(Error.code.SELF_REF)).toBeTruthy();
		expect(Error.isError(Error.code.SOURCE)).toBeTruthy();
		expect(Error.isError(Error.code.TARGET)).toBeTruthy();
	});
	it('should return false for an unkown error code', () => {
		expect(Error.isError('error')).toBeFalsy();
		expect(Error.isError('#UNKNOWN_ERROR')).toBeFalsy();
	});
});
