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
