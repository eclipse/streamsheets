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
import PanInteraction from './PanInteraction';
import InteractionActivator from './InteractionActivator';

/**
 * An InteractionActivator used to activate a {{#crossLink "PanInteraction"}}{{/crossLink}}.
 *
 * @class PanActivator
 * @extends InteractionActivator
 * @constructor
 */
class PanActivator extends InteractionActivator {
	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	getKey() {
		return PanActivator.KEY;
	}

	/**
	 * Implemented to be notified about pan start events.</br>
	 * This will activate the corresponding {{#crossLink "PanInteraction"}}{{/crossLink}}.
	 *
	 * @method onPanStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onPanStart(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			const interaction = this.activateInteraction(new PanInteraction(), dispatcher);
			interaction.onPanStart(event, viewer);
			event.hasActivated = true;
		}
	}

	static get KEY() {
		return 'pan.activator';
	}
}

export default PanActivator;
