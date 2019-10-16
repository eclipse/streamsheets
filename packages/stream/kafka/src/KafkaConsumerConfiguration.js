const { ConsumerConfiguration, ConnectorConfiguration } = require('@cedalo/sdk-streams');
const KafkaProviderConfiguration = require('./KafkaProviderConfiguration');

module.exports = class KafkaConsumerConfiguration extends ConsumerConfiguration {

	constructor(config) {
		const connectorConfig = (config && config.connector) ? { ...config.connector } : {};
		const consumerConfig = (config) ? { ...config } : {};
		const providerConfiguration = new KafkaProviderConfiguration();
		const connectorConfiguration = new ConnectorConfiguration(connectorConfig, providerConfiguration);
		super(consumerConfig, connectorConfiguration, providerConfiguration);
	}

};
