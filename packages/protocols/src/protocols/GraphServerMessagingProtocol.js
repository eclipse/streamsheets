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
 * Graph request types
 * ******************************************************************************************
 */

const ADD_MESSAGE_MESSAGE_TYPE = 'message_add';
const COMMAND_MESSAGE_TYPE = 'command';
const CREATE_GRAPH_MESSAGE_TYPE = 'graph_create';
const CREATE_STREAMSHEET_MESSAGE_TYPE = 'streamsheet_create';
const DELETE_GRAPH_MESSAGE_TYPE = 'graph_delete';
const DELETE_STREAMSHEET_MESSAGE_TYPE = 'streamsheet_delete';
const GET_GRAPH_MESSAGE_TYPE = 'graph_get';
const LOAD_GRAPH_MESSAGE_TYPE = 'graph_load';
const LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_load_subscribe';
const META_INFORMATION_MESSAGE_TYPE = 'meta_information';
const PING_GRAPHSOCKETSERVER_MESSAGE_TYPE = 'ping_graphsocketserver';
const SELECTION_MESSAGE_TYPE = 'selection';
const SUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_subscribe';
const REDO_MESSAGE_TYPE = 'redo';
const UNDO_MESSAGE_TYPE = 'undo';
const UNSUBSCRIBE_GRAPH_MESSAGE_TYPE = 'graph_unsubscribe';
const UPDATE_PROCESS_SHEET_MESSAGE_TYPE = 'update_process_sheets';

/**
 * ******************************************************************************************
 * Process sheet specific request types
 * ******************************************************************************************
 */

const MESSAGE_PUT = 'message_put';
const MESSAGE_POP = 'message_pop';
const STREAMSHEET_STEP = 'streamsheet_step';

/**
 * ******************************************************************************************
 * Events
 * ******************************************************************************************
 */

const COMMAND_EVENT = 'command';
const SELECTION_EVENT = 'selection';

module.exports = {
	MESSAGE_TYPES: {
		ADD_MESSAGE_MESSAGE_TYPE,
		COMMAND_MESSAGE_TYPE,
		CREATE_GRAPH_MESSAGE_TYPE,
		CREATE_STREAMSHEET_MESSAGE_TYPE,
		DELETE_GRAPH_MESSAGE_TYPE,
		DELETE_STREAMSHEET_MESSAGE_TYPE,
		GET_GRAPH_MESSAGE_TYPE,
		LOAD_GRAPH_MESSAGE_TYPE,
		LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE,
		META_INFORMATION_MESSAGE_TYPE,
		PING_GRAPHSOCKETSERVER_MESSAGE_TYPE,
		MESSAGE_PUT,
		MESSAGE_POP,
		SELECTION_MESSAGE_TYPE,
		SUBSCRIBE_GRAPH_MESSAGE_TYPE,
		STREAMSHEET_STEP,
		REDO_MESSAGE_TYPE,
		UNDO_MESSAGE_TYPE,
		UNSUBSCRIBE_GRAPH_MESSAGE_TYPE,
		UPDATE_PROCESS_SHEET_MESSAGE_TYPE
	},
	EVENTS: {
		COMMAND_EVENT,
		SELECTION_EVENT
	}
};
