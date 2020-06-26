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
const PopProviderConfiguration = require('./PopProviderConfiguration');

module.exports = class PopConsumerConfiguration extends sdk.ConsumerConfiguration {

	constructor(config) {
		const providerConfiguration = new PopProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration({
			name: 'POP3 Connector',
			...config.connector
		}, providerConfiguration);
		super({
			name: 'POP3 Consumer',
			...config
		}, connectorConfiguration, providerConfiguration);
	}

	validate(value) {
		// TODO: extend
		return super.validate(value);
	}

};
