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
 * A general abstract listener to handle port events. Subclasses should not overwrite the
 * <code>handlePreEvent</code> or <code>handlePostEvent</code> methods. Instead the various
 * <code>portWill</code> and <code>portDid</code> methods should be overwritten.
 *
 * @class PortListener
 * @constructor
 * @extends EventListener
 */
class PortListener extends EventListener {
	handlePreEvent(event) {
		switch (event.id) {
			case Event.PORTADD:
				this.portWillBeAdded(event);
				break;
			case Event.PORTREMOVE:
				this.portWillBeRemoved(event);
				break;
			case Event.PORTSREMOVEBULK:
				this.portsWillBeRemovedBulk(event);
				break;
			default:
				break;
		}
	}

	handlePostEvent(event) {
		switch (event.id) {
			case Event.PORTADD:
				this.portWasAdded(event);
				break;
			case Event.PORTREMOVE:
				this.portWasRemoved(event);
				break;
			case Event.PORTSREMOVEBULK:
				this.portsWereRemovedBulk(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when a port will be added to a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portWillBeAdded
	 * @param {Event} event The event object containing more details.
	 */
	portWillBeAdded(event) {}

	/**
	 * This method is called when a port was added to a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portWasAdded
	 * @param {Event} event The event object containing more details.
	 */
	portWasAdded(event) {}

	/**
	 * This method is called when a port will be removed from a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portWillBeRemoved
	 * @param {Event} event The event object containing more details.
	 */
	portWillBeRemoved(event) {}

	/**
	 * This method is called when a port was removed from a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portWasRemoved
	 * @param {Event} event The event object containing more details.
	 */
	portWasRemoved(event) {}

	/**
	 * This method is called when several ports will be removed from a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portsWillBeRemovedBulk
	 * @param {Event} event The event object containing more details.
	 */
	portsWillBeRemovedBulk(event) {}

	/**
	 * This method is called when several ports were removed from a node.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method portsWereRemovedBulk
	 * @param {Event} event The event object containing more details.
	 */
	portsWereRemovedBulk(event) {}
}

module.exports = PortListener;
