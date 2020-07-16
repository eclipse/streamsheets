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
const MessageBox = require('./MessageBox');

const setExpireTimeout = (timeouts, key, ttl, fn) => {
	if (timeouts[key]) clearTimeout(timeouts[key]);
	timeouts[key] = setTimeout(fn, ttl);
};
const clearExpireTimeout = (timeouts, key) => {
	if (timeouts[key]) {
		clearTimeout(timeouts[key]);
		delete timeouts[key];
	}
};


class TTLMessageBox extends MessageBox {
	constructor(cfg) {
		super(cfg);
		this.timeouts = {};
		// we postpone message removal on pause/stop state
		this.pendingPops = [];
		this._keppMessages = true;
	}

	// used by machine to prevent message removal on pause/stop state
	set keepMessages(doIt) {
		this._keppMessages = doIt;
		if (!doIt) {
			this.pendingPops.forEach((id) => this.pop(id));
			this.pendingPops.length = 0;
		}
	}

	_applyConfig(config) {
		super._applyConfig(config);
	}

	clear() {
		Object.keys(this.timeouts).forEach((key) => clearTimeout(this.timeouts[key]));
		this.timeouts = {};
		super.clear();
	}

	put(message, force = false, ttl) {
		const didIt = super.put(message, force);
		if (didIt) this._setExpireTimeout(ttl, message.id);
		return didIt;
	}
	pop(id) {
		const msg = super.pop(id);
		if (msg) clearExpireTimeout(this.timeouts, msg.id);
		return msg;
	}

	replaceMessage(newMessage, ttl) {
		const replaced = super.replaceMessage(newMessage);
		if (replaced) this._setExpireTimeout(ttl, newMessage.id);
		return replaced;
	}

	_popIfActive(key) {
		if (!this._keepMessages) this.pop(key);
		else this.pendingPops.push(key);
	}
	_setExpireTimeout(ttl, key) {
		if (ttl != null && ttl > 0) setExpireTimeout(this.timeouts, key, ttl, () => this._popIfActive(key));
	}
}

module.exports = TTLMessageBox;
