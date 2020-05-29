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
import { default as JSG } from '@cedalo/jsg-core';
import ClientEvent from './ClientEvent';

let currentKey;

/**
 * The KeyEvent class wraps event information passed from the JavaScript events and adds additional
 * useful information to it. It should only be used as an information source while catching the events and
 * not be constructed or used elsewhere.
 *
 * @class KeyEvent
 * @extends ClientEvent
 * @constructor
 * @private
 */
class KeyEvent extends ClientEvent {
	/**
	 * Creates a key event from a native key event and adds some information to it.
	 *
	 * @method fromEvent
	 * @param {Canvas} canvas Canvas for the event.
	 * @param {Event} ev The native key event info.
	 * @param {KeyEvent.KeyEventType} type Type of event.
	 * @static
	 */
	static fromEvent(canvas, ev, type) {
		const event = new KeyEvent(canvas, ev, type);

		/**
		 * Javascript key event key identifier.
		 * @property {Number} key
		 */
		event.key = ev.keyCode;

		if (type === KeyEvent.KeyEventType.DOWN) {
			KeyEvent.currentKey = ev.keyCode;
		} else {
			KeyEvent.currentKey = undefined;
		}

		return event;
	}


	/**
	 * Checks if the key code of given event contains a modifier key.</br>
	 * Currently <code>SHIFT</code>, <code>ALT</code> and <code>CTRL</code> are handled as modifier keys.
	 *
	 * @method containsModifierKey
	 * @param {ClientEvent} event The Event to check for modifier key.
	 * @return {Boolean} <code>true</code> if key code of given Event contains a modifier key, <code>false</code>
	 *     otherwise.
	 * @static
	 */

	static containsModifierKey(event) {
		let contains = false;
		switch (event.key) {
		case 16:
		case 17:
		case 18:
			contains = true;
			break;
		}
		return contains;
	}

	/**
	 * Checks, if given key was pressed.
	 *
	 * @method isPressed
	 * @param {ClientEvent.KeyType | Number} key The key to check. Either a predefined key or a JavaScript key
	 *     identifier.
	 * @return {Boolean} True, if the type of key was pressed.
	 */
	isPressed(key) {
		return (this.key & key) === key;
	}
	/**
	 * KeyEvent types. This is attached to the KeyEvent to identify the type of event.
	 * @class KeyEventType
	 */
	static get KeyEventType() {
		return {
			/**
			 * Key down event.
			 * @property {Number} DOWN
			 */
			DOWN: 0,
			/**
			 * Key up event.
			 * @property {Number} UP
			 */
			UP: 1
		};
	}


	/**
	 * The key code of currently pressed key.</br>
	 * Note: this is shared between all instances.
	 *
	 * @property currentKey
	 * @type {Number}
	 * @static
	 */
	static get currentKey() {
		return currentKey;
	}

	static set currentKey(key) {
		currentKey = key;
	}
}

export default KeyEvent;
