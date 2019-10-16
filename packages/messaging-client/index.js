const BaseMessagingClient = require('./src/BaseMessagingClient');
const MessagingClient = require('./src/MQTTMessagingClient');

const createAndConnect = async (conf) => {
	const messagingClient = new MessagingClient();
	const defConfig = {
		url: process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883',
		username: process.env.MESSAGE_BROKER_USERNAME || null,
		password: process.env.MESSAGE_BROKER_PASSWORD || null
	};
	const config = Object.assign({}, defConfig, conf);
	await messagingClient.connect(config.url, {
		username: config.username || null,
		password: config.password || null
	});
	return messagingClient;
};

module.exports = {
	BaseMessagingClient,
	MessagingClient,
	createAndConnect
};
