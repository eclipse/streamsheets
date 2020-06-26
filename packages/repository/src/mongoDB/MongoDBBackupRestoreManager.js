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
