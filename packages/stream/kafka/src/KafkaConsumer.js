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
const { ConsumerMixin } = require('@cedalo/sdk-streams');
const KafkaConnector = require('./KafkaConnector');

module.exports = class KafkaConsumer extends ConsumerMixin(KafkaConnector) {
	constructor(streamConfig) {
		super(streamConfig);
		this._consumer = null;
		this.partition = 1;
	}

	get topics() {
		return this.config.topics || [];
	}

	get groupId() {
		let groupId = this.config.groupId;
		if (!groupId || (groupId && groupId.length < 1)) {
			groupId = `my-group${this.config.id}`;
		}
		return groupId;
	}

	async connect() {
		try {
			await super.connect();
			this._consumer = this._client.consumer({
				groupId: this.groupId,
				readUncommitted: true,
				maxBytes: 3485760, // 10485760 (10MB)
				maxWaitTimeInMs: 300
				// fromOffset: this.config.offset,
			});
			this._consumer.on(this._consumer.events.DISCONNECT, () => {
				this.onClose();
			});
			const res = await this._consumer.connect();
			this.logger.info('Consumer connected');
			this.setConnected();
		} catch (e) {
			this.onClose();
			this.handleError(e);
		}
	}

	async initialize() {
		if (this.config.ksqlQuery && this.config.ksqlQuery.length > 0) {
			try {
				const query = this.config.ksqlQuery;
				this.ksqlQuery(this.config.ksqlQuery, (error, data) => {
					if (!error) {
						this.onMessage(query, data);
					} else {
						this.handleError(error);
					}
				});
			} catch (e) {
				this.logger.error(e);
			}
		}
		const pendingSubscribes = this.topics.filter((t) => !!t).map((t) => this._consumer.subscribe({ topic: t }));

		try {
			await Promise.all(pendingSubscribes);
			await this._consumer.run({
				autoCommitThreshold: 100,
				eachMessage: async ({ topic, partition, message }) => {
					const { headers, offset, timestamp, key } = message;
					// const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
					// this.logger.debug(`- ${prefix} ${message.key}#${message.value}`);
					// this.logger.debug(JSON.stringify(message));
					// this.config.offset = message.offset;
					// this.logger.debug(message.offset);
					// this.onMessage(topic, message.value);
					this.onMessage(topic, message.value, {
						transportDetails: { key: key && key.toString(), partition, offset, headers, timestamp }
					});
					// this.save();
				}
			});
		} catch (e) {
			this.handleError(e);
		}
	}

	async setOffsetCommandRun() {
		const { offset } = this.config;
		const admin = this._client.admin();
		await admin.connect();
		const topicsMeta = await admin.getTopicMetadata({ topics: this.topics });
		const getTopicPartitions = (topic) => {
			const topicMeta = topicsMeta.topics.find((t) => t.name === topic);
			if (topicMeta) {
				const { partitions } = topicMeta;
				return partitions.map((p) => p.partitionId);
			}
			return [];
		};
		const fns = this.topics.map(async (topic) => {
			const partitions = getTopicPartitions(topic);
			const offsets = partitions.map((p) => ({ partition: p, offset }));
			await admin.setOffsets({
				groupId: this.groupId,
				topic,
				partitions: offsets
			});
			// this._consumer.seek({ topic, partition: 2, offset: 1 });
		});
		try {
			await Promise.all(fns);
		} catch (e) {
			this.handleError(e);
		}
		await admin.disconnect();
	}

	async dispose() {
		if (this._consumer) {
			await this._consumer.disconnect();
		}
		await super.dispose();
		this._consumer = null;
	}
};
