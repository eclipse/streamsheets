const { spawn } = require('child_process');

const BackupRestoreManager = require('../BackupRestoreManager');

module.exports = class MongoDBBackupRestoreManager extends BackupRestoreManager {
	
	constructor(config) {
		super();
		this._config = config;
	}

	async backup({ pathToFile }) {
		return new Promise((resolve, reject) => {
			const spawned = spawn('mongodump', [
				'--gzip',
				'--host', `${this._config.MONGO_HOST}:${this._config.MONGO_PORT}`,
				'--db', `${this._config.MONGO_DATABASE}`,
				`--archive=${pathToFile}`
			]);
			spawned.on('exit', (code) => {
				if (code === 0) {
					resolve();				
				} else {
					reject();
				}
			});
		});
	}

	async restore({ pathToFile }) {
		return new Promise((resolve, reject) => {
			const spawned = spawn('mongorestore', [
				'--gzip',
				'--host', `${this._config.MONGO_HOST}:${this._config.MONGO_PORT}`,
				'--db', `${this._config.MONGO_DATABASE}`,
				`--archive=${pathToFile}`
			]);
			spawned.on('exit', (code) => {
				if (code === 0) {
					resolve();				
				} else {
					reject();
				}
			});
		});
	}

};
