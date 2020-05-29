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
const Interceptor = require('../../src/ws/interceptors/Interceptor');
const InterceptorChain = require('../../src/ws/interceptors/InterceptorChain');

const spy = { path: '' };

beforeEach(() => {
	spy.path = '';
});

class MockInterceptor extends Interceptor {

	constructor(id, reject = false) {
		super();
		this.id = id;
		this.reject = reject;
	}
	beforeSendToClient(context) {
		spy.path += this.id;
		return this.reject ? Promise.reject(new Error('rejected!')) : Promise.resolve(context);
	}

	beforeSendToServer(context) {
		spy.path += this.id;
		return this.reject ? Promise.reject(new Error('rejected!')) : Promise.resolve(context);
	}
}

describe('InterceptorChain', () => {
	describe('beforeSendToClient', () => {
		it('should call all registered interceptors in sequence', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			chain.add(new MockInterceptor('A'));
			chain.add(new MockInterceptor('B'));
			chain.add(new MockInterceptor('C'));
			return chain.beforeSendToClient().then(() => expect(spy.path).toBe('ABC'));
		});
		it('should stop on first reject', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			chain.add(new MockInterceptor('A', true));
			chain.add(new MockInterceptor('B'));
			chain.add(new MockInterceptor('C'));
			return chain.beforeSendToClient().catch(() => expect(spy.path).toBe('A'));
		});
		it('should reject directly if no interceptor were added', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			return chain.beforeSendToClient().catch(err => expect(err).toBeDefined());
		});
	});

	describe('beforeSendToServer', () => {
		it('should call all registered interceptors in sequence', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			chain.add(new MockInterceptor('A'));
			chain.add(new MockInterceptor('B'));
			chain.add(new MockInterceptor('C'));
			return chain.beforeSendToServer().then(() => expect(spy.path).toBe('ABC'));
		});
		it('should stop on first reject', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			chain.add(new MockInterceptor('A'));
			chain.add(new MockInterceptor('B', true));
			chain.add(new MockInterceptor('C'));
			return chain.beforeSendToServer().catch(() => expect(spy.path).toBe('AB'));
		});
		it('should reject directly if no interceptor were added', () => {
			expect.assertions(1);
			const chain = new InterceptorChain();
			return chain.beforeSendToServer().catch(err => expect(err).toBeDefined());
		});
	});
});
