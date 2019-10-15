const Event = require('../events/Event');

/**
 * A special event subclass to handle {{#crossLink "GraphSettings"}}{{/crossLink}} events.
 *
 * @class GraphSettingsEvent
 * @constructor
 * @extends Event
 * @param {String} detailId A detail id to classify the event more exactly.
 * @param {Object} [value] The event value.
 */
class GraphSettingsEvent extends Event {
	constructor(detailId, value) {
		super();
		this.id = Event.GRAPHSETTINGS;
		this.detailId = detailId;
		this.value = value;
	}
}

module.exports = GraphSettingsEvent;
