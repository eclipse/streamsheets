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
const Arrays = require('../../commons/Arrays');
const Dictionary = require('../../commons/Dictionary');

/**
 * The globally available NotificationCenter.</br>
 * This class maintains a list of observers and is used to send any {{#crossLink
 * "Notification"}}{{/crossLink}}s.
 *
 * @class NotificationCenter
 * @constructor
 */
const NotificationCenter = (() => {
	// private members and methods:
	let instance;
	const observersMap = new Dictionary();
	const defaultFunction = 'onNotification';
	let enabled = true;


	/**
	 * Returns an Array of entries, i.e. objects with an observer and an optional function.
	 *
	 * @method getObservers
	 * @param {String} forNotification The unique notification name.
	 * @return {Array} A list of entries for given notification.
	 * @private
	 */
	const getObservers = (forNotification) => {
		let observers = observersMap.get(forNotification);
		if (!observers) {
			observers = [];
			observersMap.put(forNotification, observers);
		}
		return observers;
	};

	/**
	 * Creates a new object with given observer and optional function as sole properties.
	 *
	 * @method newEntry
	 * @param {Object} observer The observer object.
	 * @param {Function} [func] An optional function.
	 * @return {Object} A new object to serve as an entry within the map of observers.
	 * @private
	 */
	const newEntry = (observer, func) => ({
		observer,
		func
	});

	/**
	 * Returns the first entry within given list of entries which match the specified observer.
	 *
	 * @method getEntryFor
	 * @param {Object} observer The observer object to get the entry for.
	 * @param {Array} allEntries A list of all entries to query.
	 * @return {Object} The matching entry or <code>undefined</code> if none could be found.
	 * @private
	 */
	const getEntryFor = (observer, allEntries) => {
		let entry;
		let i;

		for (i = 0; i < allEntries.length; i += 1) {
			if (allEntries[i].observer === observer) {
				entry = allEntries[i];
				break;
			}
		}
		return entry;
	};

	const notify = (observers, notification) => {
		let func;

		observers.forEach((entry) => {
			func = entry.func || defaultFunction;
			entry.observer[func].call(entry.observer, notification);
		});
	};

	const removeObserver = (observer) => {
		observersMap.iterate((key, entries) => {
			entries.forEach((entry) => {
				if (entry.observer === observer) {
					Arrays.remove(entries, entry);
				}
			});
		});
	};

	/**
	 * Creates this NotificationCenter instance and defines its public interface.
	 *
	 * @method create
	 * @return {NotificationCenter} The NotificationCenter instance.
	 * @private
	 */
	const create = () => ({
		/**
		 * Registers given observer for specified notification. The <code>func</code> parameter
		 * is optional and defines a function which should be called on passed observer. If not
		 * provided <code>onNotification</code> is called by default. That means the observer
		 * object should provide this method.
		 *
		 * @method register
		 * @param {Object} observer An observer object which gets notified.
		 * @param {String|Array} notifications The name or a list of names of the notification the observer is
		 *     interested in.
		 * @param {String} [func] An optional reference to a function which is called on observer. If not provided
		 * <code>onNotification</code> is called.
		 */
		register(observer, notifications, func) {
			if (observer && notifications) {
				notifications = Array.isArray(notifications) ? notifications : [notifications];
				notifications.forEach((notification) => {
					const observers = getObservers(notification);
					const entry = getEntryFor(observer, observers);
					if (!entry) {
						observers.push(newEntry(observer, func));
					}
				});
			}
		},
		/**
		 * Removes given observer for the specified notification.
		 *
		 * @method unregister
		 * @param {Object} observer The observer to remove.
		 * @param {String|Array} [notifications] The name or a list of names of notifications the observer
		 * should be removed for. If no name is provided the given observer is removed from all its notifications.
		 */
		unregister(observer, notifications) {
			if (!observer) {
				return;
			}
			if (notifications) {
				notifications = Array.isArray(notifications) ? notifications : [notifications];
				notifications.forEach((notification) => {
					const entries = getObservers(notification);
					const entry = getEntryFor(observer, getObservers(notification));
					if (entry !== undefined) {
						Arrays.remove(entries, entry);
					}
				});
			} else {
				removeObserver(observer);
			}
		},
		/**
		 * Sends given notification to all observers which have registered for it.</br>
		 * The Notification instance is passed as argument to the function provided by each
		 * observer at registration time or to its <code>onNotification</code> method.
		 *
		 * @method send
		 * @param {Notification} notification The notification to send.
		 */
		send(notification) {
			if (enabled) {
				notify(getObservers(notification.name), notification);
				//
				// notify(getObservers(ALL_NOTIFICATIONS), notification);
			}
			// FUTURE: ?? se notification.js
			// var qualifiers = notification.getQualifiers();
			// for (var q = 0; q < qualifiers.length; q++) {
			// notification.name = qualifiers[q];
			// var observers = getObservers(notification.name);
			// for (var i = 0; i < observers.length; i++) {
			// var entry = observers[i];
			// var func = entry.func ? entry.func : defaultFunction;
			// entry.observer[func].call(entry.observer, notification);
			// }
			// }
		},
		enable(flag) {
			enabled = flag;
		}
	});

	return {
		/**
		 * A global notification send on scroll events.
		 *
		 * @property SCROLL_NOTIFICATION
		 * @type {String}
		 * @static
		 */
		SCROLL_NOTIFICATION() {
			return 'scrollpanel.scroll.notification';
		},
		/**
		 * A global notification send on zoom level change.</br>
		 * Refer to {{#crossLink "GraphEditor/setZoom:method"}}{{/crossLink}} for more information about zoom change and
		 * to {{#crossLink "NotificationCenter"}}{{/crossLink}} for more information about
		 * notifications.
		 *
		 * @property ZOOM_NOTIFICATION
		 * @type {String}
		 * @static
		 */
		ZOOM_NOTIFICATION() {
			return 'grapheditor.zoom.notification';
		},
		/**
		 * A global notification send on display mode change.</br>
		 * Refer to {{#crossLink "GraphEditor/setDisplayMode:method"}}{{/crossLink}} for more information about display
		 * mode change and to {{#crossLink "NotificationCenter"}}{{/crossLink}} for more information
		 * about notifications.
		 *
		 * @property DISPLAY_MODE_NOTIFICATION
		 * @type {String}
		 * @static
		 */
		DISPLAY_MODE_NOTIFICATION() {
			return 'grapheditor.dplmode.notification';
		},
		/**
		 * Returns the sole share NotificationCenter instance.
		 *
		 * @method getInstance
		 * @return {NotificationCenter} The globally shared NotificationCenter instance.
		 */
		getInstance() {
			if (!instance) {
				instance = create();
			}
			return instance;
		}
	};
})();

module.exports = NotificationCenter;
