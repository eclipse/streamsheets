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
const {ProducerMixin, RequestResponse} = require('@cedalo/sdk-streams');
const KafkaConnector = require('./KafkaConnector');
const KSQLHelper = require('./KSQLHelper');
const KafkaFunctions = require('./KafkaFunctions');

module.exports = class KafkaProducer extends ProducerMixin(KafkaConnector) {
	constructor(config) {
		super(config);
		this._producer = null;

	}

	async connect() {
		try {
			await super.connect();
			this._producer = this._client.producer();
			this._producer.on(this._producer.events.DISCONNECT, () => {
				this.onClose();
			});
			const res = await this._producer.connect();
			this.logger.info('Producer connected');
			this.setConnected();

		} catch (e) {
			this.handleError(e);
			this.onClose();
			return;
		}
		try {
			if (this.isConnected && this.ksqlRESTUrl) {
				await this.doKSQLCommand({
					ksqlCommand: 'show topics;show tables;',
				});
			}
		} catch (e) {
			this.handleWarning(e);
		}
	}

	async produce(config) {
		const {topic, message, key} = config;
		const msg = typeof message !== 'string' ? JSON.stringify(message) : message;
		const messageKey = typeof key === 'string' && key.length > 0 ? key : '0';
		return this._producer.send({
			topic,
			messages: [{key: messageKey, value: msg}],
		});
	}

	async request(config_) {
		const requestId = config_.Metadata.requestId;
		const config = config_.Data;
		// this.logger.debug(JSON.stringify(config.Data));
		const name = config.functionName;
		let response;
		try {
			switch (name) {
				case KafkaFunctions.COMMAND:
					response = await this.doKSQLCommand(config);
					break;
				case KafkaFunctions.QUERY:
					response = await this.doKSQLQuery(config);
					break;
				default:
					response = await this.doKSQLQuery(config);
			}
		} catch (e) {
			response = {
				error: e,
			};
		}
		response = KSQLHelper.getResponseMessage(JSON.stringify(response));
		if (response.error) {
			response.Metadata = {
				error: response.error,
			};
			response.Data = {};
		} else {
			response = {
				Data: response,
				Metadata: {},
			};
		}
		return new RequestResponse(response, requestId);
	}

	async doKSQLQuery(config) {
		return new Promise((res, rej) => {
			const {query} = config;
			this.ksqlQuery(query, (error, data) => {
				if (!error) {
					return res(data);
				}
				return rej(error);
			});
		});
	}

	async doKSQLCommand(config) {
		return new Promise((res, rej) => {
			const {ksqlCommand} = config;
			const cb = (error, msg) => {
				if (!error) {
					return res(msg);
				}
				// this.handleError(error);
				return rej(error);
			};
			return KSQLHelper.command(this.ksqlRESTUrl, ksqlCommand, cb, this.logger);
		});
	}

	async dispose() {
		if(this._producer) {
			await this._producer.disconnect();
		}
		await super.dispose();
		this._producer = null;
	}
};
