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
import { SplitterNode, ItemAttributes, Shape } from '@cedalo/jsg-core';
import SplitterInteraction from './SplitterInteraction';
import StreamSheetContainerView from '../view/StreamSheetContainerView';
import InteractionActivator from './InteractionActivator';
import Cursor from '../../ui/Cursor';

const KEY = 'splitter.activator';

/**
 * An InteractionActivator used to activate a {{#crossLink "SplitterInteraction"}}{{/crossLink}}.
 *
 * @class SplitterActivator
 * @extends InteractionActivator
 * @constructor
 */
export default class SplitterActivator extends InteractionActivator {
	constructor() {
		super();

		this._controller = undefined;
	}

	getKey() {
		return SplitterActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
	}

	onMouseDown(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();

			let parent = controller.getParent();
			while (parent && !(parent.getView() instanceof StreamSheetContainerView)) {
				parent = parent.getParent();
			}
			if (parent) {
				parent.getView().moveSheetToTop(viewer);
			}

			const interaction = this.activateInteraction(new SplitterInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	/**
	 * Handels mouse move events.</br>
	 * If the event occurred over a suitable controller the mouse cursor is updated to reflect that
	 * a link might be executed.
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The mouse move event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified
	 * this activator.
	 */
	onMouseMove(event, viewer, dispatcher) {
		if (!event.isConsumed) {
			const controller = this._getControllerAt(event.location, viewer, dispatcher);
			if (controller !== undefined) {
				dispatcher.setCursor(
					controller.getModel().getDirection() === ItemAttributes.Direction.VERTICAL
						? Cursor.Style.SPLITH
						: Cursor.Style.SPLITV
				);
				this._controller = controller;
				event.isConsumed = true;
				return;
			}
		}

		this._controller = undefined;
	}

	/**
	 * Gets the controller at specified location or <code>undefined</code> if none could be found.
	 *
	 * @method _getControllerAt
	 * @param {Point} location The location, relative to Graph coordinate system, to start look up at.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 * @return {GraphItemController} The controller at specified location or
	 * <code>undefined</code>.
	 */
	_getControllerAt(location, viewer, dispatcher) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREAWITHFRAME, (cont) => {
			if (!(cont.getModel() instanceof SplitterNode)) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Handels mouse up events.</br>
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 */
	onMouseUp(event /* , viewer, dispatcher */) {
		if (this._controller) {
			this._controller = undefined;
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	static get KEY() {
		return KEY;
	}
}
