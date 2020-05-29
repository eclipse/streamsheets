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
import { default as JSG, Node, PasteItemsCommand } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import GraphController from '../controller/GraphController';
import Cursor from '../../ui/Cursor';

/**
 * Default key handler used by {{#crossLink "GraphInteraction"}}{{/crossLink}}.</br>
 * This class is different from other InteractionActivators in a sense that it does not activate
 * any interaction but rather handles <code>onKeyDown</code> and <code>onKeyUp</code> events itself.
 *
 * @class DefaultKeyHandler
 * @extends InteractionActivator
 * @constructor
 */
class DefaultKeyHandler extends InteractionActivator {
	/**
	 * Called by InteractionDispatcher on a key up event.
	 *
	 * @method onKeyUp
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 */
	onKeyUp(event, viewer, dispatcher) {
		if (viewer.hasSelection()) {
			switch (event.event.keyCode) {
				case 17:
					// Ctrl
					if (event.event.repeat === false && viewer.getCursor() === Cursor.Style.COPY) {
						viewer.setCursor(Cursor.Style.MOVE);
					}
					break;
			}
		}
	}

	/**
	 * Called by {{#crossLink "DefaultKeyHandler/onKeyDown:method"}}{{/crossLink}} to handle tab
	 * key events.
	 *
	 * @method _handleTab
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 * @private
	 * @since 1.6.0
	 */
	_handleTab(event, viewer, dispatcher) {
		// skip collapsed and no selectable controllers...
		const isValid = (controller) => {
			let valid = !!controller;
			valid = valid && !(controller instanceof GraphController);
			valid =
				valid &&
				controller.isSelectable() &&
				!controller.getModel().isAnyParentCollapsed() &&
				controller.getModel().isTabSelectAllowed();
			return valid;
		};

		const getPreviousFrom = (controller, toController) => {
			let validkid;
			const check = (ctrlr) => {
				const stop = ctrlr === toController;
				validkid = !stop && isValid(ctrlr) ? ctrlr : validkid;
				return stop;
			};
			controller.iterate(check);
			return validkid;
		};
		const getNextFrom = (controller, toController) => {
			let validkid;

			const check = (ctrlr) => {
				let found = false;
				const stop = (found || (!toController && ctrlr !== controller)) && isValid(ctrlr);
				found = found || ctrlr === toController;
				validkid = stop ? ctrlr : validkid;
				return stop;
			};
			controller.iterate(check);
			return validkid;
		};

		const selProvider = viewer.getSelectionProvider();
		let selection = event.event.shiftKey ? selProvider.getFirstSelection() : selProvider.getLastSelection();
		const graphController = viewer.getGraphController();

		if (event.event.shiftKey) {
			selection = getPreviousFrom(graphController, selection) || getPreviousFrom(graphController);
		} else {
			selection = getNextFrom(graphController, selection) || getNextFrom(graphController);
		}
		if (selection) {
			viewer.clearSelection(false);
			viewer.select(selection);
		}
	}

