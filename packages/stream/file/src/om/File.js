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
module.exports = class File {
	/*
		type: 'd',
		name: 'uploads',
		size: 4096,
		modifyTime: 1524812670000,
		accessTime: 1524812670000,
		rights: { user: 'rwx', group: 'rx', other: 'rx' },
		owner: 1001,
		group: 1001
	 */
	constructor(config) {
		this.type = config.type;
		this.name = config.name;
		this.modifyTime = new Date(config.modifyTime);
		this.accessTime = new Date(config.accessTime);
		this.mtimeMs = config.mtimeMs || 0;
		this.rights = config.rights;
		this.owner = config.owner;
		this.group = config.group;
		this.document = {};
		this.processed = false;
		this._rows = config.rows || [];
		// TODO TESTING PURPOSE ONLY: remove
		this.isProcessing = false;
	}

	toJSON() {
		return {
			type: this.type,
			name: this.name,
			mtimeMs: this.mtimeMs,
			modifyTime: this.modifiyTime ? this.modifyTime.toString() : '',
			accessTime: this.accessTime ? this.accessTime.toString() : '',
			rights: this.rights,
			owner: this.owner,
			group: this.group,
			processed: this.processed,
			data: this.data
		};
	}

	set rows(rows) {
		this._rows = rows;
	}

	pushRow(row) {
		this._rows.push(row);
	}

	get rows() {
		return this._rows.filter((f) => f !== undefined);
	}

	isFile() {
		return this.type === '-';
	}

	isDirectory() {
		return this.type === 'd';
	}

	setProcessed() {
		this.processed = true;
	}

	isProcessed() {
		return this.processed;
	}

	reset() {
		this.processed = false;
		return this;
	}
};
