const uuidv1 = require('uuid/v1');
const shortid = require('shortid');

module.exports = class IdGenerator {

	generate() {
		return this.generateShortId();
	}

	generateUUID() {
		return uuidv1();
	}

	generateShortId() {
		return shortid.generate();
	}

}