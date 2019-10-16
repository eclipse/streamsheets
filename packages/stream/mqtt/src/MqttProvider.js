const sdk = require('@cedalo/sdk-streams');
const MqttConsumer = require('./MqttConsumer');
const MqttProducer = require('./MqttProducer');
const MqttProviderConfiguration = require('./MqttProviderConfiguration');

module.exports = class MqttProvider extends sdk.Provider {
	constructor() {
		super(new MqttProviderConfiguration());
	}

	get Consumer() {
		return MqttConsumer;
	}

	get Producer() {
		return MqttProducer;
	}
};
