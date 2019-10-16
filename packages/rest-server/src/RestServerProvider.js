const sdk = require('@cedalo/sdk-streams');
const RestServerConsumer = require('./RestServerConsumer');
const RestServerProviderConfiguration = require('./RestServerProviderConfiguration');

module.exports = class RestServerProvider extends sdk.Provider {
	constructor(config) {
		super(new RestServerProviderConfiguration(config));
	}

	get Consumer() {
		return RestServerConsumer;
	}

	get canProduce() {
		return false;
	}
};
