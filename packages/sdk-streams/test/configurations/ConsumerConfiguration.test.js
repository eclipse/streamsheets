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
const ConnectorConfiguration = require('../../src/configurations/ConnectorConfiguration');
const ConsumerConfiguration = require('../../src/configurations/ConsumerConfiguration');
const configs = require('../configs');

describe('Stream API#ConsumerConfiguration', () => {
	it('should create a Consumer configuration from json', () => {
		const providerConfig = configs.find(c => c._id === 'REST_PROVIDER');
		const providerConfiguration = new ProviderConfiguration(providerConfig);
		const connectorConfig = configs.find(c => c._id === 'REST_CONNECTOR');
		const connectorConfiguration = new ConnectorConfiguration(connectorConfig, providerConfiguration);
		const consumerConfig = configs.find(c => c.id === 'REST_CONSUMER', connectorConfiguration);
		const consumerConfiguration =
				new ConsumerConfiguration(consumerConfig, connectorConfiguration, providerConfiguration);
		expect(consumerConfiguration).toBeDefined();
		expect(consumerConfiguration.toJSON()._id).toEqual(consumerConfig._id);
		expect(consumerConfiguration.toJSON().id).toEqual(consumerConfig.id);
		expect(consumerConfiguration.connector.provider.definition.connector.length).toEqual(4);
		expect(consumerConfiguration.isValid()).toBeTruthy();
	});
});
