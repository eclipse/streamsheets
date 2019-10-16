const Message = require('./Message');

class RequestResponse {
	constructor(message, requestId) {
		if (message) {
			if (message instanceof Message) {
				this.message = message;
			} else {
				try {
					this.message = Message.fromJSON(message);
				} catch (e) {
					throw Error(`Invalid RequestResponse: ${e.message}`);
				}
			}
		}
		this.requestId = requestId;
	}

	toJSON() {
		const response = this.message && typeof this.message.toJSON === 'function' ? this.message.toJSON() : {};
		return {
			type: 'response',
			response,
			requestId: this.requestId
		};
	}
}

module.exports = RequestResponse;
