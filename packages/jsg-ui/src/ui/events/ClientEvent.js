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
/* global document */

import {
	default as JSG,
	Point,
} from '@cedalo/jsg-core';

let _location = new Point(0, 0);
const windowLocation = new Point(0, 0);
const currentLocation = new Point(0, 0);

/**
 * Abstract base class for all UI events within this framework.</br>
 * <b>Note:</b> this class should never be used itself, instead use one of its subclasses.
 *
 * @class Event
 * @param {Canvas} canvas The HTML5 canvas element.
 * @param {Event} ev The wrapped native JavaScript event.
 * @param {Number} type The event type. See subclasses for event type constants.
 * @constructor
 * @private
 */
class ClientEvent {
	constructor(canvas, ev, type) {
		/**
		 * Type of event. See subclasses for event type constants.
		 * @property {Number} type
		 */
		this.type = type;

		/**
		 * JavaScript native event info.
		 * @property {Event} event
		 */
		this.event = ev;

		/**
		 * Flag to indicate, that mouse event is already used and should not be handled.
		 * @property {Boolean} isConsumed
		 */
		this.isConsumed = !!ev._isConsumed;

		/**
		 * Flag to indicate, that a repaint shall occur, after the event has been processed.
		 * @property {Boolean} doRepaint
		 */
		this.doRepaint = false;

		/**
		 * The bounds of current active canvas, i.e. the canvas which had focus when this event
		 * occurred.
		 * @property {ClientRect} canvasRect
		 */
		this.canvasRect = canvas.getBoundingClientRect();
		/**
		 * The id of current active canvas, i.e. the canvas which had focus when this event occurred.
		 * @property {String} canvasId
		 */
		this.canvasId = canvas.id;

		/**
		 * Event location relative to the canvas.
		 * @property {Point} location
		 */

		if (ev.clientX && ev.clientY) {
			let x;
			let y;
			if (ev.offsetX !== undefined && ev.offsetY !== undefined) {
				x = ev.offsetX;
				y = ev.offsetY;
			} else {
				x = ev.layerX;
				y = ev.layerY;
			}
			if (ev.target.id !== canvas.id) {
				const canvasRectSrc = ev.target.getBoundingClientRect();
				const canvasRectTrg = this.canvasRect;
				x += canvasRectSrc.left - canvasRectTrg.left;
				y += canvasRectSrc.top - canvasRectTrg.top;
			}

			this.location.set(x, y);
			ClientEvent.currentLocation.set(x, y);
		} else if (ClientEvent.currentLocation.x && ClientEvent.currentLocation.y) {
			this.location.set(ClientEvent.currentLocation.x, ClientEvent.currentLocation.y);
		} else {
			this.location.set(0, 0);
		}

		/**
		 * Event location relative to the browser window.
		 * @property {Point} windowLocation
		 */
		ClientEvent.windowLocation.set(ev.pageX, ev.pageY);
	}


	/**
	 * Checks if this Event was triggered inside the bounds of current active canvas.
	 *
	 * @method isInCanvas
	 * @return {Boolean} <code>true</code> if Event location is inside canvas bounds, <code>false</code> otherwise.
	 */
	isInCanvas() {
		return (this.event.target.tagName.toLowerCase() === 'canvas') ?
			this.event.target.id === this.canvasId : false;
	}


	/**
	 * Defines this event as consumed so it does not propagate to other DOM elements.
	 *
	 * @method consume
	 */
	consume() {
		this.isConsumed = true;
		if (this.event.stopPropagation) {
			this.event.stopPropagation();
		}
		if (this.event.stopImmediatePropagation) {
			this.event.stopImmediatePropagation();
		}
		this.event.preventDefault();
		this.event.cancelBubble = true;
		// store consume flag in native event object, so it is preserved on document event dispatch...
		this.event._isConsumed = true;
	}

	/**
	 * Key types. This is attached to the MouseEvent or GestureEvent to identify a key potentially pressed.
	 * @class KeyType
	 */
	static get KeyType() {
		return {
			/**
			 * Ctrl-Key.
			 * @property {Number} DOWN
			 */
			CTRL: 1,
			/**
			 * Alt-Key.
			 * @property {Number} ALT
			 */
			ALT: 2,
			/**
			 * Shift-Key.
			 * @property {Number} SHIFT
			 */
			SHIFT: 4,
			/**
			 * Alt-Gr-Key.
			 * @property {Number} META
			 */
			META: 8,
			/**
			 * Esc-Key
			 * @property {Number} ESC
			 */
			ESC: 27
		};
	}
	/**
	 * The event location as point.
	 *
	 * @property location
	 * @type {Point}
	 */
	get location() {
		return _location;
	}

	set location(location) {
		_location = location;
	}

	/**
	 * The event location relative to browser window as point.
	 *
	 * @property windowLocation
	 * @type {Point}
	 */
	static get windowLocation() {
		return windowLocation;
	}

	static get currentLocation() {
		return currentLocation;
	}
}

export default ClientEvent;
