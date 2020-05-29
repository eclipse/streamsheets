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
const sdk = require('@cedalo/sdk-streams');
const MqttProviderConfiguration = require('./MqttProviderConfiguration');

module.exports = class MqttConsumerConfiguration extends sdk.ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new MqttProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration(
			{
				name: 'Mqtt Connector',
				...config.connector
			},
			providerConfiguration
		);
		super(
			{
				name: 'Mqtt Consumer',
				...config
			},
			connectorConfiguration,
			providerConfiguration
		);
	}

	validate(value) {
		// TODO: extend
		return super.validate(value);
	}
};
