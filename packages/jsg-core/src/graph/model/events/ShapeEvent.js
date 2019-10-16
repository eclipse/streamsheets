const Event = require('./Event');

/**
 * A special event subclass to handle {{#crossLink "Shape"}}{{/crossLink}} events.
 *
 * @class ShapeEvent
 * @constructor
 * @extends Event
 * @param {String} detailId A detail id to classify the event more exactly.
 * @param {Object} [value] The event value.
 */
class ShapeEvent extends Event {
	constructor(detailId, value) {
		super();
		this.id = Event.SHAPE;
		this.detailId = detailId;
		this.value = value;
		// OPTIONAL FIELDS DEPENDS ON CONTEXT:
		this.index = undefined;
		this.count = undefined;
	}
	// PREDEFINED DETAIL IDs:

	static get INSERTPOINTS() {
		return 'insertpoints';
	}
	static get REPLACEPOINTS() {
		return 'replacepoint';
	}
	static get SETPOINTSAT() {
		return 'setpointat';
	}
	static get REMOVEPOINTS() {
		return 'removepoints';
	}

	// TODO remove:
	static get COORD_ADD() {
		return 'coordinateadd';
	}
	static get COORDS_INSERT_AT() {
		return 'coordinatesinsert';
	}
	static get COORDS_REMOVE_AT() {
		return 'coordnatesremove';
	}
	static get COORDS_REPLACE_AT() {
		return 'coordinatesreplace';
	}
	static get COORDS_REPLACE_ALL() {
		return 'coordinatesreplaceall';
	}
	// ~

	static get COORD_CP() {
		return 'coordinatescp';
	}
	static get COORD_ADD_CPTO() {
		return 'coordinateaddcpto';
	}
	static get COORD_ADD_CPFROM() {
		return 'coordinateaddcpfrom';
	}
	static get COORDS_SET_CPTO() {
		return 'coordinatessetcpto';
	}
	static get COORDS_SET_CPFROM() {
		return 'coordinatessetcpfrom';
	}
}

module.exports = ShapeEvent;
