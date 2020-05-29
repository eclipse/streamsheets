/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
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
		if (Array.isArray(newdata)) {
			// create new message with an array as data and replace old one:
			const msg = new Message(newdata, message.id);
			Object.assign(msg.metadata, message.metadata);
			this._replaceMessageWith(msg);
		} else {
			Object.assign(message.data, newdata);
		}
		// check if newdata != data before sending event...
		this._emitter.emit('message_changed', message);
	}
	_replaceMessageWith(newMessage) {
		this.messages.some((msg, index) => {
			const foundIt = msg.id === newMessage.id;
			if (foundIt) this.messages[index] = newMessage;
			return foundIt;
		});
	}
}
module.exports = Outbox;
