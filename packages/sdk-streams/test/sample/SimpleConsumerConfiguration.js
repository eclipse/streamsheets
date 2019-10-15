const sdk = require('../..');
const SimpleProviderConfiguration = require('./SimpleProviderConfiguration');

module.exports = class SimpleConsumerConfiguration extends sdk.ConsumerConfiguration {

	constructor() {
		const providerConfiguration = new SimpleProviderConfiguration();
		const connectorConfiguration = new sdk.ConnectorConfiguration({
			name: 'Simple Connector',
			baseTopic: 'topic'
		}, providerConfiguration);
		super({
			name: 'Simple Consumer',
			topics: '1,2'
		}, connectorConfiguration, providerConfiguration);
	}

};
