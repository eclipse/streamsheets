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
import PinchInteraction from './PinchInteraction';
import InteractionActivator from './InteractionActivator';

/**
 * An InteractionActivator used to activate a {{#crossLink "PinchInteraction"}}{{/crossLink}}.
 *
 * @class PinchActivator
 * @extends InteractionActivator
 * @constructor
 */
class PinchActivator extends InteractionActivator {
	getKey() {
		return PinchActivator.KEY;
	}

	/**
	 * Implemented to be notified about pinch start events.</br>
	 * This will activate the corresponding {{#crossLink "PinchInteraction"}}{{/crossLink}}.
	 *
	 * @method onPinchStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onPinchStart(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			const interaction = this.activateInteraction(new PinchInteraction(), dispatcher);
			interaction.onPinchStart(event, viewer);
			event.hasActivated = true;
		}
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'pinch.activator';
	}
}

export default PinchActivator;
