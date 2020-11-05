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
const level = require('level-rocksdb');

const throwNotConnected = () => { throw new Error('RocksDbClient not connected!'); };

class RocksDbClient {
	constructor() {
		this.db = undefined;
	}

	get isConnected() {
		return this.db && this.db.isOpen();
	}

	// location is a directory
	async open(location, opts) {
		const db = await level(location, opts);
		this.db = db;
		return this;
	}

	async close() {
		if (this.db) {
			await this.db.close();
			this.db = undefined;
		}
		return this;
	}

	// returns undefined if no value is found for given key
	async get(key) {
		return this.db ? this.db.get(key) : throwNotConnected();
	}

	async getAll() {
		return new Promise((resolve, reject) => {
			if (!this.db) reject(new Error('RocksDbClient not connected!'));
			const values = [];
			this.db
				.createValueStream()
				.on('data', (data) => values.push(data))
				.on('error', reject)
				.on('end', () => resolve(values));
		});
	}

	async del(key) {
		return this.db ? this.db.del(key) : throwNotConnected();
	}

	async delAll() {
		return new Promise((resolve, reject) => {
			if (!this.db) reject(new Error('RocksDbClient not connected!'));
			const batch = this.db.batch();
			this.db
				.createKeyStream()
				.on('data', (key) => batch.del(key))
				.on('error', reject)
				.on('end', () => batch.write().then(resolve).catch(reject));
		});
	}

	async put(key, value) {
		return this.db ? this.db.put(key, value) : throwNotConnected();
	}
}
module.exports = RocksDbClient;
