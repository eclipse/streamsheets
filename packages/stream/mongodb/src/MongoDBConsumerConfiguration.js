const { ConsumerConfiguration, ConnectorConfiguration } = require('@cedalo/sdk-streams');
const MongoDBProviderConfiguration = require('./MongoDBProviderConfiguration');

module.exports = class MongoDBConsumerConfiguration extends ConsumerConfiguration {
	constructor(config) {
		const providerConfiguration = new MongoDBProviderConfiguration();
		config = config || {};
		const connectorConfiguration = new ConnectorConfiguration({
			...config.connector
		}, providerConfiguration);
		super({
			...config
		}, connectorConfiguration, providerConfiguration);
	}
};
