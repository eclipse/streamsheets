const BaseMessage = require('./BaseMessage');

module.exports = class EventMessage extends BaseMessage {
	
	constructor(event) {
		super('event');
		this.event = event;
	}

	toJSON() {
		return {
			id: this._id,
			type: this._type,
			event: this.event
		}
	}

}