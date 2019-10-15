const { Provider } = require('@cedalo/sdk-streams');
const KafkaConsumer = require('./KafkaConsumer');
const KafkaProducer = require('./KafkaProducer');
const KafkaProviderConfiguration = require('./KafkaProviderConfiguration');

module.exports = class KafkaProvider extends Provider {
	constructor(config) {
		super(new KafkaProviderConfiguration(config));
	}

	get Consumer() {
		return KafkaConsumer;
	}

	get Producer() {
		return KafkaProducer;
	}
};
