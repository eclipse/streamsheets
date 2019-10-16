const sdk = require('@cedalo/sdk-streams');
const PopConsumer = require('./PopConsumer');
const PopProviderConfiguration = require('./PopProviderConfiguration');

module.exports = class PopProvider extends sdk.Provider {
	constructor() {
		super(new PopProviderConfiguration());
	}

	get Consumer() {
		return PopConsumer;
	}

	get canProduce() {
		return false;
	}
};
