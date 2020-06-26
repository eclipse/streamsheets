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

const MachineServerEvents = require('./MachineServerMessagingProtocol').EVENTS;
const MachineServerMessageTypes = require('./MachineServerMessagingProtocol').MESSAGE_TYPES;
/**
 * ******************************************************************************************
 * Machine request types
 * ******************************************************************************************
 */

const ADD_INBOX_MESSAGE = 'add_inbox_message';
const CREATE_STREAMSHEET_MESSAGE_TYPE = 'streamsheet_create';
const GET_MACHINE_MESSAGE_TYPE = 'machine_get';
const GET_MACHINES_MESSAGE_TYPE = 'machineserver_machines';
const DELETE_MACHINE_MESSAGE_TYPE = 'machine_delete';
const DELETE_STREAMSHEET_MESSAGE_TYPE = 'streamsheet_delete';
const LOAD_MACHINE_MESSAGE_TYPE = 'machine_load';
const UNLOAD_MACHINE_MESSAGE_TYPE = 'machine_unload';
const META_INFORMATION_MESSAGE_TYPE = 'meta_information';
const RENAME_MACHINE_MESSAGE_TYPE = 'machine_rename';
const PAUSE_MACHINE_MESSAGE_TYPE = 'machine_pause';
const PING_MACHINESOCKETSERVER_MESSAGE_TYPE = 'ping_machinesocketserver';
const SAVE_MACHINE_AS_MESSAGE_TYPE = 'machine_save_as';
const SAVE_MACHINE_COPY_MESSAGE_TYPE = 'machine_save_copy';
const SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE = 'machine_set_cycle_time';
const SET_MACHINE_LOCALE_MESSAGE_TYPE = MachineServerMessageTypes.SET_MACHINE_LOCALE_MESSAGE_TYPE;
const SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE = 'machine_set_update_interval';
const SET_NAMED_CELLS = 'set_named_cells';
const SET_GRAPH_CELLS = 'set_graph_cells';
const SET_SHEET_CELLS = 'set_sheet_cells';
const START_CONTROL_MODE_MESSAGE_TYPE = 'machine_start_control_mode';
const CONFIRM_PROCESSED_MACHINE_STEP = 'confirm_processed_machine_step';
const START_MACHINE_MESSAGE_TYPE = 'machine_start';
const START_MACHINES_MESSAGE_TYPE = 'machines_start';
const STEP_MACHINE_MESSAGE_TYPE = 'machine_step';
const STOP_CONTROL_MODE_MESSAGE_TYPE = 'machine_stop_control_mode';
const STOP_MACHINE_MESSAGE_TYPE = 'machine_stop';
const STOP_MACHINES_MESSAGE_TYPE = 'machines_stop';
const SUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_subscribe';
const SUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_subscribe';
const REDO_MESSAGE_TYPE = 'redo';
const UNDO_MESSAGE_TYPE = 'undo';
const UPDATE_MACHINE_IMAGE_MESSAGE_TYPE = 'update_machine_image';
const UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE = 'update_machine_title_image';
const UPDATE_PROCESS_SHEET_MESSAGE_TYPE = 'update_process_sheets';
const UNSUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_unsubscribe';
const UNSUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_unsubscribe';
const LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_load_subscribe';
const LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_load_subscribe';


/**
 * ******************************************************************************************
 * Graph request types
 * ******************************************************************************************
 */

const PING_GRAPHSOCKETSERVER_MESSAGE_TYPE = 'ping_graphsocketserver';

/**
 * ******************************************************************************************
 * General request types
 * ******************************************************************************************
 */

const COMMAND_MESSAGE_TYPE = 'command';
const SELECTION_MESSAGE_TYPE = 'selection';

/**
 * ******************************************************************************************
 * Events
 * ******************************************************************************************
 */

