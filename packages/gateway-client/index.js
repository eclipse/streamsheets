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

const Request = require('./src/requests/Request');
const BaseGatewayClient = require('./src/client/base/BaseGatewayClient');
const HTTPRequest = require('./src/requests/http/HTTPRequest');
const WebSocketRequest = require('./src/requests/sockets/WebSocketRequest');
const WebGatewayClient = require('./src/client/web/WebGatewayClient');

module.exports = {
	BaseGatewayClient,
	HTTPRequest,
	Request,
	WebGatewayClient,
	WebSocketRequest
};
