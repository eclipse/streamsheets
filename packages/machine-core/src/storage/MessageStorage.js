const fs = require('fs-extra');
const Message = require('../machine/Message');
const RocksDbClient = require('./RocksDbClient');

const getStorageLocation = async (storageId) => {
	const basedir = process.env.OUTBOX_STORAGE_DIR || '/tmp/streamsheets/outbox';
	const location = `${basedir}/${storageId}`;
	await fs.mkdirs(location);
	return location;
};


class MessageStorage {

	constructor() {
		this.size = 0;
		this.rocksdb = new RocksDbClient();
	}

	async open(storageId) {
		const location = await getStorageLocation(storageId);
		// we store complete messages, so set valueEncoding to json
		return this.rocksdb.open(location, { valueEncoding: 'json' });
	}
	async close() {
		return this.rocksdb.close();
	}

	async get(messageId) {
		const json = await this.rocksdb.get(messageId);
		return Message.fromJSON(json);
	}
	async getAll() {
		const jsons = await this.rocksdb.getAll();
		return jsons.map((json) => Message.fromJSON(json));

	}
	async remove(message) {
		await this.rocksdb.del(message.id);
		this.size -= 1;
	}
	async removeAll() {
		await this.rocksdb.delAll();
		this.size = 0;
	}

	async add(message) {
		await this.rocksdb.put(message.id, message.toJSON());
		this.size += 1;
	}
	async update(message) {
		return this.rocksdb.put(message.id, message.toJSON());
	}
}

module.exports = MessageStorage;
