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
 * {{#crossLink "Notification"}}{{/crossLink}}s and the
 * {{#crossLink "NotificationCenter"}}{{/crossLink}} provide a useful
 * notification mechanism between objects which should not have or do not require any dependency
 * between each other. E.g. a custom PropertyTable could be interested in the current selected
 * {{#crossLink "GraphItem"}}{{/crossLink}} but has otherwise no dependency to the
 * {{#crossLink "Graph"}}{{/crossLink}} or its corresponding
 * {{#crossLink "GraphView"}}{{/crossLink}}. Therefore the PropertyTable can simply
 * register itself to the NotificationCenter to be notified whenever selection within the Graph
 * has changed. It does this by calling
 * {{#crossLink "NotificationCenter/register:method"}}{{/crossLink}}
 * with
 * {{#crossLink "SelectionProvider/SELECTION_CHANGED_NOTIFICATION:property"}}{{/crossLink}}
 * as notification name.</br>
 * <b>Note:</b> it is important to unregister the observer object if notification is no longer needed!
 */

/**
 * A simple data object to be passed via {{#crossLink "NotificationCenter"}}{{/crossLink}}.<br/>
 *
 * @class Notification
 * @constructor
 * @param {String} name Notification qualifiers.
 * @param {Object} [object] The object who sends this notification
 */
class Notification {
	constructor(name, object) {
		/**
		 * An application wide unique name which identifies this notification.
		 *
		 * @property name
		 * @type String
		 */
		this.name = name;

		/**
		 * The object which sends this notification. Note that this an optional property.
		 *
		 * @property [object]
		 * @type String
		 */
		this.object = object;
		/**
		 * The event which triggered notification. Note that this an optional property.
		 *
		 * @property [event]
		 * @type {Event}
		 */
		this.event = undefined;
	}
}

// FUTURE: ?? Idea is to use same object for a general and a more finer notification, i.e. each passed
// name will be send as notification. Example nc.send(new Notification(ADD, CHANGE)); will send an ADD
// and a CHANGE notification...
// /**
// * A simple data object to be passed via {{#crossLink
// "NotificationCenter"}}{{/crossLink}}.<br/> * <b>Note:</b> it is possible to send the same
// notification with different qualifiers! * * @class Notification * @constructor * @param {String} name* Notification
// qualifiers. * @param {Object} object The object who sends this notification */ Notification
// = function(name, object) { /** * An application wide unique name which identifies this notification * * @property
// name * @type String */ this.name = arguments[0]; this.object = object; this.event = undefined;  var n =
// arguments.length-1; this._qualifiers = []; for (var i = 0; i < n; i++) { this._qualifiers.push(arguments[i]); } };
// Notification.prototype.getQualifiers = function() { return this._qualifiers; };

module.exports = Notification;
