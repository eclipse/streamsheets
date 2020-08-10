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
const { LoggerFactory } = require('@cedalo/logger');
const { MessagingService } = require('@cedalo/service-core');
const { Topics } = require('@cedalo/protocols');
const MongoDBStreamsRepository = require('./persistence/MongoDBStreamsRepository');
const StreamsManager = require('./StreamsManager');
const StreamsRequestHandlers = require('./handlers/StreamsRequestHandlers');
const { RequestHandlers } = require('@cedalo/service-core');

const logger = LoggerFactory.createLogger(
	'Streams Service',
	process.env.STREAMSHEETS_STREAMS_SERVICE_LOG_LEVEL
);

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
module.exports = class StreamsService extends MessagingService {
	constructor(metadata) {
		super(metadata);
		this.startDone = new Promise((resolve) => {
			this.finishStart = resolve;
		});
	}

	async start() {
		await super.start();
		this.repo = new MongoDBStreamsRepository();
		await this.repo.init();
		// TODO: init manager after receiving license info
		this._streamsManager = new StreamsManager({
			repo: this.repo,
		});
		this.finishStart();
		// return this._streamsManager.start(); // keep for starting alone
	}

	async _preStart() {
		await sleep(process.env.STREAMS_SERVICE_START_DELAY || 0);
		await super._preStart();
	}

	async dependencyServiceStatusUpdated(
		service,
		status /* , topic, message */
	) {
		await this.startDone;
		if (
			this._streamsManager &&
			service === 'machines' &&
			status === 'running'
		) {
			logger.info(
				'Machines service has restarted - reload streams is triggered'
			);
			this._streamsManager.reloadAll();
		}
	}

	async handleMessage(topic, message) {
		if (topic === Topics.SERVICES_STREAMS_INPUT) {
			const requestHandler = RequestHandlers.createFor(
				message,
				StreamsRequestHandlers
			);
			try {
				const handlerArgs = {
					message,
					streamsManager: this._streamsManager,
					messagingClient: this.messagingClient,
					monitorManager: this._monitorManager,
				};
				const response = await requestHandler.handle(handlerArgs);
				this.publishMessage(Topics.SERVICES_STREAMS_EVENTS, response);
			} catch (error) {
				logger.error(
					`StreamsService#handleMessage:Failed to handle request ${
						message.type
					}!\\nReason: `,
					error
				);
				if (error.type !== 'error') {
					const errorMessage = `Streams service failed to handle request ${
						message.type
					}!`;
					const errorObject = requestHandler.reject(
						message,
						errorMessage
					);
					errorObject.error.reqType = message.type;
					this.publishMessage(Topics.ERRORS_GLOBAL, errorObject);
				}
			}
		}
	}

	async _handleResponseMessage(topic /* , message */) {
		switch (topic) {
			default:
				break;
		}
	}

	async _handleRequestMessage(topic /* , message */) {
		switch (topic) {
			default:
				break;
		}
	}

	async _handleEventMessage(topic /* , message */) {
		switch (topic) {
			default:
				break;
		}
	}

	_getKeepAliveTopic() {}

	_getKeepAliveMessage() {
		return { type: 'connect', server: 'streams-service' };
	}

	getTopicsToSubscribe() {
		return [
			Topics.SERVICES_STREAMS_INPUT,
			`${Topics.SERVICES_STATUS}/machines`
		];
	}

	getDependedServices() {
		return ['machines'];
	}
};
