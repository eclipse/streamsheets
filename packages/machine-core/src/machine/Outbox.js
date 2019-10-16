const Message = require('./Message');
const MessageBox = require('./MessageBox');

const DEF_CONF = {
	max: 100, // -1, to signal no bounds...
	type: 'Outbox'
};

/**
 * @type {module.Outbox}
 */
class Outbox extends MessageBox {
	constructor(cfg = {}) {
		cfg = Object.assign({}, DEF_CONF, cfg);
		super(cfg);
	}

	peek(id, create) {
		let message = super.peek(id);
		if (!message && create) {
			message = new Message({}, id);
			this.put(message);
		}
		return message;
	}

	setMessageData(msgOrId, newdata) {
		const message = typeof msgOrId === 'object' ? msgOrId : this.peek(msgOrId, true);
		Object.assign(message.data, newdata);
		// check if newdata != data before sending event...
		this._emitter.emit('message_changed', message);
	}
}
module.exports = Outbox;
