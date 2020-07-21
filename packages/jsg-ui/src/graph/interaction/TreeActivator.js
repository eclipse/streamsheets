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

import { default as JSG, Shape, TreeItemsNode, GraphUtils, Point } from '@cedalo/jsg-core';
import TreeInteraction from './TreeInteraction';
import StreamSheetContainerView from '../view/StreamSheetContainerView';
import TreeItemsView from '../view/TreeItemsView';
import InteractionActivator from './InteractionActivator';
import ContentNodeView from '../view/ContentNodeView';
import Cursor from '../../ui/Cursor';

const KEY = 'tree.activator';

/**
 * An InteractionActivator used to activate a {{#crossLink "TreeInteraction"}}{{/crossLink}}.
 *
 * @class TreeActivator
 * @extends InteractionActivator
 * @constructor
 */
export default class TreeActivator extends InteractionActivator {
	constructor() {
		super();

		this._controller = undefined;
	}

	getKey() {
		return TreeActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
	}

	onKeyDown(event, viewer, dispatcher) {
		const focus = viewer.getGraphView().getFocus();
		if (focus && focus.getView() instanceof TreeItemsView) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = focus;
			interaction.onKeyDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onRightMouseDown(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onMouseDown(event, viewer, dispatcher) {
		if (viewer.isResizeHandle(event)) {
			return;
		}

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
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDown(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	onMouseMove(event, viewer, dispatcher) {
		if (event.isConsumed || this.isResizeHandle(viewer, event)) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			dispatcher.setCursor(Cursor.Style.AUTO);
			controller.getView().showTooltip(viewer, event);
		}
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			viewer.clearSelection();
			const interaction = this.activateInteraction(new TreeInteraction(), dispatcher);
			interaction._controller = controller;
			interaction.onMouseDoubleClick(event, viewer);
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	/**
	 * Called to handle mouse wheel in interaction specifically.</br>
	 *
	 * @method onMouseWheel
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseWheel(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const zDelta = event.getWheelDelta() < 0 ? 1 : -1;
			let view = controller.getView();

			while (view && !(view instanceof ContentNodeView)) {
				view = view.getParent();
			}

			if (view === undefined) {
				return;
			}

			view._didScroll = true;
			const scrollView = view.getScrollView();
			const pt = scrollView.getScrollPosition();

			pt.y += zDelta * 1400;
			scrollView.setScrollPositionTo(pt);

			dispatcher.getInteractionHandler().repaint();
		}
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
		const cont = viewer.filterFoundControllers(Shape.FindFlags.AREA, (controller) => true);

		return (cont && cont.getModel()) instanceof TreeItemsNode ? cont : undefined;
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
