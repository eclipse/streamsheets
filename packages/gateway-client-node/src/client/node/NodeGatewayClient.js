'use strict';

const WebSocket = require('ws');
const { BaseGatewayClient } = require('@cedalo/gateway-client');

module.exports = class NodeGatewayClient extends BaseGatewayClient {

	constructor({ name = 'Node Gateway Client', logger } = {}) {
		super({ name, logger: logger || console });
	}

	_connectSocketServer(url) {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(url);
			ws.on('open', () => this._handleOpenedSocketConnection().then(() => resolve(ws)));
			ws.on('message', message => this._handleSocketMessage(message));
			ws.on('error', event => this._handleSocketError(event));
			ws.on('close', event => this._handleSocketClose(event));
		});
	}

};
