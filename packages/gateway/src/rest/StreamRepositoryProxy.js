const { MessagingRequestHelper } = require('@cedalo/service-core');
const { MessagingClient } = require('@cedalo/messaging-client');
const { SERVICES_STREAMS_INPUT, SERVICES_STREAMS_EVENTS } = require('@cedalo/protocols').Topics;
const { STREAMS_CONFIG_LOAD_ALL } = require('@cedalo/protocols').StreamsMessagingProtocol.MESSAGE_TYPES;
const IdGenerator = require('@cedalo/id-generator');

class StreamRepositoryProxy {
	constructor() {
		this.messagingClient = new MessagingClient();
		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
		this.messagingClient.subscribe(`${SERVICES_STREAMS_EVENTS}/#`);
		this.requestHelper = new MessagingRequestHelper(this.messagingClient);
	}

	async findAllStreams(session) {
		const message = {
			requestId: IdGenerator.generateUUID(),
			session,
			type: STREAMS_CONFIG_LOAD_ALL
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return Array.isArray(result.streams) ? result.streams : [];
	}
}

module.exports = StreamRepositoryProxy;
