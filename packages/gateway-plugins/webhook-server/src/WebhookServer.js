const PLUGIN_ID = 'webhook_server';
const BASE_PATH = '/webhook';
const getExtensionSettings = (machine, extensionId) =>
	machine && machine.extensionSettings && machine.extensionSettings[extensionId]
		? machine.extensionSettings[extensionId]
		: null;

const getWebhookServer = (machine, defaultIfNull = true) => {
	const defaultValue = defaultIfNull ? { enabled: false } : null;
	return getExtensionSettings(machine, PLUGIN_ID) || defaultValue;
};

const getWebhookPath = (machine) => {
	const { enabled, id } = getWebhookServer(machine);
	return enabled ? `${BASE_PATH}/${id}` : null;
};

module.exports = {
	PLUGIN_ID,
	BASE_PATH,
	getWebhookServer,
	getWebhookPath
};
