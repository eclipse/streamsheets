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

const ERROR = FunctionErrors.code;

describe('isError', () => {
	it('should return true for a valid error code', () => {
		expect(FunctionErrors.isError(ERROR.ARGS)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.FUNC_EXEC)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.INVALID)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.INVALID_PARAM)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.LIST)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.NO_MSG_DATA)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.OUTBOX)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.PROCSHEET)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.RANGE)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.RANGE_INVALID)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.SELF_REF)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.SOURCE)).toBeTruthy();
		expect(FunctionErrors.isError(ERROR.TARGET)).toBeTruthy();
	});
	it('should return false for an unkown error code', () => {
		expect(FunctionErrors.isError('error')).toBeFalsy();
		expect(FunctionErrors.isError('#UNKNOWN_ERROR')).toBeFalsy();
	});
});
