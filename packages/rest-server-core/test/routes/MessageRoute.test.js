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
const request = require('supertest');
const sinon = require('sinon');
const EventEmittingRESTServer = require('../../src/server/EventEmittingRESTServer');

process.env.RESTSERVER_PORT = 8085;
const server = EventEmittingRESTServer.instance();

// eslint-disable-next-line
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

class MockRESTStream {
	constructor(config = {}, restServer, mockResponseMessage) {
		this._config = config;
		this._restServer = restServer;
		this._mockResponseMessage = mockResponseMessage;
	}

	publish(message, requestId) {
		return this._restServer.handleResponse(requestId, message);
	}

	handleMessage(restMessage) {
		const requestId = restMessage.metadata.id;
		const message = this._mockResponseMessage || restMessage;
		this.publish(message, requestId);
	}
}

describe('/api/v1.0', () => {
	beforeAll(done => server.start().then(done));
	afterAll(done => server.stop().then(done));
	it('should accept POST requests and respond with JSON', (done) => {
		const topic = 'cedalo/test';
		const message = {
			example: 'tests'
		};
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.send(message)
			.expect('Content-Type', /json/)
			.expect(200, done);
	});
	it('should only allow GET and POST', (done) => {
		request(server.application.app)
			.delete('/api/v1.0/cedalo/example')
			.expect('Content-Type', /text\/plain/)
			.expect(405, done);
	});
	it('should only allow GET and POST', (done) => {
		request(server.application.app)
			.delete('/api/v1.0/cedalo/example')
			.set('Accept', 'text/plain')
			.expect('Content-Type', /text\/plain/)
			.expect(405, done);
	});
	it('should only allow GET and POST', (done) => {
		request(server.application.app)
			.delete('/api/v1.0/cedalo/example')
			.set('Accept', 'text/html')
			.expect('Content-Type', /text\/html/)
			.expect(405, done);
	});
	it('should only allow GET and POST', (done) => {
		request(server.application.app)
			.delete('/api/v1.0/cedalo/example')
			.set('Accept', 'application/xhtml+xml')
			.expect('Content-Type', /text\/html/)
			.expect(405, done);
	});
	it('should only allow GET and POST', (done) => {
		request(server.application.app)
			.delete('/api/v1.0/cedalo/example')
			.set('Accept', 'application/json')
			.expect('Content-Type', /application\/json/)
			.expect(405, done);
	});
	it('should accept GET requests and respond with JSON', (done) => {
		const topic = 'cedalo/test';
		request(server.application.app)
			.get(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200, done);
	});
	it('should create a message based on the query parameters', (done) => {
		const topic = 'cedalo/get/test1';
		const feeder = new MockRESTStream(null, server);
		server.on(topic, feeder.handleMessage.bind(feeder));
		request(server.application.app)
			.get(`/api/v1.0/${topic}?example=true&example2=true`)
			.set('Accept', 'application/json')
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body.example).toEqual('true');
				expect(response.body.example2).toEqual('true');
				done();
			});
	});
	it('should create a message based on the json query parameters', (done) => {
		const json = {
			orderId: '123456',
			userId: 'ABCDEF'
		};
		const topic = 'cedalo/get/test2';
		const feeder = new MockRESTStream(null, server);
		server.on(topic, feeder.handleMessage.bind(feeder));
		request(server.application.app)
			.get(`/api/v1.0/${topic}?json=${JSON.stringify(json)}&example=true&example2=true`)
			.set('Accept', 'application/json')
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body.json).toEqual(json);
				expect(response.body.example).toEqual('true');
				expect(response.body.example2).toEqual('true');
				done();
			});
	});
	it('should send an event to subscribers', (done) => {
		const topic = 'cedalo/test1';
		const message = {
			example: 'tests'
		};
		const spy = sinon.spy();
		server.on(topic, spy);
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.send(message)
			.end((/* error, response */) => {
				expect(spy.callCount).toBe(1);
				done();
			});
	});
	it('should only send an event to subscribers', (done) => {
		const topic1 = 'cedalo/test2/a';
		const topic2 = 'cedalo/test2/b';
		const message = {
			example: 'tests'
		};
		const spy1 = sinon.spy();
		const spy2 = sinon.spy();
		server.on(topic1, spy1);
		server.on(topic2, spy2);
		request(server.application.app)
			.post(`/api/v1.0/${topic1}`)
			.set('Accept', 'application/json')
			.send(message)
			.end((error /* , response */) => {
				if (error) {
					done(error);
				}
				expect(spy1.callCount).toBe(1);
				expect(spy2.callCount).toBe(0);
				done();
			});
	});
	it('should respond with request message by default', (done) => {
		const topic = 'cedalo/test3';
		const message = {
			example: 'tests'
		};
		const feeder = new MockRESTStream(null, server, message);
		server.on(topic, feeder.handleMessage.bind(feeder));
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.send(message)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body).toEqual(message);
				done();
			});
	});
	it('should add meta information containing a request id if the Expect-Response header is set', (done) => {
		const topic = 'cedalo/test4';
		const message = {
			example: 'tests'
		};
		const spy = sinon.spy();
		server.on(topic, spy);
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', true)
			.send(message)
			.expect(200)
			.end((error /* , response */) => {
				if (error) {
					done(error);
				}
				expect(spy.args[0][0].metadata).toBeDefined();
				expect(spy.args[0][0].metadata.id).toBeDefined();
				done();
			});
	});
	it('should reply with a custom response if the Expect-Response header is set', (done) => {
		const topic = 'cedalo/test5';
		const message = {
			example: 'tests'
		};
		const customResponse = {
			example: 'tests2'
		};
		const feeder = new MockRESTStream(null, server, customResponse);
		server.on(topic, feeder.handleMessage.bind(feeder));
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', true)
			.send(message)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body).toEqual(customResponse);
				done();
			});
	});
	it('should respond with request message if the Expect-Response header is set to false', (done) => {
		const topic = 'cedalo/test6';
		const message = {
			example: 'tests'
		};
		const feeder = new MockRESTStream(null, server, message);
		server.on(topic, feeder.handleMessage.bind(feeder));
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', false)
			.send(message)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body).toEqual(message);
				done();
			});
	});
	it('should reply with a custom response if the Expect-Response header is set', (done) => {
		const topic1 = 'cedalo/test7/a';
		const topic2 = 'cedalo/test7/b';
		const message1 = {
			example: 'message1'
		};
		const message2 = {
			example: 'message2'
		};
		const customResponse1 = {
			example: 'customResponse1'
		};
		const customResponse2 = {
			example: 'customResponse2'
		};
		const feeder1 = new MockRESTStream(null, server, customResponse1);
		server.on(topic1, feeder1.handleMessage.bind(feeder1));
		const feeder2 = new MockRESTStream(null, server, customResponse2);
		server.on(topic2, feeder2.handleMessage.bind(feeder2));
		request(server.application.app)
			.post(`/api/v1.0/${topic1}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', true)
			.send(message1)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body).toEqual(customResponse1);
				request(server.application.app)
					.post(`/api/v1.0/${topic2}`)
					.set('Accept', 'application/json')
					.set('Expect-Response', true)
					.send(message2)
					.expect(200)
					.end((error2, response2) => {
						if (error2) {
							done(error2);
						}
						expect(response2.body).toEqual(customResponse2);
						done();
					});
			});
	});
	// eslint-disable-next-line
	it('should return a response containing a timeout warning if no custom response is received before the given timeout', (done) => {
		const topic = 'cedalo/test8';
		const message = {
			example: 'tests'
		};
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', true)
			.send(message)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body.type).toBe('warning');
				done();
			});
	});
	// eslint-disable-next-line
	it('should return a response containing a timeout warning if no custom response is received before the given timeout', (done) => {
		const topic = 'cedalo/test9';
		const message = {
			example: 'tests'
		};
		const spy = sinon.spy();
		server.on(topic, spy);
		request(server.application.app)
			.post(`/api/v1.0/${topic}`)
			.set('Accept', 'application/json')
			.set('Expect-Response', true)
			.send(message)
			.expect(200)
			.end((error, response) => {
				if (error) {
					done(error);
				}
				expect(response.body.type).toBe('warning');
				done();
			});
	});
});
