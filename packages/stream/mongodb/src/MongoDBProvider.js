const { Provider } = require('@cedalo/sdk-streams');
const MongoDBConsumer = require('./MongoDBConsumer');
const MongoDBProducer = require('./MongoDBProducer');
const MongoDBProviderConfiguration = require('./MongoDBProviderConfiguration');

module.exports = class MongoDBProvider extends Provider {
	constructor(config) {
		super(new MongoDBProviderConfiguration(config));
	}

	get Consumer() {
		return MongoDBConsumer;
	}

	get Producer() {
		return MongoDBProducer;
	}
};
