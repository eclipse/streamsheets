const sdk = require('../..');
const SimpleConsumer = require('./SimpleConsumer');
const SimpleProducer = require('./SimpleProducer');
const SimpleProviderConfiguration = require('./SimpleProviderConfiguration');

module.exports = class SimpleProvider extends sdk.Provider {

	constructor() {
		super(new SimpleProviderConfiguration());
	}

	get Consumer() {
		return SimpleConsumer;
	}

	get Producer() {
		return SimpleProducer;
	}

	async beforeProvide(streamConfig) {
		streamConfig.baseTopic = 'hello';
		return streamConfig;
	}

	async afterProvide(stream) {
		stream.name = 'New';
		return stream;
	}

};
