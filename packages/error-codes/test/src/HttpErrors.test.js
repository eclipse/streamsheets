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
const { Errors, CODES, HttpErrors } = require('../../');

describe('HttpErrors.createFromInternal', () => {
	it('should create a 404 http error object from internal not found error', () => {
		const error = Errors.createInternal(CODES.DOMAIN_NOT_FOUND);
		const result = HttpErrors.createFromInternal(error);

		expect(result.message).toBe(CODES.DOMAIN_NOT_FOUND);
		expect(result.status).toBe(404);
		expect(result.statusCode).toBe(404);
		expect(result.expose).toBe(true);
	});

	it('should create an 500er http error object if code is UNKNOWN', () => {
		const error = Errors.createInternal(`${CODES.DOMAIN_NOT_FOUND}-something`);
		const result = HttpErrors.createFromInternal(error);
		expect(result.message).toBe('Internal Server Error');
		expect(result.status).toBe(500);
		expect(result.statusCode).toBe(500);
		expect(result.expose).toBe(false);
	});

	it('should create an 500er http error object if no input is provided', () => {
		const result = HttpErrors.createFromInternal();
		expect(result.message).toBe('Internal Server Error');
		expect(result.status).toBe(500);
		expect(result.statusCode).toBe(500);
		expect(result.expose).toBe(false);
	});
});


describe('HttpErrors.create (deprecated)', () => {
	it('should create a 404 http error object from internal not found error', () => {
		const error = Errors.createInternal(CODES.DOMAIN_NOT_FOUND);
		const result = HttpErrors.create(error);

		expect(result.message).toBe(CODES.DOMAIN_NOT_FOUND);
		expect(result.status).toBe(404);
		expect(result.statusCode).toBe(404);
		expect(result.expose).toBe(true);
	});

	it('should create an 500er http error object if code is UNKNOWN', () => {
		const error = Errors.createInternal(`${CODES.DOMAIN_NOT_FOUND}-something`);
		const result = HttpErrors.create(error);
		expect(result.message).toBe('Internal Server Error');
		expect(result.status).toBe(500);
		expect(result.statusCode).toBe(500);
		expect(result.expose).toBe(false);
	});

	it('should create an 500er http error object if no input is provided', () => {
		const result = HttpErrors.create();
		expect(result.message).toBe('Internal Server Error');
		expect(result.status).toBe(500);
		expect(result.statusCode).toBe(500);
		expect(result.expose).toBe(false);
	});
});
