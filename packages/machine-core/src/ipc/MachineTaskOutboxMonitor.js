const MachineEvents = require('@cedalo/protocols').MachineServerMessagingProtocol.EVENTS;
const State = require('../State');
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');


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
		this.onClear = this.onClear.bind(this);
		this.onMessagePut = this.onMessagePut.bind(this);
		this.onMessagePop = this.onMessagePop.bind(this);
		this.onMessageChanged = this.onMessageChanged.bind(this);
		this.outbox.on('clear', this.onClear);
		this.outbox.on('message_put', this.onMessagePut);
		this.outbox.on('message_pop', this.onMessagePop);
		this.outbox.on('message_changed', this.onMessageChanged);
	}

	dispose() {
		this.outbox.off('clear', this.onClear);
		this.outbox.off('message_put', this.onMessagePut);
		this.outbox.off('message_pop', this.onMessagePop);
		this.outbox.off('message_changed', this.onMessageChanged);
	}

	onClear(messages) {
		const message = eventmsg(MachineEvents.MESSAGE_BOX_CLEAR, this.outbox, this.machine, { messages });
		this.publishEvent(message);
	}

	onMessagePut(message) {
		const messages = this.outbox.messages.slice(0);
		const msg = eventmsg(MachineEvents.MESSAGE_PUT, this.outbox, this.machine, { message, messages });
		this.publishEvent(msg);
	}

	onMessagePop(message) {
		const messages = this.outbox.messages.slice(0);
		const msg = eventmsg(MachineEvents.MESSAGE_POP, this.outbox, this.machine, { message, messages });
		this.publishEvent(msg);
	}

	onMessageChanged(message) {
		const messages = this.outbox.messages.slice(0);
		const msg = eventmsg(MachineEvents.MESSAGE_CHANGED, this.outbox, this.machine, { message, messages });
		this.publishEvent(msg);
	}

	// DL-2293: we send in-/outbox events only if machine is stopped or paused:
	publishEvent(message) {
		if (this.machine.state !== State.RUNNING) {
			MachineTaskMessagingClient.publishEvent(message);
		}
	}

}

module.exports = MachineTaskOutboxMonitor;
