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
declare module '@cedalo/protocols' {
	class GatewayMessagingProtocol {
		static MESSAGE_TYPES: {
			ADD_INBOX_MESSAGE: 'add_inbox_message';
			CREATE_STREAMSHEET_MESSAGE_TYPE: 'streamsheet_create';
			GET_MACHINE_MESSAGE_TYPE: 'machine_get';
			GET_MACHINES_MESSAGE_TYPE: 'machineserver_machines';
			DELETE_MACHINE_MESSAGE_TYPE: 'machine_delete';
			DELETE_STREAMSHEET_MESSAGE_TYPE: 'streamsheet_delete';
			LOAD_MACHINE_MESSAGE_TYPE: 'machine_load';
			UNLOAD_MACHINE_MESSAGE_TYPE: 'machine_unload';
			META_INFORMATION_MESSAGE_TYPE: 'meta_information';
			RENAME_MACHINE_MESSAGE_TYPE: 'machine_rename';
			PAUSE_MACHINE_MESSAGE_TYPE: 'machine_pause';
			PING_MACHINESOCKETSERVER_MESSAGE_TYPE: 'ping_machinesocketserver';
			SAVE_MACHINE_AS_MESSAGE_TYPE: 'machine_save_as';
			SAVE_MACHINE_COPY_MESSAGE_TYPE: 'machine_save_copy';
			SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE: 'machine_set_cycle_time';
			SET_MACHINE_LOCALE_MESSAGE_TYPE: 'machine_set_locale';
			SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE: 'machine_set_update_interval';
			SET_NAMED_CELLS: 'set_named_cells';
			SET_GRAPH_CELLS: 'set_graph_cells';
			SET_SHEET_CELLS: 'set_sheet_cells';
			START_CONTROL_MODE_MESSAGE_TYPE: 'machine_start_control_mode';
			CONFIRM_PROCESSED_MACHINE_STEP: 'confirm_processed_machine_step';
			START_MACHINE_MESSAGE_TYPE: 'machine_start';
			START_MACHINES_MESSAGE_TYPE: 'machines_start';
			STEP_MACHINE_MESSAGE_TYPE: 'machine_step';
			STOP_CONTROL_MODE_MESSAGE_TYPE: 'machine_stop_control_mode';
			STOP_MACHINE_MESSAGE_TYPE: 'machine_stop';
			STOP_MACHINES_MESSAGE_TYPE: 'machines_stop';
			SUBSCRIBE_GRAPH_MESSAGE_TYPE: 'graph_subscribe';
			SUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_subscribe';
			REDO_MESSAGE_TYPE: 'redo';
			UNDO_MESSAGE_TYPE: 'undo';
			UPDATE_MACHINE_IMAGE_MESSAGE_TYPE: 'update_machine_image';
			UPDATE_PROCESS_SHEET_MESSAGE_TYPE: 'update_process_sheets';
			UNSUBSCRIBE_GRAPH_MESSAGE_TYPE: 'graph_unsubscribe';
			UNSUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_unsubscribe';
			LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_load_subscribe';
			LOAD_SUBSCRIBE_GRAPH_MESSAGE_TYPE: 'graph_load_subscribe';
			USER_GET_MESSAGE_TYPE: 'user_get';
			AUTH_DATA_MESSAGE_TYPE: 'auth_data';
			USER_SAVE_MESSAGE_TYPE: 'user_save';
			USER_SETTINGS_GET_MESSAGE_TYPE: 'user_settings_get';
			USER_LOGIN_MESSAGE_TYPE: 'user_login';
			USER_LOGOUT_MESSAGE_TYPE: 'user_logout';
			USER_SETTINGS_SAVE_MESSAGE_TYPE: 'user__settings_save';
			AUTH_ENTITY_GET_MESSAGE_TYPE: 'auth_entity_get';
			AUTH_ENTITY_CREATE_MESSAGE_TYPE: 'auth_entity_create';
			AUTH_ENTITY_DELETE_MESSAGE_TYPE: 'auth_entity_delete';
			AUTH_ENTITY_UPDATE_MESSAGE_TYPE: 'auth_entity_update';
		};
		static EVENTS: {
			USER_JOINED_EVENT: 'user_joined';
			USER_LEFT_EVENT: 'user_left';
			SESSION_INIT_EVENT: 'session_init';
		};
	}

