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

/**
 * The base class for all event listener objects. This class specifies the methods each listener
 * must implement. As convenience it provides empty implementations for each defined method.
 *
 * @class EventListener
 * @constructor
 */
class EventListener {
	/**
	 * Called before a model change will happen.</br>
	 * <b>Note:</b> subclasses should overwrite. This implementation does nothing.
	 *
	 * @method handlePreEvent
	 * @param {Event} event The event object containing more details.
	 */
	/* eslint-disable no-empty-function */
	handlePreEvent(event) {}

	/**
	 * Called after a model change has happened.</br>
	 * <b>Note:</b> subclasses should overwrite. This implementation does nothing.
	 *
	 * @method handlePostEvent
	 * @param {Event} event The event object containing more details.
	 */
	handlePostEvent(event) {}
	/* eslint-enable no-empty-function */
}

module.exports = EventListener;
