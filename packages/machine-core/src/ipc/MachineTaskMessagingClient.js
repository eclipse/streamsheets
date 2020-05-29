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
const logger = require('../logger').create({ name: 'MachineMessagingClient' });
const MessagingClient = require('../messaging/Client');
const { Topics } = require('@cedalo/protocols');
const { EventMessage } = require('@cedalo/messages');
const { createAndConnect } = require('@cedalo/messaging-client');


class MachineTaskMessagingClient extends MessagingClient {

	constructor() {
		super(logger);
		Object.defineProperties(this, {
			machine: { value: { topic: undefined } }
		});
	}

	get topic() {
		return this.machine.topic;
	}

	register(machine) {
		this.machine.topic = `${Topics.SERVICES_MACHINES_EVENTS}/${machine.id}`;
	}

	publish(message, opts) {
		this.client.publish(this.topic, message, opts);
	}

	publishEvent(message, opts) {
		// service task listener wrapped each event inside EventMessage, so:
		this.publish(new EventMessage(message), opts);
	}
}

// SINGLETON
const create = () => {
	const msgclient = new MachineTaskMessagingClient();
	createAndConnect()
		.then((client) => {
			msgclient.client = client;
		})
		.catch(err => logger.error(err));
	return msgclient;
};
module.exports = Object.freeze(create());
