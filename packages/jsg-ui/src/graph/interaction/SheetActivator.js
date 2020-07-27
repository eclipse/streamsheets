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
/* eslint-disable no-mixed-operators */
/* global document */

import { default as JSG, Shape, CellsNode, HeaderNode, SheetHeaderNode, StreamSheet } from '@cedalo/jsg-core';

import WorksheetView from '../view/WorksheetView';
import InteractionActivator from './InteractionActivator';
import SheetInteraction from './SheetInteraction';
import ContentNodeView from '../view/ContentNodeView';
import MouseEvent from '../../ui/events/MouseEvent';

const KEY = 'sheet.activator';

/**
 * An InteractionActivator used to activate a {{#crossLink 'SheetInteraction'}}{{/crossLink}}.
 *
 * @class SheetActivator
 * @extends InteractionActivator
 * @constructor
 */
export default class SheetActivator extends InteractionActivator {
	constructor() {
		super();

		this._controller = undefined;
		this._hitCode = undefined;
	}

	getKey() {
		return SheetActivator.KEY;
	}

	onKeyDown(event, viewer, dispatcher) {
		const focus = viewer.getGraphView().getFocus();
		if (focus && focus.getView() instanceof WorksheetView && focus.getView().hasSelection()) {
			const interaction = this.activateInteraction(new SheetInteraction(), dispatcher);
			interaction._controller = focus;
			interaction._hitCode = WorksheetView.HitCode.SHEET;
			if (interaction.onKeyDown(event, viewer)) {
				event.isConsumed = true;
				event.hasActivated = true;
			}
			return;
		}
		if (focus && event.event.ctrlKey && event.event.key === 'q') {
			let parent = focus.getParent();
			while (parent && !(parent.getView() instanceof WorksheetView)) {
				parent = parent.getParent();
			}
			if (parent && parent.getView() instanceof WorksheetView) {
				const interaction = this.activateInteraction(new SheetInteraction(), dispatcher);
				interaction._controller = parent;
				interaction._hitCode = WorksheetView.HitCode.SHEET;
				if (interaction.onKeyDown(event, viewer)) {
					event.isConsumed = true;
					event.hasActivated = true;
				}
			}
		}
	}

	onRightMouseDown(event, viewer, dispatcher) {
		this.handleMouseDown(event, viewer, dispatcher);
	}

	onMouseDown(event, viewer, dispatcher) {
		this.handleMouseDown(event, viewer, dispatcher);
	}

	// onMouseDrag(event, viewer, dispatcher) {
	// 	this.handleMouseDown(event, viewer, dispatcher);
	// }
	//
	handleMouseDown(event, viewer, dispatcher) {
		JSG.toolTip.removeTooltip(event);

		if (viewer.isResizeHandle(event)) {
			return;
		}

		if (this._controller === undefined) {
			this.setState(event, viewer, dispatcher);
			if (viewer.getCanvas()._jsgEditor.hasItemMenuHandler()) {
				viewer.getCanvas()._jsgEditor.getItemMenuHandler().hideMenu();
			}
		}

		if (this._controller) {
			switch (this._hitCode) {
				case WorksheetView.HitCode.CORNER:
				case WorksheetView.HitCode.SELECTIONMOVE:
				case WorksheetView.HitCode.SELECTIONEXTEND:
				case WorksheetView.HitCode.REFERENCEMOVE:
				case WorksheetView.HitCode.SHEET:
				case WorksheetView.HitCode.COLUMN:
				case WorksheetView.HitCode.COLUMNOUTLINE:
				case WorksheetView.HitCode.COLUMNSIZE:
				case WorksheetView.HitCode.COLUMNSIZEHIDDEN:
				case WorksheetView.HitCode.ROW:
				case WorksheetView.HitCode.ROWOUTLINE:
				case WorksheetView.HitCode.ROWSIZE:
				case WorksheetView.HitCode.ROWSIZEHIDDEN: {
					const interaction = this.activateInteraction(new SheetInteraction(), dispatcher);
					interaction._controller = this._controller;
					interaction._hitCode = this._hitCode;
					if (!event.isClicked(MouseEvent.ButtonType.RIGHT)) {
						interaction.onMouseDown(event, viewer);
					}
					// viewer.clearSelection();
					break;
				}
				default:
					if (viewer.getCanvas()._jsgEditor.hasItemMenuHandler()) {
						viewer.getCanvas()._jsgEditor.getItemMenuHandler().hideMenu();
					}
					if (event.event.type === 'panstart') {
						const interaction = this.activateInteraction(new SheetInteraction(), dispatcher);
						interaction._controller = this._controller;
						// interaction._hitCode = this._hitCode;
					}
					break;
			}
			event.isConsumed = true;
			event.hasActivated = true;
		}
	}

