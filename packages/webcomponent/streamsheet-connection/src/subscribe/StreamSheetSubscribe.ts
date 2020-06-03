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
import Converter from './Converter';
import EventDispatcher from './EventDispatcher';
import StreamSheetConnection from '../connection/StreamSheetConnection';
import IMachineJSON from '../IMachineJSON';
import { EventHandler } from '../Events';
import cast from '../utils/cast';
import traverse from '../utils/traverse';
import validate from '../utils/validate';
import IMachineElement from '../IMachineElement';
// import { traverse, validate } from '../utils';

const TAG = 'streamsheet-subscribe';


const dispatchError = (err: Error, el: Element) => {
	el.dispatchEvent(new CustomEvent('error', { detail: err }));
};


const convert = (machinedef: IMachineJSON, graphdef: JSON): Promise<any> =>
	new Promise((resolve, reject) => {
		const converted = machinedef && graphdef && Converter.convert(machinedef, graphdef);
		if (converted) resolve(converted);
		else reject(new Error('Failed to convert machine- and graph-definitions!'));
	});

const getConnectionFromParent = (element: Element): StreamSheetConnection | undefined => {
	let parent;
	traverse.up(element, (el) => {
		parent = validate.tagName(el, StreamSheetConnection.TAG) ? el : undefined;
		return !!parent;
	});
	return parent;
};

const findMachines = (element: Element): IMachineElement[] => {
	const machines: IMachineElement[] = [];
	traverse.down(element, (el) => {
		const mel = toMachineElement(el);
		if (mel) machines.push(mel);
		return false;
	});
	return machines;
};

const toMachineElement = (el: Element | null): IMachineElement | undefined =>
    // TODO verify that element fulfills interface IMachineElement
	cast.elementToType<IMachineElement>(el, (el) => true); // validate.tagName(el, 'stream-machine'));

const toArray = (str: string): [] => str.startsWith('[') ? JSON.parse(str) : str.split(',').map(mid => mid.trim());

const machinesFromAttribute = (attribute: string | null): IMachineElement[] | undefined => {
	try {
		if (attribute) {
			const machines = toArray(attribute);
			return machines.reduce((all: IMachineElement[], mid: string) => {
				const mel = toMachineElement(document.getElementById(mid));
				if (mel) all.push(mel);
				return all;
			}, []);
		}
	} catch(e) {
		// ignore
	}
	return undefined;
};
const getMachines = (element: Element): IMachineElement[] => {
	const machines = machinesFromAttribute(element.getAttribute('machines'));
	return machines || findMachines(element);
};
const getConnection = (element: Element): StreamSheetConnection | undefined => {
	const connId = element.getAttribute('connection');
	const connection = connId ? document.getElementById(connId) : null;
	return (
		cast.elementToType<StreamSheetConnection>(connection, (connection) =>
			validate.tagName(connection, StreamSheetConnection.TAG)
		) || getConnectionFromParent(element)
	);
};

const setMachine = (element: IMachineElement, definition: IMachineJSON) => {
	element.setMachine(definition);
	return element;
};

class StreamSheetSubscribe extends HTMLElement {
	// INDEX TYPE: allow for setting attributes vie index string
	[attribute: string]: any;

	static get observedAttributes() {
		return ['syncsteps'];
	}

	private machines: IMachineElement[] = [];
	private evDispatcher?: EventDispatcher;

	constructor() {
		super();
		this.evDispatcher = undefined;
	}

	connectedCallback() {
		const connection = getConnection(this);
		if (connection) {
			const machines = getMachines(this);
			this.evDispatcher = EventDispatcher.of(connection);
			this.evDispatcher.doSyncMachineSteps = !!this.getAttribute('syncsteps');
			if (machines.length) {
				connection
					.whenReady()
					.then(() => {
						machines.forEach((m) => {
							connection
								.subscribe(m.getAttribute('name'))
								.then(({ graph, machine }) => convert(machine, graph))
								.then((mdef) => setMachine(m, mdef))
								.then((machine) => {
									this.machines.push(machine);
									machine.subscribedCallback(this);
								})
								.catch((err) => {
									m.subscribedCallback(this, err);
									dispatchError(err, this)
								});
						});
					})
					.catch((err) => dispatchError(err, this));
			} else {
				dispatchError(new Error('No referenced machines found!'), this);
			}
		} else {
			dispatchError(new Error(`No "<${StreamSheetConnection.TAG}>" found!`), this);
		}
	}

	disconnectedCallback() {
		this.machines.forEach((machine) => {
			machine.unsubscribedCallback(this);
		});
		if (this.evDispatcher) this.evDispatcher.dispose();
	}

	attributeChangedCallback(name: string, oldValue: any, newValue: any) {
		this[name] = newValue;
	}

	get gatewayClient() {
		return this.evDispatcher ? this.evDispatcher.gatewayClient : undefined;
	}

	get syncsteps() {
		return this.evDispatcher && this.evDispatcher.doSyncMachineSteps; 
	}

	set syncsteps(val) {
		if (this.evDispatcher) this.evDispatcher.doSyncMachineSteps = !!val;
	}


	on(eventtype: string, machineId: string, handler: EventHandler) {
		if (this.evDispatcher) this.evDispatcher.on(eventtype, machineId, handler);
	}

	off(eventtype: string, machineId: string, handler: EventHandler) {
		if (this.evDispatcher) this.evDispatcher.off(eventtype, machineId, handler);
	}
}

if (!customElements.get(TAG)) customElements.define(TAG, StreamSheetSubscribe);

export default StreamSheetSubscribe;
