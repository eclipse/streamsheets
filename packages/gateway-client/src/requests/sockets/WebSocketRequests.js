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

const WebSocketRequest = require('./WebSocketRequest');

const {
	// Graph request types
	LOAD_GRAPH_MESSAGE_TYPE,
	SUBSCRIBE_GRAPH_MESSAGE_TYPE,
	UNSUBSCRIBE_GRAPH_MESSAGE_TYPE,
	// Machine request types
	ADD_INBOX_MESSAGE,
	CREATE_STREAMSHEET_MESSAGE_TYPE,
	DELETE_MACHINE_MESSAGE_TYPE,
	DELETE_STREAMSHEET_MESSAGE_TYPE,
	GET_MACHINE_MESSAGE_TYPE,
	GET_MACHINES_MESSAGE_TYPE,
	LOAD_MACHINE_MESSAGE_TYPE,
	UNLOAD_MACHINE_MESSAGE_TYPE,
	LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE,
	MACHINE_UPDATE_SETTINGS_MESSAGE_TYPE,
	PAUSE_MACHINE_MESSAGE_TYPE,
	RENAME_MACHINE_MESSAGE_TYPE,
	STREAMSHEET_STREAM_UPDATE_TYPE,
	UPDATE_MACHINE_IMAGE_MESSAGE_TYPE,
	UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE,
	SAVE_MACHINE_AS_MESSAGE_TYPE,
	SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE,
	SET_MACHINE_LOCALE_MESSAGE_TYPE,
	SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE,
	CONFIRM_PROCESSED_MACHINE_STEP,
	SET_NAMED_CELLS,
	SET_GRAPH_CELLS,
	START_MACHINE_MESSAGE_TYPE,
	START_MACHINES_MESSAGE_TYPE,
	STEP_MACHINE_MESSAGE_TYPE,
	STOP_MACHINE_MESSAGE_TYPE,
	STOP_MACHINES_MESSAGE_TYPE,
	SUBSCRIBE_MACHINE_MESSAGE_TYPE,
	REDO_MESSAGE_TYPE,
	UNDO_MESSAGE_TYPE,
	UNSUBSCRIBE_MACHINE_MESSAGE_TYPE,
	// General request types
	COMMAND_MESSAGE_TYPE,
	USER_GET_MESSAGE_TYPE,
	USER_SAVE_MESSAGE_TYPE,
	USER_SETTINGS_GET_MESSAGE_TYPE,
	USER_SETTINGS_SAVE_MESSAGE_TYPE,
	USER_LOGIN_MESSAGE_TYPE,
	USER_LOGOUT_MESSAGE_TYPE,
	AUTH_ENTITY_CREATE_MESSAGE_TYPE,
	AUTH_ENTITY_GET_MESSAGE_TYPE,
	AUTH_ENTITY_DELETE_MESSAGE_TYPE,
	AUTH_ENTITY_UPDATE_MESSAGE_TYPE
} = require('@cedalo/protocols').GatewayMessagingProtocol.MESSAGE_TYPES;

const {
	STREAM_CONFIG_SAVE,
	STREAMS_CONFIG_LOAD_ALL,
	STREAM_CONFIG_DELETE,
	STREAM_RELOAD,
	STREAM_COMMAND_MESSAGE_TYPE
} = require('@cedalo/protocols').StreamsMessagingProtocol.MESSAGE_TYPES;

const {
	SERVICES_STREAMS_INPUT,
	SERVICES_PERSISTENCE_INPUT,
	SERVICES_AUTH_INPUT
} = require('@cedalo/protocols').Topics;

class StreamCommandSocketRequest extends WebSocketRequest {
	constructor(ws, scope, cmd) {
		super(ws, STREAM_COMMAND_MESSAGE_TYPE);
		this._topic = SERVICES_STREAMS_INPUT;
		this._cmd = cmd;
		this._scope = scope;
	}

	_getConfig() {
		return {
			cmd: this._cmd,
			topic: this._topic,
			scope: this._scope
		};
	}
}

/**
 * ******************************************************************************************
 * DS Configurations requests
 * ******************************************************************************************
 */

class DSConfigurationSaveSocketRequest extends WebSocketRequest {
	constructor(ws, scope, configuration) {
		super(ws, STREAM_CONFIG_SAVE);
		this._topic = SERVICES_STREAMS_INPUT;
		this._configuration = configuration;
		this._scope = scope;
	}

	_getConfig() {
		return {
			configuration: this._configuration,
			topic: this._topic,
			scope: this._scope
		};
	}
}

