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
import { default as JSG, NotificationCenter, Notification, Shape, LayoutNode, CellsNode } from '@cedalo/jsg-core';

import StreamSheetContainerView from '../view/StreamSheetContainerView';
import SheetGraphItemEventInteraction from './SheetGraphItemEventInteraction';
import InteractionActivator from './InteractionActivator';
import Feedback from '../feedback/Feedback';
import Cursor from '../../ui/Cursor';
import SelectionProvider from '../view/SelectionProvider';

const KEY = 'sheetgraphitemevent.activator';

export default class SheetGraphItemEventActivator extends InteractionActivator {
	getKey() {
		return SheetGraphItemEventActivator.KEY;
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
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			const item = cont.getModel()
			if (!item.isVisible()) {
				return false;
			}
			return (item.getAttributeValueAtPath('value') !== undefined ||
				item.getEvents().hasMouseEvent());
		});
	}

	_getShapeControllerAt(location, viewer, dispatcher) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			if (!cont.getModel().isVisible()) {
				return false;
			}
			let item = cont.getModel().getParent();
			while (item && !(item instanceof CellsNode)) {
				item = item.getParent();
			}

			return item !== undefined;
		});
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		this.handleClick(event, viewer, dispatcher, 'double');

		// if (viewer.getGraph().getMachineContainer().getMachineState().getValue() === 1) {
			const cont = this._getShapeControllerAt(event.location, viewer, dispatcher);
			if (cont && !cont.getModel().isProtected()) {
				NotificationCenter.getInstance().send(
					new Notification(JSG.PLOT_DOUBLE_CLICK_NOTIFICATION, {open: true})
				);			}
		// }

	}

	onMouseDown(event, viewer, dispatcher) {
		this.handleClick(event, viewer, dispatcher, 'down');
	}

	onMouseUp(event, viewer, dispatcher) {
		this.handleClick(event, viewer, dispatcher, 'up');
	}

	handleClick(event, viewer, dispatcher, type) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller === undefined) {
			return;
		}

		let parent = controller.getParent();
		while (parent && !(parent.getView() instanceof StreamSheetContainerView)) {
			parent = parent.getParent();
		}
		if (parent) {
			parent.getView().moveSheetToTop(viewer);
		}

		if (viewer.getGraph().getMachineContainer().getMachineState().getValue() === 1) {
			return;
		}

		viewer.clearSelection();

		const interaction = this.activateInteraction(new SheetGraphItemEventInteraction(), dispatcher);
		interaction._controller = controller;
		switch (type) {
		case 'double':
			interaction.onMouseDoubleClick(event, viewer);
			break;
		case 'down':
			interaction.onMouseDown(event, viewer);
			break;
		}

		event.isConsumed = true;
		event.hasActivated = true;
	}

	_getFeedback(controller, viewer) {
		if (this._controller !== controller) {
			viewer.clearInteractionFeedback();
			if (this._controller) {
				this._controller.getModel().hover = false;
			}
		} else if (this._feedback) {
			return this._feedback;
		}

		const model = controller.getModel();

		if (model.showFeedback !== true) {
			return undefined;
		}

		const fbItem = controller.createFeedbackItem(false, true);
		const fbView = controller.createFeedbackView(fbItem, false);
		const feedback = new Feedback(fbItem, fbView, model);
		model.hover = true;

		viewer.addInteractionFeedback(feedback);

		feedback.init();

		this._feedback = feedback;
		this._controller = controller;

		return this._feedback;
	}

	onMouseMove(event, viewer, dispatcher) {
		if (
			viewer
				.getGraph()
				.getMachineContainer()
				.getMachineState()
				.getValue() !== 0
		) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const events = controller.getModel().getEvents().hasMouseEvent();
			if (events) {
				this._getFeedback(controller, viewer);
				dispatcher.setCursor(Cursor.Style.EXECUTE);
				event.hasActivated = true;
				event.doRepaint = true;
				return;
			}
		}
		if (this._controller) {
			viewer.clearInteractionFeedback();
			this._controller.getModel().hover = false;
			this._feedback = undefined;
			this._controller = undefined;
			event.doRepaint = true;
		}
	}

	handleContextMenu(event, viewer, dispatcher) {
		let controller;

		if (viewer.isResizeHandle(event)) {
			controller = viewer.getSelectionProvider().getFirstSelection();
		}

		if (!controller) {
			if (viewer.getSelectionProvider().hasSingleSelection()) {
				const bbox = viewer.getSelectionView().getBoundingBox();
				const rect = bbox.getBoundingRectangle();
				if (rect.containsPoint(event.location)) {
					controller = viewer.getSelectionProvider().getFirstSelection();
				}
			}

			if (!controller) {
				controller = this._getShapeControllerAt(event.location, viewer, dispatcher);
			}
		}
		if (controller) {
			if (controller.getModel().isProtected()) {
				return;
			}
			if (!controller.isSelected()) {
				viewer.getSelectionProvider().setSelection([controller]);
				viewer.getSelectionView().refresh();
				event.doRepaint = true;
			}
			event.hasActivated = true;
			if (controller.getParent().getModel() instanceof LayoutNode) {
				NotificationCenter.getInstance().send(
					new Notification(JSG.LAYOUT_SHOW_CONTEXT_MENU_NOTIFICATION, {
						event,
						controller
					})
				);
			} else {
				NotificationCenter.getInstance().send(
					new Notification(JSG.GRAPH_SHOW_CONTEXT_MENU_NOTIFICATION, {
						event,
						controller
					})
				);
			}
		}
	}

	static get KEY() {
		return KEY;
	}
}
