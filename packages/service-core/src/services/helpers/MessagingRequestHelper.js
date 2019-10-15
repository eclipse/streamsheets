const uuid = require('uuid/v1');
const { LoggerFactory } = require('@cedalo/logger');

const logger = LoggerFactory.createLogger(
	'MessagingRequestHelper',
	process.env.STREAMSHEETS_LOG_LEVEL
);
class MessagingRequestHelper {
	constructor(messagingClient) {
		this.messagingClient = messagingClient;
		this.messagingClient.on("message", (topic, msg_) => {
			try {
				const msg = JSON.parse(msg_.toString());
				if (msg.type === 'response' && msg.requestId && this.hasRequest(msg)) {
					this.resolveRequest(msg);
				}
			} catch (e) {
				logger.warn(e);
			}
		});
		this.requests = new Map();
	}

	async doRequestMessage(request = {message: {}, topic: ''}) {
		request.message.requestId = request.message.requestId || uuid();
		this.messagingClient.publish(request.topic, request.message);
		return this.awaitRequest(request.message);
	}

	hasRequest({ requestId }) {
		return this.requests.has(requestId);
	}

	resolveRequest(message) {
		const promise = this.requests.get(message.requestId);
		if (promise) {
			promise.resolve(message.response);
		}
	}

	async awaitRequest({ requestId }) {
		return new Promise((resolve, reject) =>
			this.requests.set(requestId, { resolve, reject })
		);
	}
}

module.exports = MessagingRequestHelper;
