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
