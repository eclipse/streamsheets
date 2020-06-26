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
const { logger } = require('@cedalo/logger');

const { MessagingClient } = require('@cedalo/messaging-client');
const { Topics } = require('@cedalo/protocols');

const BaseService = require('./BaseService');
const MessagingRequestHelper = require('./helpers/MessagingRequestHelper');

const isRequestMessage = (message) =>
	message.type !== 'response' && message.type !== 'event';
const isResponseMessage = (message) => message.type === 'response';
const isEventMessage = (message) => message.type === 'event';
const getServiceFromStatusTopic = (topic) => {
	const parts = topic.split('/');
	return parts[parts.length - 1];
};

module.exports = class MessagingService extends BaseService {
	constructor(
		metadata = {},
		config = {
			messageBroker: {
				url: process.env.MESSAGE_BROKER_URL || 'mqtt://localhost:1883',
				username: process.env.MESSAGE_BROKER_USERNAME || null,
				password: process.env.MESSAGE_BROKER_PASSWORD || null
			}
		}
	) {
		super(metadata, config);
		this._messagingClient = new MessagingClient();
	}

	get messagingClient() {
		return this._messagingClient;
	}

	async handleMessage(topic, message) {
		if (isRequestMessage(message)) {
			this._handleRequestMessage(topic, message);
		} else if (isResponseMessage(message)) {
			this._handleResponseMessage(topic, message);
		} else if (isEventMessage(message)) {
			this._handleEventMessage(topic, message);
		}
	}

	async _handleRequestMessage(/* topic, message */) {
		return Promise.resolve();
	}

	async _handleResponseMessage(/* topic, message */) {
		return Promise.resolve();
	}

	async _handleEventMessage(/* topic, message */) {
		return Promise.resolve();
	}

	async _preStart() {
		const lastWillMessage = this._getLastWillMessage();
		await this._messagingClient.connect(this._config.messageBroker.url, {
			clientId: this.name, // fixed per service to receive while offline
			clean: false, // set to false to receive QoS 1 and 2 messages while offline
			username: this._config.messageBroker.username,
			password: this._config.messageBroker.password,
			will: {
				topic: `${Topics.SERVICES_STATUS}/${this.type}`,
				payload: JSON.stringify(lastWillMessage),
				qos: 2,
				retain: true
			}
		});
		this._messagingClient.on('message', (topic, message) => {
			// TODO: handle empty message
			// TODO: handle JSON parse error
			try {
				const messageString = message.toString();
				const messageParsed = JSON.parse(messageString);
				if (topic.startsWith(Topics.SERVICES_STATUS)) {
					const service = getServiceFromStatusTopic(topic);
					const { status } = messageParsed;
					this.dependencyServiceStatusUpdated(
						service,
						status,
						topic,
						messageParsed
					);
				} else {
					this.handleMessage(topic, messageParsed);
				}
			} catch (error) {
				// TODO: handle error
			}
		});
		this._messagingClient.on(
			'error',
			this.onMessagingClientError.bind(this)
		);
		this._messagingClient.on(
			'reconnect',
			this.onMessagingClientReconnect.bind(this)
		);
		this._messagingClient.on(
			'close',
			this.onMessagingClientClose.bind(this)
		);
		this._messagingClient.on(
			'offline',
			this.onMessagingClientOffline.bind(this)
		);
		this._messagingClient.on('end', this.onMessagingClientEnd.bind(this));
		this._messagingClient.on(
			'connect',
			this.onMessagingClientConnect.bind(this)
		);
		this._subscribeToTopics();
		this._messagingRequestHelper = new MessagingRequestHelper(this._messagingClient);
	}

	onMessagingClientError(error) {
		logger.error(`Messaging Client error: ${error}`);
	}

	onMessagingClientReconnect() {
		logger.debug(`Messaging Client reconnecting`);
	}

	onMessagingClientClose() {
		logger.debug(`Messaging Client closing`);
	}

	onMessagingClientOffline() {
		logger.debug(`Messaging Client offline`);
	}

	onMessagingClientEnd() {
		logger.debug(`Messaging Client end`);
	}

	onMessagingClientConnect() {
		this._publishServiceStatus();
	}

	_getLastWillMessage() {
		return Object.assign(this.metadata, {
			status: 'stopped'
		});
	}

	// when there are services that this service depends on do something (e.g. start)
	async dependencyServiceStatusUpdated() {
		return true;
	}

	_publishServiceStatus() {
		const serviceInformation = Object.assign(this.metadata, {
			status: 'running'
		});
		this.publishMessage(
			`${Topics.SERVICES_STATUS}/${this.type}`,
			serviceInformation,
			{
				qos: 2,
				retain: true
			}
		);
	}

	async _postStart() {
		await super._postStart();
		this._publishServiceStatus();
		this._sendKeepAlive();
	}

	publishMessage(topic, message, options) {
		this._messagingClient.publish(topic, message, options);
	}

	getTopicsToSubscribe() {
		return ['#'];
	}

	_subscribeToTopics() {
		const topics = this.getTopicsToSubscribe();
		const depTopics = this.getDependedServices().map(
			(dep) => `${Topics.SERVICES_STATUS}/${dep}`
		);
		const allTopics = topics.concat(depTopics);
		allTopics.forEach((topic) => this._messagingClient.subscribe(topic));
	}

	getDependedServices() {
		return [];
	}

	// TODO: handle this in another way, e.g., by sending a status request by the gateway
	_sendKeepAlive() {
		// TODO: change server to service both in the property and the value
		// this.publishMessage(this._getKeepAliveTopic(), this._getKeepAliveMessage());
		// setTimeout(() => {
		// 	this._sendKeepAlive();
		// }, 15000);
	}

	_getKeepAliveTopic() {
		throw new Error('_getKeepAliveTopic() must be implemented by subclass');
	}

	_getKeepAliveMessage() {
		throw new Error(
			'_getKeepAliveMessage() must be implemented by subclass'
		);
	}
};
