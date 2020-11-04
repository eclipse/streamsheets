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
const MachineEvents = require('@cedalo/protocols').MachineServerMessagingProtocol.EVENTS;
const { isNotRunning, isNotStepping, publishIf } = require('./utils');
const MessageStorage = require('../storage/MessageStorage');

const eventmsg = (type, outbox, machine, props) => ({
	type,
	src: 'outbox',
	srcId: outbox.id,
	machineId: machine.id,
	...props
});

class MachineTaskOutboxMonitor {

	constructor(machine) {
		this.machine = machine;
		this.outbox = machine.outbox;
		this.storage = new MessageStorage();
		this.onClear = this.onClear.bind(this);
		this.onMachineLoaded = this.onMachineLoaded.bind(this);
		this.onMessagePut = this.onMessagePut.bind(this);
		this.onMessagePop = this.onMessagePop.bind(this);
		this.onMessageChanged = this.onMessageChanged.bind(this);
		this.machine.on('loaded', this.onMachineLoaded);
		// this.outbox.on('clear', this.onClear);
		// this.outbox.on('message_put', this.onMessagePut);
		// this.outbox.on('message_pop', this.onMessagePop);
		// this.outbox.on('message_changed', this.onMessageChanged);
		// DL-2293 & DL-3300: we send outbox events only if machine is neither running nor stepping:
		this.publishEvent = publishIf(isNotRunning(machine), isNotStepping(machine));
	}

	dispose() {
		this.machine.off('loaded', this.onMachineLoaded);
		this.outbox.off('clear', this.onClear);
		this.outbox.off('message_put', this.onMessagePut);
		this.outbox.off('message_pop', this.onMessagePop);
		this.outbox.off('message_changed', this.onMessageChanged);
	}

	onClear(/* messages */) {
		const totalSize = this.outbox.size;
		const messages = this.outbox.getFirstMessages();
		const message = eventmsg(MachineEvents.MESSAGE_BOX_CLEAR, this.outbox, this.machine, { messages, totalSize });
		this.publishEvent(message);
	}

	async onMachineLoaded(machine) {
		try {
			await this.storage.open(machine.id);
			const messages = await this.storage.getAll();
			messages.forEach((message) => this.outbox.put(message));
		} catch(err) {
			console.log(`Failed to open outbox storage for machine ${this.machine.id}`);
			console.error(err);
		} finally {
			// register all outbox listeners
			this.outbox.on('clear', this.onClear);
			this.outbox.on('message_put', this.onMessagePut);
			this.outbox.on('message_pop', this.onMessagePop);
			this.outbox.on('message_changed', this.onMessageChanged);	
		}
	}

	onMessagePut(message) {
		const totalSize = this.outbox.size;
		const messages = this.outbox.getFirstMessages();
		const msg = eventmsg(MachineEvents.MESSAGE_PUT, this.outbox, this.machine, { message, messages, totalSize });
		this.storage.add(message);
		this.publishEvent(msg);
	}

	onMessagePop(message) {
		const totalSize = this.outbox.size;
		const messages = this.outbox.getFirstMessages();
		const msg = eventmsg(MachineEvents.MESSAGE_POP, this.outbox, this.machine, { message, messages, totalSize });
		this.storage.remove(message);
		this.publishEvent(msg);
	}

	onMessageChanged(message) {
		const totalSize = this.outbox.size;
		const messages = this.outbox.getFirstMessages();
		const msg = eventmsg(MachineEvents.MESSAGE_CHANGED, this.outbox, this.machine, {
			message,
			messages,
			totalSize
		});
		this.storage.update(message);
		this.publishEvent(msg);
	}
}

module.exports = MachineTaskOutboxMonitor;
