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
const CODES = {
	NODE_NOT_FOUND: 'NODE_NOT_FOUND',
	PARENT_NODE_NOT_FOUND: 'PARENT_NODE_NOT_FOUND',
	DOMAIN_NOT_FOUND: 'DOMAIN_NOT_FOUND',
	SCENARIO_NOT_FOUND: 'SCENARIO_NOT_FOUND',
	'LOCK_ACQUIRE:NODE_LOCKED': 'LOCK_ACQUIRE:NODE_LOCKED',
	'LOCK_RELEASE:NODE_LOCK_NOT_ACQUIRED': 'LOCK_RELEASE:NODE_LOCK_NOT_ACQUIRED',
	TRANSLATION_NOT_FOUND: 'TRANSLATION_NOT_FOUND',
	WRONG_MAIL_OR_PASSWORD: 'WRONG_MAIL_OR_PASSWORD',
	USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
	PASSWORDS_DONT_MATCH: 'PASSWORDS_DONT_MATCH',
	NODE_LOCK_NOT_ACQUIRED: 'NODE_LOCK_NOT_ACQUIRED',
	WRONG_MAIL: 'WRONG_MAIL',
	MACHINE_NOT_FOUND: 'MACHINE_NOT_FOUND',
	SETTING_NOT_FOUND: 'SETTING_NOT_FOUND',
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	GRAPH_NOT_FOUND: 'GRAPH_NOT_FOUND'
};

module.exports = CODES;
