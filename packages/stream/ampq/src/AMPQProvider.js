const sdk = require('@cedalo/sdk-streams');
const AMPQConsumer = require('./AMPQConsumer');
const AMPQProducer = require('./AMPQProducer');
const AMPQProviderConfiguration = require('./AMPQProviderConfiguration');

module.exports = class AMPQProvider extends sdk.Provider {
	constructor() {
		super(new AMPQProviderConfiguration());
	}

	get Consumer() {
		return AMPQConsumer;
	}

	get Producer() {
		return AMPQProducer;
	}
};