class DSConfigurationLoadAllSocketRequest extends WebSocketRequest {
	constructor(ws, scope) {
		super(ws, STREAMS_CONFIG_LOAD_ALL);
		this._topic = SERVICES_STREAMS_INPUT;
		this._scope = scope;
	}

	_getConfig() {
		return {
			topic: this._topic,
			scope: this._scope
		};
	}
}

class DSConfigurationDeleteSocketRequest extends WebSocketRequest {
	constructor(ws, scope, configId) {
		super(ws, STREAM_CONFIG_DELETE);
		this._topic = SERVICES_STREAMS_INPUT;
		this._configId = configId;
		this._scope = scope;

	}

	_getConfig() {
		return {
			topic: this._topic,
			configId: this._configId,
			scope: this._scope
		};
	}
}

class DSReloadSocketRequest extends WebSocketRequest {
	constructor(ws, scope, sources) {
		super(ws, STREAM_RELOAD);
		this._topic = SERVICES_STREAMS_INPUT;
		this._sources = sources;
		this._scope = scope;
	}

	_getConfig() {
		return {
			topic: this._topic,
			sources: this._sources,
			scope: this._scope
		};
	}
}

/**
 * ******************************************************************************************
 * User requests
 * ******************************************************************************************
 */
class UserLoginSocketRequest extends WebSocketRequest {
	constructor(ws, credentials) {
		super(ws, USER_LOGIN_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._credentials = credentials;
	}

	_getConfig() {
		return {
			topic: this._topic,
			credentials: this._credentials
		};
	}
}

class UserLogoutSocketRequest extends WebSocketRequest {
	constructor(ws, id) {
		super(ws, USER_LOGOUT_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._id = id;
	}

	_getConfig() {
		return {
			topic: this._topic,
			id: this._id
		};
	}
}

class AuthEntityGetSocketRequest extends WebSocketRequest {
	constructor(ws, entity) {
		super(ws, AUTH_ENTITY_GET_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._entity = entity;
	}

	_getConfig() {
		return {
			topic: this._topic,
			entity: this._entity
		};
	}
}

class AuthEntityCreateSocketRequest extends WebSocketRequest {
	constructor(ws, entity) {
		super(ws, AUTH_ENTITY_CREATE_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._entity = entity;
	}

	_getConfig() {
		return {
			topic: this._topic,
			entity: this._entity
		};
	}
}

class AuthEntityDeleteSocketRequest extends WebSocketRequest {
	constructor(ws, entity) {
		super(ws, AUTH_ENTITY_DELETE_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._entity = entity;
	}

	_getConfig() {
		return {
			topic: this._topic,
			entity: this._entity
		};
	}
}

class AuthEntityUpdateSocketRequest extends WebSocketRequest {
	constructor(ws, entity) {
		super(ws, AUTH_ENTITY_UPDATE_MESSAGE_TYPE);
		this._entity = entity;
		this._topic = SERVICES_AUTH_INPUT;
	}

	_getConfig() {
		return {
			topic: this._topic,
			entity: this._entity
		};
	}
}

class UserSettingGetSocketRequest extends WebSocketRequest {
	constructor(ws, userId) {
		super(ws, USER_SETTINGS_GET_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._userId = userId;
	}

	_getConfig() {
		return {
			topic: this._topic,
			userId: this._userId
		};
	}
}

class UserSettingsSaveSocketRequest extends WebSocketRequest {
	constructor(ws, userId, settings) {
		super(ws, USER_SETTINGS_SAVE_MESSAGE_TYPE);
		this._topic = SERVICES_AUTH_INPUT;
		this._userId = userId;
		this._settings = settings;
	}

	_getConfig() {
		return {
			topic: this._topic,
			userId: this._userId,
			settings: this._settings
		};
	}
}

class UserGetSocketRequest extends WebSocketRequest {
	constructor(ws, userId) {
		super(ws, USER_GET_MESSAGE_TYPE);
		this._userId = userId;
	}

	_getConfig() {
		return {
			userId: this._userId
		};
	}
}

class UserSaveSocketRequest extends WebSocketRequest {
	constructor(ws, user) {
		super(ws, USER_SAVE_MESSAGE_TYPE);
		this._user = user;
	}

	_getConfig() {
		return {
			user: this._user
		};
	}
}

/**
 * ******************************************************************************************
 * Graph requests
 * ******************************************************************************************
 */

class LoadGraphWebSocketRequest extends WebSocketRequest {
	constructor(ws, graphId) {
		super(ws, LOAD_GRAPH_MESSAGE_TYPE);
		this._graphId = graphId;
	}

