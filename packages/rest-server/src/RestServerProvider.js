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
const RestServerConsumer = require('./RestServerConsumer');
const RestServerProviderConfiguration = require('./RestServerProviderConfiguration');

module.exports = class RestServerProvider extends sdk.Provider {
	constructor(config) {
		super(new RestServerProviderConfiguration(config));
	}

	get Consumer() {
		return RestServerConsumer;
	}

	get canProduce() {
		return false;
	}
};
