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
const Interceptor = require('./Interceptor');
const logger = require('../../utils/logger').create({ name: 'GraphServerInterceptor' });

const {
	GatewayMessagingProtocol,
	GraphServerMessagingProtocol,
	MachineServerMessagingProtocol
} = require('@cedalo/protocols');

const {
	CreateStreamSheetMessage,
	DeleteGraphMessage,
	DeleteStreamSheetMessage,
	GetGraphMessage,
	LoadGraphMessage,
	LoadSubscribeGraphMessage,
	SubscribeGraphMessage,
	UnsubscribeGraphMessage
} = require('../messages/Messages');

const INTERCEPTED_MESSAGE_TYPES = [
	GatewayMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.PING_GRAPHSOCKETSERVER_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.META_INFORMATION_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.REDO_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.UNDO_MESSAGE_TYPE
];

const TARGET_GRAPH_SERVER = 'graphserver';

const REQUEST_MAPPINGS = new Map([
	[GatewayMessagingProtocol.MESSAGE_TYPES.CREATE_STREAMSHEET_MESSAGE_TYPE, {
		requestClass: CreateStreamSheetMessage,
		parameterMapping: (context, parameters) => {
			parameters.streamsheetId = context.message.machineserver.streamsheet.id;
			parameters.streamsheetName = context.message.machineserver.streamsheet.name;
			parameters.activeItemId = context.message.machineserver.activeItemId;
			parameters.position = context.message.machineserver.position;
			return parameters;
		},
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.DELETE_STREAMSHEET_MESSAGE_TYPE, {
		requestClass: DeleteStreamSheetMessage,
		parameterMapping: (context, parameters) => {
			parameters.streamsheetId = context.message.machineserver.streamsheetId;
			return parameters;
		},
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE, {
		requestClass: DeleteGraphMessage,
		parameterMapping: (context, parameters) => parameters,
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.UNLOAD_MACHINE_MESSAGE_TYPE, {
		requestClass: DeleteGraphMessage,
		parameterMapping: (context, parameters) => parameters,
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.GET_MACHINE_MESSAGE_TYPE, {
		requestClass: GetGraphMessage,
		parameterMapping: (context, parameters) => parameters,
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE, {
		requestClass: LoadGraphMessage,
		parameterMapping: (context, parameters) => {
			const streamsheets = context.message.machineserver.machine.streamsheets.map(streamsheet => ({
				id: streamsheet.id,
				sheet: streamsheet.sheet
			}));
			parameters.streamsheets = streamsheets;
			return parameters;
		},
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE, {
		requestClass: LoadSubscribeGraphMessage,
		parameterMapping: (context, parameters) => {
			parameters.machine = context.message.machineserver.machine;
			return parameters;
		},
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_MACHINE_MESSAGE_TYPE, {
		requestClass: SubscribeGraphMessage,
		parameterMapping: (context, parameters) => {
			parameters.machine = context.message.machineserver.machine;
			return parameters;
		},
		target: TARGET_GRAPH_SERVER
	}],
	[GatewayMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE, {
		requestClass: UnsubscribeGraphMessage,
		parameterMapping: (context, parameters) => parameters,
		target: TARGET_GRAPH_SERVER
	}]
]);

module.exports = class GraphServerInterceptor extends Interceptor {
	beforeSendToClient(context) {
		if (context.message && context.message.type === 'event') {
			return this._handleServerEvent(context);
		}
		if (context.message && context.message.type === 'response') {
			return this._handleMachineServerResponse(context);
		}
		return Promise.resolve(context);
	}
	_handleServerEvent(context) {
		const event = context.message.event;
		const graphserver = context.connection.graphserver;
		if (graphserver) {
			switch (event.type) {
			// eslint-disable-next-line
			case MachineServerMessagingProtocol.EVENTS.STREAMSHEET_STEP: {
				const message = {
					type: GraphServerMessagingProtocol.MESSAGE_TYPES.UPDATE_PROCESS_SHEET_MESSAGE_TYPE,
					streamsheet: {
						id: event.srcId,
						cells: event.result
					},
					machineId: event.machineId
				};
				return graphserver.send(message)
					.then(() => Promise.resolve(context));
			}
			/*
			// eslint-disable-next-line
			case MachineServerMessagingProtocol.EVENTS.MESSAGE_PUT:
				const messagePutMessage = {
					type: GraphServerMessagingProtocol.MESSAGE_TYPES.MESSAGE_PUT,
					message: event.message,
					machineId: event.machineId,
					src: event.src,
					srcId: event.srcId,
					streamsheetId: event.streamsheetId
				};
				// the graph server then produces a command event that is send to the client
				return graphserver.send(messagePutMessage)
				// additionally the initial message put event is send to the client
					.then(() => Promise.resolve(context));
			case MachineServerMessagingProtocol.EVENTS.MESSAGE_POP:
				// the graph server then produces a command event that is send to the client
				return graphserver.send(event)
					// additionally the initial message pop event is send to the client
					.then(() => Promise.resolve(context));
			*/
			default:
			}
		}
		return Promise.resolve(context);
	}

	async _handleMachineServerResponse(context) {
		const { message } = context;
		const requestMapping = REQUEST_MAPPINGS.get(message.requestType);
		if (requestMapping && message.machineserver) {
			logger.info(`Handle machine-server response to request: ${message.requestType}(${message.requestId})...`);
			// TODO: add error handling
			const { requestClass, parameterMapping, target } = requestMapping;
			const serverConnection = context.connection[target];
			try {
				const parameters = parameterMapping(context, {
					id: message.requestId,
					machineId: message.machineserver.machine.id,
					templateId: message.machineserver.templateId
				});
				// eslint-disable-next-line
				const request = new requestClass(parameters);
				const response = await serverConnection.send(request.toJSON(), request.id);
				message.graphserver = response.response;
				return context;
			} catch (err) {
				logger.error('Failed to handle machine-server response!', err, message);
			}
		} else {
			const reason = !requestMapping
				? 'Request not handled by graph-server...'
				: 'Response context contains no machineserver-object...';
			logger.debug(`Ignore response to request: ${message.requestType}(${message.requestId}). ${reason}`);
		}
		return context;
	}

	interceptBeforeSendToServer(message) {
		if (message) {
			return INTERCEPTED_MESSAGE_TYPES.includes(message.type);
		}
		return false;
	}

	beforeSendToServer(context) {
		const interceptBeforeSendToServer = this.interceptBeforeSendToServer(context.message);
		context.graphserver = interceptBeforeSendToServer;
		return Promise.resolve(context);
	}
};
