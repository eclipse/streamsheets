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
 * Streams request types
 * ******************************************************************************************
 */

const STREAM_CONFIG_SAVE = 'stream_config_save';
const STREAM_CONFIG_DELETE = 'stream_config_delete';
const STREAM_CONFIG_LOAD = 'stream_config_load';
const STREAM_CONFIG_LOAD_BY_NAME = 'stream_config_load_by_name';
const STREAMS_CONFIG_LOAD_ALL = 'stream_config_load_all';
const STREAM_CONFIG_VALIDATE = 'stream_config_validate';
const STREAM_GET_PROVIDERS = 'stream_get_providers';
const STREAM_UPDATE = 'stream_update';
const STREAM_LIST = 'stream_list';
const STREAM_RELOAD = 'stream_reload';
const STREAM_RELOAD_ALL = 'stream_reload_all';
const STREAM_COMMAND_MESSAGE_TYPE = 'stream_command';
const STREAM_LOOKUP_REQUEST = 'stream_lookup_request';
const META_INFORMATION_MESSAGE_TYPE = 'meta_information';


/**
 * ******************************************************************************************
 * Events
 * ******************************************************************************************
 */
const STREAM_ERROR = 'stream_error';
const STREAM_UPDATED = 'stream_updated';
const STREAM_LOG = 'stream_log';
const STREAM_RELOADED = 'stream_reloaded';
const STREAM_RELOADED_ALL = 'stream_reloaded_all';
const STREAM_LOOKUP_RESPONSE = 'stream_lookup_response';

module.exports = {
	MESSAGE_TYPES: {
		STREAM_CONFIG_SAVE,
		STREAM_CONFIG_DELETE,
		STREAM_CONFIG_LOAD,
		STREAM_GET_PROVIDERS,
		STREAM_CONFIG_LOAD_BY_NAME,
		STREAMS_CONFIG_LOAD_ALL,
		STREAM_CONFIG_VALIDATE,
		STREAM_UPDATE,
		STREAM_LIST,
		STREAM_RELOAD,
		STREAM_RELOAD_ALL,
		STREAM_LOOKUP_REQUEST,
		META_INFORMATION_MESSAGE_TYPE,
		STREAM_COMMAND_MESSAGE_TYPE
	},
	EVENTS: {
		STREAM_UPDATED,
		STREAM_RELOADED,
		STREAM_RELOADED_ALL,
		STREAM_ERROR,
		STREAM_LOOKUP_RESPONSE,
		STREAM_LOG
	}
};
