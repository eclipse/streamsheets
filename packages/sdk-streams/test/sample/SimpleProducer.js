const sdk = require('../..');
const SimpleSource = require('./SimpleSource');

module.exports = class SimpleProducer extends sdk.Producer {

	constructor(config) {
		super(config);
		const baseTopic = config.baseTopic;
		const topics = config.topics;
		this.topics = topics.map(t => baseTopic + t);
		this.duration = config.connector.duration;
	}

	async connect() {
		this.setConnected();
		return true;
	}

	async initialize() {
		return true;
	}

	async produce(config) {
		const { payload } = config;
		SimpleSource.publishMessage(this.topics[0], payload);
	}

	async request(config) {
		const {
			metadata: {
				topic,
				method
			},
			data
		} = config;
		return new Promise((resolve, reject) => {
			if (method === 'GET') {
				SimpleSource.subscribe((msg, topic_) => {
					// this.onMessage(topic_, msg);
					resolve(msg);
				}, topic);
			}
			if (method === 'POST') {
				SimpleSource.publishMessage(topic, {
					...data,
					requestId: 0
				});
			}
		});


	}

	async test() {
		return true;
	}

};
