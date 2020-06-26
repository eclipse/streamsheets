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
'use strict';

const supertest = require('supertest');
// const before = require('../helper/BeforeHook');

let defaultApp;

// beforeAll(() => before.getApp().then((res) => {
// 	defaultApp = res.defaultApp;
// }));

describe.skip('@cedalo/gateway', () => {
	it('should test the root API page (GET, 200)', () => supertest(defaultApp.app)
			.get('/api/v1.0/')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.then((response) => {
				expect(typeof response.body).toBe('object');
				expect(response.body.hasOwnProperty('message')).toBe(true);
				expect(response.statusCode).toBe(200);
			}));
	it('should test the root API page (HEAD, 200)', () => supertest(defaultApp.app)
			.head('/api/v1.0/')
			.set('Accept', 'application/json')
			.expect(200)
			.expect('Content-Type', /json/)
			.then((response) => {
				expect(response.statusCode).toBe(200);
			}));
	it('should test the root API page with wrong request method (TRACE, 405)', () => supertest(defaultApp.app)
			.trace('/api/v1.0/')
			.set('Accept', 'application/json')
			.expect(405)
			.expect('Content-Type', /json/)
			.then((response) => {
				expect(typeof response.body).toBe('object');
				expect(response.body.hasOwnProperty('error')).toBe(true);
				expect(response.body.error).toBe('/api/v1.0/ does not allow TRACE. \nAllowed methods: GET, HEAD');
				expect(response.headers.hasOwnProperty('allow')).toBe(true);
				expect(response.headers.allow).toBe('GET, HEAD');
				expect(response.statusCode).toBe(405);
			}));
	it('should test a non-existent page (GET, 404)', () => supertest(defaultApp.app)
			.get('/api/v1.0/404')
			.set('Accept', 'application/json')
			.expect(404)
			.expect('Content-Type', /json/)
			.then((response) => {
				expect(typeof response.body).toBe('object');
				expect(response.body.hasOwnProperty('error')).toBe(true);
				expect(response.body.error).toBe('Resource not found: /api/v1.0/404');
				expect(response.statusCode, 404);
			}));
});
