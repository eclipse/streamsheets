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
import { StreamsMessagingProtocol } from '@cedalo/protocols';
import { StreamWSRequest, StreamWSResponse } from '../stream/types';
import { RequestContext } from '../streamsheets';
import ProxyConnection from './ProxyConnection';

const buildResponse = (request: StreamWSRequest, response: StreamWSResponse['response']): StreamWSResponse =>
	({
		type: 'response',
		requestId: request.requestId,
		requestType: request.type,
		response
	} as StreamWSResponse);

const buildErrorResponse = (request: StreamWSRequest, error: any) => ({
	type: 'error',
	requestId: request.requestId,
	requestType: request.type,
	error
});

export const StreamWSProxy = {
	handleEvent: async ({ api }: RequestContext, proxyConnection: ProxyConnection, event: any) => {

		try {
			const handledEvent = await api.stream.handleStreamEvent(event);
			if(handledEvent) {
				proxyConnection.onServerEvent(event);
			}
		} catch(e) {
			// do nothing
		}
	},
	handleRequest: async (context: RequestContext, proxyConnection: ProxyConnection, message: StreamWSRequest) => {
		switch (message.type) {
			case StreamsMessagingProtocol.MESSAGE_TYPES.STREAMS_CONFIG_LOAD_ALL: {
				try {
					const streams = await context.api.stream.findAllStreams(message.scope);
					proxyConnection.onServerEvent(buildResponse(message, { streams }));
				} catch (error) {
					proxyConnection.onServerEvent(buildErrorResponse(message, error));
				}
				break;
			}
			case StreamsMessagingProtocol.MESSAGE_TYPES.STREAM_CONFIG_SAVE: {
				try {
					const result = await context.api.stream.saveStream(message.scope, message.configuration);
					proxyConnection.onServerEvent(buildResponse(message, result));
				} catch (error) {
					proxyConnection.onServerEvent(buildErrorResponse(message, error));
				}
				break;
			}
			case StreamsMessagingProtocol.MESSAGE_TYPES.STREAM_RELOAD: {
				try {
					await context.api.stream.reloadStreams(message.scope, message.sources || []);
					proxyConnection.onServerEvent(buildResponse(message, {}));
				} catch (error) {
					proxyConnection.onServerEvent(buildErrorResponse(message, error));
				}
				break;
			}
			case StreamsMessagingProtocol.MESSAGE_TYPES.STREAM_CONFIG_DELETE: {
				try {
					const result = await context.api.stream.deleteStream(message.scope, message.configId);
					proxyConnection.onServerEvent(buildResponse(message, result));
				} catch (error) {
					proxyConnection.onServerEvent(buildErrorResponse(message, error));
				}
				break;
			}
			case StreamsMessagingProtocol.MESSAGE_TYPES.STREAM_COMMAND_MESSAGE_TYPE: {
				try {
					const result = await context.api.stream.executeStreamCommand(message.scope, message.cmd);
					proxyConnection.onServerEvent(buildResponse(message, result));
				} catch (error) {
					proxyConnection.onServerEvent(buildErrorResponse(message, error));
				}
				break;
			}
			default: {
				console.log('UNVERIFIED STREAM MESSAGE', message.type);
			}
		}
	}
};
