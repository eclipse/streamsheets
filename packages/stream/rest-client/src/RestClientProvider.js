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
const RestClientProducer = require('./RestClientProducer');
const RestClientProviderConfiguration = require('./RestClientProviderConfiguration');

module.exports = class RestClientProvider extends sdk.Provider {
	constructor(config) {
		super(new RestClientProviderConfiguration(config));
	}

	get canConsume() {
		return false;
	}

	get Producer() {
		return RestClientProducer;
	}
};
