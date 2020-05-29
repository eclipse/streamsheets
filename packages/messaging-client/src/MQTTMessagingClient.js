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
const mqtt = require('mqtt');
const BaseMessagingClient = require('./BaseMessagingClient');
const IdGenerator = require('@cedalo/id-generator');

module.exports = class MQTTMessagingClient extends BaseMessagingClient {

	constructor() {
		super();
		this._messagingClient = null;
		this._id = IdGenerator.generate();
	}

	connect(url, options = {}) {
		options.username =
			options.username || process.env.MESSAGE_BROKER_USERNAME;
		options.password =
			options.password || process.env.MESSAGE_BROKER_PASSWORD;
		options.keepalive =
			options.keepalive ||
			parseInt(process.env.MESSAGE_BROKER_KEEP_ALIVE, 10) ||
			30;
		this.clientId = options.clientId || this._id;
		options.clientId = this.clientId;
		this._messagingClient = mqtt.connect(url, options);
		return new Promise((resolve, reject) => {
			this._messagingClient.on('connect', () => {
				resolve(this._messagingClient);
			});
			this._messagingClient.on('error', (error) => {
				reject(error);
			});
		});
	}

	publish(topic, message, options = {
		qos: 2
	}) {
		if (this._messagingClient) {
			let messageToSend = message;
			if (typeof message  === 'string') {
				try {
					messageToSend = JSON.parse(message);
				} catch (error) {
					// do not allow to send strings
					return;
				}
			}
			messageToSend = JSON.stringify(messageToSend);
			this._messagingClient.publish(topic, messageToSend, options);
		}
	}

	subscribe(topic, options = {
		qos: 2
	}) {
		if (this._messagingClient) {
			this._messagingClient.subscribe(topic, options);
		}
	}

	unsubscribe(topic) {
		if (this._messagingClient) {
			this._messagingClient.unsubscribe(topic);
		}
	}

	/**
	 *
	 * @param {*} event
	 * @param {*} callback (topic, message) => {}
	 */
	on(event, callback) {
		this._messagingClient.on(event, callback);
	}

	end() {
		if (this._messagingClient) this._messagingClient.end(true);
	}
};
