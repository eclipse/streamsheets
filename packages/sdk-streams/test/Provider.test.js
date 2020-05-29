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
const ProviderConfiguration = require('../src/configurations/ProviderConfiguration');
const Provider = require('../src/Provider');
const SimpleProvider = require('./sample/SimpleProvider');
const SimpleConsumerConfiguration = require('./sample/SimpleConsumerConfiguration');

const configs = require('./configs');

const simpleConfig = {
	name: 'Simple Consumer',
	baseTopic: 'topic',
	topics: '1,2',
	connector: {
		name: 'Simple Connector',
		duration: 4000,
		provider: {
			name: 'Simple Provider'
		}
	}
};

describe('Provider', () => {
	it('should create a new Provider from a configuration', () => {
		const config = new ProviderConfiguration({
			name: 'Test config'
		});
		const provider = new Provider(config);
		expect(provider).toBeDefined();
	});
	it('should create a new SimpleProvider from an extended class', () => {
		const provider = new SimpleProvider();
		// console.log(JSON.stringify(provider, null, 3));
		expect(provider).toBeDefined();
	});
	it('should create a new SimpleProvider and provide a simple consumer with before and after hooks', async () => {
		const provider = new SimpleProvider();
		const config = new SimpleConsumerConfiguration();
		// console.log(JSON.stringify(config, null, 2));
		const consumer = await provider.provide(config);
		expect(consumer).toBeDefined();
		expect(consumer.name).toEqual('Simple Consumer');
		expect(consumer.config.baseTopic).toEqual('hello');
	});

	it('should emit error', async () => {
		const provider = new SimpleProvider();
		provider.on(SimpleProvider.EVENTS.ERROR, (error) => {
			expect(error).toBeDefined();
		});
		return  expect(provider.provide()).rejects.toHaveProperty('message','Error: No Stream config');
	});
});
