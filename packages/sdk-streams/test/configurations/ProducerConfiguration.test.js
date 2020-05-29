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
const ProducerConfiguration = require('../../src/configurations/ProducerConfiguration');
const configs = require('../configs');

describe('producerAPI#ProducerConfiguration', () => {
	it('should create a Producer configuration from json', () => {
		const providerConfig = configs.find(c => c._id === 'REST_PROVIDER');
		const providerConfiguration = new ProviderConfiguration(providerConfig);
		const connectorConfig = configs.find(c => c._id === 'REST_CONNECTOR');
		const connectorConfiguration = new ConnectorConfiguration(connectorConfig, providerConfiguration);
		const producerConfig = configs.find(c => c.id === 'REST_PRODUCER', connectorConfiguration);
		const producerConfiguration =
				new ProducerConfiguration(producerConfig, connectorConfiguration, providerConfiguration);
		expect(producerConfiguration).toBeDefined();
		expect(producerConfiguration.toJSON()._id).toEqual(producerConfig._id);
		expect(producerConfiguration.toJSON().id).toEqual(producerConfig.id);
		expect(producerConfiguration.connector.provider.definition.connector.length).toEqual(4);
		expect(producerConfiguration.isValid()).toBeTruthy();
	});
});
