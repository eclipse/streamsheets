// currently a singleton => one for all used Streams
const logger = require('../logger').create({ name: 'StreamMessagingClient' });
const MessagingClient = require('../messaging/Client');
const StreamRequestHandler = require('./StreamRequestHandler');
const { createAndConnect } = require('@cedalo/messaging-client');


const DEF_OPTS = {
	timeout: 20000
};

class StreamMessagingClient extends MessagingClient {
	constructor() {
		super(logger);
		Object.defineProperties(this, {
			reqhandler: { value:  new StreamRequestHandler(this) }
		});
	}

	dispose() {
		super.dispose();
		this.reqhandler.dispose();
	}

	subscribe(topic) {
		this.client.subscribe(topic);
	}

	unsubscribe(topic) {
		this.client.unsubscribe(topic);
	}

	publish(topic, message) {
		this.client.publish(topic, message);
	}

	request(topic, message, timeout = DEF_OPTS.timeout) {
		return this.reqhandler.request(message, timeout, () => {
			this.client.publish(topic, message);
		});
	}
}

// SINGLETON
const create = () => {
	const dsclient = new StreamMessagingClient();
	createAndConnect()
		.then((client) => {
			dsclient.client = client;
		})
		.catch(err => logger.error(err));
	return dsclient;
};
module.exports = Object.freeze(create());
