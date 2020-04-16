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