	_getConfig() {
		return {
			graphId: this._graphId
		};
	}
}

class SubscribeGraphWebSocketRequest extends WebSocketRequest {
	constructor(ws, graphId) {
		super(ws, SUBSCRIBE_GRAPH_MESSAGE_TYPE);
		this._graphId = graphId;
	}

	_getConfig() {
		return {
			graphId: this._graphId
		};
	}
}

class UnsubscribeGraphWebSocketRequest extends WebSocketRequest {
	constructor(ws, graphId) {
		super(ws, UNSUBSCRIBE_GRAPH_MESSAGE_TYPE);
		this._graphId = graphId;
	}

	_getConfig() {
		return {
			graphId: this._graphId
		};
	}
}

/**
 * ******************************************************************************************
 * Machine requests
 * ******************************************************************************************
 */

class CreateStreamSheetWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, activeItemId, position) {
		super(ws, CREATE_STREAMSHEET_MESSAGE_TYPE);
		this._machineId = machineId;
		this._activeItemId = activeItemId;
		this._position = position;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			activeItemId: this._activeItemId,
			position: this._position
		};
	}
}

class DeleteMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, DELETE_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class UnloadMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, UNLOAD_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class DeleteStreamSheetWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetId) {
		super(ws, DELETE_STREAMSHEET_MESSAGE_TYPE);
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

class GetMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, GET_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class GetMachinesWebSocketRequest extends WebSocketRequest {
	constructor(ws) {
		super(ws, GET_MACHINES_MESSAGE_TYPE);
	}

	_getConfig() {
		return {};
	}
}

class LoadMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, settings) {
		super(ws, LOAD_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
		this._settings = settings;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			settings: this._settings
		};
	}
}

class LoadSubscribeMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, settings, scope) {
		super(ws, LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
		this._settings = settings;
		this._scope = scope;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			settings: this._settings,
			scope: this._scope
		};
	}
}

class PauseMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, PAUSE_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class UpdateMachineImageWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, previewImage) {
		super(ws, UPDATE_MACHINE_IMAGE_MESSAGE_TYPE);
		this._topic = SERVICES_PERSISTENCE_INPUT;
		this._machineId = machineId;
		this._previewImage = previewImage;
	}

	_getConfig() {
		return {
			topic: this._topic,
			machineId: this._machineId,
			previewImage: this._previewImage
		};
	}
}

class UpdateMachineTitleImageWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, titleImage) {
		super(ws, UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE);
		this._topic = SERVICES_PERSISTENCE_INPUT;
		this._machineId = machineId;
		this._titleImage = titleImage;
	}

	_getConfig() {
		return {
			topic: this._topic,
			machineId: this._machineId,
			titleImage: this._titleImage
		};
	}
}

class UpdateStreamSheetStreamsWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetId, streams) {
		super(ws, STREAMSHEET_STREAM_UPDATE_TYPE);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._streams = streams;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			streams: this._streams
		};
	}
}

class RenameMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, newName) {
		super(ws, RENAME_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
		this._newName = newName;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			newName: this._newName
		};
	}
}

class SetNamedCellsWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetId, namedCells) {
		super(ws, SET_NAMED_CELLS);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._namedCells = namedCells;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			namedCells: this._namedCells
		};
	}
}

class SetGraphCellsWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetId, graphCells) {
		super(ws, SET_GRAPH_CELLS);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this.graphCells = graphCells;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			graphCells: this.graphCells
		};
	}
}

class AddInboxMessageWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetId, message, metadata) {
		super(ws, ADD_INBOX_MESSAGE);
		this._machineId = machineId;
		this._streamsheetId = streamsheetId;
		this._message = message;
		this._metadata = metadata;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetId: this._streamsheetId,
			message: this._message,
			metadata: this._metadata
		};
	}
}

class SaveMachineAsWebSocketRequest extends WebSocketRequest {
	constructor(ws, originalMachineId, newName) {
		super(ws, SAVE_MACHINE_AS_MESSAGE_TYPE);
		this._originalMachineId = originalMachineId;
		this._newName = newName;
	}

	_getConfig() {
		return {
			originalMachineId: this._originalMachineId,
			newName: this._newName
		};
	}
}

class ConfirmProcessedMachineStepRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, CONFIRM_PROCESSED_MACHINE_STEP);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class StartMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, START_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class StartMachinesWebSocketRequest extends WebSocketRequest {
	constructor(ws) {
		super(ws, START_MACHINES_MESSAGE_TYPE);
	}

	_getConfig() {
		return {};
	}
}

class SetCycleTimeWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, cycleTime) {
		super(ws, SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE);
		this._machineId = machineId;
		this._cycleTime = cycleTime;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			cycleTime: this._cycleTime
		};
	}
}

class SetMachineLocaleWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, locale) {
		super(ws, SET_MACHINE_LOCALE_MESSAGE_TYPE);
		this._machineId = machineId;
		this._locale = locale;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			locale: this._locale
		};
	}
}

class SetStreamSheetStepIntervalWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, streamsheetStepInterval) {
		super(ws, SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE);
		this._machineId = machineId;
		this._streamsheetStepInterval = streamsheetStepInterval;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			streamsheetStepInterval: this._streamsheetStepInterval
		};
	}
}

class StepMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, STEP_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class StopMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, STOP_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class StopMachinesWebSocketRequest extends WebSocketRequest {
	constructor(ws) {
		super(ws, STOP_MACHINES_MESSAGE_TYPE);
	}

	_getConfig() {
		return {};
	}
}


class SubscribeMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, SUBSCRIBE_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class RedoWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, REDO_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class UndoWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, UNDO_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class UnsubscribeMachineWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId) {
		super(ws, UNSUBSCRIBE_MACHINE_MESSAGE_TYPE);
		this._machineId = machineId;
	}

	_getConfig() {
		return {
			machineId: this._machineId
		};
	}
}

class UpdateMachineSettingsWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, settings) {
		super(ws, MACHINE_UPDATE_SETTINGS_MESSAGE_TYPE);
		this._machineId = machineId;
		this._settings = settings;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			settings: this._settings
		};
	}
}

/**
 * ******************************************************************************************
 * General requests
 * ******************************************************************************************
 */
class CommandWebSocketRequest extends WebSocketRequest {
	constructor(ws, machineId, graphId, command, undo = false, redo = false) {
		super(ws, COMMAND_MESSAGE_TYPE);
		this._machineId = machineId;
		this._graphId = graphId;
		this._command = command;
		this._undo = undo;
		this._redo = redo;
	}

	_getConfig() {
		return {
			machineId: this._machineId,
			graphId: this._graphId,
			command: this._command,
			undo: this._undo,
			redo: this._redo
		};
	}
}

module.exports = {
	// Graph requests
	LoadGraphWebSocketRequest,
	SubscribeGraphWebSocketRequest,
	UnsubscribeGraphWebSocketRequest,
	// Machine requests
	AddInboxMessageWebSocketRequest,
	CreateStreamSheetWebSocketRequest,
	DeleteMachineWebSocketRequest,
	DeleteStreamSheetWebSocketRequest,
	GetMachineWebSocketRequest,
	GetMachinesWebSocketRequest,
	LoadMachineWebSocketRequest,
	LoadSubscribeMachineWebSocketRequest,
	PauseMachineWebSocketRequest,
	RenameMachineWebSocketRequest,
	UpdateMachineImageWebSocketRequest,
	UpdateMachineTitleImageWebSocketRequest,
	UpdateMachineSettingsWebSocketRequest,
	UpdateStreamSheetStreamsWebSocketRequest,
	SaveMachineAsWebSocketRequest,
	SetCycleTimeWebSocketRequest,
	SetMachineLocaleWebSocketRequest,
	SetStreamSheetStepIntervalWebSocketRequest,
	ConfirmProcessedMachineStepRequest,
	SetNamedCellsWebSocketRequest,
	SetGraphCellsWebSocketRequest,
	StartMachineWebSocketRequest,
	StartMachinesWebSocketRequest,
	StepMachineWebSocketRequest,
	StopMachineWebSocketRequest,
	StopMachinesWebSocketRequest,
	SubscribeMachineWebSocketRequest,
	RedoWebSocketRequest,
	UndoWebSocketRequest,
	UnloadMachineWebSocketRequest,
	UnsubscribeMachineWebSocketRequest,
	// General requests
	CommandWebSocketRequest,
	UserGetSocketRequest,
	UserSaveSocketRequest,
	UserSettingGetSocketRequest,
	UserSettingsSaveSocketRequest,
	DSConfigurationSaveSocketRequest,
	DSConfigurationLoadAllSocketRequest,
	DSConfigurationDeleteSocketRequest,
	DSReloadSocketRequest,
	UserLoginSocketRequest,
	UserLogoutSocketRequest,
	AuthEntityCreateSocketRequest,
	AuthEntityDeleteSocketRequest,
	AuthEntityUpdateSocketRequest,
	AuthEntityGetSocketRequest,
	StreamCommandSocketRequest
};
