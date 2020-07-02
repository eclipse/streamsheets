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
	// max: 100, // -1, to signal no bounds...
	max: -1, // -1, to signal no bounds...
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
		const oldmsg = typeof msgOrId === 'object' ? msgOrId : this.peek(msgOrId, true);
		const newmsg = new Message(newdata, oldmsg.id);
		// combine metadata
		Object.assign(newmsg.metadata, oldmsg.metadata);
		// combine or replace data
		if (!Array.isArray(oldmsg.data) && !Array.isArray(newmsg.data)) {
			Object.assign(newmsg.data, Object.assign({}, oldmsg.data, newmsg.data));
		}
		this.replaceMessage(newmsg);
	}
}
module.exports = Outbox;
