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

import { TextNode, Shape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import GraphController from '../controller/GraphController';
import ClientEvent from '../../ui/events/ClientEvent';
import Cursor from '../../ui/Cursor';

/**
 * An InteractionActivator used to activate a {{#crossLink "LinkInteraction"}}{{/crossLink}}.
 *
 * @class LinkActivator
 * @extends InteractionActivator
 * @constructor
 */
class LinkActivator extends InteractionActivator {
	constructor() {
		super();
		// TODO: check if placing this line after super() does not have any sideeffects
		this._link = undefined;
	}

	getKey() {
		return LinkActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
	}

	/**
	 * To handle KeyEvents. Currently simply pass to <code>onMouseMove</code>.
	 *
	 * @method onKeyDown
	 * @param {KeyEvent} event Current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by {{#crossLink
	 *     "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified this
	 * activator.
	 */
	onKeyDown(event, viewer, dispatcher) {
		this.onMouseMove(event, viewer, dispatcher);
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
		this._link = undefined;

		if (this.isExecuteEvent(event)) {
			const controller = this._getControllerAt(event.location, viewer, dispatcher);
			if (controller) {
				const model = controller.getModel();
				const value = model.getLink().getValue();
				if (value && value.length) {
					this._link = value;
					dispatcher.setCursor(Cursor.Style.EXECUTE);
					event.isConsumed = true;
					event.hasActivated = true;
					return;
				}
			}
		}
		if (dispatcher.getCursor() === Cursor.Style.EXECUTE) {
			dispatcher.setCursor(Cursor.Style.AUTO);
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
		let controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => {
			if (cont instanceof GraphController) {
				return false;
			}
			if (
				cont
					.getModel()
					.getLink()
					.getValue() === ''
			) {
				return false;
			}
			return true;
		});

		if (controller && !(controller instanceof GraphController)) {
			const item = controller.getModel();
			if (item instanceof TextNode && item.getLink().getValue() === '') {
				controller = controller.getParent();
			}
			return controller;
		}
		return undefined;
	}

	/**
	 * Implemented to be notified about mouse up events.</br>
	 * Might triggers the execution of a link.
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by {{#crossLink
	 *     "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified this
	 *     activator.
	 */
	onMouseUp(event, viewer, dispatcher) {
		if (this._link) {
			event.isConsumed = true;
			event.hasActivated = true;
			if (
				this._link.search('file:') !== -1 ||
				this._link.search('function:') !== -1 ||
				this._link.search('code:') !== -1
			) {
				const controller = this._getControllerAt(event.location, viewer, dispatcher);
				dispatcher.getInteractionHandler().executeLink(controller);
			} else if (this._link.search('http://') === -1) {
				window.open(`http://${this._link}`, '_blank');
			} else {
				window.open(this._link, '_blank');
			}
		}
	}

	/**
	 * Checks if given Event triggers a link execution.
	 *
	 * @method isExecuteEvent
	 * @param {ClientEvent} event The Event object to check.
	 * @return {Boolean} <code>true</code> if an execution should be performed, <code>false</code> otherwise.
	 */
	isExecuteEvent(event) {
		// Note AltGr results in (altKey && ctrlKey)==true!!
		return event && !event.isPressed(ClientEvent.KeyType.CTRL);
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
		return 'link.activator';
	}
}


export default LinkActivator;
