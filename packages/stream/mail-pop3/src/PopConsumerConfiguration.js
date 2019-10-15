const sdk = require('@cedalo/sdk-streams');
const PopProviderConfiguration = require('./PopProviderConfiguration');

module.exports = class PopConsumerConfiguration extends sdk.ConsumerConfiguration {

	constructor(config) {
		const providerConfiguration = new PopProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration({
			name: 'POP3 Connector',
			...config.connector
		}, providerConfiguration);
		super({
			name: 'POP3 Consumer',
			...config
		}, connectorConfiguration, providerConfiguration);
	}

	validate(value) {
		// TODO: extend
		return super.validate(value);
	}

};
