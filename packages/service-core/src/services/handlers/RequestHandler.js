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

module.exports = class RequestHandler {
	constructor(type) {
		if (this.constructor === RequestHandler) {
			throw new TypeError('Class RequestHandler is abstract!');
		}
		this.type = type;
	}

	handle() {
		return new Promise((resolve) => {
			resolve();
		});
	}

	confirm(request, response = {}) {
		request = request || {};
		return {
			type: 'response',
			requestId: request.requestId || '',
			requestType: request.type,
			response
		};
	}

	reject(request, message, code) {
		request = request || {};
		return {
			type: 'error',
			requestId: request.requestId || '',
			requestType: request.type,
			error: {
				code,
				message
			}
		};
	}

	forbidden(request, error = {}) {
		request = request || {};
		return {
			type: 'error',
			requestId: request.requestId || '',
			requestType: request.type,
			error: {
				code: error.code || '403',
				message: error.message || 'Forbidden'
			}
		};
	}

	unAuthorized(request) {
		request = request || {};
		return {
			type: 'error',
			requestId: request.requestId || '',
			requestType: request.type,
			error: {
				code: '401',
				message: 'Unauthorized'
			}
		};
	}
};
