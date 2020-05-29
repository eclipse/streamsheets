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
const { Kafka, logLevel } = require('kafkajs');

module.exports = class KafkaOnlyHandler {
	constructor(stream) {
		this.stream = stream;
	}

	get config() {
		return this.stream.config;
	}

	get topics() {
		return this.config.topics || [];
	}

	async connect() {
		try {
			this.stream.logger.debug('Connecting with kafka onlywith config:');
			// this.stream.logger.debug(JSON.stringify(this.stream.config));
			const connectionString = this.stream.config.connector.connectionString ||
										'localhost:9092';
			const clientId = this.stream.config.clientId || 'cedalo-kafka-stream';
			this._client = new Kafka({
				clientId,
				brokers: connectionString.split(','),
				logLevel: process.env.STREAMSHEETS_LOG_LEVEL || logLevel.INFO,
				ssl: this.stream._sslOptions,
				sasl: this.stream._saslOptions
			});
			this._consumer = this._client.consumer({ groupId: 'my-group' });
			this.stream.logger.info('Consumer connected');
			this._producer = this._client.producer();
			this.stream.logger.info('Producer connected');
			await this._consumer.connect();
			await this._producer.connect();
			this.stream.setConnected();
		} catch (e) {
			this.stream.logger.error(`Kafka Client Error: ${e}`);
			this.stream.logger.error(e);
			this.stream.handleError(e);
		}
		this.stream.logger.info('Client connected');
	}

	async initialize() {
		const stopics = this.topics.map(async (topic) => {
			await this._consumer.subscribe({ topic });
			await this._consumer.run({
				eachMessage: async ({ message }) => {
					// this.stream.logger.debug(JSON.stringify(message));
					this.stream.onMessage(topic, message.value);
				}
			});
		});
		return Promise.all(stopics);
	}

	async publish(topic, message) {
		const msg = typeof message !== 'string' ? JSON.stringify(message) : message;
		return this._producer.send({
			topic,
			messages: [{ key: '0', value: msg }]
		});
	}

	async dispose() {
		await this._producer.disconnect();
		await this._consumer.disconnect();
	}

	async test() {
		// TODO
	}
};
