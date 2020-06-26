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
const { ConsumerConfiguration, ConnectorConfiguration } = require('@cedalo/sdk-streams');
const KafkaProviderConfiguration = require('./KafkaProviderConfiguration');

module.exports = class KafkaConsumerConfiguration extends ConsumerConfiguration {

	constructor(config) {
		const connectorConfig = (config && config.connector) ? { ...config.connector } : {};
		const consumerConfig = (config) ? { ...config } : {};
		const providerConfiguration = new KafkaProviderConfiguration();
		const connectorConfiguration = new ConnectorConfiguration(connectorConfig, providerConfiguration);
		super(consumerConfig, connectorConfiguration, providerConfiguration);
	}

};
