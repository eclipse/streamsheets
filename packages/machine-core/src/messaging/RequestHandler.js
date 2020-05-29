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
const logger = require('../logger').create({ name: 'RequestHandler' });
const IdGenerator = require('@cedalo/id-generator');

const removeRequest = (requestId, handler) => {
	const pending = handler.pending;
	const request = pending.get(requestId);
	if (request) clearTimeout(request.timeoutId);
	pending.delete(requestId);
	return request;
};

const rejectRequest = (requestId, error, handler) => {
	const request = removeRequest(requestId, handler);
	if (request) {
		logger.error('Reject request!', request.msg, error);
		request.reject(error || new Error(`Request (${request.id}) failed! Unknown reason!`));
	}
};

const resolveRequest = (requestId, result, handler) => {
	const request = removeRequest(requestId, handler);
	if (request) request.resolve(result);
};

const pendingRequest = (resolve, reject, message) => {
	const request = { resolve, reject, msg: message };
	request.id = message.requestId || IdGenerator.generate();
	return {
		setTimeout: (timeout, handler) => {
			request.timeoutId = setTimeout(() => 
				rejectRequest(request.id, new Error(`Request (${request.id}) timed out!`), handler), timeout);
			return request;
		}
	};
};


class RequestHandler {

	// client must provide on/off 'message' events
	constructor(client) {
		Object.defineProperties(this, {
			pending: { value: new Map() },
			isListening: { value: false },
		});
		this.client = client;
		this.handleResponse = this.handleResponse.bind(this);
		this.client.on('message', this.handleResponse);
	}

	dispose() {
		Array.from(this.pending.keys())
			.forEach(requestId => rejectRequest(requestId, new Error(`Dispose request ${requestId}!`), this));
		this.pending.clear();
		this.client.off('message', this.handleResponse);
	}

	request(message, timeout, send) {
		return new Promise((resolve, reject) => {
			const request = pendingRequest(resolve, reject, message).setTimeout(timeout, this);
			this.pending.set(request.id, request);
			message.requestId = request.id;
			send();
		});
	}

	handleResponse(message) {
		if (message.response != null) {
			// we resolve even if message has no result:
			if (message.error == null) resolveRequest(message.response, message.result, this);
			else rejectRequest(message.response, message.error, this);
		}
	}
}

module.exports = RequestHandler;
