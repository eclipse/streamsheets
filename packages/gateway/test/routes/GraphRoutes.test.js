'use strict';

const supertest = require('supertest');
const before = require('../helper/BeforeHook');
const uuid = require('uuid/v4');
const Auth = require('../../src/Auth');
// Import additional test matchers
require('jasmine-expect');

const jwtTestToken = Auth.getToken({ _id: 'something' });

let defaultApp;
beforeAll(() => before.getApp().then((res) => {
	defaultApp = res.defaultApp;
}));

describe('@cedalo/gateway', () => {
	describe('GET /api/v1.0/graphs', () => {
		it('should reply with unauthorized (GET, 401)', () => supertest(defaultApp.app)
			.get('/api/v1.0/graphs')
			.set('Accept', 'application/json')
			.expect(401)
			.then((response) => {
				expect(response.body).toEqual({ error: 'GET /api/v1.0/graphs requires authentication (apiKey)' });
			}));
		it('should respond with json', () => supertest(defaultApp.app)
			.get('/api/v1.0/graphs')
			.set('Accept', 'application/json')
			.set('Authorization', `JWT ${jwtTestToken}`)
			.expect('Content-Type', /json/)
			.expect(200));
	});
	describe('GET /api/v1.0/graphs/:id', () => {
		it('should reply with graph (GET, 200)', () => {
			const newGraph = {
				id: uuid(),
				'o-graphitem': {},
				machineId: uuid()
			};
			return supertest(defaultApp.app)
				.post('/api/v1.0/graphs')
				.send(newGraph)
				.set('Accept', 'application/json')
				.set('Authorization', `JWT ${jwtTestToken}`)
				.expect(201)
				.expect('Content-Type', /json/)
				.then((response) => {
					expect(response.body.id).toBeDefined();
					return supertest(defaultApp.app)
						.get(`/api/v1.0/graphs/${response.body.id}`)
						.set('Accept', 'application/json')
						.set('Authorization', `JWT ${jwtTestToken}`)
						.expect(200)
						.expect('Content-Type', /json/)
						.then((getResponse) => {
							expect(getResponse.body.id).toBe(newGraph.id);
							expect(getResponse.body['o-graphitem']).toEqual(newGraph['o-graphitem']);
							expect(getResponse.body.machineId).toBe(newGraph.machineId);
						});
				});
		});

		it('should reply with not found (GET, 404)', () => supertest(defaultApp.app)
			.get('/api/v1.0/graphs/doesNotExist')
			.set('Accept', 'application/json')
			.set('Authorization', `JWT ${jwtTestToken}`)
			.expect(404)
			.expect('Content-Type', /json/)
			.then((response) => {
				expect(response.body).toEqual({ error: 'GRAPH_NOT_FOUND' });
			}));
	});
	describe('DELETE /api/v1.0/graphs', () => {
		it('should not be allowed (DELETE, 405)', () => supertest(defaultApp.app)
			.delete('/api/v1.0/graphs')
			.set('Accept', 'application/json')
			.expect(405)
			.then((response) => {
				expect(response.body.error).toStartWith('/api/v1.0/graphs does not allow DELETE.');
			}));
	});
	describe('DELETE /api/v1.0/graphs/:id', () => {
		it('should delete a graph (DELETE, 204)', () => {
			const newGraph = {
				id: uuid(),
				'o-graphitem': {},
				machineId: uuid()
			};
			return supertest(defaultApp.app)
				.post('/api/v1.0/graphs')
				.send(newGraph)
				.set('Accept', 'application/json')
				.set('Authorization', `JWT ${jwtTestToken}`)
				.expect(201)
				.expect('Content-Type', /json/)
				.then((response) => {
					expect(response.body.id).toBeDefined();
					return supertest(defaultApp.app)
						.delete(`/api/v1.0/graphs/${response.body.id}`)
						.set('Accept', 'application/json')
						.set('Authorization', `JWT ${jwtTestToken}`)
						.expect(204)
						.then((deleteResponse) => {
							expect(deleteResponse.body).toEqual({});
						});
				});
		});
	});
	describe('PUT /api/v1.0/graphs/:id', () => {
		it('should update a graph (PUT, 200)', () => {
			const newGraph = {
				id: uuid(),
				'o-graphitem': {
					someValue: 'someValue'
				},
				machineId: uuid()
			};
			const updatedGraph = Object.assign({}, newGraph);
			updatedGraph['o-graphitem'].someValue = 'someNewValue';
			return supertest(defaultApp.app)
				.post('/api/v1.0/graphs')
				.send(newGraph)
				.set('Accept', 'application/json')
				.set('Authorization', `JWT ${jwtTestToken}`)
				.expect(201)
				.expect('Content-Type', /json/)
				.then((response) => {
					expect(response.body.id).toBeDefined();
					return supertest(defaultApp.app)
						.put(`/api/v1.0/graphs/${response.body.id}`)
						.send(updatedGraph)
						.set('Accept', 'application/json')
						.set('Authorization', `JWT ${jwtTestToken}`)
						.expect(200)
						.then((putResponse) => {
							expect(putResponse.body).toEqual(updatedGraph);
						});
				});
		});
	});
});

