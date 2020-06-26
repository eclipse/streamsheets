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
 * A general abstract listener to handle {{#crossLink "GraphItem"}}{{/crossLink}} events.
 * Subclasses should not overwrite the <code>handlePreEvent</code> or <code>handlePostEvent</code> methods.
 * Instead this class provides empty stub methods to handle item events which are intended to be overwritten.
 *
 * @class GraphItemListener
 * @constructor
 * @extends EventListener
 */
class GraphItemListener extends EventListener {
	handlePreEvent(event) {
		switch (event.id) {
			case Event.ANGLE:
				this.angleWillChange(event);
				break;
			case Event.BBOX:
				this.boundingBoxWillChange(event);
				break;
			case Event.INDEX:
				this.indexWillChange(event);
				break;
			case Event.ITEMADD:
				this.itemWillBeAdded(event);
				break;
			case Event.ITEMREMOVE:
				this.itemWillBeRemoved(event);
				break;
			case Event.PARENT:
				this.parentWillChange(event);
				break;
			case Event.PIN:
				this.pinWillChange(event);
				break;
			case Event.SIZE:
				this.sizeWillChange(event);
				break;
			default:
				break;
		}
	}

	handlePostEvent(event) {
		switch (event.id) {
			case Event.ANGLE:
				this.angleDidChange(event);
				break;
			case Event.BBOX:
				this.boundingBoxDidChange(event);
				break;
			case Event.INDEX:
				this.indexDidChange(event);
				break;
			case Event.ITEMADD:
				this.itemWasAdded(event);
				break;
			case Event.ITEMREMOVE:
				this.itemWasRemoved(event);
				break;
			case Event.PARENT:
				this.parentDidChange(event);
				break;
			case Event.PIN:
				this.pinDidChange(event);
				break;
			case Event.SIZE:
				this.sizeDidChange(event);
				break;
			case Event.PATH:
				this.pathDidChange(event);
				break;
			default:
				break;
		}
	}

	/**
	 * This method is called when the item angle will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method angleWillChange
	 * @param {Event} event The event object containing more details.
	 */
	angleWillChange(event) {}

	/**
	 * This method is called when the item angle has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method angleDidChange
	 * @param {Event} event The event object containing more details.
	 */
	angleDidChange(event) {}

	// TODO (ah) THINK: should this go to a BoundsListener??
	/**
	 * This method is called when the item bounding box will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method boundingBoxWillChange
	 * @param {Event} event The event object containing more details.
	 */
	boundingBoxWillChange(event) {}

	/**
	 * This method is called when the item bounding box has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method boundingBoxDidChange
	 * @param {Event} event The event object containing more details.
	 */
	boundingBoxDidChange(event) {}

	/**
	 * This method is called when the item size will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method sizeWillChange
	 * @param {Event} event The event object containing more details.
	 */
	sizeWillChange(event) {}

	/**
	 * This method is called when the item size has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method sizeDidChange
	 * @param {Event} event The event object containing more details.
	 */
	sizeDidChange(event) {}

	/**
	 * This method is called when the item pin will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method pinWillChange
	 * @param {Event} event The event object containing more details.
	 */
	pinWillChange(event) {}

	/**
	 * This method is called when the item pin has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method pinDidChange
	 * @param {Event} event The event object containing more details.
	 */
	pinDidChange(event) {}

	// ~ THINK

	/**
	 * This method is called when the item parent will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method parentWillChange
	 * @param {Event} event The event object containing more details.
	 */
	parentWillChange(event) {}

	/**
	 * This method is called when the item parent has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method parentDidChange
	 * @param {Event} event The event object containing more details.
	 */
	parentDidChange(event) {}

	/**
	 * This method is called to signal that the path hierarchy of an item within a Graph has changed.
	 * Usually a call to this method is triggered by a parent change within an items path hierarchy.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method pathDidChange
	 * @param {Event} event The event object containing more details.
	 */
	pathDidChange() {}

	/**
	 * This method is called when the item index will change.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method indexWillChange
	 * @param {Event} event The event object containing more details.
	 */
	indexWillChange(event) {}

	/**
	 * This method is called when the item index has changed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method indexDidChange
	 * @param {Event} event The event object containing more details.
	 */
	indexDidChange(event) {}

	/**
	 * This method is called when the item will be added.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method itemWillBeAdded
	 * @param {Event} event The event object containing more details.
	 */
	itemWillBeAdded(event) {}

	/**
	 * This method is called when the item was added.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method itemWasAdded
	 * @param {Event} event The event object containing more details.
	 */
	itemWasAdded(event) {}

	/**
	 * This method is called when the item will be removed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method itemWillBeRemoved
	 * @param {Event} event The event object containing more details.
	 */
	itemWillBeRemoved(event) {}

	/**
	 * This method is called when the item was removed.</br>
	 * Empty implementation subclasses should overwrite.
	 *
	 * @method itemWasRemoved
	 * @param {Event} event The event object containing more details.
	 */
	itemWasRemoved(event) {}
}

module.exports = GraphItemListener;
