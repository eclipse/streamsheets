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

const EventMessage = require('./src/messages/core/EventMessage');
const RequestMessage = require('./src/messages/core/RequestMessage');
const ResponseMessage = require('./src/messages/core/ResponseMessage');

module.exports = {
	EventMessage,
	RequestMessage,
	ResponseMessage
};
