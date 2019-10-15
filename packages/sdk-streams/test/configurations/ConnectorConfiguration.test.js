const ProviderConfiguration = require('../../src/configurations/ProviderConfiguration');
const ConnectorConfiguration = require('../../src/configurations/ConnectorConfiguration');
const configs = require('../configs');

describe('Stream API#ConnectorConfiguration', () => {
	it('should create a Connector configuration from json', () => {
		const providerConfig = configs.find(c => c._id === 'REST_PROVIDER');
		const providerConfiguration = new ProviderConfiguration(providerConfig);
		const connectorConfig = configs.find(c => c._id === 'REST_CONNECTOR');
		const connectorConfiguration = new ConnectorConfiguration(connectorConfig, providerConfiguration);
		expect(connectorConfiguration).toBeDefined();
		expect(connectorConfiguration.toJSON()._id).toEqual(connectorConfig._id);
		expect(connectorConfiguration.toJSON().id).toEqual(connectorConfig.id);
		expect(connectorConfiguration.toJSON()).toEqual({ ...connectorConfig, password: '' });
		expect(connectorConfiguration.provider.definition.connector.length).toEqual(4);
		expect(connectorConfiguration.isValid()).toBeTruthy();
	});
});
