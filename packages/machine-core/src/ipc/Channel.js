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
// wrapper around process object to add validation and some additional features...
class Channel {

	constructor(task) {
		this.task = task;
		this._isActive = true;
		this._isAvailable = task.send != null;
		this.task.setMaxListeners(0);
	}

	get isActive() {
		return this._isActive;
	}

	get isAvailable() {
		return this._isAvailable;
	}

	setActive(doIt) {
		const oldstate = this._isActive;
		this._isActive = doIt;
		return oldstate;
	}

	on(event, callback) {
		this.task.on(event, callback);
	}

	off(event, callback) {
		this.task.removeListener(event, callback);
	}

	send(msg) {
		if (this._isAvailable && this._isActive) {
			this.task.send(msg);
		}
	}

	exit() {
		this.task.exit();
	}
}

const create = (task = process) => Object.seal(new Channel(task));

module.exports = {
	create
};
