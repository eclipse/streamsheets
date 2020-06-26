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
const RESTClient = require('../../src/client/RESTClient');
const request001 = require('./request001.json');
const request002 = require('./request002.json');
const request003 = require('./request003.json');
const request004 = require('./request004.json');
const http = require('http');

const port = 3003;
const defaultResponseMessage = {
	message: 'Response from test server'
};

describe('RESTClient', () => {
	beforeAll(() => {
		const requestHandler = (request, response) => {
			response.end(JSON.stringify(defaultResponseMessage));
		};
		const server = http.createServer(requestHandler);
		server.listen(port, (error) => {
			if (error) {
				console.log('error', error);
			} else {
				console.log(`Test server is listening on port ${port}`);
			}
		});
	});
	describe('send()', () => {
		it('should send a request', async (done) => {
			const client = new RESTClient();
			const response = await client.send(request001);
			expect(response).toEqual(defaultResponseMessage);
			done();
		});
		it('should use the base url if configured', async (done) => {
			const client = new RESTClient();
			const response = await client.send(request002, {
				baseUrl: 'http://localhost:3003/api/v1.0/rest'
			});
			expect(response).toEqual(defaultResponseMessage);
			done();
		});
		it('should use the username and password if configured', async (done) => {
			const client = new RESTClient();
			const response = await client.send(request003, {
				baseUrl: 'http://localhost:3003/api/v1.0/rest',
				user: 'cedalo',
				pass: 'examples'
			});
			expect(response).toEqual(defaultResponseMessage);
			done();
		});
		it('should get a response from the Weather API', async (done) => {
			const client = new RESTClient();
			await client.send(request004);
			done();
		});
		it('should return an error if the request could not be executed', async (done) => {
			const client = new RESTClient();
			try {
				await client.send(request003, {
					baseUrl: 'http://localhost:3004/api/v1.0/rest'
				});
			} catch (error) {
				expect(error.code).toBe('ECONNREFUSED');
				done();
			}
		});
	});
});
