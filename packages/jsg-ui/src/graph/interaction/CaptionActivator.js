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
/* global window */

import {
	Shape,
	GraphUtils,
	CaptionNode,
	StreamSheetContainer,
	ChangeItemOrderCommand
} from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import Cursor from '../../ui/Cursor';

const KEY = 'caption.activator';

export default class CaptionActivator extends InteractionActivator {
	getKey() {
		return CaptionActivator.KEY;
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
			if (!(cont.getModel() instanceof CaptionNode)) {
				return false;
			}
			return true;
		});
	}

	/**
	 * Handles mouse up events.</br>
	 *
	 * @method onMouseDoubleClick
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 */
	onMouseDoubleClick(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			if (controller.getModel().getParent().onClickMaximize) {
				controller
					.getModel()
					.getParent()
					.onClickMaximize();
				event.isConsumed = true;
				event.hasActivated = true;
			}
		}
	}

	isOverStatus(event, viewer, controller) {
		const rect = controller.getView()._iconRect;

		if (rect) {
			const point = event.location.copy();
			viewer.translateFromParent(point);

			GraphUtils.traverseDown(viewer.getGraphView(), controller.getView(), (v) => {
				v.translateFromParent(point);
				return true;
			});

			return rect.containsPoint(point);
		}
		return false;
	}

	onMouseMove(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			if (this.isOverStatus(event, viewer, controller)) {
				dispatcher.setCursor(Cursor.Style.EXECUTE);
				event.isConsumed = true;
				event.hasActivated = true;
			}
		}
	}

	onMouseDown(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			let item = controller.getModel().getParent();
			while (item !== undefined && !(item instanceof StreamSheetContainer)) {
				item = item.getParent();
			}
			if (item) {
				viewer
					.getInteractionHandler()
					.execute(new ChangeItemOrderCommand(item, ChangeItemOrderCommand.Action.TOTOP, viewer));
			}
			if (this.isOverStatus(event, viewer, controller)) {
				const link = controller.getModel().getIconLink();
				if (link) {
					window.open(link, '_blank');
					event.isConsumed = true;
					event.hasActivated = true;
				}
			}
		}
	}

	static get KEY() {
		return KEY;
	}
}
