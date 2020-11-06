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
const fs = require('fs-extra');
const Message = require('../machine/Message');
const RocksDbClient = require('./RocksDbClient');
const logger = require('../logger').create({ name: 'MessageStore' });

const getStoreLocation = async (storeId) => {
	const basedir = process.env.OUTBOX_STORAGE_DIR || '/tmp/streamsheets/outbox';
	const location = `${basedir}/${storeId}`;
	await fs.mkdirs(location);
	return location;
};

const messageFromJSON = (json) => (json ? Message.fromJSON(json) : undefined);
const returnTrue = () => true;
const logError = (msg, returnValue = false) => (error) => {
	logger.error(msg, error);
	return returnValue;
};
const changeSize = (value, store) => () => {
	if (value) store._size += value;
	else store._size = 0;
	return true;
};

class MessageStore {
	constructor() {
		this._size = 0;
		this.rocksdb = new RocksDbClient();
		this.incSize = changeSize(1, this);
		this.decSize = changeSize(-1, this);
		this.clearSize = changeSize(0, this);
	}

	get size() {
		return this._size;
	}

	async open(storeId) {
		let isOpen = false;
		try {
			const location = await getStoreLocation(storeId);
			// we store complete messages, so set valueEncoding to json
			isOpen = (await this.rocksdb.open(location, { valueEncoding: 'json' })).isConnected;
		} catch (err) {
			logger.error('Failed to open message store!', err);
		}
		return isOpen;
	}
	async close(storeId, deleted) {
		let res = await this.rocksdb.close().then(returnTrue).catch(logError('Failed to close message store!'));
		if (deleted) {
			const location = await getStoreLocation(storeId);
			res = await fs.remove(location).then(returnTrue).catch(logError('Failed to delete store location!'));
		}
		return res;
	}

	async get(messageId) {
		return this.rocksdb
			.get(messageId)
			.then(messageFromJSON)
			.catch(logError('Failed to get message from message store!', undefined));
	}
	async getAll() {
		return this.rocksdb
			.getAll()
			.then((jsons) => jsons.map(messageFromJSON))
			.catch(logError('Failed to get all messages from message store!', []));
	}

	async remove(message) {
		return this.rocksdb
			.del(message.id)
			.then(this.decSize)
			.catch(logError('Failed to remove message from message store!'));
	}
	async removeAll() {
		return this.rocksdb
			.delAll()
			.then(this.clearSize)
			.catch(logError('Failed to remove all messages from message store!'));
	}

	async add(message) {
		return this.rocksdb
			.put(message.id, message.toJSON())
			.then(this.incSize)
			.catch(logError('Failed to add message to message store!'));
	}
	async update(message) {
		return this.rocksdb
			.put(message.id, message.toJSON())
			.then(returnTrue)
			.catch(logError('Failed to update message in message store!'));
	}
}

module.exports = MessageStore;
