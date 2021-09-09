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
import { MessagingClient } from '@cedalo/messaging-client';
import { Topics } from '@cedalo/protocols';
import { MessagingRequestHelper } from '@cedalo/service-core';
import {
	AddInboxMessageRequest,
	DeleteMachineRequest,
	ID,
	LoadMachineRequest,
	MachineUpdateExtensionSettingsRequest,
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

	async delete(id: ID) {
		const message: DeleteMachineRequest = {
			type: 'machine_delete',
			requestId: Math.random(),
			machineId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return { deleted: result.machine.deleted };
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

	async addInboxMessage(id: ID, streamsheetId: ID, inboxMessage: any, metadata: object) {
		const message: AddInboxMessageRequest = {
			type: 'add_inbox_message',
			requestId: Math.random(),
			machineId: id,
			streamsheetId,
			message: inboxMessage,
			metadata
		};

		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return result;
	}

	async updateExtensionSettings(id: ID, extensionId: string, settings: object) {
		const message: MachineUpdateExtensionSettingsRequest = {
			type: 'machine_update_extension_settings',
			requestId: Math.random(),
			machineId: id,
			extensionId,
			settings
		};

		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_MACHINES_INPUT });
		return result;
	}
}
