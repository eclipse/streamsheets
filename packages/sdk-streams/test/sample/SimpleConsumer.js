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
const SimpleSource = require('./SimpleSource');

module.exports = class SimpleConsumer extends sdk.Consumer {

	constructor(consumerConfig) {
		super(consumerConfig);
		const baseTopic = consumerConfig.baseTopic;
		const topics = consumerConfig.topics;
		this.topics = topics.map(t => baseTopic + t);
		this.duration = consumerConfig.connector.duration;
	}

	async connect() {
		this.setConnected();
		return true;
	}

	async initialize() {
		SimpleSource.subscribe((message, topic) => {
			this.onMessage(topic, message);
		});
		return true;
	}

};
