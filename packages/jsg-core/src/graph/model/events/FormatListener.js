/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const EventListener = require('./EventListener');
const Event = require('./Event');

/**
 * A general abstract listener to handle format events. Subclasses should not overwrite the
 * <code>handlePreEvent</code> or <code>handlePostEvent</code> methods. Instead this class provides
 * empty stub methods to handle format and text format events which are intended to be overwritten.
 *
 * @class FormatListener
 * @constructor
 * @extends EventListener
 */
class FormatListener extends EventListener {
	// subclasses should overwrite formatWillChange
	handlePreEvent(event) {
		switch (event.id) {
			case Event.FORMAT:
				this.formatWillChange(event);
				break;
			case Event.TEXTFORMAT:
				this.textFormatWillChange(event);
				break;
			default:
				break;
		}
	}

	// subclasses should overwrite formatDidChange
	handlePostEvent(event) {
		switch (event.id) {
			case Event.FORMAT:
				this.formatDidChange(event);
				break;
			case Event.TEXTFORMAT:
				this.textFormatDidChange(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when a format property will be changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method formatWillChange
	 * @param {Event} event The event object containing more details.
	 */
	formatWillChange(event) {}

	/**
	 * This method is called when a text format property will be changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method textFormatWillChange
	 * @param {Event} event The event object containing more details.
	 */
	textFormatWillChange(event) {}

	/**
	 * This method is called when a format property has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method formatDidChange
	 * @param {Event} event The event object containing more details.
	 */
	formatDidChange(event) {}

	/**
	 * This method is called when a text format property has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method textFormatDidChange
	 * @param {Event} event The event object containing more details.
	 */
	textFormatDidChange(event) {}
}

module.exports = FormatListener;
