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
import ViewInteraction from './ViewInteraction';
import GraphController from '../controller/GraphController';
import ContentNodeView from '../view/ContentNodeView';
import Cursor from '../../ui/Cursor';

/**
 * An InteractionActivator used to activate a {{#crossLink "ViewInteraction"}}{{/crossLink}}.
 *
 * @class ViewActivator
 * @extends InteractionActivator
 * @constructor
 */
class ViewActivator extends InteractionActivator {
	getKey() {
		return ViewActivator.KEY;
	}

	handleContextMenu(event, viewer, dispatcher) {
	}

	onMouseMove(event, viewer, dispatcher) {
		const controller = this._getController(event, viewer, dispatcher);
		if (controller) {
			const view = controller.getView();
			if (view instanceof ContentNodeView) {
				if (!this.isResizeHandle(viewer, event)) {
					dispatcher.setCursor(Cursor.Style.AUTO);
					event.isConsumed = true;
				}
			}
		}
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
		const controller = this._getController(event, viewer, dispatcher);
		if (controller) {
			// don't care about selection and resize handles => we won't a direct reaction and no deselection before...
			const view = controller.getView();
			const resize = this.isResizeHandle(viewer, event);
			if (resize === true) {
				return;
			}
			const interaction = this.activateInteraction(new ViewInteraction(view), dispatcher);
			if (view instanceof ContentNodeView) {
				// content view has to use this, because of location handling
				interaction._notifyMouseEvent(event, viewer);
				// handle differently to prevent deselection after scrolling
				if (!event.isConsumed) {
					viewer.clearSelection();
				}
			} else {
				viewer.clearSelection();
				interaction.setCurrentLocation(viewer.translateFromParent(event.location.copy()));
				interaction.onMouseDown(event, viewer);
			}
			event.hasActivated = true;
		}
	}

	/**
	 * Implemented to be notified about mouse double click events.</br>
	 *
	 * @method onMouseDoubleClick
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDoubleClick(event, viewer, dispatcher) {
		if (!event.isConsumed) {
			// do we handle it:
			const controller = this._getController(event, viewer, dispatcher);
			if (controller) {
				const view = controller.getView();
				if (view instanceof ContentNodeView) {
					const interaction = this.activateInteraction(
						new ViewInteraction(view),
						dispatcher
					);
					// content view has to use this, because of location handling
					interaction._notifyMouseEvent(event);
					return;
				}
			}
			event.isConsumed = !!controller;
		}
	}

	onMouseWheel(event, viewer, dispatcher) {
		if (!event.isConsumed) {
			// do we handle it:
			const controller = dispatcher.getControllerAt(event.location, undefined, this.condition);
			if (controller) {
				const view = controller.getView();
				if (view instanceof ContentNodeView) {
					view.translateFromParent(event.location);
					view.handleMouseWheel(event);
					if (!event.isConsumed) {
						view.translateToParent(event.location);
					}
				}
			}
		}
	}

	/**
	 * Returns the controller at specified event location or <code>undefined</code> if no suitable controller could be
	 * found.
	 *
	 * @method _getController
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @return {GraphItemController} The controller which handles specified event or
	 *     <code>undefined</code>
	 * @private
	 */
	_getController(event, viewer, dispatcher) {
		const tmppoint = JSG.ptCache.get().setTo(event.location);

		let controller = viewer.filterFoundControllers(Shape.FindFlags.AUTOMATIC, this.condition);
		// let controller = dispatcher.getControllerAt(event.location, undefined, this.condition);

		controller = this._getControllerHandlingEvent(event, viewer.translateFromParent(tmppoint), controller);
		JSG.ptCache.release(tmppoint);
		return controller;
	}

	/**
	 * Traverses controller hierarchy from Graph to given controller and returns, maybe a different,
	 * controller whose view handles given event at specified location.
	 *
	 * @method _getControllerHandlingEvent
	 * @param {MouseEvent} event The event to check.
	 * @param {Point} location The location to check at, relative to given controller parent.
	 * @param {GraphItemController} controller The controller to check.
	 * @return {GraphItemController} The controller which handles specified event or
	 *     <code>undefined</code>
	 * @private
	 */
	_getControllerHandlingEvent(event, location, controller) {
		let parent;
		if (controller && !(controller instanceof GraphController)) {
			// we go up until graph:
			parent = controller.getParent();
			parent = parent ? this._getControllerHandlingEvent(event, location, parent) : undefined;
			if (!parent) {
				// do we handle event?
				const view = controller.getView();
				controller.getModel().translateFromParent(location);
				parent = view.doHandleEventAt(location, event) ? controller : undefined;
			}
		}
		return parent;
	}

	// we are interested in visible controllers only...
	condition(controller) {
		return controller.getModel().isVisible();
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
		return 'view.activator';
	}
}

export default ViewActivator;
