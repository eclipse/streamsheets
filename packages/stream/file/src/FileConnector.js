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
const sdk = require('@cedalo/sdk-streams');
const fs = require('fs-extra');
const path = require('path');
const LocalHandler = require('./protocols/local/LocalHandler');

const PROTOCOL = {
	LOCAL: 'local',
	SFTP: 'sftp',
	FTP: 'ftp'
};

const STREAM_HANDLERS = {
	[PROTOCOL.LOCAL]: LocalHandler,
};

module.exports = class FileConnector extends sdk.Connector {
	constructor(streamConfig) {
		super(streamConfig);
		this._handler = null;
		this.running = Promise.resolve();
	}

	async connect() {
		const { /* protocol , */ encoding } = this.config.connector;
		this._handler = new STREAM_HANDLERS[PROTOCOL.LOCAL](this, encoding);
		if (this._handler) {
			try {
				await this._handler.connect();
				return this.setConnected();
			} catch (e) {
				this.logger.error(e);
			}
		}
		return this.handleError(
			new Error('NO_STREAM_HANDLER'),
			'NO_STREAM_HANDLER'
		);
	}

	async dispose() {
		if (this._handler) this._handler.dispose();
		clearTimeout(this.timeoutId);
		this._connected = false;
		this._handler = null;
		try {
			await this.running;
		} catch (e) {
			// Destroying anyway
		}
	}

	get rootDir() {
		return this.config.connector.rootDir || '';
	}

	getCwd() {
		const { dir = '.' } = this.config;
		// TODO: Move to LocalClient. Will not work for SFTP and FTP
		const dirPath = path.resolve(path.join(this.rootDir, dir));
		if (!fs.existsSync(dirPath)) {
			throw new Error(`The directory '${dirPath}' is not valid.`);
		}
		return dirPath;
	}

	get client() {
		if (this._handler) {
			return this._handler._client;
		}
		return null;
	}
};
