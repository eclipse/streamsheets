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
const { Provider } = require('@cedalo/sdk-streams');
const KafkaConsumer = require('./KafkaConsumer');
const KafkaProducer = require('./KafkaProducer');
const KafkaProviderConfiguration = require('./KafkaProviderConfiguration');

module.exports = class KafkaProvider extends Provider {
	constructor(config) {
		super(new KafkaProviderConfiguration(config));
	}

	get Consumer() {
		return KafkaConsumer;
	}

	get Producer() {
		return KafkaProducer;
	}
};
