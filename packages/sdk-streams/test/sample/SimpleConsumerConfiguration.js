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
const sdk = require('../..');
const SimpleProviderConfiguration = require('./SimpleProviderConfiguration');

module.exports = class SimpleConsumerConfiguration extends sdk.ConsumerConfiguration {

	constructor() {
		const providerConfiguration = new SimpleProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration({
			name: 'Simple Connector',
			baseTopic: 'topic'
		}, providerConfiguration);
		super({
			name: 'Simple Consumer',
			topics: '1,2'
		}, connectorConfiguration, providerConfiguration);
	}

};
