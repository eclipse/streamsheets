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
import {
	Shape,
	ButtonNode,
	StreamSheetContainer,
	Command,
	ChangeItemOrderCommand
} from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import Cursor from '../../ui/Cursor';

const KEY = 'button.activator';

export default class ButtonActivator extends InteractionActivator {
	constructor() {
		super();

		this._controller = undefined;
	}

	getKey() {
		return ButtonActivator.KEY;
	}

	onMouseDown(event, viewer, dispatcher) {
		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
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
				dispatcher.setCursor(Cursor.Style.EXECUTE);
				this._controller = controller;
				event.isConsumed = true;
				event.hasActivated = true;
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
		const cont = viewer.filterFoundControllers(Shape.FindFlags.AREA, (contr) => true);

		return cont && cont.getModel() instanceof ButtonNode ? cont : undefined;
	}

	/**
	 * Handles mouse up events.</br>
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 */
	onMouseUp(event, viewer, dispatcher) {
		if (this._controller) {
			const model = this._controller.getModel();
			if (model.onClick) {
				const scope = model.getEventScope();
				const cmd = model.onClick.call(scope || model, model);
				if (cmd instanceof Command) {
					viewer.getInteractionHandler().execute(cmd);
				}
			}
			let item = this._controller.getModel().getParent();
			while (item !== undefined && !(item instanceof StreamSheetContainer)) {
				item = item.getParent();
			}
			if (item) {
				viewer
					.getInteractionHandler()
					.execute(new ChangeItemOrderCommand(item, ChangeItemOrderCommand.Action.TOTOP, viewer));
			}
			this._controller = undefined;
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	static get KEY() {
		return KEY;
	}
}
