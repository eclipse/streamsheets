'use strict';

const supertest = require('supertest');
const before = require('../helper/BeforeHook');

// eslint-disable-next-line
const key = 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJtYWNoaW5lc2VydmVyIiwiaWF0IjoxNTA0MTg3NjIzLCJleHAiOjE1MzU3MjM2MjN9.x0iIxbIXBxyvyjKyCyj1BqwiA2UcCUlJa1tvcl7QTaU';
let defaultApp;
beforeAll(() => before.getApp().then((res) => {
	defaultApp = res.defaultApp;
}));

describe('@cedalo/gateway', () => {
	describe.skip('GET /api/v1.0/machines', () => {
		it('should respond with json', () => supertest(defaultApp.app)
			.get('/api/v1.0/machines')
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200));
	});
	describe.skip('POST /api/v1.0/machines', () => {
		const newMachine = {
			id: 'example-machine-678',
			name: 'Example Machine 678'
		};
		it.skip('should respond with json', () => supertest(defaultApp.app)
			.post('/api/v1.0/machines')
			.send(newMachine)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.expect(200));
	});
	describe.skip('GET /api/v1.0/machines/:id', () => {
		it.skip('should respond with json', () => {
			const id = 'example-machine-2';
			return supertest(defaultApp.app)
				.get(`/api/v1.0/machines/${id}`)
				.set('Accept', 'application/json')
				.expect('Content-Type', /json/)
				.expect(200)
				.then((response) => {
					expect(response.body.id).toEqual('example-machine-2');
					expect(response.body.name).toEqual('Example Machine 2');
				});
		});
	});
	describe.skip('PUT /api/v1.0/machines/:id', () => {
		const updatedMachine = {
			id: 'example-machine-1',
			status: 1,
			name: 'Updated Example Machine 1'
		};
		it('should update a machine', () => {
			const id = 'example-machine-1';
			return supertest(defaultApp.app)
				.put(`/api/v1.0/machines/${id}`)
				.set('Accept', 'application/json')
				.send(updatedMachine)
				.expect('Content-Type', /json/)
				.expect(200)
				.then((response) => {
					expect(response.body).toEqual({
						id: 'example-machine-1',
						name: 'Updated Example Machine 1',
						status: 1
					});
				});
		});
	});
});
