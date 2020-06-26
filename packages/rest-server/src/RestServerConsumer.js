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
const { ConsumerMixin, Message, Connector, Events } = require('@cedalo/sdk-streams');
const RestServerConnector = require('./RestServerConnector');
const _ = require('lodash');

const DEFAULT_TIMEOUT = 5000;

const deletePendingRequest = (requestId, requests) => {
	const request = requests.get(requestId);
	if (request) {
		clearTimeout(request.timeoutId);
		requests.delete(requestId);
	}
	return request;
};
const timeoutHandler = (requestId, requests, timeout) => {
	const { restServer } = deletePendingRequest(requestId, requests);
	restServer.handleResponse(requestId, {
		type: 'warning',
		message: `REST feeder: response not received before timeout of ${timeout} ms.`
	});
};

module.exports = class RestServerConsumer extends ConsumerMixin(RestServerConnector) {
	constructor(config) {
		super({ ...config, type: Connector.TYPE.CONSUMER });
		this._restServer = undefined;
		this._pendingRequests = new Map();
	}

	async publish(config) {
		const { topic, message } = config;
		return this._restServer.handleRequest({
			topic,
			message,
			expectResponse: this.config.expectResponse,
			timeout: this.config.responseTimeout || DEFAULT_TIMEOUT
		});
	}

	async respond(config) {
		return this._restServer.handleResponse(config.requestId, config.message ? config.message.Data : {});
	}

	async test(config = { testTopic: 'cedalo/example', message: { example: 'test' } }) {
		return new Promise(async (res) => {
			this._restServer.on(config.testTopic, (message) => {
				const { metadata } = message;
				if (metadata.topic === config.testTopic && message.example === config.message.example) {
					// eslint-disable-next-line no-console
					console.log(`receiving at: ${metadata.topic}`);
					return res(true);
				}
				return res(false);
			});
			try {
				await this.publish({
					topic: config.testTopic,
					message: config.message
				});
			} catch (e) {
				return res(false);
			}
			setTimeout(async () => res(false), 3000, res);
			return false;
		});
	}

	verify(user) {
		return !this._hasCredentials()
			|| (user && user.name === this.config.connector.userName && user.pass === this.config.connector.password);
	}

	onMessage(topic, restMessage) {
		const { user, transportDetails } = restMessage.metadata;
		const requestId = restMessage.metadata.id;
		const expectResponse = this.config.expectResponse || restMessage.metadata.expectResponse;
		if (this.verify(user)) {
			const restMessageCopy = _.cloneDeep(restMessage);
			delete restMessageCopy.metadata;
			const message = new Message(restMessageCopy);
			if (expectResponse) {
				const timeoutId = setTimeout(
					() => timeoutHandler(
						requestId,
						this._pendingRequests,
						this.config.responseTimeout || DEFAULT_TIMEOUT
					),
					this.config.responseTimeout || DEFAULT_TIMEOUT
				);
				this._pendingRequests.set(requestId, { requestId, timeoutId, restServer: this._restServer });
			}
			this.applyMetaData(message, false);
			message.metadata.requestId = requestId;
			message.metadata.topic = restMessage.metadata.topic;
			message.metadata.transportDetails = transportDetails;
			delete restMessage.metadata.user;
			this.emit(message);
			this._emitter.emit(Events.CONSUMER.MESSAGE, topic, message, this.id);
			if (!expectResponse) {
				delete restMessage.metadata.transportDetails.clientIP;
				this._restServer.handleResponse(requestId, restMessage);
			}
		} else {
			this._restServer.handleResponse(requestId, {
				type: 'error',
				message: 'Username or password not correct.'
			});
		}
	}

	async update(configDiff) {
		await super.update(configDiff);
		await this._updateListeners();
	}

	_hasCredentials() {
		return this.config.connector.userName && this.config.connector.password;
	}
};
