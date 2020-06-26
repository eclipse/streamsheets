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
import InteractionActivator from './InteractionActivator';
import RotateInteraction from './RotateInteraction';
import SelectionHandle from '../view/selection/SelectionHandle';

/**
 * An InteractionActivator used to activate a {{#crossLink "RotateInteraction"}}{{/crossLink}}.
 *
 * @class RotateActivator
 * @extends InteractionActivator
 * @constructor
 */
class RotateActivator extends InteractionActivator {
	getKey() {
		return RotateActivator.KEY;
	}

	/**
	 * Implemented to be notified about mouse down events.</br>
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDown(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			const activeHandle = dispatcher.getActiveHandle();
			if (activeHandle && activeHandle.getType() === SelectionHandle.TYPE.ROTATE) {
				this._activate(event, viewer, dispatcher);
			}
		}
	}

	/**
	 * Implemented to be notified about rotate start gesture events.</br>
	 * This will activate the corresponding {{#crossLink "RotateInteraction"}}{{/crossLink}}.
	 *
	 * @method onRotateStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onRotateStart(event, viewer, dispatcher) {
		if (this.isDisposed === false) {
			this._activate(event, viewer, dispatcher);
		}
	}

	/**
	 * Creates a new {{#crossLink "RotateInteraction"}}{{/crossLink}} instance and activates it.
	 *
	 * @method _activate
	 * @param {ClientEvent} event The current event which triggers interaction activation.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @private
	 */
	_activate(event, viewer, dispatcher) {
		const interaction = this.activateInteraction(new RotateInteraction(), dispatcher);
		interaction.onRotateStart(event, viewer);
		event.hasActivated = true;
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
		return 'rotate.activator';
	}
}

export default RotateActivator;
