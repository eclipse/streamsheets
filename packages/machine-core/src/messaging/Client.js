const LoggerClient = require('./LoggerClient');


const switchClient = (oldclient, newclient) => {
	if (oldclient.subscriptions) {
		oldclient.subscriptions.forEach((handler, topic) => newclient.subscribe(topic, handler));
		oldclient.subscriptions.clear();
	}
	if(oldclient.listeners) {
		oldclient.listeners.forEach((listeners, event) => listeners.forEach(listener => newclient.on(event, listener)));
		oldclient.listeners.clear();
	}
};


class Client {

	constructor(withLogger) {
		Object.defineProperties(this, {
			messaging: { value: { client: new LoggerClient(withLogger) } }
		});
	}
	
	get client() {
		return this.messaging.client;
	}

	set client(client) {
		const oldclient = this.client;
		this.messaging.client = client;
		switchClient(oldclient, client);
	}

	dispose() {
		const client = this.client;
		client.end();
	}


	on(event, callback) {
		this.client.on(event, callback);
	}

	off(event, callback) {
		this.client.off(event, callback);
	}

	subscribe(topics, handler) {
		this.client.subscribe(topics, handler);
	}

	unsubscribe(topics, handler) {
		this.client.unsubscribe(topics, handler);
	}
}

module.exports = Client;
