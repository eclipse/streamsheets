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
const logger = require('../logger').create({ name: 'RedisInboxAdapter' });
const Message = require('../machine/Message');
const Redis = require('ioredis');

const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';
const MAX_INBOX_SIZE = parseInt(process.env.MAX_INBOX_SIZE, 10) || 10000;
// const REDIS_HOST = process.env.REDIS_HOST || 'localhost';

const redisAPI = (inboxId, scopeId) => {
	const scopedInboxId = `${scopeId}-${inboxId}`;
	const redis = new Redis(REDIS_PORT, REDIS_HOST);
	const eventRedis = redis.duplicate();
	redis.defineCommand('ack', {
		numberOfKeys: 1,
		lua: `
			local pendingKey=KEYS[1] .. '.pending'
			local element=redis.call('rpop', KEYS[1])
			if element then
				redis.call('publish', KEYS[1], element)
			else
				redis.call('decr', pendingKey)
			end
			return redis.call('llen', KEYS[1])`
	});

	redis.defineCommand('queue', {
		numberOfKeys: 1,
		lua: `
			local pendingKey=KEYS[1] .. '.pending'
			local pending=tonumber(redis.call('get', pendingKey)) or 0;
			local inboxLen=tonumber(redis.call('llen', KEYS[1])) or 0;
			if pending < 20 then
				redis.call('publish', KEYS[1], ARGV[1]);
				redis.call('incr', pendingKey)
				return 0
			elseif inboxLen < ${MAX_INBOX_SIZE} then
				return redis.call('lpush', KEYS[1], ARGV[1])
			end`
	});

	const redisErrorHandler = () => {
		// Ignore redis errors
		// logger.warn(error);
	};

	redis.on('error', redisErrorHandler);
	eventRedis.on('error', redisErrorHandler);

	const inboxKey = `inbox.${scopedInboxId}`;
	const inboxKeyPending = `inbox.${scopedInboxId}.pending`;

	const streamSubscriberKey = (streamId) => `stream.${scopeId}-${streamId}.subscribers`;

	const queue = async (key, message) => redis.queue(key, message);

	const push = async (message) => {
		const jsonMessage = JSON.stringify(message.toJSON());
		return queue(inboxKey, jsonMessage);
	};

	const clear = async () => redis.del(inboxKey, inboxKeyPending);

	const isSubscribed = async (streamId) => redis.sismember(streamSubscriberKey(streamId), scopedInboxId);

	const subscribe = async (streamId) => {
		eventRedis.subscribe(inboxKey);
		redis.del(inboxKeyPending);
		redis.sadd(streamSubscriberKey(streamId), scopedInboxId);
	};

	const unsubscribe = async (streamId) => {
		eventRedis.unsubscribe(inboxKey);
		redis.srem(streamSubscriberKey(streamId), scopedInboxId);
	};

	const ack = async () => redis.ack(inboxKey);

	const onNewMessage = (f) =>
		eventRedis.on('message', (channel, message) => {
			try {
				const parsed = JSON.parse(message);
				f(parsed);
			} catch (e) {
				logger.warn(`Received non JSON message from redis: ${message}`);
			}
		});

	const dispose = () => {
		redis.quit();
		eventRedis.quit();
	};

	return {
		push,
		clear,
		dispose,
		isSubscribed,
		ack,
		subscribe,
		unsubscribe,
		onNewMessage
	};
};

class RedisInboxAdapter {
	constructor(inbox, scopeId) {
		this.inbox = inbox;
		this.redisLen = 0;
		this.redis = redisAPI(this.inbox.id, scopeId);
		this.redis.onNewMessage((message) => this._newMessage(message));
		this.subscribe = this.subscribe.bind(this);
		this.unsubscribe = this.unsubscribe.bind(this);
		this.clear = this.clear.bind(this);
		this.put = this.put.bind(this);
		this.pop = this.pop.bind(this);
	}

	get totalSize() {
		return this.inbox.size + this.redisLen;
	}

	clear() {
		this.redis.clear();
		this.redisLen = 0;
	}

	async subscribe(streamId) {
		this.redis.subscribe(streamId);
	}

	unsubscribe(streamId) {
		this.redis.unsubscribe(streamId);
	}

	dispose() {
		this.redis.dispose();
	}

	pop(message) {
		if (message) {
			this.redis.ack().then((len) => {
				this.redisLen = len;
			});
		}
	}

	put(message, wasPut) {
		if (!wasPut) {
			this.redis.push(message).then((len) => {
				this.redisLen = len;
			});
		}
	}

	async _newMessage(jsonMessage) {
		const message = Message.fromJSON(jsonMessage);
		if (message) {
			// Force the message into the inbox
			// Otherwise it would end up at the last position in the redis queue
			this.inbox.put(message, true);
		} else {
			logger.warn(`Unknown message format: ${jsonMessage}`);
		}
	}
}

module.exports = RedisInboxAdapter;
