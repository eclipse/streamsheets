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
const ToitProviderConfiguration = require('./ToitProviderConfiguration');

module.exports = class ToitConsumerConfiguration extends sdk.ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new ToitProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration(
			{
				name: 'Toit Connector',
				...config.connector
			},
			providerConfiguration
		);
		super(
			{
				name: 'Toit Consumer',
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
