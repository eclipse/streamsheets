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
const { GatewayMessagingProtocol } = require('@cedalo/protocols');

const { LoadSheetCellsMessage } = require('../messages/Messages');

const INTERCEPTED_MESSAGE_TYPES = [
	GatewayMessagingProtocol.MESSAGE_TYPES.ADD_INBOX_MESSAGE,
	GatewayMessagingProtocol.MESSAGE_TYPES.COMMAND_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.CREATE_STREAMSHEET_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.DELETE_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.DELETE_STREAMSHEET_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.GET_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.GET_MACHINES_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.MACHINE_UPDATE_SETTINGS_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.META_INFORMATION_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.PAUSE_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.RENAME_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.STREAMSHEET_STREAM_UPDATE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.SAVE_MACHINE_AS_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.SET_NAMED_CELLS,
	GatewayMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_LOCALE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.START_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.START_MACHINES_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.STEP_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.STOP_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.STOP_MACHINES_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.SUBSCRIBE_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.UNSUBSCRIBE_MACHINE_MESSAGE_TYPE,
	GatewayMessagingProtocol.MESSAGE_TYPES.UNLOAD_MACHINE_MESSAGE_TYPE
];

const IGNORED_CMDS = ['command.SetTreeItemExpandFlagCommand'];

const TARGET_MACHINE_SERVER = 'machineserver';

const LOAD_SHEET_CELLS_REQUEST = {
	requestClass: LoadSheetCellsMessage,
	parameterMapping: (context, parameters) => {
		parameters.machineId = context.message.graphserver.graph.machineId;
		parameters.command = context.message.graphserver.command;
		parameters.machineDescriptor = context.message.graphserver.machineDescriptor;
		return parameters;
	},
	target: TARGET_MACHINE_SERVER
};
const REQUEST_MAPPINGS = new Map([
	['command.PasteCellsFromClipboardCommand', LOAD_SHEET_CELLS_REQUEST],
	['command.DeleteCellsCommand', LOAD_SHEET_CELLS_REQUEST],
	['command.InsertCellsCommand', LOAD_SHEET_CELLS_REQUEST]
]);

module.exports = class MachineServerInterceptor extends Interceptor {

	beforeSendToClient(context) {
		if (context.message && context.message.type === 'response') {
			return this._handleServerResponse(context);
		}
		return Promise.resolve(context);
	}

	async beforeSendToServer(context) {
		const doIntercept = this.interceptBeforeSendToServer(context.message);
		context.machineserver = doIntercept;
		return context;
	}

	interceptBeforeSendToServer(message) {
		if (message && INTERCEPTED_MESSAGE_TYPES.includes(message.type)) {
			return (
				!message.command || !IGNORED_CMDS.includes(message.command.name)
			);
		}
		return false;
	}

	async _handleServerResponse(context) {
		if (context.message.requestType === 'command') {
			const server = context.message.graphserver || context.message.machineserver;
			const command = server ? server.command : undefined;
			const requestMapping = command ? REQUEST_MAPPINGS.get(command.name) : undefined;
			if (requestMapping) {
				// TODO: add error handling
				const { requestClass, parameterMapping, target } = requestMapping;
				const serverConnection = context.connection[target];
				const parameters = parameterMapping(context, {
					id: context.message.requestId
				});
				// eslint-disable-next-line
				const request = new requestClass(parameters);
				const response = await serverConnection.send(request.toJSON(), request.id);
				context.message.machineserver = response.response;
				return context;
			}
		}
		return context;
	}
};
