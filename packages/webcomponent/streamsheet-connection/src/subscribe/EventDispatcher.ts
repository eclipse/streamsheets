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
import Synchronizer from '../sync/Synchronizer';
import IGatewayClient from '../connection/IGatewayClient';
import EventConverter from './EventConverter';
import EventListeners from './EventListeners';
import StreamSheetConnection from '../connection/StreamSheetConnection';
import { EventMessage, EventHandler } from '../Events';


class EventDispatcher {

	static of(connection: StreamSheetConnection): EventDispatcher {
		const dispatcher = new EventDispatcher(connection);
		// dispatcher.connection.on('gateway_disconnected', dispatcher.dispatch);
		return dispatcher;
	}

	private connection: StreamSheetConnection;
	private gwclient: IGatewayClient;
	private doSyncSteps = false;
	private evlisteners = new EventListeners();
	private evconverter = new EventConverter();

	private constructor(connection: StreamSheetConnection) {
		this.connection = connection;
		this.gwclient = connection.client;

		this.dispatch = this.dispatch.bind(this);
		this.notifyListeners = this.notifyListeners.bind(this);
	}

	get gatewayClient() {
		return this.gwclient;
	}

	get doSyncMachineSteps() {
		return this.doSyncSteps;
	}

	set doSyncMachineSteps(doIt) {
		this.doSyncSteps = doIt;
	}


	on(evtype: string, machineId: string, handler: EventHandler) {
		if (!this.evlisteners.hasListeners(evtype)) {
			this.gwclient.on(evtype, this.dispatch);
		}
		this.evlisteners.add(evtype, machineId, handler);

		console.log(`*** MACHINES: ${this.evlisteners.getMachineIds().join(',')}`);
	}
	off(evtype: string, machineId: string, handler: EventHandler) {
		this.evlisteners.remove(evtype, machineId, handler);
		if (!this.evlisteners.hasListeners(evtype)) {
			this.gwclient.off(evtype, this.dispatch);
		}
	}

	dispatch(event: EventMessage) {
		const ev = this.evconverter.convert(event);
		const type = ev.type;
		const machineId = ev.machineId || ev.srcId;
		if (type === 'machine_step') {
			this.handleMachineStep(ev, machineId);
		} else {
			this.handleEvent(ev, machineId);
		}
	}
	private handleMachineStep(event: EventMessage, machineId: string) {
		if (this.doSyncSteps) {
			Synchronizer.sync(
				() => this.notifyListeners(event, machineId),
				() => this.gwclient.confirmProcessedMachineStep(machineId)
			);
		} else {
			this.notifyListeners(event, machineId);
			this.gwclient.confirmProcessedMachineStep(machineId);
		}
	}
	private handleEvent(event: EventMessage, machineId: string) {
		this.notifyListeners(event, machineId);
		if (event.type === 'gateway_disconnected') {
			// remove all listeners and handle disconnect...
			this.evlisteners.clear();
		}
	}
	private notifyListeners(event: EventMessage, machineId: string) {
		const type = event.type;
		const listeners = machineId
			? this.evlisteners.getListeners(type, machineId)
			: this.evlisteners.getListenersByEvent(type);
		listeners.forEach((listener: EventHandler) => listener(event));
	}

	dispose() {
		this.unsubscribeFromMachines();
		this.evlisteners.clear();
		// this.gwclient.off('gateway_disconnected', this.dispatch);
	}
	private unsubscribeFromMachines() {
		this.evlisteners.getMachineIds().forEach((machineId) => this.connection.unsubscribe(machineId));
	}
}

export default EventDispatcher;
