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

import ClientEvent from './ClientEvent';
import KeyEvent from './KeyEvent';
import MouseEvent from './MouseEvent';


/**
 * The GestureEvent class wraps event information passed from the JavaScript events and adds additional
 * useful information to it. It should only be used as an information source while catching the events and
 * not be constructed or used elsewhere.
 *
 * @class GestureEvent
 * @extends ClientEvent
 * @constructor
 * @private
 */
class GestureEvent extends ClientEvent {
	/**
	 * Create a mouse event from a Javascript Gesture Event and add some information to it.
	 *
	 * @method fromEvent
	 * @param {GraphicSystem} gs GraphicSystem, where the event originated.
	 * @param {Event} gesture The native gesture event.
	 * @param {GestureEvent.GestureEventType} type Type of event.
	 * @static
	 */
	static fromEvent(gs, gesture, type) {
		const event = new GestureEvent(gs.canvas, gesture, type);

		// if (JSG.debug._isActive) {
		// 	const evType = GestureEvent.eventType2string(type);
		// }

		switch (type) {
		case GestureEvent.GestureEventType.TAPDOWN:
			if (gesture.pointers.length > 1) {
				return undefined;
			}
			event.type = MouseEvent.MouseEventType.DOWN;
			break;
		case GestureEvent.GestureEventType.TOUCHMOVE:
			if (gesture.pointers.length > 1) {
				return undefined;
			}
			event.type = MouseEvent.MouseEventType.MOVE;
			break;
		case GestureEvent.GestureEventType.TOUCHMOVESINGLE:
			event.type = MouseEvent.MouseEventType.MOVE;
			break;
		case GestureEvent.GestureEventType.TAPUP:
			if (gesture.pointers.length > 1) {
				return undefined;
			}
			event.type = MouseEvent.MouseEventType.UP;
			break;
		case GestureEvent.GestureEventType.DBLTAP:
			if (gesture.pointers.length > 1) {
				return undefined;
			}
			event.type = MouseEvent.MouseEventType.DBLCLK;
			break;
		default:
			event.type = type;
			break;
		}

		/**
		 * The native gesture event.
		 * @property {Event} gesture
		 */
		event.gesture = gesture;

		/**
		 * Gesture type, i.e. one of the predefined type constants.
		 * @property {GestureEvent.GestureEventType} type
		 */
		event.gestureType = type;

		/**
		 * Key pressed while using the mouse. Javascript key event key identifier, if a key is pressed, otherwise
		 * undefined.
		 * @property {Number} key
		 */
		event.key = KeyEvent.currentKey;

		/**
		 * Coordinate system of current active canvas, i.e. the canvas which had focus when this event
		 * occurred.
		 * @property cs
		 * @type {CoordinateSystem}
		 */
		event.cs = gs.graphics.getCoordinateSystem();

		const root = document.documentElement;
		if (event.gesture.pointers.length) {
			const touch = event.gesture.pointers[0];
			const target = document.elementFromPoint(touch.clientX, touch.clientY);

			event.location.set(touch.clientX - event.canvasRect.left - root.scrollLeft,
				touch.clientY - event.canvasRect.top - root.scrollTop);

			const canvas = gs.getCanvas();
			if (target && target.id !== canvas.id) {
				const canvasRectSrc = canvas.getBoundingClientRect();
				const canvasRectTrg = target.getBoundingClientRect();
				event.location.x += canvasRectSrc.left - canvasRectTrg.left;
				event.location.y += canvasRectSrc.top - canvasRectTrg.top;
			}

			ClientEvent.windowLocation.set(touch.pageX, touch.pageY);
		} else {
			event.location.set(event.event.changedPointers[0].clientX - event.canvasRect.left - root.scrollLeft,
				event.event.changedPointers[0].clientY - event.canvasRect.top - root.scrollTop);
			ClientEvent.windowLocation.set(event.event.changedPointers[0].pageX, event.event.changedPointers[0].pageY);
		}

		// touch event consumes all others:
		event.event.preventDefault();
		// event.event.stopPropagation();
		event.gesture.preventDefault();
		// event.gesture.stopPropagation();

		return event;
	}

	/**
	 * Checks, if a key is pressed during the mouse operation.
	 *
	 * @method isPressed
	 * @param {ClientEvent.KeyType | Number} key Key to check. Either a predefined key or a JavaScript key identifier.
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

	/**
	 * Checks if this GestureEvent was triggered inside the bounds of current active canvas. Since a gesture event can
	 * have multiple touch events only the first one is considered.
	 *
	 * @method isInCanvas
	 * @return {Boolean} <code>true</code> if GestureEvent location is inside canvas bounds, <code>false</code>
	 *     otherwise.
	 */
	isInCanvas() {
		// overwritten to simply use first touch...
		const x = this.gesture.pointers[0].clientX;
		const y = this.gesture.pointers[0].clientY;
		const crect = this.canvasRect;
		return (x >= crect.left && x <= crect.right && y >= crect.top && y <= crect.bottom);
	}

