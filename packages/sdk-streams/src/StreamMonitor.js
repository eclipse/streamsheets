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
/* eslint-disable no-console */

const { EVENTS } = require('./Consumer');

module.exports = class StreamMonitor {
	constructor(consumer) {
		this.consumer = consumer;
		this.consumer.on(EVENTS.MESSAGE, this.onMessage.bind(this));
		this.consumer.on(EVENTS.CONNECT, this.onConnect.bind(this));
		this.consumer.on(EVENTS.ERROR, this.onError.bind(this));
		this.consumer.on(EVENTS.DISPOSED, this.onDisposed().bind(this));
		this.consumer.on(EVENTS.PRODUCE, this.onProduce.bind(this));
		this.consumer.on(EVENTS.REQUEST, this.onRequest.bind(this));
		this.consumer.on(EVENTS.RESPOND, this.onRespond.bind(this));
	}

	onMessage(/* topic, message */) {
		console.log(`${this.consumer.id} onMessage()`);
	}

	onProduce(/* config */) {
		console.log(`${this.consumer.id} onProduce()`);
	}

	onRequest(/* config */) {
		console.log(`${this.consumer.id} onRequest()`);
	}

	onRespond(/* config */) {
		console.log(`${this.consumer.id} onRespond()`);
	}

	onError(/* errorOrError */) {
		console.log(`${this.consumer.id} onError()`);
	}

	onConnect() {
		console.log(`${this.consumer.id} onConnect()`);
	}

	onDisposed() {
		console.log(`${this.consumer.id} onDisposed()`);
	}
};
