const BaseMessage = require('./BaseMessage');

module.exports = class ResponseMessage extends BaseMessage {
	
	constructor(requestId) {
		super('response');
		this._requestId = requestId;
	}

}