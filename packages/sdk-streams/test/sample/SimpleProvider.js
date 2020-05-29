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
const SimpleConsumer = require('./SimpleConsumer');
const SimpleProducer = require('./SimpleProducer');
const SimpleProviderConfiguration = require('./SimpleProviderConfiguration');

module.exports = class SimpleProvider extends sdk.Provider {

	constructor() {
		super(new SimpleProviderConfiguration());
	}

	get Consumer() {
		return SimpleConsumer;
	}

	get Producer() {
		return SimpleProducer;
	}

	async beforeProvide(streamConfig) {
		streamConfig.baseTopic = 'hello';
		return streamConfig;
	}

	async afterProvide(stream) {
		stream.name = 'New';
		return stream;
	}

};
