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
const MongoDBProviderConfiguration = require('./MongoDBProviderConfiguration');

module.exports = class MongoDBConsumerConfiguration extends ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new MongoDBProviderConfiguration();
		config = config || {};
		const connectorConfiguration = new ConnectorConfiguration({
			...config.connector
		}, providerConfiguration);
		super({
			...config
		}, connectorConfiguration, providerConfiguration);
	}
};
