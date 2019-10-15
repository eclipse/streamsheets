const sdk = require('@cedalo/sdk-streams');
const MqttProviderConfiguration = require('./MqttProviderConfiguration');

module.exports = class MqttConsumerConfiguration extends sdk.ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new MqttProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration(
			{
				name: 'Mqtt Connector',
				...config.connector
			},
			providerConfiguration
		);
		super(
			{
				name: 'Mqtt Consumer',
				...config
			},
			connectorConfiguration,
			providerConfiguration
		);
	}

	validate(value) {
		// TODO: extend
		return super.validate(value);
	}
};
