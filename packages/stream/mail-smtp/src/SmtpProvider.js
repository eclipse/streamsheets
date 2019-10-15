const sdk = require('@cedalo/sdk-streams');
const SmtpProducer = require('./SmtpProducer');
const SmtpProviderConfiguration = require('./SmtpProviderConfiguration');

module.exports = class SmtpProvider extends sdk.Provider {
	constructor() {
		super(new SmtpProviderConfiguration());
	}

	get canConsume() {
		return false;
	}

	get Producer() {
		return SmtpProducer;
	}
};
