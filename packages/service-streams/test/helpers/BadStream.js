/* eslint-disable */
const sdk = require('@cedalo/sdk-streams');

module.exports = class BadStream extends sdk.Consumer {

	constructor(consumerConfig) {
		super(consumerConfig);
	}

	async connect() {
		setTimeout(() => {
			throw new Error();
		}, 200);
		this.setConnected();
	}

	async initialize() {
	}

	async publish(config) {

	}

	async request(config) {

	}

};
