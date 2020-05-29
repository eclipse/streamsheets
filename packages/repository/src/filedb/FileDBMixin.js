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
'use strict';

const low = require('lowdb');

/**
 * An mixin that provides a JSON file database.
 *
 * @class FileDBMixin
 * @public
 */
const FileDBMixin = superclass => class extends superclass {

	constructor({ dbFile }) {
		super();
		this._db = low(dbFile);
		this._db.defaults({ machines: [] }).value();
	}

	get db() {
		return this._db;
	}

	set db(db) {
		this._db = db;
	}
};
module.exports = FileDBMixin;
