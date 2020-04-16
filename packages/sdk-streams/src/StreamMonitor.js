/* eslint-disable no-console */

const { EVENTS } = require('./Consumer');

module.exports = class StreamMonitor {
	constructor(consumer) {
		this.consumer = consumer;
		this.consumer.on(EVENTS.MESSAGE, this.onMessage.bind(this));
		this.consumer.on(EVENTS.READY, this.onReady.bind(this));
		this.consumer.on(EVENTS.CONNECT, this.onConnect.bind(this));
		this.consumer.on(EVENTS.ERROR, this.onError.bind(this));
		this.consumer.on(EVENTS.DISPOSED, this.onDisposed().bind(this));
		this.consumer.on(EVENTS.TEST, this.onTest.bind(this));
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

	onTest(/* config */) {
		console.log(`${this.consumer.id} onTest()`);
	}

	onError(/* errorOrError */) {
		console.log(`${this.consumer.id} onError()`);
	}

	onReady() {
		console.log(`${this.consumer.id} onReady()`);
	}

	onConnect() {
		console.log(`${this.consumer.id} onConnect()`);
	}

	onDisposed() {
		console.log(`${this.consumer.id} onDisposed()`);
	}
};
