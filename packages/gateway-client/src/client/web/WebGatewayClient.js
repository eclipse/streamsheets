'use strict';

const BaseGatewayClient = require('../base/BaseGatewayClient');

module.exports = class WebGatewayClient extends BaseGatewayClient {
	constructor({ name = 'Web Gateway Client', defaultListener } = {}) {
		super({ name, logger: console, defaultListener });
	}

	_connectSocketServer(url) {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(url);
			ws.onopen = () =>
				this._handleOpenedSocketConnection().then(() => resolve(ws));
			ws.onmessage = (event) => this._handleSocketMessage(event.data);
			ws.onerror = (event) => {
				this._handleSocketError(event);
				reject(event);
			};
			ws.onclose = (event) => this._handleSocketClose(event);
		}).catch((error) => this._handleSocketError(error));
	}
};
