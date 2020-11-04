const level = require('level-rocksdb');

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
		try {
			return this.db ? await this.db.get(key) : undefined;
		} catch (err) {
			console.error(err);
		}
		return undefined;
	}
	async getAll() {
		return new Promise((resolve, reject) => {
			const values = [];
			if (this.db) {
				this.db
					.createValueStream()
					.on('data', (data) => values.push(data))
					.on('error', (err) => reject(err))
					.on('end', () => resolve(values));
			} else {
				resolve(values);
			}
		});
	}
	async del(key) {
		if (this.db) {
			try {
				await this.db.del(key);
			} catch (err) {
				console.error(err);
			}
		}
	}
	async delAll() {
		return new Promise((resolve, reject) => {
			if (this.db) {
				const batch = this.db.batch();
				this.db
					.createKeyStream()
					.on('data', (key) => batch.del(key))
					.on('error', (err) => reject(err))
					.on('end', () => batch.write().then(resolve));
			} else {
				resolve();
			}
		});
	}

	async put(key, value) {
		if (this.db) {
			try {
				await this.db.put(key, value);
			} catch (err) {
				console.error(err);
			}
		}
	}
}
module.exports = RocksDbClient;
