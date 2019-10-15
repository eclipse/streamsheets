const LocalClient = require('./LocalClient');

module.exports = class LocalConsumerHandler {
	constructor(consumer, encoding) {
		this.consumer = consumer;
		this.encoding = encoding;
	}

	async connect() {
		this._client = new LocalClient(this.encoding);
	}

	async dispose() {
		this._client = null;
	}
};
