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
const Outbox = require('./Outbox');
const MessageStore = require('../storage/MessageStore');

const isExpired = (message) => message.metadata.expire && message.metadata.expire < Date.now();
const getExpireTTL = (message) => message.metadata.expire ? message.metadata.expire - Date.now() : -1;
const setExpireTTL = (message, ttl) => {
	if (ttl > 0) message.metadata.expire = Date.now() + ttl;
	return message;
};

/**
 * @type {module.PersistentOutbox}
 */
class PersistentOutbox extends Outbox {
	constructor(cfg = {}) {
		super(cfg);
		this.store = new MessageStore();
	}

	async load(conf, machine) {
		// ensure outbox contains only messages from storage
		super.clear();
		await this.store.open(machine.id);
		const messages = await this.store.getAll();
		messages.forEach((message) => (isExpired(message) ? this.store.remove(message) : this.put(message)));
	}

	async dispose() {
		return this.store.close();
	}

	clear() {
		super.clear();
		this.store.removeAll();
	}

	put(message, force, ttl) {
		if (ttl == null) ttl = getExpireTTL(message);
		const didIt = super.put(setExpireTTL(message, ttl), force, ttl);
		if (didIt) this.store.add(message);
		return didIt;
	}

	// id is optional. if specified message with this id is popped from box, otherwise first message
	pop(id) {
		const poppedMsg = super.pop(id);
		if (poppedMsg) this.store.remove(poppedMsg);
		return poppedMsg;
	}

	replaceMessage(newMessage, ttl) {
		const replaced = super.replaceMessage(setExpireTTL(newMessage), ttl);
		if (replaced) this.store.update(newMessage);
		return replaced;
	}
}
module.exports = PersistentOutbox;
