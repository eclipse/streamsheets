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
 * Topics
 * ******************************************************************************************
 */

const BASE_TOPIC = 'api/v1.1/digitalmachine';

// Topics for the migrated system
const ERRORS_GLOBAL = `${BASE_TOPIC}/errors`;
const LICENSE_INFO = `${BASE_TOPIC}/license/info`;
const SERVICES_STATUS = `${BASE_TOPIC}/services/status`;
const SERVICES_STREAMS_INPUT = `${BASE_TOPIC}/services/streams/input`;
const SERVICES_STREAMS_EVENTS = `${BASE_TOPIC}/services/streams/events`;
const SERVICES_GRAPHS_INPUT = `${BASE_TOPIC}/services/graphs/input`;
const SERVICES_GRAPHS_OUTPUT = `${BASE_TOPIC}/services/graphs/output`;
const SERVICES_GRAPHS_EVENTS = `${BASE_TOPIC}/services/graphs/events`;
const SERVICES_OPCUA_EVENTS = `${BASE_TOPIC}/services/opcua/events`;
const SERVICES_MACHINES_INPUT = `${BASE_TOPIC}/services/machines/input`;
const SERVICES_MACHINES_OUTPUT = `${BASE_TOPIC}/services/machines/output`;
const SERVICES_MACHINES_EVENTS = `${BASE_TOPIC}/services/machines/events`;
const SERVICES_MACHINES_MONITORING = `${BASE_TOPIC}/services/machines/monitoring`;
const SERVICES_MESSAGEBUFFER_INPUT = `${BASE_TOPIC}/services/messagebuffer/input`;
const SERVICES_MESSAGEBUFFER_OUTPUT = `${BASE_TOPIC}/services/messagebuffer/output`;
const SERVICES_MESSAGEBUFFER_EVENTS = `${BASE_TOPIC}/services/messagebuffer/events`;
const SERVICES_PERSISTENCE_EVENTS = `${BASE_TOPIC}/services/persistence/events`;
const SERVICES_PERSISTENCE_INPUT = `${BASE_TOPIC}/services/persistence/input`;
const SERVICES_AUTH_EVENTS = `${BASE_TOPIC}/services/auth/events`;
const SERVICES_AUTH_INPUT = `${BASE_TOPIC}/services/auth/input`;
const SERVICES_AUTH_DATA = `${BASE_TOPIC}/services/auth/data`;
const CONFIG_JWT = `${BASE_TOPIC}/config/jwt`;
// Unused topics

const SERVICES_GATEWAY_EVENTS = `${BASE_TOPIC}/services/gateway/events`;
const SERVICES_MIGRATION_OUTPUT = `${BASE_TOPIC}/services/migration/output`;

module.exports = {
	BASE_TOPIC,
	ERRORS_GLOBAL,
	LICENSE_INFO,
	SERVICES_STATUS,
	SERVICES_AUTH_INPUT,
	SERVICES_AUTH_EVENTS,
	SERVICES_AUTH_DATA,
	CONFIG_JWT,
	SERVICES_STREAMS_INPUT,
	SERVICES_STREAMS_EVENTS,
	SERVICES_GATEWAY_EVENTS,
	SERVICES_GRAPHS_EVENTS,
	SERVICES_GRAPHS_INPUT,
	SERVICES_GRAPHS_OUTPUT,
	SERVICES_MACHINES_EVENTS,
	SERVICES_MACHINES_MONITORING,
	SERVICES_MACHINES_INPUT,
	SERVICES_MACHINES_OUTPUT,
	SERVICES_MESSAGEBUFFER_EVENTS,
	SERVICES_MESSAGEBUFFER_INPUT,
	SERVICES_MESSAGEBUFFER_OUTPUT,
	SERVICES_MIGRATION_OUTPUT,
	SERVICES_OPCUA_EVENTS,
	SERVICES_PERSISTENCE_EVENTS,
	SERVICES_PERSISTENCE_INPUT
};
