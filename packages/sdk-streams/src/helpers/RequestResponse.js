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
const Message = require('./Message');

class RequestResponse {
	constructor(message, requestId) {
		if (message) {
			if (message instanceof Message) {
				this.message = message;
			} else {
				try {
					this.message = Message.fromJSON(message);
				} catch (e) {
					throw Error(`Invalid RequestResponse: ${e.message}`);
				}
			}
		}
		this.requestId = requestId;
	}

	toJSON() {
		const response = this.message && typeof this.message.toJSON === 'function' ? this.message.toJSON() : {};
		return {
			type: 'response',
			response,
			requestId: this.requestId
		};
	}
}

module.exports = RequestResponse;
