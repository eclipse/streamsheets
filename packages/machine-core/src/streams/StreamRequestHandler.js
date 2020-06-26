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
const RequestHandler = require('../messaging/RequestHandler');

const requestId = (message) => {
	const metadata = message.metadata || message.Metadata;
	return metadata && metadata.requestId;
};

class StreamRequestHandler extends RequestHandler {

	request(message, timeout, send) {
		// check message metadata for requestId to reuse...
		message.requestId = requestId(message);
		return super.request(message, timeout, send);
	}

	// messages received from broker have topic as first argument!
	handleResponse(topic, message) {
		message = JSON.parse(message);
		const reqId = message.requestId;
		if (reqId != null) {
			const response = { response: reqId };
			const key = message.type === 'response' ? 'result' : 'error';
			response[key] = message;
			super.handleResponse(response);
		}
	}
}

module.exports = StreamRequestHandler;
