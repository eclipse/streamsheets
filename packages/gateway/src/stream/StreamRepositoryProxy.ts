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
import { StreamsMessagingProtocol, Topics } from '@cedalo/protocols';
import { MessagingRequestHelper } from '@cedalo/service-core';
import {
	Stream,
	ReloadStreamsRequest,
	SaveStreamRequest,
	DeleteStreamRequest,
	GetAllStreamsRequest,
	GetStreamRequest,
	GetStreamByNameRequest,
	StreamCommandRequest,
	GetProvidersRequest,
	ValidateStreamRequest
} from './types';
import { ID } from '../streamsheets';

const { SERVICES_STREAMS_INPUT, SERVICES_STREAMS_EVENTS } = Topics;
const {
	STREAM_COMMAND_MESSAGE_TYPE,
	STREAM_CONFIG_SAVE,
	STREAMS_CONFIG_LOAD_ALL,
	STREAM_CONFIG_DELETE,
	STREAM_RELOAD,
	STREAM_CONFIG_LOAD,
	STREAM_CONFIG_LOAD_BY_NAME,
	STREAM_GET_PROVIDERS,
	STREAM_CONFIG_VALIDATE
} = StreamsMessagingProtocol.MESSAGE_TYPES;

export interface StreamValidationResult {
	valid: boolean;
	fieldErrors: { [key: string]: string };
	fieldUpdates: { [key: string]: string };
}

export class StreamRepositoryProxy {
	private messagingClient: MessagingClient;
	private requestHelper: MessagingRequestHelper;

	constructor() {
		this.messagingClient = new MessagingClient();
		this.messagingClient.connect(process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883');
		this.messagingClient.subscribe(`${SERVICES_STREAMS_EVENTS}/#`);
		this.requestHelper = new MessagingRequestHelper(this.messagingClient);
	}

	async findById(id: ID) {
		const message: Omit<GetStreamRequest, 'scope'> = {
			type: STREAM_CONFIG_LOAD,
			requestId: Math.random(),
			configId: id
		};
		const { result } = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async findByName(name: string) {
		const message: Omit<GetStreamByNameRequest, 'scope'> = {
			type: STREAM_CONFIG_LOAD_BY_NAME,
			requestId: Math.random(),
			name
		};
		const { result } = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async providers() {
		const message: Omit<GetProvidersRequest, 'scope'> = {
			type: STREAM_GET_PROVIDERS,
			requestId: Math.random()
		};
		const { result } = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async findAllStreams() {
		const message: Omit<GetAllStreamsRequest, 'scope'> = {
			type: STREAMS_CONFIG_LOAD_ALL,
			requestId: Math.random()
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return Array.isArray(result.streams) ? result.streams : [];
	}

	async executeStreamCommand(cmd: StreamCommandRequest['cmd']) {
		const message: Omit<StreamCommandRequest, 'scope'> = {
			type: STREAM_COMMAND_MESSAGE_TYPE,
			requestId: Math.random(),
			cmd
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async deleteStream(id: ID) {
		const message: Omit<DeleteStreamRequest, 'scope'> = {
			type: STREAM_CONFIG_DELETE,
			requestId: Math.random(),
			configId: id
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async saveStream(stream: Stream): Promise<any> {
		const message: Omit<SaveStreamRequest, 'scope'> = {
			type: STREAM_CONFIG_SAVE,
			requestId: Math.random(),
			configuration: stream
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async validateStream(provider: string, streamType: string, config: object): Promise<StreamValidationResult> {
		const message: Omit<ValidateStreamRequest, 'scope'> = {
			type: STREAM_CONFIG_VALIDATE,
			requestId: Math.random(),
			provider,
			streamType,
			configuration: config
		};
		const result = await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
		return result;
	}

	async reloadStreams(sources: Array<ID>) {
		const message: Omit<ReloadStreamsRequest, 'scope'> = {
			type: STREAM_RELOAD,
			requestId: Math.random(),
			sources
		};
		await this.requestHelper.doRequestMessage({ message, topic: SERVICES_STREAMS_INPUT });
	}
}
