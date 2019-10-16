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
