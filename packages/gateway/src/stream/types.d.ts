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
import { ID, Scope } from '../streamsheets';

export interface Stream {
	id: ID;
	name: string;
	className: string;
	scope?: Scope;
	status?: string;
	providerId?: ID;
	provider?: {
		id: ID;
	}
	connector?: {
		id: ID;
	};
}

export interface BaseStreamWSRequest {
	requestId: number;
	scope: Scope;
}

export interface BaseStreamWSResponse {
	type: 'response';
	requestId: number;
}

export interface StreamCommandRequest extends BaseStreamWSRequest {
	type: 'stream_command';
	cmd: {
		streamId: ID;
	};
}

export interface ReloadStreamsRequest extends BaseStreamWSRequest {
	type: 'stream_reload';
	sources?: Array<ID>;
}

export interface DeleteStreamRequest extends BaseStreamWSRequest {
	type: 'stream_config_delete';
	configId: ID;
}

export interface GetStreamRequest extends BaseStreamWSRequest {
	type: 'stream_config_load';
	configId: ID;
}

export interface GetStreamByNameRequest extends BaseStreamWSRequest {
	type: 'stream_config_load_by_name';
	name: string;
}

export interface SaveStreamRequest extends BaseStreamWSRequest {
	type: 'stream_config_save';
	configuration: Stream;
}

export interface GetAllStreamsRequest extends BaseStreamWSRequest {
	type: 'stream_config_load_all';
}

export interface GetProvidersRequest extends BaseStreamWSRequest {
	type: 'stream_get_providers';
}

export interface ValidateStreamRequest extends BaseStreamWSRequest {
	type: 'stream_config_validate';
	provider: string;
	streamType: string;
	configuration: any;
}

export interface StreamCommandResponse extends BaseStreamWSResponse {
	requestType: 'stream_command';
	response: {
		result: any;
	};
}

export interface ReloadStreamsResponse extends BaseStreamWSResponse {
	requestType: 'stream_reload';
	response: {};
}

export interface DeleteStreamResponse extends BaseStreamWSResponse {
	requestType: 'stream_config_delete';
	response: {
		id: ID;
		result: any;
	};
}

export interface SaveStreamResponse extends BaseStreamWSResponse {
	requestType: 'stream_config_save';
	response: {
		id: ID;
		result: Stream;
	};
}

export interface GetStreamResponse extends BaseStreamWSResponse {
	requestType: 'stream_config_load';
	response: Stream;
}

export interface GetStreamByNameResponse extends BaseStreamWSResponse {
	requestType: 'stream_config_load_by_name';
	response: Stream;
}

export interface GetProvidersResponse extends BaseStreamWSResponse {
	requestType: 'stream_get_providers';
	response: string[];
}

export interface GetAllStreamsResponse extends BaseStreamWSResponse {
	requestType: 'stream_config_load_all';
	response: {
		streams: Array<Stream>;
	};
}

export type StreamWSRequest =
	| StreamCommandRequest
	| ReloadStreamsRequest
	| DeleteStreamRequest
	| SaveStreamRequest
	| GetStreamRequest
	| GetStreamByNameRequest
	| GetProvidersRequest
	| GetAllStreamsRequest;

export type StreamWSResponse =
	| StreamCommandResponse
	| ReloadStreamsResponse
	| DeleteStreamResponse
	| SaveStreamResponse
	| GetStreamResponse
	| GetStreamByNameResponse
	| GetProvidersResponse
	| GetAllStreamsResponse;
