declare module '@cedalo/logger' {
	class Logger {
		debug(...args: any): void;
		info(...args: any): void;
		warn(...args: any): void;
		error(...args: any): void;
	}
	class LoggerFactory {
		static createLogger(name: string, level: string): Logger;
	}
}

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
			SESSION_INIT_EVENT: 'session_init'
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

declare module '@cedalo/messaging-client' {
	class MessagingClient {
		connect(url: string, configuration?: any): Promise<any>;

		publish(topic: string, message: object | string): Promise<any>;

		subscribe(topic: string, options?: any): Promise<any>;

		unsubscribe(topic: string): Promise<any>;

		on(event: string, callback: (topic: string, message: string) => void): Promise<any>;

		end(): Promise<any>;
	}
}

declare module '@cedalo/id-generator' {
	function generate(): string;
	function generateUUID(): string;
	function generateShortId(): string;
}
