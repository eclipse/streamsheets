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
import { EventHandler } from '../Events';


// const get = (factory) => (key, all) => all.get(key) || all.set(key, factory()).get(key);
// const getSet = get(() => new Set());
// const getMap = get(() => new Map());

const getMap = (machineId: string, map: Map<string, Map<string, Set<EventHandler>>>): Map<string, Set<EventHandler>> =>
	// @ts-ignore	
	map.get(machineId) || map.set(machineId, new Map<string, Set<EventHandler>>()).get(machineId);


const getSet = (machineId: string, map: Map<string, Set<EventHandler>>): Set<EventHandler> =>
	// @ts-ignore
	map.get(machineId) || map.set(machineId, new Set<EventHandler>()).get(machineId);


const getListeners = (all: Map<string, Map<string, Set<EventHandler>>>) => (evtype: string, machineId: string) => {
	const evlisteners = getMap(evtype, all);
	return getSet(machineId, evlisteners);
};


class EventListeners {
	private listeners = new Map<string, Map<string, Set<EventHandler>>>();
	private getEvListeners: (evtype: string, machineId: string) => Set<EventHandler>;

	constructor() {
		this.getEvListeners = getListeners(this.listeners);
	}

	add(evtype: string, machineId: string, handler: EventHandler): void {
		const evlisteners = this.getEvListeners(evtype, machineId);
		evlisteners.add(handler);
	}

	clear(): void {
		this.listeners.clear();
	}

	remove(evtype: string, machineId: string, handler: EventHandler): void {
		const evlisteners = this.getEvListeners(evtype, machineId);
		evlisteners.delete(handler);
	}

	getMachineIds(): string[] {
		const allIds = new Set<string>();
		this.listeners.forEach(map => {
			Array.from(map.keys()).forEach((key: string) => allIds.add(key))
		});
		return Array.from(allIds.values());
	}

	getListeners(evtype: string, machineId: string): Set<EventHandler> {
		return this.getEvListeners(evtype, machineId);
	}

	getListenersByEvent(evtype: string): EventHandler[] {
		const listeners = this.listeners.get(evtype) || new Map<string, Set<EventHandler>>();
		return Array
			.from(listeners.values())
			.reduce((all, set) => all.concat(Array.from(set.values())),new Array<EventHandler>());
	}

	hasListeners(evtype: string): boolean {
		const evlisteners = this.listeners.get(evtype);
		return !!evlisteners && !!evlisteners.size;
	}
}

export default EventListeners;
