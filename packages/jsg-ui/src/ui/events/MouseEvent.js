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
/* global navigator */

import { default as JSG } from '@cedalo/jsg-core';
import ClientEvent from './ClientEvent';
import KeyEvent from './KeyEvent';

let lastButtonDown;

/**
 * The MouseEvent class wraps event information passed from the JavaScript events and adds additional
 * useful information to it. It should only be used as an information source while catching the events and
 * not be constructed or used elsewhere.
 *
 * @class MouseEvent
 * @extends ClientEvent
 * @constructor
 * @private
 */
class MouseEvent extends ClientEvent {
	/**
	 * Creates a mouse event from a native mouse event and adds some information to it.
	 *
	 * @method fromEvent
	 * @param {Canvas} canvas Canvas for the event.
	 * @param {Event} ev Original Javascript mouse event info.
	 * @param {MouseEvent.MouseEventType} type Type of event.
	 * @static
	 */
	static fromEvent(canvas, ev, type) {
		const event = new MouseEvent(canvas, ev, type);

		/**
		 * Key pressed while using the mouse. Javascript key event key identifier, if a key is pressed, otherwise
		 * undefined.
		 * @property {Number} key
		 */
		event.key = KeyEvent.currentKey;
		/**
		 * API internal.</br>
		 * Used to signal to not switch focus during mouse event.
		 * @property {Boolean} keepFocus
		 */
		event.keepFocus = false;
		event.isDragging = false;

		if (type === MouseEvent.MouseEventType.DOWN) {
			// save to retrieve button type while mouse is moving (which is unknown in IE/Edge)
			MouseEvent.lastButtonDown = ev.button;
		} else if (type === MouseEvent.MouseEventType.UP) {
			// save to retrieve button type while mouse is moving (which is unknown in IE/Edge)
			MouseEvent.lastButtonDown = undefined;
		}

		return event;
	}

	/**
	 * Checks, which button is clicked.
	 *
	 * @method isClicked
	 * @param {MouseEvent.ButtonType} Button type to check.
	 * @return {Boolean} True, if the type of button is clicked.
	 */
	isClicked(btnkey) {
		if (this.type === MouseEvent.MouseEventType.MOVE && MouseEvent.lastButtonDown) {
			return MouseEvent.lastButtonDown;
		}

		return this.event.button !== undefined && this.event.button === btnkey;
	}

	/**
	 * Checks, if given key is pressed during the mouse operation.
	 *
	 * @method isPressed
	 * @param {ClientEvent.KeyType | Number} Key to check. Either a predefined key or a JavaScript key identifier.
	 * @return {Boolean} True, if the type of key is clicked.
	 */
	isPressed(key) {
		switch (key) {
		case ClientEvent.KeyType.CTRL:
			return this.event.ctrlKey;
		case ClientEvent.KeyType.ALT:
			return this.event.altKey;
		case ClientEvent.KeyType.META:
			return this.event.metaKey;
		case ClientEvent.KeyType.SHIFT:
			return this.event.shiftKey;
		default:
			return key === KeyEvent.currentKey;
		}
	}

	isWheelX() {
		const ev = this.event;
		return ev.wheelDeltaX || (ev.axis && ev.axis === ev.HORIZONTAL_AXIS) || ev.deltaX;
	}

	isWheelY() {
		const ev = this.event;
		return ev.wheelDeltaY || (ev.axis && ev.axis === ev.VERTICAL_AXIS) || ev.deltaY;
	}

	getWheelDelta() {
		const ev = this.event;
		if (ev.wheelDelta) {
			return ev.wheelDelta / 120;
		}
		if (ev.detail) {
			return -ev.detail;
		}
		const propIE = this.isWheelX() ? 'deltaX' : 'deltaY';
		const delta = ev[propIE];

		const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
		if (isFirefox) {
			return delta ? -delta : 0;
		}

		return delta ? -delta / 100 : 0;
	}

	static get lastButtonDown() {
		return lastButtonDown;
	}

	static set lastButtonDown(val) {
		lastButtonDown = val;
	}
	/**
	 * ButtonType. This is attached to the MouseEvent to identify the type of button used.
	 * @class ButtonType
	 */
	static get ButtonType() {
		return {
			/**
			 * Left Mouse Button.
			 * @property {Number} LEFT
			 */
			LEFT: 0,
			/**
			 * Right Mouse Button.
			 * @property {Number} RIGHT
			 */
			RIGHT: 2
		};
	}

	/**
	 * MouseEvent types. This is attached to the MouseEvent to identify the type of event.
	 * @class MouseEventType
	 */
	static get MouseEventType() {
		return {
			/**
			 * Mouse down event.
			 * @property {Number} DOWN
			 */
			DOWN: 0,
			/**
			 * Mouse move event.
			 * @property {Number} MOVE
			 */
			MOVE: 1,
			/**
			 * Mouse up event.
			 * @property {Number} UP
			 */
			UP: 2,
			/**
			 * Mouse exit event.
			 * @property {Number} EXIT
			 */
			EXIT: 4,
			/**
			 * Mouse double click event.
			 * @property {Number} DBLCLK
			 */
			DBLCLK: 8,
			/**
			 * Mouse wheel event.
			 * @property {Number} WHEEL
			 */
			WHEEL: 16,
			/**
			 * Mouse context menu event.
			 * @property {Number} CONTEXT
			 * @since 1.6.34
			 */
			CONTEXT: 32,

			/**
			 * Tries to match the <code>type</code> property of given native Javascript event to one of the predefined
			 * constants.
			 * @method fromEvent
			 * @param {Event} event Native Javascript mouse event object.
			 * @return {Number} One of the predefined type constants or -1 if none matches native event type.
			 */
			fromEvent(event) {
				let type = -1;
				switch (event.type) {
				case 'mousedown':
					type = this.DOWN;
					break;
				case 'mousemove':
					type = this.MOVE;
					break;
				case 'mouseup':
					type = this.UP;
					break;
				case 'mouseexit':
					type = this.EXIT;
					break;
				case 'dblclick':
					type = this.DBLCLK;
					break;
				case 'wheel':
					type = this.WHEEL;
					break;
				case 'contextmenu':
					type = this.CONTEXT;
					break;
				}
				return type;
			}
		};
	}
}

export default MouseEvent;