	/**
	 * Called by InteractionDispatcher on a key down event.
	 *
	 * @method onKeyDown
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator belongs.
	 */
	onKeyDown(event, viewer, dispatcher) {
		let root;
		let selection;
		let i;

		switch (event.event.keyCode) {
			case 9:
				if (event.event.target.id !== 'jsgTextEdit') {
					this._handleTab(event, viewer, dispatcher);
					event.doRepaint = true;
					event.consume();
					// event.doPreventDefault = true;
				}
				return;
			case 107:
				// + -> zoom
				if (event.event.ctrlKey) {
					viewer.setZoom(viewer.getZoom() + 0.1);
					event.doRepaint = true;
					event.consume();
					// event.doPreventDefault = true;
				}
				return;
			case 109:
				// + -> zoom
				if (event.event.ctrlKey) {
					viewer.setZoom(viewer.getZoom() - 0.1);
					event.doRepaint = true;
					event.consume();
					// event.doPreventDefault = true;
				}
				return;
			case 90:
				// ctrl z -> undo
				if (event.event.ctrlKey) {
					dispatcher.getInteractionHandler().undo();
					event.consume();
				}
				return;
			case 89:
				// ctrl y -> redo
				if (event.event.ctrlKey) {
					dispatcher.getInteractionHandler().redo();
					event.consume();
				}
				return;
			case 86:
				// v -> paste or paste format
				if (event.event.ctrlKey) {
					if (event.event.shiftKey) {
						dispatcher.getInteractionHandler().pasteFormat();
					} else {
						dispatcher.getInteractionHandler().paste();
					}
					event.consume();
				}
				return;
			case 65:
				// ctrl a -> select all
				if (event.event.ctrlKey) {
					let notify = false;
					root = viewer.getRootController().getContent();
					const selProvider = viewer.getSelectionProvider();

					viewer.clearSelection();
					JSG.setDrawingDisabled(true);

					for (i = 0; i < root.children.length; i += 1) {
						const controller = root.children[i];
						if (
							controller.isSelectable() &&
							!controller.isSelected() &&
							selProvider._doSelect(controller)
						) {
							notify = true;
						}
					}
					JSG.setDrawingDisabled(false);
					if (notify === true) {
						selProvider._notifySelectionChanged();
					}

					event.doRepaint = true;
					event.consume();
					// event.doPreventDefault = true;
				}
				return;
		}

		if (viewer.hasSelection()) {
			selection = viewer.getSelection();
			switch (event.event.keyCode) {
				case 17:
					// Ctrl
					if (event.event.repeat === false && viewer.getCursor() === Cursor.Style.MOVE) {
						viewer.setCursor(Cursor.Style.COPY);
					}
					break;
				case 27:
					// ESC
					viewer.clearSelection();
					event.doRepaint = true;
					event.consume();
					break;
				case 46:
					// delete
					dispatcher.getInteractionHandler().deleteSelection();
					event.consume();
					event.doRepaint = true;
					break;
				case 68:
					// ctrl d -> duplicate
					if (event.event.ctrlKey) {
						const xml = JSG.copyItems(viewer.getSelection());
						const cmd = new PasteItemsCommand(xml, viewer);
						dispatcher.getInteractionHandler().execute(cmd);
						event.consume();
						// event.doPreventDefault = true;
					}
					break;
				case 81:
					// ctrl q -> remove ports
					if (event.event.ctrlKey) {
						let n;
						for (i = 0, n = selection.length; i < n; i += 1) {
							if (selection[i].getModel() instanceof Node) {
								selection[i].getModel().clearPorts();
							}
						}
						event.consume();
					}
					break;
				case 88:
					// ctrl x -> cut
					if (event.event.ctrlKey) {
						dispatcher.getInteractionHandler().cutSelection();
						event.consume();
					}
					break;
				case 67:
					// c -> copy
					if (event.event.ctrlKey) {
						if (event.event.shiftKey) {
							dispatcher.getInteractionHandler().copySelectionFormat();
						} else {
							dispatcher.getInteractionHandler().copySelection();
						}
						event.consume();
					}
					break;
			}
		} else if (viewer.getScrollPanel().getScrollBarsMode() !== JSG.ScrollBarMode.HIDDEN) {
			const panel = viewer.getScrollPanel();
			switch (event.event.keyCode) {
				case 37:
					// left arrow:
					panel.scroll(-500);
					event.doRepaint = true;
					event.consume();
					break;
				case 38:
					// up arrow:
					panel.scroll(0, -500);
					event.doRepaint = true;
					event.consume();
					break;
				case 39:
					// right arrow:
					panel.scroll(500);
					event.doRepaint = true;
					event.consume();
					break;
				case 40:
					// down arrow:
					panel.scroll(0, 500);
					event.doRepaint = true;
					event.consume();
					break;
			}
		}
	}
}

export default DefaultKeyHandler;