	/**
	 * Returns a string representation for the given type. If the type is unknown its number is simply
	 * returned.
	 *
	 * @method eventType2string
	 * @param {GestureEvent.GestureEventType | Number} type The event type code.
	 * @return {String} The corresponding string representation.
	 * @private
	 */
	static eventType2string(type) {
		let str;

		switch (type) {
		case GestureEvent.GestureEventType.TAPDOWN:
			str = 'tapdown';
			break;
		case GestureEvent.GestureEventType.TAPUP:
			str = 'tapup';
			break;
		case GestureEvent.GestureEventType.DBLTAP:
			str = 'doubletap';
			break;
		case GestureEvent.GestureEventType.CANCEL:
			str = 'cancel';
			break;
		case GestureEvent.GestureEventType.PINCHSTART:
			str = 'pinch_start';
			break;
		case GestureEvent.GestureEventType.PINCH:
			str = 'pinch';
			break;
		case GestureEvent.GestureEventType.PINCHEND:
			str = 'pinch_end';
			break;
		case GestureEvent.GestureEventType.SWIPE:
			str = 'swipe';
			break;
		case GestureEvent.GestureEventType.ROTATESTART:
			str = 'rotate_start';
			break;
		case GestureEvent.GestureEventType.ROTATE:
			str = 'rotate';
			break;
		case GestureEvent.GestureEventType.ROTATEEND:
			str = 'rotate_end';
			break;
		case GestureEvent.GestureEventType.PANSTART:
			str = 'pan_start';
			break;
		case GestureEvent.GestureEventType.PAN:
			str = 'pan';
			break;
		case GestureEvent.GestureEventType.PANEND:
			str = 'pan_end';
			break;
		case GestureEvent.GestureEventType.HOLD:
			str = 'hold';
			break;
		default:
			str = type; // unknown type,simply return its code...
		}

		return str;
	}

	/**
	 * Checks, which button is clicked.
	 *
	 * @method isClicked
	 * @param {MouseEvent.ButtonType} btnkey Button type to check.
	 * @return {Boolean} True, if the type of button is clicked.
	 */
	isClicked(btnkey) {
		return this.event.button && this.event.button === btnkey;
	}
	/**
	 * GestureEvent types. This is attached to the GestureEvent to identify the type of event.
	 * @class GestureEventType
	 */
	static get GestureEventType() {
		return {
			/**
			 * Gesture cancel event.
			 * @property {Number} CANCEL
			 */
			CANCEL: 2 ** 10,
			/**
			 * Tap down event.
			 * @property {Number} TAPDOWN
			 */
			TAPDOWN: 2 ** 17,
			/**
			 * Tap up event.
			 * @property {Number} TAPUP
			 */
			TAPUP: 2 ** 18,
			/**
			 * Double tap event.
			 * @property {Number} DBLTAP
			 */
			DBLTAP: 2 ** 19,
			/**
			 * Gesture pinch start event.
			 * @property {Number} PINCHSTART
			 */
			PINCHSTART: 2 ** 20,
			/**
			 * Gesture pinch event.
			 * @property {Number} PINCH
			 */
			PINCH: 2 ** 21,
			/**
			 * Gesture pinch end event.
			 * @property {Number} PINCHEND
			 */
			PINCHEND: 2 ** 22,
			/**
			 * Gesture swipe event.
			 * @property {Number} SWIPE
			 */
			SWIPE: 2 ** 23,
			/**
			 * Gesture ROTATESTART event.
			 * @property {Number} ROTATESTART
			 */
			ROTATESTART: 2 ** 24,
			/**
			 * Gesture rotate event.
			 * @property {Number} ROTATE
			 */
			ROTATE: 2 ** 25,
			/**
			 * Gesture rotate end event.
			 * @property {Number} ROTATEEND
			 */
			ROTATEEND: 2 ** 26,
			/**
			 * Gesture pan start event.
			 * @property {Number} PANSTART
			 */
			PANSTART: 2 ** 27,
			/**
			 * Gesture pan event.
			 * @property {Number} PAN
			 */
			PAN: 2 ** 28,
			/**
			 * Gesture pan end event.
			 * @property {Number} PANEND
			 */
			PANEND: 2 ** 29,
			/**
			 * Gesture hold event ** i.e. a longer tap event.
			 * @property {Number} HOLD
			 */
			HOLD: 2 ** 30,
			/**
			 * General touch event.
			 * @property {Number} TOUCH
			 */
			TOUCH: 2 ** 31,
			// just so simulate move
			TOUCHMOVE: 2 ** 32,
			TOUCHMOVESINGLE: 2 ** 33
		};
	}
};

export default GestureEvent;
