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
const logger = require('../logger').create({ name: 'MachineTaskMonitor' });
const MachineTaskOutboxMonitor = require('./MachineTaskOutboxMonitor');
const MachineTaskStreamSheetMonitor = require('./MachineTaskStreamSheetMonitor');
const MachineTaskMessagingClient = require('./MachineTaskMessagingClient');
const { collectMachineStats } = require('./utils');
const State = require('../State');
const MachineEvents = require('@cedalo/protocols').MachineServerMessagingProtocol.EVENTS;
const { EventMessage } = require('@cedalo/messages');
const Redis = require('ioredis');

const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';

const machineStepKey = (machineId) => `machines.${machineId}.step`;

const createMachineEvent = (machine, name, type) => ({
	event: name,
	type,
	src: 'machine',
	srcId: machine.id
});
const errorEvent = (machine, error) => Object.assign(createMachineEvent(machine, 'error', 'error'), { error });
const updateEvent = (type, machine, props) => Object.assign(createMachineEvent(machine, 'update', type), props);
const messageEvent = (type, machine, props) => Object.assign(createMachineEvent(machine, 'message', type), props);

const stepEvent = (monitor) =>
	updateEvent(MachineEvents.MACHINE_STEP_EVENT, monitor.machine, {
		stats: monitor.machine.stats,
		outbox: {
			// messages: monitor.machine.outbox.messages.slice(0)
			messages: monitor.machine.outbox.getFirstMessages(),
			totalSize: monitor.machine.outbox.size
		},
		streamsheets: Array.from(monitor.streamsheetMonitors.values()).map((mon) => mon.getStreamSheetStepData())
	});

const redisApi = () => {
	let current = Promise.resolve();
	let next = null;
	const redis = new Redis(REDIS_PORT, REDIS_HOST);
	const serialize = (obj) => {
		try {
			return JSON.stringify(obj);
		} catch (err) {
			logger.error('Failed to stringify object for redis!', obj);
		}
		return undefined;
	};
	const setStep = async (machineId, event) => {
		const isAlreadyAwaiting = next !== null;
		next = event;
		if (!isAlreadyAwaiting) {
			try {
				await current;
			} catch (error) {
				logger.error('Failed to set step in redis', error);
			} finally {
				const serialized = serialize(next);
				next = null;
				current = serialized ? redis.set(machineStepKey(machineId), serialized) : Promise.resolve();
			}
		}
	};

	return {
		setStep
	};
};

class MachineTaskMonitor {
	constructor(machine) {
		this.machine = machine;
		// update interval:
		this._stepUpdateInterval = -1;
		this._steps = 0;
		this._statsInfo = {};
		this._redis = redisApi();
		this.outboxMonitor = new MachineTaskOutboxMonitor(machine);
		this.streamsheetMonitors = new Map();
		this.onMachineError = this.onMachineError.bind(this);
		this.onMachineMessage = this.onMachineMessage.bind(this);
		this.onMachineUpdate = this.onMachineUpdate.bind(this);
		this.onMachineWillStop = this.onMachineWillStop.bind(this);
		this.machine.on('error', this.onMachineError);
		this.machine.on('message', this.onMachineMessage);
		this.machine.on('update', this.onMachineUpdate);
		this.machine.on('willStop', this.onMachineWillStop);
	}

	dispose() {
		this.machine.off('error', this.onMachineError);
		this.machine.off('message', this.onMachineMessage);
		this.machine.off('update', this.onMachineUpdate);
		this.machine.off('willStop', this.onMachineWillStop);
		this.outboxMonitor.dispose();
		this.streamsheetMonitors.forEach((monitor) => monitor.dispose());
		this.streamsheetMonitors.clear();
	}

	update(props = {}) {
		if (props.streamsheets) {
			this.streamsheetMonitors.forEach((monitor) => monitor.update(props.streamsheets));
		}
		this._stepUpdateInterval = props.stepUpdateInterval || this._stepUpdateInterval;
	}

	// handles general machine message
	onMachineMessage(type, message) {
		const { machine } = this;
		const msgEvent = messageEvent(type, machine, message);
		MachineTaskMessagingClient.publishEvent(msgEvent);
	}

	onMachineUpdate(type, data) {
		let event;
		const { machine } = this;
		switch (type) {
			case 'cycletime':
				event = updateEvent(MachineEvents.MACHINE_CYCLETIME_EVENT, machine, { cycletime: machine.cycletime });
				break;
			case 'stream_reloaded':
				event = updateEvent(MachineEvents.STREAMS_RELOAD_EVENT, machine, { data });
				break;
			case 'descriptor': // will be triggered by request handler on delete/insert cells/rows/columns...
				event = updateEvent(MachineEvents.MACHINE_DESCRIPTOR_UPDATE_EVENT, machine, { data });
				break;
			case 'lastModified':
				event = updateEvent(MachineEvents.MACHINE_LAST_MODIFIED_EVENT, machine, { 
					lastModified: machine.metadata.lastModified, lastModifiedBy: machine.metadata.lastModifiedBy
				});
				break;
			case 'locale':
				event = updateEvent(MachineEvents.MACHINE_LOCALE_EVENT, machine, { locale: machine.locale });
				break;
			case 'name':
				event = updateEvent(MachineEvents.MACHINE_RENAME_EVENT, machine, { name: machine.name });
				break;
			case 'namedCells':
				event = updateEvent(MachineEvents.NAMED_CELLS_EVENT, machine, {
					namedCells: machine.namedCells.getDescriptors()
				});
				break;
			case 'graphCells':
				event = updateEvent('graphCells', machine, { graphCells: machine.graphCells.getDescriptors() });
				break;
			case 'functions':
				event = updateEvent(MachineEvents.MACHINE_FUNCTIONS_EVENT, machine, { functionDefinitions: data });
				break;
			case 'opcua':
				event = updateEvent(MachineEvents.MACHINE_OPCUA_EVENT, machine, { isOPCUA: machine.isOPCUA });
				break;
			case 'state':
				event = updateEvent(MachineEvents.MACHINE_STATE_EVENT, machine, {
					state: machine.state,
					stats: machine.state === State.STOPPED ? this._statsInfo.stats : undefined,
					streamsheets: machine.state === State.STOPPED ? this._statsInfo.streamsheets : undefined
				});
				break;
			case 'step': {
				this._steps += 1;
				const redisEvent =
					this._stepUpdateInterval < 0 || this._steps >= this._stepUpdateInterval ? stepEvent(this) : null;
				if (redisEvent != null) {
					this._steps = 0;
					this._redis.setStep(machine.id, new EventMessage(redisEvent));
				}
				break;
			}
			case 'streamsheet_added':
				this.streamsheetMonitors.set(data.id, new MachineTaskStreamSheetMonitor(data));
				break;
			case 'streamsheet_removed':
				if (this.streamsheetMonitors.has(data.id)) {
					this.streamsheetMonitors.get(data.id).dispose();
					this.streamsheetMonitors.delete(data.id);
				}
				break;
			default:
				logger.info(`Ignore update event "${type}" for machine ${this.machine.name}{${this.machine.id}}!!`);
		}
		if (event) {
			MachineTaskMessagingClient.publishEvent(event);
		}
	}

	onMachineWillStop() {
		this._statsInfo = collectMachineStats(this.machine);
	}

	onMachineError(error) {
		logger.error(`Error on machine ${this.machine.name}{${this.machine.id}}!!`, error);
		MachineTaskMessagingClient.publishEvent(errorEvent(this.machine, error));
	}
}

module.exports = MachineTaskMonitor;
