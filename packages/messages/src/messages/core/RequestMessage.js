const IdGenerator = require('@cedalo/id-generator');
const BaseMessage = require('./BaseMessage');

module.exports = class RequestMessage extends BaseMessage {
	
	constructor(type, requestId = IdGenerator.generate()) {
		super(type);
		this._requestId = requestId;
	}

	toJSON() {
		return Object.assign(
			{
				id: this._id,
				type: this._type,
				requestId: this._id
			}, this._getConfig());
	}

	_getConfig() {
		return {};
	}

}
