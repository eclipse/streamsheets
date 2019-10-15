const Event = require('./Event');

/**
 * A special event subclass to handle {{#crossLink "Node"}}{{/crossLink}} events.
 *
 * @class NodeEvent
 * @constructor
 * @extends Event
 * @param {String} detailId A detail id to classify the event more exactly.
 * @param {Object} [value] The event value.
 */
class NodeEvent extends Event {
	constructor(detailId, value) {
		super();
		this.id = Event.NODE;
		this.detailId = detailId;
		this.value = value;
		// OPTIONAL FIELDS DEPENDS ON CONTEXT:
	}
}

module.exports = NodeEvent;
