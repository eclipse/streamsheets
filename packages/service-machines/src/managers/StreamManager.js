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
const logger = require('../utils/logger').create({ name: 'StreamManager' });
const EventEmitter = require('events');
const { Topics } = require('@cedalo/protocols');
const { LoggerMessagingClient } = require('@cedalo/machine-core');
const { createAndConnect } = require('@cedalo/messaging-client');

const descriptorFromEvent = (event) => {
	const stream = event && event.data && event.data.stream;
	const timestamp = stream && event.data.timestamp && new Date(event.data.timestamp).getTime();
	return stream
		? { id: stream.id, name: stream.name, type: stream.type, state: stream.state, timestamp, scope: stream.scope }
		: undefined;
};

const handleEvent = (event, callback) => {
	const descriptor = descriptorFromEvent(event);
	if (descriptor) callback(descriptor);
	else logger.warn(`Got event for unknown data-source: ${event}`);
};
const handleUpdate = (event, manager) => {
	handleEvent(event, (descriptor) => {
		if (['producer', 'consumer', 'stream'].includes(descriptor.type)) {
			manager.descriptors.set(descriptor.id, descriptor);
			manager.emitter.emit('streamChanged', descriptor);
		}
	});
};
const handleDelete = (event, manager) => {
	handleEvent(event, (descriptor) => {
		manager.descriptors.delete(descriptor.id);
		manager.emitter.emit('streamDeleted', descriptor);
	});
};

const TOPICS = [
	`${Topics.SERVICES_STREAMS_EVENTS}/+/connect`,
	`${Topics.SERVICES_STREAMS_EVENTS}/+/update`,
	`${Topics.SERVICES_STREAMS_EVENTS}/+/dispose`,
	`${Topics.SERVICES_STREAMS_EVENTS}/+/error`,
	`${Topics.SERVICES_STREAMS_EVENTS}/+/delete`
];

class StreamManager {
	constructor() {
		Object.defineProperties(this, {
			descriptors: { value: new Map() },
			emitter: { value: new EventEmitter() },
			messaging: { value: { client: new LoggerMessagingClient(logger) } }
		});
		this.emitter.setMaxListeners(0);
		this.handleMessage = this.handleMessage.bind(this);
	}

	set client(client) {
		this.unsubscribe();
		this.messaging.client = client;
		this.subscribe();
	}

	getDescriptors() {
		return Array.from(this.descriptors.values());
	}

	dispose() {
		this.unsubscribe();
		this.emitter.removeAllListeners();
		this.messaging.client.end();
	}

	// to notify machines on feeder changes
	on(event, callback) {
		this.emitter.on(event, callback);
	}
	off(event, callback) {
		this.emitter.removeListener(event, callback);
	}

	subscribe() {
		const client = this.messaging.client;
		TOPICS.forEach((topic) => client.subscribe(topic));
		client.on('message', this.handleMessage);
	}
	unsubscribe() {
		const client = this.messaging.client;
		TOPICS.forEach((topic) => client.unsubscribe(topic));
		client.off('message', this.handleMessage);
	}

	handleMessage(topic, message) {
		const action = topic.split('/').pop();
		const { event } = JSON.parse(message);
		switch (action) {
			case 'connect':
			case 'update':
			case 'dispose':
			case 'error':
				handleUpdate(event, this);
				break;
			case 'delete':
				handleDelete(event, this);
				break;
			default:
				logger.warn(`Unknown data-source event "${action}"`);
		}
	}
}

// create singleton:
const create = () => {
	const manager = new StreamManager();
	createAndConnect()
		.then((client) => {
			manager.client = client;
		})
		.catch((err) => logger.error(err));
	return manager;
};
module.exports = Object.freeze(create());
