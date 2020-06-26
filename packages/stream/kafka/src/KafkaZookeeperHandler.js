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
const { Field } = require('@cedalo/sdk-streams');
const kafka = require('kafka-node');

const zkOptions = {
	sessionTimeout: 30000,
	spinDelay: 1000,
	retries: 0
};
const defKafkaClientOpts = {
	kafkaHost: 'localhost:9093',
	connectTimeout: 10000,
	requestTimeout: 30000,
	autoConnect: true
	// connectRetryOptions: {}
};

module.exports = class KafkaZookeeperHandler {
	constructor(stream) {
		this.stream = stream;
	}

	async connect() {
		try {
			this._client = await this._createClient();
			await this._initConsumer();
			return this._initProducer();
		} catch (e) {
			this.stream.handleError(e, 'CONNECT_ERROR');
			this.stream.logger.error(e);
			return false;
		}
	}

	async initialize() {
		return this._subscribeToTopics();
	}

	async publish(topic, message) {
		const msg = typeof message !== 'string' ? JSON.stringify(message) : message;
		const payloads = [{ topic, messages: msg }];
		if (!this._producer) {
			await this._initProducer();
		}
		return new Promise((resolve, reject) => {
			this._producer.send(payloads, (err, data) => {
				this.stream.logger.debug(`sending message to ${topic}`);
				if (err) {
					this.stream.logger.error(`Fail publishing ${topic}`);
					this.stream.handleError(new Error(err[0]));
				}
				return (err) ? reject(err) : resolve(data);
			});
		});
	}

	// async test(config = { payload: { testme: 'testme' }, topic: 'test' }) {
	// 	return new Promise(async (res, rej) => {
	// 		await this._addTopics([config.topic]);
	// 		const fn = (message) => {
	// 			const { topic, value /* , offset, partition, highWaterOffset, key */} = message;
	// 			if (topic === config.topic) {
	// 				try {
	// 					const msg = JSON.parse(value);
	// 					res(msg.testme === 'testme');
	// 				} catch (e) {
	// 					this.stream.logger.warn(`Failed to parse message to json: ${message}`);
	// 					rej(e);
	// 				}
	// 			}
	// 		};
	// 		this._consumer.on('message', fn);
	// 		try {
	// 			await this._publish({
	// 				topic: config.topic,
	// 				message: config.payload
	// 			});
	// 		} catch (e) {
	// 			return res(false);
	// 		}
	// 		setTimeout(async () => res(false), 15000);
	// 		return false;
	// 	});
	// }

	async dispose() {
		await this._disposeClient(this._client);
		this._consumer = null;
		this._producer = null;
		this._connected = false;
	}

	async _disposeClient(client) {
		if (!client) return true;
		return new Promise((res) => {
			if (this.connected) {
				client.close((o) => {
					res(o);
				});
			}
			res(true);
		});
	}

	async _createClient() {
		const connectionString = this.stream.config.connector.connectionString ||
								'localhost:2181/';
		const clientId = this.stream.config.clientId || 'cedalo-kafka-stream';
		const mode = this.stream.config.connector.mode || 'zk';
		if (mode === 'zk') {
			const noAckBatchOptions = { noAckBatchSize: null, noAckBatchAge: null };
			return new kafka.Client(connectionString, clientId, zkOptions,
				noAckBatchOptions, this.stream._sslOptions);
		}
		const kafkaClientOptions = Object.assign(defKafkaClientOpts, {
			kafkaHost: connectionString,
			connectTimeout: 20000, // def:10000
			requestTimeout: 50000, // def 30000
			autoConnect: true,
			// maximum async operations at a time toward the kafka cluster. default: 10
			maxAsyncRequests: 10,
			sslOptions: this.stream._sslOptions
		});
		const client = new kafka.KafkaClient(kafkaClientOptions);
		client.on('error', (err) => {
			this.stream.logger.error(`Kafka Client Error: ${err}`);
			this.stream.logger.error(err);
			this.stream.handleError(err);
		});
		client.once('connect', () => {
			this.stream.logger.info('Client connected');
			client.loadMetadataForTopics([], (error, results) => {
				if (error) {
					this.stream.logger.error(error);
					return;
				}
				this.stream.logger.debug(`Meta from broker: ${JSON.stringify(results)}`);
			});
		});
		return client;
	}

	async _createTopics(topics) {
		return new Promise((res, rej) => {
			this._producer.createTopics(topics, true, (err, data) => {
				if (err) return rej(err);
				return res(data);
			});
		});
	}

	async _addTopics(topics, isRetry = false) {
		return new Promise((res) => {
			const topicsObj = topics.map((topic) => {
				if (typeof topic === 'string') {
					return {
						topic,
						offset: 0,
						partition: 0
					};
				}
				return topic;
			});
			this._consumer.addTopics(topicsObj, async (err, added) => {
				if (err) {
					this.stream.logger.info(`trying to create topics${err}`);
					if (isRetry) {
						await this.stream.handleError(err, 'KAFKA_SUBSCRIBE_ERROR');
						return this.stream.dispose();
					}
					if (err.topics && err.topics.length > 0) {
						this.stream.logger.info(`trying to create topics${err.topics}`);
						try {
							await this._createTopics(err.topics);
							this.stream.logger.info(`topics created: ${err.topics}`);
						} catch (e) {
							this.stream.logger.error(`failed to create topics ${err.topics}`);
						}
					}
					return this._addTopics(topics, true);
				}
				return res(added);
			});
		});
	}

	async _subscribeToTopics(isRetry = false) {
		const topics = this.stream.config.topics.map(topic => ({
			topic,
			offset: 0,
			partition: 0
		}));
		return new Promise((res) => {
			this._consumer.addTopics(topics, async (err, added) => {
				if (err) {
					this.stream.logger.info(`trying to create topics${err}`);
					if (isRetry) {
						await this.stream.handleError(err, 'KAFKA_SUBSCRIBE_ERROR');
						return this.stream.dispose();
					}
					if (err.topics && err.topics.length > 0) {
						this.stream.logger.info(`trying to create topics${err.topics}`);
						try {
							await this._createTopics(err.topics);
						} catch (e) {
							this.stream.logger.error(`failed to create topics ${err.topics}`);
						}
					}
					return this._subscribeToTopics(true);
				}
				this.stream.logger.info(`subscribed to topics: ${JSON.stringify(topics)}`);
				return res(added);
			}, true);
		});
	}

	async _initConsumer() {
		const options = {
			groupId: 'kafka-node-group', // consumer group id, default `kafka-node-group`
			// Auto commit config
			autoCommit: true,
			autoCommitIntervalMs: 5000,
			// The max wait time is the maximum amount of time in milliseconds to block waiting
			// if insufficient data is available at the time the request is issued, default 100ms
			fetchMaxWaitMs: 100,
			// This is the minimum number of bytes of messages that must be available to give a response, default 1 byte
			fetchMinBytes: 1,
			// The maximum bytes to include in the message set for this partition.
			// This helps bound the size of the response.
			fetchMaxBytes: 1024 * 1024,
			// If set true, consumer will fetch message from the given offset in the payloads
			fromOffset: false,
			// If set to 'buffer', values will be returned as raw buffer objects.
			encoding: 'utf8',
			keyEncoding: 'utf8'
		};
		this._consumer = new kafka.Consumer(this._client, [], options);
		this._consumer.on('message', (message) => {
			let { value /* , offset, partition, highWaterOffset, key */} = message;
			const { topic } = message;
			try {
				value = JSON.parse(value);
			} catch (e) {
				this.stream.logger.warn(`Failed to parse as json message value : ${value}`);
			}
			this.stream.onMessage(topic, value);
		});
		this._consumer.on('error', async (err) => {
			this.stream.logger.error('consumer error', err);
			await this.stream.handleError(err, 'KAFKA_CONSUME_ERROR');
			if (!this._consumer) await this.stream.dispose();
		});
	}

	async _initProducer() {
		this._producer = new kafka.HighLevelProducer(this._client);
		this._producer.on('error', async (err) => {
			this.stream.logger.error('producer error', err);
			this._connected = false;
			await this.stream.handleError(err, 'KAFKA_PRODUCE_ERROR');
			if (!this._producer) await this.stream.dispose();
		});

		const connectTimeout = this.stream.getConnectorConfigById('connectTimeout',
			Field.TYPES.POSINT) || 10000;
		const t = setTimeout(() => {
			if (!this._connected) {
				this.stream.handleError(new Error('KAFKA_CONNECT_TIMEOUT'));
			}
		}, connectTimeout);
		this._producer.on('ready', () => {
			clearTimeout(t);
			if (!this.stream.connected) {
				this.stream.setConnected();
			}
		});
	}
};
