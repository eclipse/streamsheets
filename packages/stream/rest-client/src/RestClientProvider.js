const sdk = require('@cedalo/sdk-streams');
const RestClientProducer = require('./RestClientProducer');
const RestClientProviderConfiguration = require('./RestClientProviderConfiguration');

module.exports = class RestClientProvider extends sdk.Provider {
	constructor(config) {
		super(new RestClientProviderConfiguration(config));
	}

	get canConsume() {
		return false;
	}

	get Producer() {
		return RestClientProducer;
	}
};