const COMMAND_EVENT = 'command';
const GATEWAY_DISCONNECTED_EVENT = 'gateway_disconnected';
const GRAPH_SERVER_CONNECTED_EVENT = 'graphserver_connected';
const GRAPH_SERVER_DISCONNECTED_EVENT = 'graphserver_disconnected';
const SESSION_INIT_EVENT = 'session_init';
const LICENSE_INFO_EVENT = 'license_information';
const MACHINE_CYCLETIME_EVENT = 'machine_cycletime';
const MACHINE_RENAME_EVENT = 'machine_rename';
const MACHINE_FUNCTIONS_EVENT = 'machine_functions';
const MACHINE_SERVER_CONNECTED_EVENT = 'machineserver_connected';
const MACHINE_SERVER_DISCONNECTED_EVENT = 'machineserver_disconnected';
const MACHINE_STATE_EVENT = 'machine_state';
const MACHINE_STEP_EVENT = 'machine_step';
const MESSAGE_ADD_EVENT = 'message_add';
const RESPOND_EVENT = 'respond';
const SHEET_STEP_EVENT = 'sheet_step';
const SHEET_UPDATE_EVENT = 'sheet_update';
const SELECTION_EVENT = 'selection';
const MESSAGE_BOX_CLEAR = 'message_box_clear';
const MESSAGE_PUT = 'message_put';
const MESSAGE_POP = 'message_pop';
const MESSAGE_CHANGED = 'message_changed';
const SERVICE_EVENT = 'service';
const SERVICE_CONNECTED_EVENT = 'service_connected';
const SERVICE_DISCONNECTED_EVENT = 'service_disconnected';
const STREAMSHEET_MESSAGE_ATTACHED = 'streamsheet_message_attached';
const STREAMSHEET_MESSAGE_DETACHED = 'streamsheet_message_detached';
const STREAMSHEET_STEP_EVENT = 'streamsheet_step';
const STREAMSHEET_STREAM_UPDATE_TYPE = 'streamsheet_stream_update';
const STREAMSHEET_STREAM_UPDATED = 'streamsheet_stream_updated';
const USER_JOINED_EVENT = 'user_joined';
const USER_LEFT_EVENT = 'user_left';
const STREAMS_RELOAD_EVENT = 'stream_reload';
const USER_GET_MESSAGE_TYPE = 'user_get';
const AUTH_DATA_MESSAGE_TYPE = 'auth_data';
const USER_SAVE_MESSAGE_TYPE = 'user_save';
const USER_SETTINGS_GET_MESSAGE_TYPE = 'user_settings_get';
const USER_LOGIN_MESSAGE_TYPE = 'user_login';
const USER_LOGOUT_MESSAGE_TYPE = 'user_logout';
const USER_SETTINGS_SAVE_MESSAGE_TYPE = 'user__settings_save';
const AUTH_ENTITY_GET_MESSAGE_TYPE = 'auth_entity_get';
const AUTH_ENTITY_CREATE_MESSAGE_TYPE = 'auth_entity_create';
const AUTH_ENTITY_DELETE_MESSAGE_TYPE = 'auth_entity_delete';
const AUTH_ENTITY_UPDATE_MESSAGE_TYPE = 'auth_entity_update';
const STREAM_CONTROL_EVENT = 'stream_control_event';
const REDIRECT = 'redirect';

