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
const IdGenerator = require('@cedalo/id-generator');
const RESTServer = require('./RESTServer');
const EventEmitter = require('eventemitter2').EventEmitter2;
// const EventEmitter = require('events');

const DEFAULT_TIMEOUT = 8000;

const deletePendingRequest = (requestId, requests) => {
	const request = requests.get(requestId);
	if (request) {
		clearTimeout(request.timeoutId);
		requests.delete(requestId);
	}
	return request;
};
const timeoutHandler = (requestId, requests, timeout) => {
	const { resolve } = deletePendingRequest(requestId, requests);
	resolve({
		type: 'warning',
		message: `REST server: response not received before timeout of ${timeout} ms.`
	});
};

module.exports = class EventEmittingRESTServer extends RESTServer {
	static instance(config) {
		if (!EventEmittingRESTServer.singleton) {
			EventEmittingRESTServer.singleton = new EventEmittingRESTServer(config);
		}
		return EventEmittingRESTServer.singleton;
	}

	constructor(config) {
		super(config);
		this._emitter = new EventEmitter({
			wildcard: true,
			delimiter: '/',
			maxListeners: 100
		});
		this._pendingRequests = new Map();
		this._timeout = DEFAULT_TIMEOUT;
	}

	stop() {
		// TODO: remove listeners
		return super.stop();
	}

	on(event, callback) {
		this._emitter.on(event, callback);
	}

	off(event, callback) {
		this._emitter.removeListener(event, callback);
	}

	removeAllListeners(event) {
		this._emitter.removeAllListeners(event);
	}

	handleRequest({ topic, message, expectResponse, timeout, user, transportDetails }) {
		return new Promise((resolve, reject) => {
			message.metadata = {
				user,
				expectResponse
			};
			const requestId = IdGenerator.generate();
			message.metadata.id = requestId;
			message.metadata.topic = topic;
			message.metadata.transportDetails = transportDetails;
			this._pendingRequests.set(requestId, { resolve, reject });
			const timeoutId = setTimeout(
				() => timeoutHandler(requestId, this._pendingRequests, timeout || this._timeout),
				timeout || this._timeout
			);
			this._pendingRequests.set(requestId, { resolve, reject, timeoutId });
			this._emitter.emit(topic, message);
		});
	}

	handleResponse(requestId, message) {
		const request = deletePendingRequest(requestId, this._pendingRequests);
		if (request) {
			return request.resolve(message);
		}
		return Promise.resolve(message);
	}

	_postConfig(config) {
		config.requestHandler = this;
		return config;
	}
};
