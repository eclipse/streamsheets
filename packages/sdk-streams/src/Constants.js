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
const ERRORS = {
	TIMEOUT_ERROR: 'TIMEOUT_ERROR',
	INVALID_CONFIG: 'ERROR_INVALID_CONFIG',
	FAILEDTOCONNECT: 'FAILEDTOCONNECT',
	FAILEDTOINITIALIZE: 'FAILEDTOINITIALIZE',
	FAILEDTOTEST: 'FAILEDTOTEST',
	FAILEDTOPROVIDE: 'FAILEDTOPROVIDE'
};

const STREAM_TYPES = {
	CONNECTOR: 'connector',
	PRODUCER: 'producer',
	CONSUMER: 'consumer'
};

const EVENTS = {
	CONNECTOR: {
		ERROR: 'connector_error',
		WARNING: 'connector_warning',
		OFFLINE: 'offline',
		CONNECT: 'connect',
		CLOSE: 'close',
		DISPOSED: 'dispose',
		UPDATE: 'update',
		PERSIST: 'persist'
	},
	CONSUMER: {
		MESSAGE: 'message',
		RESPOND: 'respond'
	},
	PRODUCER: {
		PRODUCE: 'produce',
		REQUEST: 'request'
	}
};

module.exports = {
	ERRORS,
	STREAM_TYPES,
	EVENTS
};