	class StreamsMessagingProtocol {
		static MESSAGE_TYPES: {
			STREAM_CONFIG_SAVE: 'stream_config_save';
			STREAM_CONFIG_DELETE: 'stream_config_delete';
			STREAM_CONFIG_LOAD: 'stream_config_load';
			STREAM_CONFIG_LOAD_BY_NAME: 'stream_config_load_by_name';
			STREAMS_CONFIG_LOAD_ALL: 'stream_config_load_all';
			STREAM_CONFIG_VALIDATE: 'stream_config_validate';
			STREAM_GET_PROVIDERS: 'stream_get_providers';
			STREAM_UPDATE: 'stream_update';
			STREAM_LIST: 'stream_list';
			STREAM_RELOAD: 'stream_reload';
			STREAM_RELOAD_ALL: 'stream_reload_all';
			STREAM_COMMAND_MESSAGE_TYPE: 'stream_command';
			STREAM_LOOKUP_REQUEST: 'stream_lookup_request';
			META_INFORMATION_MESSAGE_TYPE: 'meta_information';
		};
	}

	class MachineServerMessagingProtocol {
		static MESSAGE_TYPES: {
			ADD_INBOX_MESSAGE: 'add_inbox_message';
			CREATE_STREAMSHEET_MESSAGE_TYPE: 'streamsheet_create';
			STREAMSHEET_STREAM_UPDATE_TYPE: 'streamsheet_stream_update';
			GET_MACHINE_MESSAGE_TYPE: 'machine_get';
			GET_MACHINES_MESSAGE_TYPE: 'machineserver_machines';
			DELETE_MACHINE_MESSAGE_TYPE: 'machine_delete';
			DELETE_STREAMSHEET_MESSAGE_TYPE: 'streamsheet_delete';
			LOAD_MACHINE_MESSAGE_TYPE: 'machine_load';
			UNLOAD_MACHINE_MESSAGE_TYPE: 'machine_unload';
			LOAD_SHEET_CELLS: 'load_sheet_cells';
			MACHINE_UPDATE_SETTINGS: 'machine_update_settings';
			META_INFORMATION_MESSAGE_TYPE: 'meta_information';
			OPEN_MACHINE_MESSAGE_TYPE: 'machine_open';
			PAUSE_MACHINE_MESSAGE_TYPE: 'machine_pause';
			RENAME_MACHINE_MESSAGE_TYPE: 'machine_rename';
			SAVE_MACHINE_AS_MESSAGE_TYPE: 'machine_save_as';
			SAVE_MACHINE_COPY_MESSAGE_TYPE: 'machine_save_copy';
			SET_MACHINE_CYCLE_TIME_MESSAGE_TYPE: 'machine_set_cycle_time';
			SET_MACHINE_LOCALE_MESSAGE_TYPE: 'machine_set_locale';
			SET_MACHINE_UPDATE_INTERVAL_MESSAGE_TYPE: 'machine_set_update_interval';
			SET_NAMED_CELLS: 'set_named_cells';
			SET_GRAPH_CELLS: 'set_graph_cells';
			SET_SHEET_CELLS: 'set_sheet_cells';
			START_MACHINE_MESSAGE_TYPE: 'machine_start';
			START_MACHINES_MESSAGE_TYPE: 'machines_start';
			STEP_MACHINE_MESSAGE_TYPE: 'machine_step';
			STOP_MACHINE_MESSAGE_TYPE: 'machine_stop';
			STOP_MACHINES_MESSAGE_TYPE: 'machines_stop';
			STREAMSHEETS_ORDER_MESSAGE_TYPE: 'streamsheets_order';
			SUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_subscribe';
			UNSUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_unsubscribe';
			UPDATE_MACHINE_IMAGE_MESSAGE_TYPE: 'update_machine_image';
			LOAD_SUBSCRIBE_MACHINE_MESSAGE_TYPE: 'machine_load_subscribe';
			COMMAND_MESSAGE_TYPE: 'command';
		};

