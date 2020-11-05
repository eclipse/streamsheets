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

/**
 * @type {module.PersistentOutbox}
 */
class PersistentOutbox extends Outbox {
	constructor(cfg = {}) {
		super(cfg);
		this.store = new MessageStore();
	}

	async load(conf, machine) {
		try {
			await this.store.open(machine.id);
			const messages = await this.store.getAll();
			// ensure outbox contains only messages from storage
			this.clear();
			messages.forEach((message) => this.put(message));
		} catch (err) {
			console.log(`Failed to open outbox storage for machine ${this.machine.id}`);
			console.error(err);
		}
	}

	async dispose() {
		return this.store.close();
	}

	clear() {
		super.clear();
		this.store.removeAll();
	}

	put(message, force, ttl) {
		const didIt = super.put(message, force, ttl);
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
		const replaced = super.replaceMessage(newMessage, ttl);
		if (replaced) this.store.update(newMessage);
		return replaced;
	}
}
module.exports = PersistentOutbox;
