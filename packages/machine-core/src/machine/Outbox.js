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
const { clone } = require('@cedalo/commons');
const Message = require('./Message');
const TTLMessageBox = require('./TTLMessageBox');

const cloneData = (data) => clone(data) || data;

const getMessage = (id, outbox, ttl) => {
	let msg = outbox.peek(id);
	if (!msg) {
		msg = new Message({}, id);
		outbox.put(msg, undefined, ttl);
	}
	return msg;
};
const DEF_CONF = {
	// max: 100, // -1, to signal no bounds...
	max: -1, // -1, to signal no bounds...
	reverse: true,
	type: 'Outbox'
};

/**
 * @type {module.Outbox}
 */
class Outbox extends TTLMessageBox {
	constructor(cfg = {}) {
		cfg = Object.assign({}, DEF_CONF, cfg);
		super(cfg);
	}

	getFirstMessages(n = 100) {
		return super.getFirstMessages(n);
	}

	setMessageMetadata(msgOrId, newdata, ttl) {
		const oldmsg = typeof msgOrId === 'object' ? msgOrId : getMessage(msgOrId, this, ttl);
		const newmsg = new Message({}, oldmsg.id);
		Object.assign(newmsg.metadata, cloneData(newdata));
		// combine data
		Object.assign(newmsg.data, cloneData(oldmsg.data));
		// combine or replace metadata
		if (!Array.isArray(oldmsg.metadata) && !Array.isArray(newmsg.metadata)) {
			Object.assign(newmsg.metadata, Object.assign({}, cloneData(oldmsg.metadata), newmsg.metadata));
		}
		this.replaceMessage(newmsg, ttl);
	}

	setMessageData(msgOrId, newdata, ttl) {
		const oldmsg = typeof msgOrId === 'object' ? msgOrId : getMessage(msgOrId, this, ttl);
		const newmsg = new Message(newdata, oldmsg.id);
		// combine metadata
		Object.assign(newmsg.metadata, cloneData(oldmsg.metadata));
		// combine or replace data
		if (!Array.isArray(oldmsg.data) && !Array.isArray(newmsg.data)) {
			Object.assign(newmsg.data, Object.assign({}, cloneData(oldmsg.data), newmsg.data));
		}
		this.replaceMessage(newmsg, ttl);
	}
}
module.exports = Outbox;