		static EVENTS: {
			MACHINE_ADD_EVENT: 'machine_add';
			MACHINE_CYCLETIME_EVENT: 'machine_cycletime';
			MACHINE_DESCRIPTOR_UPDATE_EVENT: 'machine_descriptor_update';
			MACHINE_LAST_MODIFIED_EVENT: 'machine_lastmodified';
			MACHINE_LOCALE_EVENT: 'machine_locale';
			MACHINE_OPCUA_EVENT: 'machine_opcua';
			MACHINE_RENAME_EVENT: 'machine_rename';
			MACHINE_FUNCTIONS_EVENT: 'machine_functions';
			MACHINE_REMOVE_EVENT: 'machine_remove';
			MACHINE_STATE_EVENT: 'machine_state';
			MACHINE_STEP_EVENT: 'machine_step';
			MESSAGE_ADD_EVENT: 'message_add';
			STREAMSHEET_STEP: 'streamsheet_step';
			STREAMSHEET_MESSAGE_ATTACHED: 'streamsheet_message_attached';
			STREAMSHEET_MESSAGE_DETACHED: 'streamsheet_message_detached';
			STREAMSHEET_STREAM_UPDATE_EVENT: 'streamsheet_stream_update';
			STREAMSHEET_STREAM_UPDATED: 'streamsheet_stream_updated';
			MESSAGE_BOX_CLEAR: 'message_box_clear';
			MESSAGE_PUT: 'message_put';
			MESSAGE_POP: 'message_pop';
			MESSAGE_CHANGED: 'message_changed';
			STREAMS_RELOAD_EVENT: 'stream_reload';
			SHEET_UPDATE_EVENT: 'sheet_update';
			SHEET_CELLRANGE_CHANGE_EVENT: 'sheet_cellrange_change';
			SHEET_CELLS_UPDATE_EVENT: 'sheet_cells_update';
			NAMED_CELLS_EVENT: 'named_cells';
		};
	}

	class Topics {
		static BASE_TOPIC: 'api/v1.1/digitalmachine';
		static ERRORS_GLOBAL: 'api/v1.1/digitalmachine/errors';
		static LICENSE_INFO: 'api/v1.1/digitalmachine/license/info';
		static SERVICES_STATUS: 'api/v1.1/digitalmachine/services/status';
		static SERVICES_STREAMS_INPUT: 'api/v1.1/digitalmachine/services/streams/input';
		static SERVICES_STREAMS_EVENTS: 'api/v1.1/digitalmachine/services/streams/events';
		static SERVICES_GRAPHS_INPUT: 'api/v1.1/digitalmachine/services/graphs/input';
		static SERVICES_GRAPHS_OUTPUT: 'api/v1.1/digitalmachine/services/graphs/output';
		static SERVICES_GRAPHS_EVENTS: 'api/v1.1/digitalmachine/services/graphs/events';
		static SERVICES_OPCUA_EVENTS: 'api/v1.1/digitalmachine/services/opcua/events';
		static SERVICES_MACHINES_INPUT: 'api/v1.1/digitalmachine/services/machines/input';
		static SERVICES_MACHINES_OUTPUT: 'api/v1.1/digitalmachine/services/machines/output';
		static SERVICES_MACHINES_EVENTS: 'api/v1.1/digitalmachine/services/machines/events';
		static SERVICES_MACHINES_MONITORING: 'api/v1.1/digitalmachine/services/machines/monitoring';
		static SERVICES_MESSAGEBUFFER_INPUT: 'api/v1.1/digitalmachine/services/messagebuffer/input';
		static SERVICES_MESSAGEBUFFER_OUTPUT: 'api/v1.1/digitalmachine/services/messagebuffer/output';
		static SERVICES_MESSAGEBUFFER_EVENTS: 'api/v1.1/digitalmachine/services/messagebuffer/events';
		static SERVICES_PERSISTENCE_EVENTS: 'api/v1.1/digitalmachine/services/persistence/events';
		static SERVICES_PERSISTENCE_INPUT: 'api/v1.1/digitalmachine/services/persistence/input';
		static SERVICES_AUTH_EVENTS: 'api/v1.1/digitalmachine/services/auth/events';
		static SERVICES_AUTH_INPUT: 'api/v1.1/digitalmachine/services/auth/input';
		static SERVICES_AUTH_DATA: 'api/v1.1/digitalmachine/services/auth/data';
		static CONFIG_JWT: 'api/v1.1/digitalmachine/config/jwt';
	}
}