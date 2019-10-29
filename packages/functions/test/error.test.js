const ERROR = require('../src/functions/errors');

describe('isError', () => {
	it('should return true for a valid error code', () => {
		expect(ERROR.isError(ERROR.ARGS)).toBeTruthy();
		expect(ERROR.isError(ERROR.FUNC_EXEC)).toBeTruthy();
		expect(ERROR.isError(ERROR.INVALID)).toBeTruthy();
		expect(ERROR.isError(ERROR.INVALID_PARAM)).toBeTruthy();
		expect(ERROR.isError(ERROR.LIST)).toBeTruthy();
		expect(ERROR.isError(ERROR.NO_MSG_DATA)).toBeTruthy();
		expect(ERROR.isError(ERROR.OUTBOX)).toBeTruthy();
		expect(ERROR.isError(ERROR.PROCSHEET)).toBeTruthy();
		expect(ERROR.isError(ERROR.RANGE)).toBeTruthy();
		expect(ERROR.isError(ERROR.RANGE_INVALID)).toBeTruthy();
		expect(ERROR.isError(ERROR.SELF_REF)).toBeTruthy();
		expect(ERROR.isError(ERROR.SOURCE)).toBeTruthy();
		expect(ERROR.isError(ERROR.TARGET)).toBeTruthy();
	});
	it('should return false for an unkown error code', () => {
		expect(ERROR.isError('error')).toBeFalsy();
		expect(ERROR.isError('#UNKNOWN_ERROR')).toBeFalsy();
	});
});
