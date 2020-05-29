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
const FileConnector = require('./FileConnector');

const MODE = {
	FILE: 'file',
	APPEND: 'append'
};

const PUBLISH_MODE = {
	CREATE: 'create',
	APPEND: 'append'
};

module.exports = class FileProducer extends sdk.ProducerMixin(FileConnector) {
	async produce(config) {
		const {
			directory = '',
			filename,
			mode = PUBLISH_MODE.APPEND,
			separator = ','
		} = config;
		const content = config.messageObject;
		if (!filename) {
			this.handleError('Filename is required but not specified.');
			return;
		}
		const dirPath = path.join(this.rootDir, directory);
		try {
			fs.ensureDirSync(dirPath);
		} catch (e) {
			this.handleError(`Directory "${dirPath}" could not be created.`);
		}
		const fPath = path.resolve(dirPath, filename);
		let stringToWrite = content;
		if (Array.isArray(content)) {
			stringToWrite = content
				.map((row) => {
					if (Array.isArray(row)) {
						return row.join(separator);
					}
					return row;
				})
				.join('\n');
		}
		if (mode === PUBLISH_MODE.APPEND) {
			this.client.append(fPath, `${stringToWrite}\n`);
		} else if (mode === PUBLISH_MODE.CREATE) {
			this.client.write(fPath, stringToWrite);
		} else {
			const validModes = Object.keys(MODE)
				.map((m) => PUBLISH_MODE[m])
				.join(', ');
			this.handleError(
				`Value for "mode" is not valid: ${mode}. Allowed values: ${validModes}.`
			);
		}
	}
};
