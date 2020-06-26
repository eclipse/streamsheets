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

const BaseMessage = require('../core/BaseMessage');

const {
	CREATE_GRAPH_MESSAGE_TYPE,
	CREATE_STREAMSHEET_MESSAGE_TYPE,
	DELETE_GRAPH_MESSAGE_TYPE,
	DELETE_STREAMSHEET_MESSAGE_TYPE,
	GET_GRAPH_MESSAGE_TYPE,
	LOAD_GRAPH_MESSAGE_TYPE,
	SUBSCRIBE_GRAPH_MESSAGE_TYPE,
	UNSUBSCRIBE_GRAPH_MESSAGE_TYPE
} = require('@cedalo/protocols').GraphServerMessagingProtocol.MESSAGE_TYPES;

const {
	LOAD_SHEET_CELLS
} = require('@cedalo/protocols').MachineServerMessagingProtocol.MESSAGE_TYPES;

class CreateGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId }) {
		super({ serverConnection, type: CREATE_GRAPH_MESSAGE_TYPE });
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class CreateStreamSheetMessage extends BaseMessage {

	constructor({ serverConnection, machineId, streamsheetId, activeItemId, position }) {
		super({ serverConnection, type: CREATE_STREAMSHEET_MESSAGE_TYPE });
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._activeItemId = activeItemId;
		this._position = position;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			activeItemId: this._activeItemId,
			position: this._position
		};
	}

}

class DeleteStreamSheetMessage extends BaseMessage {

	constructor({ serverConnection, machineId, streamsheetId }) {
		super({ serverConnection, type: DELETE_STREAMSHEET_MESSAGE_TYPE });
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

class DeleteGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId }) {
		super({ serverConnection, type: DELETE_GRAPH_MESSAGE_TYPE });
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class GetGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId }) {
		super({ serverConnection, type: GET_GRAPH_MESSAGE_TYPE });
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class LoadGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId, templateId, streamsheets }) {
		super({ serverConnection, type: LOAD_GRAPH_MESSAGE_TYPE });
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


class LoadSheetCellsMessage extends BaseMessage {

	constructor({ serverConnection, machineId, streamsheetId, cellDescriptors, command }) {
		super({ serverConnection, type: LOAD_SHEET_CELLS });
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._cellDescriptors = cellDescriptors;
		this._command = command;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			cellDescriptors: this._cellDescriptors,
			command: this._command
		};
	}

}

class SubscribeGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId }) {
		super({ serverConnection, type: SUBSCRIBE_GRAPH_MESSAGE_TYPE });
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}

}

class UnsubscribeGraphMessage extends BaseMessage {

	constructor({ serverConnection, machineId }) {
		super({ serverConnection, type: UNSUBSCRIBE_GRAPH_MESSAGE_TYPE });
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
	LoadSheetCellsMessage,
	SubscribeGraphMessage,
	UnsubscribeGraphMessage
};
