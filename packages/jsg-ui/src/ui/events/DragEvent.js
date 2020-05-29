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

/**
 * The DragEvent class wraps event information passed from the JavaScript events and adds additional
 * useful information to it. It should only be used as an information source while catching the events and
 * not be constructed or used elsewhere.
 *
 * @class DragEvent
 * @extends ClientEvent
 * @constructor
 * @private
 */
class DragEvent extends ClientEvent {
	/**
	 * Create a drag event from a Javascript Drag Event and add some information to it.
	 *
	 * @method fromEvent
	 * @param {Canvas} canvas Canvas for the event.
	 * @param {Event} ev Original Javascript drag event info.
	 * @param {DragEventType} type Type of event.
	 * @static
	 */
	static fromEvent(canvas, ev, type) {
		const event = new DragEvent(canvas, ev, type);
		event.event.preventDefault();
		return event;
	}

	/**
	 * DragEvent types. This is attached to the DragEvent to identify the type of event.
	 * @class DragEventType
	 */
	static get DragEventType() {
		return {
			/**
			 * Drop event.
			 * @property {Number} DROP
			 */
			DROP: 0,
			/**
			 * Drag enter event.
			 * @property {Number} ENTER
			 */
			ENTER: 1,
			/**
			 * Drage exit event.
			 * @property {Number} EXIT
			 */
			EXIT: 2,
			/**
			 * Drag leave event.
			 * @property {Number} LEAVE
			 */
			LEAVE: 4,
			/**
			 * Drag over event.
			 * @property {Number} OVER
			 */
			OVER: 8
		};
	}
}

export default DragEvent;
