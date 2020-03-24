import { MessagingClient } from '@cedalo/messaging-client';
import { Topics } from '@cedalo/protocols';
import { MessagingRequestHelper } from '@cedalo/service-core';
import {
	ID,
	LoadMachineRequest,
	PauseMachineRequest,
	StartMachineRequest,
	UnloadMachineRequest
} from '../streamsheets';

const { SERVICES_MACHINES_INPUT, SERVICES_MACHINES_OUTPUT } = Topics;

export class MachineServiceProxy {
	private messagingClient: MessagingClient;
	private requestHelper: MessagingRequestHelper;

	constructor() {
		this.messagingClient = new MessagingClient();
		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
		this.messagingClient.subscribe(`${SERVICES_MACHINES_OUTPUT}/#`);
		this.requestHelper = new MessagingRequestHelper(this.messagingClient);
	}

	async load(id: ID) {
		const message: LoadMachineRequest = {
			type: 'machine_load',
			requestId: Math.random(),
			machineId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return result;
	}

	async unload(id: ID) {
		const message: UnloadMachineRequest = {
			type: 'machine_unload',
			requestId: Math.random(),
			machineId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return { unloaded: result.machine.unloaded };
	}

	async start(id: ID) {
		const message: StartMachineRequest = {
			type: 'machine_start',
			requestId: Math.random(),
			machineId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return result;
	}

	async pause(id: ID) {
		const message: PauseMachineRequest = {
			type: 'machine_pause',
			requestId: Math.random(),
			machineId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return result;
	}
}
