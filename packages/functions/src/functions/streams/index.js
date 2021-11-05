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
const KAFKACOMMAND = require('./kafkacommand');
const KAFKAQUERY = require('./kafkaquery');
const PRODUCE = require('./produce');
const { requestinternal, REQUEST, REQUESTINFO } = require('./request');
const { RESPOND } = require('./respond');

module.exports = {
	functions: {
		requestinternal,
		// KAFKA HERE???
		KAFKACOMMAND,
		KAFKAQUERY,
		PRODUCE,
		REQUEST,
		REQUESTINFO,
		RESPOND
	}
};
