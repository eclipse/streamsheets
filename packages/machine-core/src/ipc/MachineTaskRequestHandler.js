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
const logger = require('../logger').create({ name: 'MachineTaskRequestHandler' });
const RequestHandlerRegistry = require('./RequestHandlerRegistry');


// handles request to machine-task
class MachineTaskRequestHandler {
	// REVIEW: we pass monitor only to handle request to monitors! => should this be supported at all??
	constructor(monitor, channel) {
		this.channel = channel;
		this.machine = monitor.machine;
		this.handlers = RequestHandlerRegistry.of(monitor);
		this.onMessage = this.onMessage.bind(this);
		this.channel.on('message', this.onMessage);
	}

	dispose() {
		this.channel.off('message', this.onMessage);
	}

	onMessage(msg) {
		if (msg.request != null) {
			const handler = this.handlers.get(msg.request);
			if (handler) {
				logger.info(`Handle request: ${msg.request}`);
				// set lastModified on handled request,
				// actually this should be done on success, but that might needs adapt of result, so simply do it here
				if (handler.isModifying) {
					this.machine.setLastModifiedAt(Date.now(), msg.userId || 'unknown');
				}
				handler.handle(msg)
					.then((result) => this.channel.send({ response: msg.requestId, result }))
					.catch((error) => this.channel.send({ response: msg.requestId, error: { message: error.message} }))
					.finally(() => logger.info(`Finished handle request: ${msg.request}`));
			} else {
				logger.error(`Unknown request ${msg.request}!`);
				this.channel.send({ response: msg.requestId, error: { message: `Unknown request ${msg.request}!` } });
			}
		}
	}
}

module.exports = MachineTaskRequestHandler;
