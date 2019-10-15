module.exports = class Reader {
	constructor() {
		this._version = 0;
	}

	set version(version) {
		this._version = version;
	}

	get version() {
		return this._version;
	}

	getDocument() {}

	getObject(/* object, key */) {}

	getAttribute(/* object, key */) {}

	iterateObjects(/* object, callback */) {}

	iterateAttributes(/* object, callback */) {}
};
