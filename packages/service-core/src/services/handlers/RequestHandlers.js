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

const RequestHandler = require('./RequestHandler');

class UnknownRequestHandler extends RequestHandler {
	handle(request) {
		return new Promise((resolve) => {
			resolve(`Unknown request '${request.type}'!`);
		});
	}
}

module.exports = class Requests {

	static instance(...requests) {
		if (!Requests.singleton) {
			Requests.singleton = new Requests(...requests);
		}
		return Requests.singleton;
	}

	static createFor(request, ...requests) {
		return Requests.instance(...requests).get(request.type);
	}

	constructor(...requests) {
		Requests.unknown = new UnknownRequestHandler();
		this.requests = new Map();
		requests.forEach((request) => {
			// eslint-disable-next-line
			Object.entries(request).forEach(([key, Req]) => {
				this.add(new Req());
			});
		});
	}

	add(request) {
		this.requests.set(request.type, request);
	}

	get(type) {
		const req = this.requests.get(type || 'undefined');
		return req || Requests.unknown;
	}
};