module.exports = {
	MESSAGE_TYPES: {
		// Machine request types
		ADD_INBOX_MESSAGE,
		AUTH_DATA_MESSAGE_TYPE,
		CREATE_STREAMSHEET_MESSAGE_TYPE,
		DELETE_MACHINE_MESSAGE_TYPE,
		DELETE_STREAMSHEET_MESSAGE_TYPE,
		GET_MACHINE_MESSAGE_TYPE,
		GET_MACHINES_MESSAGE_TYPE,
		LOAD_MACHINE_MESSAGE_TYPE,
		UNLOAD_MACHINE_MESSAGE_TYPE,
		LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE,
		MACHINE_UPDATE_SETTINGS_MESSAGE_TYPE: MachineServerMessageTypes.MACHINE_UPDATE_SETTINGS,
		META_INFORMATION_MESSAGE_TYPE,
		OPEN_MACHINE_MESSAGE_TYPE: MachineServerMessageTypes.OPEN_MACHINE_MESSAGE_TYPE,
		PAUSE_MACHINE_MESSAGE_TYPE,
		RENAME_MACHINE_MESSAGE_TYPE,
		STREAMSHEET_STREAM_UPDATE_TYPE,
		PING_MACHINESOCKETSERVER_MESSAGE_TYPE,
		SAVE_MACHINE_AS_MESSAGE_TYPE,
		SAVE_MACHINE_COPY_MESSAGE_TYPE,
		SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE,
		SET_MACHINE_LOCALE_MESSAGE_TYPE,
		SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE,
		SET_NAMED_CELLS,
		SET_GRAPH_CELLS,
		SET_SHEET_CELLS,
		SET_SHEET_CELLS_MESSAGE_TYPE: MachineServerMessageTypes.SET_SHEET_CELLS,
		START_CONTROL_MODE_MESSAGE_TYPE,
		CONFIRM_PROCESSED_MACHINE_STEP,
		START_MACHINE_MESSAGE_TYPE,
		START_MACHINES_MESSAGE_TYPE,
		STEP_MACHINE_MESSAGE_TYPE,
		STOP_CONTROL_MODE_MESSAGE_TYPE,
		STOP_MACHINE_MESSAGE_TYPE,
		STOP_MACHINES_MESSAGE_TYPE,
		SUBSCRIBE_GRAPH_MESSAGE_TYPE,
		LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE,
		SUBSCRIBE_MACHINE_MESSAGE_TYPE,
		REDO_MESSAGE_TYPE,
		UNDO_MESSAGE_TYPE,
		UNSUBSCRIBE_GRAPH_MESSAGE_TYPE,
		UNSUBSCRIBE_MACHINE_MESSAGE_TYPE,
		UPDATE_MACHINE_IMAGE_MESSAGE_TYPE,
		UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE,
		UPDATE_PROCESS_SHEET_MESSAGE_TYPE,
		// Graph request types
		PING_GRAPHSOCKETSERVER_MESSAGE_TYPE,
		// General request types
		COMMAND_MESSAGE_TYPE,
		SELECTION_MESSAGE_TYPE,
		USER_GET_MESSAGE_TYPE,
		USER_SAVE_MESSAGE_TYPE,
		USER_SETTINGS_GET_MESSAGE_TYPE,
		USER_SETTINGS_SAVE_MESSAGE_TYPE,
		USER_LOGIN_MESSAGE_TYPE,
		USER_LOGOUT_MESSAGE_TYPE,
		AUTH_ENTITY_CREATE_MESSAGE_TYPE,
		AUTH_ENTITY_DELETE_MESSAGE_TYPE,
		AUTH_ENTITY_UPDATE_MESSAGE_TYPE,
		AUTH_ENTITY_GET_MESSAGE_TYPE
	},
	EVENTS: {
		// Events
		COMMAND_EVENT,
		SESSION_INIT_EVENT,
		GATEWAY_DISCONNECTED_EVENT,
		GRAPH_SERVER_CONNECTED_EVENT,
		GRAPH_SERVER_DISCONNECTED_EVENT,
		LICENSE_INFO_EVENT,
		MACHINE_LOCALE_EVENT: MachineServerEvents.MACHINE_LOCALE_EVENT,
		MACHINE_RENAME_EVENT,
		MACHINE_FUNCTIONS_EVENT,
		MACHINE_SERVER_CONNECTED_EVENT,
		STREAMSHEET_STREAM_UPDATED,
		MACHINE_CYCLETIME_EVENT,
		MACHINE_SERVER_DISCONNECTED_EVENT,
		MACHINE_STATE_EVENT,
		MACHINE_STEP_EVENT,
		MESSAGE_ADD_EVENT,
		RESPOND_EVENT,
		SHEET_STEP_EVENT,
		SHEET_UPDATE_EVENT,
		SELECTION_EVENT,
		SERVICE_EVENT,
		MESSAGE_BOX_CLEAR,
		MESSAGE_PUT,
		MESSAGE_POP,
		MESSAGE_CHANGED,
		SERVICE_CONNECTED_EVENT,
		SERVICE_DISCONNECTED_EVENT,
		STREAMSHEET_MESSAGE_ATTACHED,
		STREAMSHEET_MESSAGE_DETACHED,
		STREAMSHEET_STEP_EVENT,
		USER_JOINED_EVENT,
		USER_LEFT_EVENT,
		STREAMS_RELOAD_EVENT,
		STREAM_CONTROL_EVENT,
		REDIRECT
	}
};
