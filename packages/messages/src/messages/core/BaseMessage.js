'use strict';

const Message = require('./Message');

module.exports = class BaseMessage extends Message {

	_getConfig() {
		return {};
	}

	toJSON() {
		return Object.assign(
			{
				type: this._type,
				id: this._id
			}, this._getConfig());
	}

};
