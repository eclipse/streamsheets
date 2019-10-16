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
