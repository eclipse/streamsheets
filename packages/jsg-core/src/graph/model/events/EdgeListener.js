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
const JSG = require('../../../JSG');
const EventListener = require('./EventListener');
const Event = require('./Event');

/**
 * A general abstract listener to handle edge events. Subclasses should not overwrite the
 * <code>handlePreEvent</code> or <code>handlePostEvent</code> methods. Instead this class provides
 * empty stub methods to handle edge events which are intended to be overwritten.
 *
 * @class EdgeListener
 * @constructor
 * @extends EventListener
 */
class EdgeListener extends EventListener {
	// subclasses should overwrite formatWillChange
	handlePreEvent(event) {
		switch (event.id) {
			case Event.EDGEATTACHED:
				this.edgeWillBeAttached(event);
				break;
			case Event.EDGEDETACHED:
				this.edgeWillBeDetached(event);
				break;
			default:
				break;
		}
	}

	// subclasses should overwrite formatDidChange
	handlePostEvent(event) {
		switch (event.id) {
			case Event.EDGEATTACHED:
				this.edgeWasAttached(event);
				break;
			case Event.EDGEDETACHED:
				this.edgeWasDetached(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when an edge will be attached.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method edgeWillBeAttached
	 * @param {Event} event The event object containing more details.
	 */
	edgeWillBeAttached(event) {}

	/**
	 * This method is called when an edge was attached.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method edgeWasAttached
	 * @param {Event} event The event object containing more details.
	 */
	edgeWasAttached(event) {}

	/**
	 * This method is called when an edge will be detached.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method edgeWillBeDetached
	 * @param {Event} event The event object containing more details.
	 */
	edgeWillBeDetached(event) {}

	/**
	 * This method is called when an edge was detached.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method edgeWasDetached
	 * @param {Event} event The event object containing more details.
	 */
	edgeWasDetached(event) {}
}

module.exports = EdgeListener;
