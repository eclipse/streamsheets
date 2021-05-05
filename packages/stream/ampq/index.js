const AMPQProvider = require('./src/AMPQProvider');
const AMPQProviderConfiguration = require('./src/AMPQProviderConfiguration');
const AMPQConsumer = require('./src/AMPQConsumer');
const AMPQConsumerConfiguration = require('./src/AMPQConsumerConfiguration');

module.exports = {
	Provider: AMPQProvider,
	AMPQConsumer,
	AMPQConsumerConfiguration,
	AMPQProviderConfiguration
};
