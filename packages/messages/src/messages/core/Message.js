const IdGenerator = require('@cedalo/id-generator');

module.exports = class Message {

	constructor(type = 'message', id = IdGenerator.generate()) {
		this._type = type;
		this._id = id;
	}

	get id() {
		return this._id;
	}

	get type() {
		return this._type;
	}

};
