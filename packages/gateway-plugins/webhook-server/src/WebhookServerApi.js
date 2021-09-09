const IdGenerator = require('@cedalo/id-generator');
const { PLUGIN_ID, getWebhookServer, getWebhookPath } = require('./WebhookServer');

const WebhookServerApi = {
	updateWebhookServer: async ({ api, auth, machineServiceProxy, machineRepo }, scope, id, webhookServerUpdate) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return;
		}
		const existingMachine = await api.machine.findMachine(scope, id);
		if (existingMachine) {
			const existingwebhookServer = getWebhookServer(existingMachine, false) || {
				id: IdGenerator.generate(),
				enabled: false
			};
			const webhookServer = { ...existingwebhookServer, ...webhookServerUpdate };
			if (!webhookServer.streamsheetId) {
				webhookServer.streamsheetId = existingMachine.streamsheets[0].id;
			}
			try {
				await machineServiceProxy.updateExtensionSettings(id, PLUGIN_ID, webhookServer);
			} catch (e) {
				if (e.error && e.error.message.startWith('No machine')) {
					await machineRepo.updateWebhookServer(id, webhookServer);
				}
			}
		}
	},
	getWebhookServer: async ({ api, auth }, scope, id) => {
		const validScope = auth.isValidScope(scope);
		if (!validScope) {
			return null;
		}
		const machine = await api.machine.findMachine(scope, id);
		return { ...getWebhookServer(machine), path: getWebhookPath(machine) };
	}
};

module.exports = {
	WebhookServerApi
};
