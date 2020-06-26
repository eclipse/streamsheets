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
import { default as JSG, Shape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import GraphController from '../controller/GraphController';

/**
 * An InteractionActivator used to activate a tooltip.
 *
 * @class TooltipActivator
 * @extends InteractionActivator
 * @constructor
 */
class TooltipActivator extends InteractionActivator {
	constructor() {
		super();
		this._controller = undefined;
	}

	getKey() {
		return TooltipActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
	}

	/**
	 * Implemented to be notified about mouse move events.</br>
	 * If the event occurred over a suitable controller the mouse cursor is updated to reflect that
	 * a link might be executed.
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The mouse move event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by {{#crossLink
	 *     "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified this
	 *     activator.
	 */
	onMouseMove(event, viewer, dispatcher) {
		// JSG.toolTip.removeTooltip(event);
		JSG.toolTip.savePosition(event);

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (
			controller &&
			(this._controller === undefined || controller.getModel().getId() === this._controller.getModel().getId())
		) {
			if (!JSG.toolTip.hasTooltip()) {
				const model = controller.getModel();
				const value = model.getTooltip().getValue();
				if (value && value.length) {
					JSG.toolTip.startTooltip(event, value, JSG.toolTip.getDelay(), controller);
					this._controller = controller;
				}
			}
		} else {
			JSG.toolTip.removeTooltip();
			this._controller = undefined;
		}
	}

	/**
	 * Gets the controller at specified location or <code>undefined</code> if none could be found.
	 *
	 * @method _getControllerAt
	 * @param {Point} location The location, relative to Graph coordinate system, to start look up at.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified this
	 *     activator.
	 * @return {GraphItemController} The controller at specified location or
	 *     <code>undefined</code>.
	 */
	_getControllerAt(location, viewer, dispatcher) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			if (cont instanceof GraphController) {
				return false;
			}
			if (
				cont
					.getModel()
					.getTooltip()
					.getValue() === ''
			) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Implemented to be notified about mouse up events.</br>
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by {{#crossLink
	 *     "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified this
	 *     activator.
	 */
	onMouseDown(event, viewer, dispatcher) {
		JSG.toolTip.removeTooltip();
		this._controller = undefined;
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
		return 'tooltip.activator';
	}
}

export default TooltipActivator;
