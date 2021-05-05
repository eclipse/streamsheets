const sdk = require('@cedalo/sdk-streams');
const AMPQProviderConfiguration = require('./AMPQProviderConfiguration');

module.exports = class MqttConsumerConfiguration extends sdk.ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new AMPQProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration(
			{
				name: 'AMPQ Connector',
				...config.connector
			},
			providerConfiguration
		);
		super(
			{
				name: 'AMPQ Consumer',
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
