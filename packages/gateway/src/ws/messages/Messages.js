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
'use strict';

const { RequestMessage } = require('@cedalo/messages');

const {
	CREATE_GRAPH_MESSAGE_TYPE,
	CREATE_STREAMSHEET_MESSAGE_TYPE,
	DELETE_GRAPH_MESSAGE_TYPE,
	DELETE_STREAMSHEET_MESSAGE_TYPE,
	GET_GRAPH_MESSAGE_TYPE,
	LOAD_GRAPH_MESSAGE_TYPE,
	LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE,
	SUBSCRIBE_GRAPH_MESSAGE_TYPE,
	UNSUBSCRIBE_GRAPH_MESSAGE_TYPE
} = require('@cedalo/protocols').GraphServerMessagingProtocol.MESSAGE_TYPES;

const {
	LOAD_SHEET_CELLS
} = require('@cedalo/protocols').MachineServerMessagingProtocol.MESSAGE_TYPES;

class CreateGraphMessage extends RequestMessage {

	constructor({ machineId }) {
		super(CREATE_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class CreateStreamSheetMessage extends RequestMessage {

	constructor({ machineId, streamsheetId, streamsheetName, activeItemId, position }) {
		super(CREATE_STREAMSHEET_MESSAGE_TYPE);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._streamsheetName = streamsheetName;
		this._activeItemId = activeItemId;
		this._position = position;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			streamsheetName: this._streamsheetName,
			activeItemId: this._activeItemId,
			position: this._position
		};
	}

}

class DeleteStreamSheetMessage extends RequestMessage {

	constructor({ machineId, streamsheetId }) {
		super(DELETE_STREAMSHEET_MESSAGE_TYPE);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId
		};
	}

}

class DeleteGraphMessage extends RequestMessage {

	constructor({ machineId }) {
		super(DELETE_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class GetGraphMessage extends RequestMessage {

	constructor({ machineId }) {
		super(GET_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class LoadGraphMessage extends RequestMessage {

	constructor({ machineId, templateId, streamsheets }) {
		super(LOAD_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
		this._templateId = templateId;
		this._streamsheets = streamsheets;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			templateId: this._templateId,
			streamsheets: this._streamsheets
		};
	}

}

class LoadSubscribeGraphMessage extends RequestMessage {

	constructor({ machineId, templateId, machine }) {
		super(LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
		this._templateId = templateId;
		this._machine = machine;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			templateId: this._templateId,
			machine: this._machine
		};
	}

}


class LoadSheetCellsMessage extends RequestMessage {

	constructor({ machineId, streamsheetId, cellDescriptors, command, machineDescriptor }) {
		super(LOAD_SHEET_CELLS);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._cellDescriptors = cellDescriptors;
		this._machineDescriptor = machineDescriptor;
		this._command = command;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			cellDescriptors: this._cellDescriptors,
			machineDescriptor: this._machineDescriptor,
			command: this._command
		};
	}
}

class SubscribeGraphMessage extends RequestMessage {

	constructor({ machineId, machine }) {
		super(SUBSCRIBE_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
		this._machine = machine;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			machine: this._machine
		};
	}

}

class UnsubscribeGraphMessage extends RequestMessage {

	constructor({ machineId }) {
		super(UNSUBSCRIBE_GRAPH_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

module.exports = {
	CreateGraphMessage,
	CreateStreamSheetMessage,
	DeleteGraphMessage,
	DeleteStreamSheetMessage,
	GetGraphMessage,
	LoadGraphMessage,
	LoadSubscribeGraphMessage,
	LoadSheetCellsMessage,
	SubscribeGraphMessage,
	UnsubscribeGraphMessage
};
