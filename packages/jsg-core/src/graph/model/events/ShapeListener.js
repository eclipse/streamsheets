const JSG = require('../../../JSG');
const EventListener = require('./EventListener');
const Event = require('./Event');

/**
 * A general abstract listener to handle {{#crossLink "Shape"}}{{/crossLink}} events.
 * Subclasses should not overwrite the <code>handlePreEvent</code> or <code>handlePostEvent</code> methods.
 * Instead this class provides empty stub methods to handle shape events which are intended to be overwritten.
 *
 * @class ShapeListener
 * @constructor
 * @extends EventListener
 */
class ShapeListener extends EventListener {
	handlePreEvent(event) {
		switch (event.id) {
			case Event.SHAPE:
				this.shapeWillChange(event);
				break;
			case Event.SHAPEPOINTS:
				this.shapePointsWillChange(event);
				break;
			default:
				break;
		}
	}

	handlePostEvent(event) {
		switch (event.id) {
			case Event.SHAPE:
				this.shapeDidChange(event);
				break;
			case Event.SHAPEPOINTS:
				this.shapePointsDidChange(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when the shape will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method shapeWillChange
	 * @param {Event} event The event object containing more details.
	 */
	shapeWillChange(event) {}

	/**
	 * This method is called when the shape points will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method shapePointsWillChange
	 * @param {Event} event The event object containing more details.
	 */
	shapePointsWillChange(event) {}

	/**
	 * This method is called when the shape has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method shapeDidChange
	 * @param {Event} event The event object containing more details.
	 */
	shapeDidChange(event) {}

	/**
	 * This method is called when the shape points has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method shapePointsDidChange
	 * @param {Event} event The event object containing more details.
	 */
	shapePointsDidChange(event) {}
}

module.exports = ShapeListener;
