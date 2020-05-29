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
const ProviderConfiguration = require('../../src/configurations/ProviderConfiguration');
const ProviderFieldDefinition = require('../../src/configurations/Field');
const configs = require('../configs');

describe('Stream API#Provider', () => {
	it('should create a new Provider configuration', () => {
		const config = new ProviderConfiguration({
			name: 'Test config'
		});
		expect(config).toBeDefined();
		expect(config.toJSON()._id).toBeDefined();
		expect(config.toJSON().id).toBeDefined();
	});
	it('should create a Provider configuration from json', () => {
		const json = configs.find(c => c._id === 'REST_PROVIDER');
		const config = new ProviderConfiguration(json);
		expect(config).toBeDefined();
		expect(config.toJSON()._id).toEqual(json._id);
		expect(config.toJSON().id).toEqual(json.id);
		expect(config.definition.connector.length).toEqual(4);
		expect(config.definition.connector[0]).toBeInstanceOf(ProviderFieldDefinition);
		expect(config.isValid()).toBeTruthy();
		const res = config.toJSON();
		expect(res.id).toEqual('REST_PROVIDER');
		expect(res.definition.connector.length).toEqual(4);
		expect(res.definition.consumer.length).toEqual(1);
		expect(res.definition.producer.length).toEqual(3);
	});
});
