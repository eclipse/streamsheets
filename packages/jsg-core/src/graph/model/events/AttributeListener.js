const JSG = require('../../../JSG');
const EventListener = require('./EventListener');
const Event = require('./Event');

/**
 * A general abstract listener to handle attribute and layout attribute events. Subclasses should not overwrite the
 * <code>handlePreEvent</code> or <code>handlePostEvent</code> methods. Instead this class provides
 * empty stub methods to handle attribute events which are intended to be overwritten.
 *
 * @class AttributeListener
 * @constructor
 * @extends EventListener
 */
class AttributeListener extends EventListener {
	handlePreEvent(event) {
		switch (event.id) {
			case Event.ATTRIBUTE:
				this.attributeWillChange(event);
				break;
			case Event.LAYOUTATTRIBUTES:
				this.layoutAttributeWillChange(event);
				break;
			default:
				break;
		}
	}

	handlePostEvent(event) {
		switch (event.id) {
			case Event.ATTRIBUTE:
				this.attributeDidChange(event);
				break;
			case Event.LAYOUTATTRIBUTES:
				this.layoutAttributeDidChange(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when an attribute will be changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method attributeWillChange
	 * @param {Event} event The event object containing more details.
	 */
	attributeWillChange(event) {}

	/**
	 * This method is called when a layout attribute will be changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method layoutAttributeWillChange
	 * @param {Event} event The event object containing more details.
	 */
	layoutAttributeWillChange(event) {}

	/**
	 * This method is called when an attribute has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method attributeDidChange
	 * @param {Event} event The event object containing more details.
	 */
	attributeDidChange(event) {}

	/**
	 * This method is called when a layout attribute has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method layoutAttributeDidChange
	 * @param {Event} event The event object containing more details.
	 */
	layoutAttributeDidChange(event) {}
}

module.exports = AttributeListener;
