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
// const JSG = require('../../../JSG');
/**
 * This module contains the basic classes to build up the event mechanism used within the framework.
 * Beside the {{#crossLink "Event"}}{{/crossLink}} class itself the
 * {{#crossLink "EventListener"}}{{/crossLink}} and the
 * {{#crossLink "EventDispatcher"}}{{/crossLink}} classes are important too.
 * In principle the mechanism works like follows:
 * <ul>
 * <li>each model object sends a pre event as a result of a requested modification</li>
 * <li>the notification of each registered EventListener is done by the EventDispatcher</li>
 * <li>the passed event contains a <code>doIt</code> flag with which a modification can be prohibited, by setting this
 * field to <code>false</code></li>
 * <li>if all listeners agree the modification is performed and the event object is send a second time as a post event
 * </li>
 * </ul>
 * Note that pre and post event is always the same object. So an application can store additional
 * information to the event object which is preserved between the pre and post function calls.</br>
 * To register a listener either use the {{#crossLink "Model/addEventListener:method"}}{{/crossLink}}
 * to
 * register to a single event or use the various <code>addxxxListener</code> methods as a convenient
 * way to get informed about several different events.
 */

/**
 * A simple event object to signal model changes. </br>
 * <b>Node:</b> besides the event <code>id</code> and the <code>doIt</code> flag, which are always
 * present, all other fields are optional. So the existing of event fields depend on the actual
 * event instance and the context in which it is send.
 *
 * @class Event
 * @constructor
 * @param {String} id The unique event id.
 * @param {Object} [value] The event value.
 */
class Event {
	constructor(id, value) {
		// console.log('create event' + cnt++);

		/**
		 * The unique event identifier to classify this event.
		 * @property id
		 * @type String
		 */
		this.id = id;
		/**
		 * Setting this flag to <code>false</code> will prohibit the model change. By default it is set to
		 * <code>true</code>.
		 * @property doIt
		 * @type Boolean
		 */
		this.doIt = true; // flag indicating if event should proceed...
		/**
		 * An optional event value. This value type depends on the event type and context in which it was send.
		 * @property [value]
		 * @type Object
		 */
		this.value = value;
		/**
		 * Property which marks this <code>Event</code> as being forced, i.e. not necessarily caused by a model change.
		 * @property isForced
		 * @type Boolean
		 * @since 2.0.17
		 */
		this.isForced = false;

		// TODO (ah) TESTING PURPOSE - review -
		// OPTIONAL:
		/**
		 * A unique identifier to classify this event more exactly.</br>
		 * For example: a general <code>Event.ATTRIBUTE</code> event specifies
		 * the changed attribute with this field.
		 *
		 * @property detailId
		 * @type String
		 */
		this.detailId = undefined;

		// depends on event context...

		// TODO (ah) - review -
		// remove object to remove or add
		this.data = undefined; // depends on event context, e.g. pre event contains new value, post event old value,
		this.source = undefined;
		// ~
	}

	/**
	 * Returns the event identifier.
	 *
	 * @method getId
	 * @return {String} The event identifier.
	 */
	getId() {
		return this.id;
	}

	// SOME PREDEFINED EVENT IDs use within API:

	/**
	 * A general event identifier. Use this to retrieve all events.
	 *
	 * @property ALL
	 * @type String
	 * @static
	 */
	// currently only to match existing event management...
	static get ALL() {
		return 'event.all'; // <-- GENERAL EVENT WHICH RETRIEVES ALL!! EVENTS (TODO remove?)
	}

	/**
	 * Event identifier for attribute changes.
	 *
	 * @property ATTRIBUTE
	 * @type String
	 * @static
	 */
	static get ATTRIBUTE() {
		return 'event.attribute';
	}

	/**
	 * Event identifier for layout attribute changes.
	 *
	 * @property LAYOUTATTRIBUTES
	 * @type String
	 * @static
	 */
	static get LAYOUTATTRIBUTES() {
		return 'event.layoutattributes';
	}

	/**
	 * Event identifier for format changes.
	 *
	 * @property FORMAT
	 * @type String
	 * @static
	 */
	static get FORMAT() {
		return 'event.format';
	}

	/**
	 * Event identifier for text format changes.
	 *
	 * @property TEXTFORMAT
	 * @type String
	 * @static
	 */
	static get TEXTFORMAT() {
		return 'event.textformat';
	}

	// TODO (ah) EVENT - REVIEW
	//= > TOPICS:
	//	- general events => special events => classification
	//	- some predefined event listener
	static get ANGLE() {
		return 'event.angle';
	}

	static get BBOX() {
		return 'event.bbox';
	}

	static get INDEX() {
		return 'event.index';
	}

	static get ITEMADD() {
		return 'event.itemadd';
	}

	static get ITEMREMOVE() {
		return 'event.itemremove';
	}

	static get LAYER() {
		return 'event.layer';
	}

	static get LINK() {
		return 'event.link';
	}

	static get NAME() {
		return 'event.name';
	}

	static get PARENT() {
		return 'event.parent';
	}

	static get PIN() {
		return 'event.pin';
	}

	static get SHAPE() {
		return 'event.shape';
	}

	static get SHAPEPOINTS() {
		return 'event.shapepoints';
	}

	static get SIZE() {
		return 'event.size';
	}

	static get COLLAPSEDSIZE() {
		return 'event.collapsedsize';
	}

	static get TYPE() {
		return 'event.type';
	}

	static get TEXT() {
		return 'event.text'; // currently not used, see comment in TextNode#setText()
	}

	static get CUSTOM() {
		return 'event.custom';
	}

	static get PATH() {
		return 'event.path';
	}

	static get NODE() {
		return 'event.node';
	}

	static get PORTADD() {
		return 'event.portadd';
	}

	static get PORTREMOVE() {
		return 'event.portremove';
	}

	static get PORTREMOVEALL() {
		return 'event.portremoveall';
	}

	static get PORTSREMOVEBULK() {
		return 'event.portsremovebulk';
	}

	static get EDGEATTACHED() {
		return 'event.edgeattached';
	}

	static get EDGEDETACHED() {
		return 'event.edgedetached';
	}

	static get RESHAPE() {
		return 'reshape';
	}

	static get GRAPH() {
		return 'graph';
	}

	static get GRAPHSETTINGS() {
		return 'graphsettings';
	}

	static get ADDITIONADD() {
		return 'event.addition.add';
	}

	static get ADDITIONREMOVE() {
		return 'event.addition.remove';
	}

	static get ADDITIONREMOVEALL() {
		return 'event.addition.remove.all';
	}
}

module.exports = Event;
