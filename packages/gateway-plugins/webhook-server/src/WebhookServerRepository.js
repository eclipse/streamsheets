// const { InputError } = require('@cedalo/gateway/out/src/errors');
const { PLUGIN_ID } = require('./WebhookServer');

const WebhookServerRepository = {
	async updateWebhookServer(id, webhookServer) {
		// throw InputError.invalid('Invalid WebhookServer Update', errors);
		const result = await this.db
			.collection(this.collection)
			.updateOne({ _id: id }, { $set: { [`extensionSettings.${PLUGIN_ID}`]: webhookServer } });
		return result;
	}
};

module.exports = {
	WebhookServerRepository
};
