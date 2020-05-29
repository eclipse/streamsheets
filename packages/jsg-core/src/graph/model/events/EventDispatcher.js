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
const Arrays = require('../../../commons/Arrays');
const Event = require('./Event');

/**
 * This class maps listeners to events and provides methods to notify them.
 *
 * @class EventDispatcher
 * @constructor
 */
class EventDispatcher {
	constructor() {
		this._eventListeners = {};
		this._eventsEnabled = true;
	}

	/**
	 * Checks if events are currently enabled, i.e. listeners are notified
	 *
	 * @method areEventsEnabled
	 * @return {Boolean} <code>true</code> if events are enabled, <code>false</code> otherwise
	 */
	areEventsEnabled() {
		return this._eventsEnabled;
	}

	/**
	 * Enables events, i.e. listeners are notified if a modification occurs.
	 *
	 * @method enableEvents
	 */
	enableEvents() {
		this._eventsEnabled = true;
	}

	/**
	 * Disables events, i.e. listeners are not notified if a modification occurs.
	 *
	 * @method disableEvents
	 * @return {Boolean} The events enabled state, i.e. <code>true</code> if events were enabled before,
	 *     <code>false</code> otherwise.
	 */
	disableEvents() {
		const oldstate = this._eventsEnabled;
		this._eventsEnabled = false;
		return oldstate;
	}

	/**
	 * Registers given listener to the specified event id.</br>
	 * If given listener was registered already for specified event calling this method has no effect.
	 * For predefined event identifiers look at {{#crossLink "Event"}}{{/crossLink}}
	 * or the various other event classes.
	 *
	 * @method registerListener
	 * @param {String} eventid The unique event id to register the listener for.
	 * @param {EventListener} listener The listener to notify if an event of specified type occurs.
	 */
	registerListener(eventid, listener) {
		const listeners = this._listenersForEvent(eventid);
		if (listeners.indexOf(listener) < 0) {
			listeners.push(listener);
		}
	}

	/**
	 * Deregisters given listener from the list of listeners which will be notified when an event of
	 * specified type occurs.</br>
	 * See {{#crossLink "EventDispatcher/registerListener:method"}}{{/crossLink}} too.
	 *
	 * @method unregisterListener
	 * @param {String} eventid The unique event id to deregister listener for.
	 * @param {EventListener} listener The listener to remove.
	 */
	unregisterListener(eventid, listener) {
		const listeners = this._listenersForEvent(eventid);
		Arrays.remove(listeners, listener);
	}

	/**
	 * Sends given event object as a pre event to all listeners which are registered to the given event.
	 *
	 * @method sendPreEvent
	 * @param {Event} event The event object to send as pre event.
	 */
	sendPreEvent(event) {
		this._notify(this._listenersForEvent(event.id), event, false);
		if (event.id !== Event.ALL) {
			this._notify(this._listenersForEvent(Event.ALL), event, false);
		}
	}

	/**
	 * Sends given event object as a post event to all listeners which are registered to the given event.
	 *
	 * @method sendPostEvent
	 * @param {Event} event The event object to send as post event.
	 */
	sendPostEvent(event) {
		this._notify(this._listenersForEvent(event.id), event, true);
		if (event.id !== Event.ALL) {
			this._notify(this._listenersForEvent(Event.ALL), event, true);
		}
	}

	/**
	 * Notifies given listeners about specified event.
	 *
	 * @method _notify
	 * @param {Array} listeners A list of listener objects to be notified.
	 * @param {Event} event The event object to send.
	 * @param {Boolean} isPost Specify <code>true</code> if a post-event message should be send to given listeners or
	 * <code>false</code> otherwise.
	 * @private
	 */
	_notify(listeners, event, isPost) {
		if (this._eventsEnabled === true && JSG.propertyEventsDisabled === false) {
			listeners.forEach((listener) => {
				if (isPost) {
					listener.handlePostEvent(event);
				} else {
					listener.handlePreEvent(event);
				}
			});
		}
	}

	/**
	 * Returns a list of listener objects which were registered for given event id.
	 *
	 * @method _listenersForEvent
	 * @param {String} id The unique event id to get registered listeners for.
	 * @return {Array} A, possible empty, list of listener objects which were registered for given id.
	 * @private
	 */
	_listenersForEvent(id) {
		let listeners = this._eventListeners[id];
		if (!listeners) {
			listeners = [];
			this._eventListeners[id] = listeners;
		}
		return listeners;
	}
}

module.exports = EventDispatcher;
