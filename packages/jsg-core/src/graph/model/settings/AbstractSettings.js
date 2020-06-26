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
/**
 * Creates a new AbstractSettings instance. It provides convenience methods to set the value of a setting which
 * triggers corresponding events. Typically setting properties are bound to a {{#crossLink
 * "GraphItem"}}{{/crossLink}} so a {{#crossLink
 * "AbstractSettings/register:method"}}{{/crossLink}} method is provided as well.
 *
 * @class AbstractSettings
 * @constructor
 */
class AbstractSettings {
	constructor(item) {
		// WE CURRENTLY ARE BOUND TO ONE ITEM! But if listeners are necessary we can add it later again...
		this._item = item; // the item these attributes belong to...
	}

	/**
	 * Registers given graph item to this AbstractSettings instance.
	 *
	 * @method register
	 * @param {GraphItem} item The graph item to bound to this instance.
	 */
	register(item) {
		this._item = item;
	}

	/**
	 * Unregisters given graph item from this AbstractSettings instance.
	 *
	 * @method deregister
	 * @param {GraphItem} item The graph item to unbound from this instance.
	 */
	deregister(item) {
		this._item = undefined;
	}

	/**
	 * Sends given event as pre-event to all listeners which are registered to the id of specified event.
	 * If given item is not defined calling this method has no effect.
	 *
	 * @method sendPreEventToItem
	 * @param {GraphItem} [item] The graph model to use for event notification.
	 * @return {Event} event The event to send.
	 */
	sendPreEventToItem(item, event) {
		if (event && item && item.areEventsEnabled()) {
			item.sendPreEvent(event);
		}
	}

	/**
	 * Sends given event as post-event to all listeners which are registered to the id of specified event.
	 * If given item is not defined calling this method has no effect.
	 *
	 * @method sendPostEventToItem
	 * @param {GraphItem} [item] The graph model to use for event notification.
	 * @return {Event} event The event to send.
	 */
	sendPostEventToItem(item, event) {
		if (event && item && item.areEventsEnabled()) {
			item.sendPostEvent(event);
		}
	}
}

module.exports = AbstractSettings;
