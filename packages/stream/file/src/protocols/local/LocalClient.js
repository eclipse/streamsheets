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
const iconv = require('iconv-lite');

class LocalClient {
	constructor(encoding) {
		this.encoding = encoding;
	}

	async ensureDir(path) {
		return fs.ensureDir(path);
	}

	async move(src, dest) {
		return fs.move(src, dest, { overwrite: true });
	}

	async remove(path) {
		return fs.remove(path);
	}

	async write(path, data, encoding = this.encoding) {
		const encodedData = iconv.encode(data, encoding);
		return fs.writeFile(path, encodedData);
	}

	async append(path, data) {
		const encodedData = iconv.encode(data, this.encoding);
		return fs.appendFile(path, encodedData);
	}
}

module.exports = LocalClient;
