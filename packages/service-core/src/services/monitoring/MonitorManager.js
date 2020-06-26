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
const { logger } = require('@cedalo/logger');

module.exports = class MonitorManager {

	constructor(messagingClient, monitorClass) {
		this._messagingClient = messagingClient;
		this._monitors = new Map();
		this._monitorClass = monitorClass;
	}

	subscribe(thing) {
		let monitor = this._monitors.get(thing.id);
		if (!monitor) {
			logger.debug(`Subscribing to ${thing.id}`);
			// eslint-disable-next-line
			monitor = new this._monitorClass(this._messagingClient);
			monitor.subscribe(thing);
			this._monitors.set(thing.id, monitor);
		}
		return monitor;
	}

	unsubscribe(thing) {
		const monitor = this._monitors.get(thing.id);
		if (monitor) {
			logger.debug(`Unsubscribing from ${thing.id}`);
			monitor.unsubscribe();
			this._monitors.delete(thing.id);
		} else {
			logger.debug(`No monitor found for ${thing.id}`);
		}
	}

	shutdown() {
		this._monitors.forEach(monitor => monitor.unsubscribe());
	}

	getMonitor(id) {
		return this._monitors.get(id);
	}
}