	/**
	 * Handles mouse move events.</br>
	 * If the event occurred over a suitable controller the mouse cursor is updated to reflect that
	 * a link might be executed.
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The mouse move event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which
	 * notified this activator.
	 */
	onMouseMove(event, viewer, dispatcher) {
		// JSG.toolTip.removeTooltip(event);
		// JSG.toolTip.savePosition(event);
		if (viewer.isResizeHandle(event)) {
			return;
		}

		this.setState(event, viewer, dispatcher);
	}

	getCell(cont, event, viewer) {
		const view = cont.getView().getWorksheetView();
		return view.getCellInside(event, viewer);
	}

	setState(event, viewer, dispatcher) {
		if (!event.isConsumed) {
			let controller = this._getControllerAt(event.location, viewer, dispatcher);
			if (
				controller &&
				!(controller.getModel() instanceof CellsNode) &&
				!(controller.getModel() instanceof HeaderNode) &&
				!(controller.getModel() instanceof SheetHeaderNode) &&
				!(controller.getModel() instanceof StreamSheet)
			) {
				let cont = controller;
				while (cont && !(cont.getModel() instanceof StreamSheet)) {
					cont = cont.getParent();
				}
				if (cont) {
					const cell = this.getCell(cont, event, viewer);
					if (cell && (cell.x === -1 || cell.y === -1)) {
						controller = cont;
					} else {
						cont = undefined;
					}
				}
				if (cont === undefined) {
					this._controller = undefined;
					this._hitCode = undefined;
					return;
				}
			}
			if (controller !== undefined) {
				if (!(controller.getView() instanceof WorksheetView)) {
					controller = controller.getParent().getParent();
				}
				const view = controller.getView().getWorksheetView();
				this._hitCode = view.getHitCode(event.location, viewer);
				view.setCursor(this._hitCode, dispatcher);
				this._controller = controller;
				event.isConsumed = true;
				event.hasActivated = true;
				if (viewer.getGraphView().hasLayer('chartinfo')) {
					viewer.getGraphView().clearLayer('chartinfo');
					event.doRepaint = true;
				}
				return;
			}
		}

		this._controller = undefined;
		this._hitCode = undefined;
	}

	/**
	 * Gets the controller at specified location or <code>undefined</code> if none could be found.
	 *
	 * @method _getControllerAt
	 * @param {Point} location The location, relative to Graph coordinate system, to start look up at.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher which notified
	 * this activator.
	 * @return {GraphItemController} The controller at specified location or
	 * <code>undefined</code>.
	 */
	_getControllerAt(location, viewer, dispatcher) {
		return viewer.filterFoundControllers(Shape.FindFlags.AREA, (cont) => true);
	}

	/**
	 * Handels mouse up events.</br>
	 * Might triggers the execution of a link.
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The mouse up event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by
	 * {{#crossLink "InteractionHandler"}}{{/crossLink}}.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher
	 * which notified this activator.
	 */
	onMouseUp(event /* , viewer, dispatcher */) {
		if (this._controller) {
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
			let view = controller.getView();
			const zDelta = event.getWheelDelta() < 0 ? 1 : -1;

			while (view && !(view instanceof ContentNodeView)) {
				view = view.getParent();
			}

			if (view === undefined) {
				return;
			}

			const scrollView = view.getScrollView();
			const pt = scrollView.getScrollPosition();

			if (event.event.shiftKey) {
				pt.x += zDelta * 2000;
			} else {
				pt.y += zDelta * 1500;
			}

			scrollView.setScrollPositionTo(pt);

			dispatcher.getInteractionHandler().repaint();
		}
	}

	static get KEY() {
		return KEY;
	}
}
