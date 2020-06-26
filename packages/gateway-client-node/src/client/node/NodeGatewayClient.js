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

const WebSocket = require('ws');
const { BaseGatewayClient } = require('@cedalo/gateway-client');

module.exports = class NodeGatewayClient extends BaseGatewayClient {

	constructor({ name = 'Node Gateway Client', logger } = {}) {
		super({ name, logger: logger || console });
	}

	_connectSocketServer(url) {
		return new Promise((resolve) => {
			const ws = new WebSocket(url);
			ws.on('open', () => this._handleOpenedSocketConnection().then(() => resolve(ws)));
			ws.on('message', message => this._handleSocketMessage(message));
			ws.on('error', event => this._handleSocketError(event));
			ws.on('close', event => this._handleSocketClose(event));
		});
	}
};
