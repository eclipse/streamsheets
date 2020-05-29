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
const Redis = require('ioredis');

const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_HOST = process.env.REDIS_HOST || 'internal-redis';
// const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const redis = new Redis(REDIS_PORT, REDIS_HOST);
redis.config('SET', 'notify-keyspace-events', 'K$ls');
const streamKey = (streamId, scopeId) => `stream.${scopeId}-${streamId}`;
const inboxKey = (inboxId) => `inbox.${inboxId}`;
const streamSubscribersKey = (streamId, scopeId) => `${streamKey(streamId, scopeId)}.subscribers`;

const MAX_INBOX_SIZE = parseInt(process.env.MAX_INBOX_SIZE, 10) || 10000;

redis.defineCommand('queue', {
	numberOfKeys: 1,
	lua: `
		local pendingKey=KEYS[1] .. '.pending'
		local pending=tonumber(redis.call('get', pendingKey)) or 0;
		local inboxLen=tonumber(redis.call('llen', KEYS[1])) or 0;
		if pending < 20 then
			redis.call('publish', KEYS[1], ARGV[1]);
			redis.call('incr', pendingKey)
		elseif inboxLen < ${MAX_INBOX_SIZE} then
			redis.call('lpush', KEYS[1], ARGV[1])
		end
		`
});

redis.defineCommand('queueAll', {
	numberOfKeys: 1,
	lua: `
		local inboxIds = redis.call('smembers', KEYS[1]);
		for _,inboxId in pairs(inboxIds) do
			local inboxKey = 'inbox.' .. inboxId
			local pendingKey=inboxKey .. '.pending'
			local pending=tonumber(redis.call('get', pendingKey)) or 0;
			local inboxLen=tonumber(redis.call('llen', inboxKey)) or 0;
			if pending < 20 then
				redis.call('publish', inboxKey, ARGV[1]);
				redis.call('incr', pendingKey)
			elseif inboxLen < ${MAX_INBOX_SIZE} then
				redis.call('lpush', inboxKey, ARGV[1])
			end
		end
		`
});

module.exports = { redis, streamKey, inboxKey, streamSubscribersKey };
