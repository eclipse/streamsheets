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
const LOAD_SHEET_CELLS = 'load_sheet_cells';
const MACHINE_UPDATE_SETTINGS = 'machine_update_settings';
const META_INFORMATION_MESSAGE_TYPE = 'meta_information';
const OPEN_MACHINE_MESSAGE_TYPE = 'machine_open';
const PAUSE_MACHINE_MESSAGE_TYPE = 'machine_pause';
const RENAME_MACHINE_MESSAGE_TYPE = 'machine_rename';
const SAVE_MACHINE_AS_MESSAGE_TYPE = 'machine_save_as';
const SAVE_MACHINE_COPY_MESSAGE_TYPE = 'machine_save_copy';
const SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE = 'machine_set_cycle_time';
const SET_MACHINE_LOCALE_MESSAGE_TYPE = 'machine_set_locale';
const SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE = 'machine_set_update_interval';
const SET_NAMED_CELLS = 'set_named_cells';
const SET_GRAPH_CELLS = 'set_graph_cells';
const SET_SHEET_CELLS = 'set_sheet_cells';
const START_MACHINE_MESSAGE_TYPE = 'machine_start';
const START_MACHINES_MESSAGE_TYPE = 'machines_start';
const STEP_MACHINE_MESSAGE_TYPE = 'machine_step';
const STOP_MACHINE_MESSAGE_TYPE = 'machine_stop';
const STOP_MACHINES_MESSAGE_TYPE = 'machines_stop';
const STREAMSHEETS_ORDER_MESSAGE_TYPE = 'streamsheets_order';
const SUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_subscribe';
const UNSUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_unsubscribe';
const UPDATE_MACHINE_IMAGE_MESSAGE_TYPE = 'update_machine_image';
const UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE = 'update_machine_title_image';
const LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE = 'machine_load_subscribe';


/**
 * ******************************************************************************************
 * General request types
 * ******************************************************************************************
 */

const COMMAND_MESSAGE_TYPE = 'command';

/**
 * ******************************************************************************************
 * Events
 * ******************************************************************************************
 */

const MACHINE_ADD_EVENT = 'machine_add';
const MACHINE_CYCLETIME_EVENT = 'machine_cycletime';
const MACHINE_DESCRIPTOR_UPDATE_EVENT = 'machine_descriptor_update';
const MACHINE_LAST_MODIFIED_EVENT = 'machine_lastmodified';
const MACHINE_LOCALE_EVENT = 'machine_locale';
const MACHINE_OPCUA_EVENT = 'machine_opcua';
const MACHINE_RENAME_EVENT = 'machine_rename';
const MACHINE_FUNCTIONS_EVENT = 'machine_functions';
const MACHINE_REMOVE_EVENT = 'machine_remove';
const MACHINE_STATE_EVENT = 'machine_state';
const MACHINE_STEP_EVENT = 'machine_step';
const MESSAGE_ADD_EVENT = 'message_add';
const STREAMSHEET_STEP = 'streamsheet_step';
const STREAMSHEET_MESSAGE_ATTACHED = 'streamsheet_message_attached';
const STREAMSHEET_MESSAGE_DETACHED = 'streamsheet_message_detached';
const STREAMSHEET_STREAM_UPDATE_EVENT = 'streamsheet_stream_update';
const STREAMSHEET_STREAM_UPDATED = 'streamsheet_stream_updated';
const STREAMSHEET_STREAM_UPDATE_TYPE = 'streamsheet_stream_update';
const MESSAGE_BOX_CLEAR = 'message_box_clear';
const MESSAGE_PUT = 'message_put';
const MESSAGE_POP = 'message_pop';
const MESSAGE_CHANGED = 'message_changed';
const STREAMS_RELOAD_EVENT = 'stream_reload';
const SHEET_UPDATE_EVENT = 'sheet_update';
const SHEET_CELLRANGE_CHANGE_EVENT = 'sheet_cellrange_change';
const SHEET_CELLS_UPDATE_EVENT = 'sheet_cells_update';
const NAMED_CELLS_EVENT = 'named_cells';

// DEPRECATED:
const SHEET_STEP_EVENT = 'sheet_step';

module.exports = {
	MESSAGE_TYPES: {
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
		LOAD_SHEET_CELLS,
		MACHINE_UPDATE_SETTINGS,
		META_INFORMATION_MESSAGE_TYPE,
		OPEN_MACHINE_MESSAGE_TYPE,
		PAUSE_MACHINE_MESSAGE_TYPE,
		RENAME_MACHINE_MESSAGE_TYPE,
		SAVE_MACHINE_AS_MESSAGE_TYPE,
		SAVE_MACHINE_COPY_MESSAGE_TYPE,
		SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE,
		SET_MACHINE_LOCALE_MESSAGE_TYPE,
		SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE,
		SET_NAMED_CELLS,
		SET_GRAPH_CELLS,
		SET_SHEET_CELLS,
		START_MACHINE_MESSAGE_TYPE,
		START_MACHINES_MESSAGE_TYPE,
		STEP_MACHINE_MESSAGE_TYPE,
		STOP_MACHINE_MESSAGE_TYPE,
		STOP_MACHINES_MESSAGE_TYPE,
		STREAMSHEETS_ORDER_MESSAGE_TYPE,
		SUBSCRIBE_MACHINE_MESSAGE_TYPE,
		UNSUBSCRIBE_MACHINE_MESSAGE_TYPE,
		// General request types
		COMMAND_MESSAGE_TYPE,
		STREAMSHEET_STREAM_UPDATE_TYPE,
		UPDATE_MACHINE_IMAGE_MESSAGE_TYPE,
		UPDATE_MACHINE_TITLE_IMAGE_MESSAGE_TYPE
	},
	EVENTS: {
		MACHINE_ADD_EVENT,
		MACHINE_CYCLETIME_EVENT,
		MACHINE_DESCRIPTOR_UPDATE_EVENT,
		MACHINE_LAST_MODIFIED_EVENT,
		MACHINE_LOCALE_EVENT,
		MACHINE_OPCUA_EVENT,
		MACHINE_RENAME_EVENT,
		MACHINE_FUNCTIONS_EVENT,
		MACHINE_REMOVE_EVENT,
		MACHINE_STATE_EVENT,
		MACHINE_STEP_EVENT,
		MESSAGE_ADD_EVENT,
		NAMED_CELLS_EVENT,
		SHEET_STEP_EVENT,
		SHEET_UPDATE_EVENT,
		SHEET_CELLRANGE_CHANGE_EVENT,
		SHEET_CELLS_UPDATE_EVENT,
		MESSAGE_BOX_CLEAR,
		MESSAGE_PUT,
		MESSAGE_POP,
		MESSAGE_CHANGED,
		STREAMSHEET_STEP,
		STREAMSHEET_MESSAGE_ATTACHED,
		STREAMSHEET_MESSAGE_DETACHED,
		STREAMSHEET_STREAM_UPDATE_EVENT,
		STREAMSHEET_STREAM_UPDATED,
		STREAMS_RELOAD_EVENT
	}
};
