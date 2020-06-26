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
/* global HTMLElement */

// TODO review => instead of subclassing StreamMachine from MachineElement it might be better to compose

class MachineElement extends HTMLElement {

	constructor() {
		super();
		this.onMachineStep = this.onMachineStep.bind(this);
		this.onMachineState = this.onMachineState.bind(this);
		this.onMessageBoxClear = this.onMessageBoxClear.bind(this);
		this.onMessagePut = this.onMessagePut.bind(this);
		this.onMessagePop = this.onMessagePop.bind(this);
		this.onSheetUpdate = this.onSheetUpdate.bind(this);
	}

	get machineId() {
		return this._machineId;
	}

	setMachine(definition) {
		this.update = false;
		this.machine = definition;
		this.update = true;
		this.style.visibility = 'visible';
	}

	subscribedCallback(element, error) {
		if (!error) {
			const machineId = this.machineId;
			this.gwclient = element.gatewayClient;
			element.on('machine_step', machineId, this.onMachineStep);
			element.on('machine_state', machineId, this.onMachineState);
			element.on('message_put', machineId, this.onMessagePut);
			element.on('message_pop', machineId, this.onMessagePop);
			element.on('message_box_clear', machineId, this.onMessageBoxClear);
			element.on('sheet_update', machineId, this.onSheetUpdate);
		}
	}

	unsubscribedCallback(element) {
		const machineId = this.machineId;
		element.off('machine_step', machineId, this.onMachineStep);
		element.off('machine_state', machineId, this.onMachineState);
		element.off('message_put', machineId, this.onMessagePut);
		element.off('message_pop', machineId, this.onMessagePop);
		element.off('message_box_clear', machineId, this.onMessageBoxClear);
		element.off('sheet_update', machineId, this.onSheetUpdate);
	}


	onMachineStep(ev) {
		this.update = false;
		this.value = ev.data;
		this.update = true;
	}

	onMessageBoxClear(ev) {
		const { src } = ev;
		if (src) {
			if (src === 'inbox') this.clearInbox(ev.streamheetId);
			else if (src === 'outbox') this.clearOutbox();
		}
	}
	onMessagePut(ev) {
		const { message, src } = ev;
		if (message && src) {
			if (src === 'inbox') this.addInboxMessage(ev.streamheetId, message);
			else if (src === 'outbox') this.addOutboxMessage(message);
		}
	}
	onMessagePop(ev) {
		const { message, src } = ev;
		if (message && src) {
			if (src === 'inbox') this.removeInboxMessage(ev.streamheetId, message);
			else if (src === 'outbox') this.removeOutboxMessage(message);
		}
	}

	onSheetUpdate(ev) {
		this.update = false;
		this.value = ev.data;
		this.update = true;
	}

	onMachineState(ev) {
		this.state = ev.state;
	}
}

export default MachineElement;
