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
import { default as JSG, NotificationCenter, Notification, Rectangle, Shape, LayoutNode, GraphUtils } from '@cedalo/jsg-core';

import InteractionActivator from './InteractionActivator';
import Cursor from '../../ui/Cursor';
import LayoutNodeInteraction from './LayoutNodeInteraction';

JSG.LAYOUT_DOUBLE_CLICK_NOTIFICATION = 'layout_double_click_notification';

const KEY = 'layoutnode.activator';

export default class LayoutNodeActivator extends InteractionActivator {
	getKey() {
		return LayoutNodeActivator.KEY;
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
			return (item instanceof LayoutNode);
		});
	}

	getColumn(event, viewer, point, layoutNode) {
		const data = layoutNode.columnData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.height = layoutNode.getHeight().getValue();
		rect.width = 200;

		for (let i = 0; i < data.length; i += 1) {
			const column = data[i];
			rect.x += column.layoutSize - 100;
			if (rect.containsPoint(point)) {
				return i;
			}
			rect.x += 100;
		}

		return -1;
	}

	getColumnHeader(event, viewer, point, layoutNode) {
		const data = layoutNode.columnData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.height = 300;

		for (let i = 0; i < data.length; i += 1) {
			const column = data[i];
			rect.width = column.layoutSize;
			if (rect.containsPoint(point)) {
				return i;
			}
			rect.x += column.layoutSize;
		}

		return -1;
	}

	getRowHeader(event, viewer, point, layoutNode) {
		const data = layoutNode.rowData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.width = 300;

		for (let i = 0; i < data.length; i += 1) {
			const row = data[i];
			rect.height = row.layoutSize;
			if (rect.containsPoint(point)) {
				return i;
			}
			rect.y += row.layoutSize;
		}

		return -1;
	}

	getRow(event, viewer, point, layoutNode) {
		const data = layoutNode.rowData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.width = layoutNode.getWidth().getValue();
		rect.height = 200;

		for (let i = 0; i < data.length; i += 1) {
			const row = data[i];
			rect.y += row.layoutSize - 100;
			if (rect.containsPoint(point)) {
				return i;
			}
			rect.y += 100;
		}

		return -1;
	}

	pointToNode(controller, event, viewer) {
		const point = event.location.copy();
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), controller.getView(), (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	onMouseDoubleClick(event, viewer, dispatcher) {
		if (viewer.getGraph().getMachineContainer().getMachineState().getValue() !== 1) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const point = this.pointToNode(controller, event, viewer);
			const layoutNode = controller.getModel();
			let data = this.getRowHeader(event, viewer, point, layoutNode);
			if (data === -1) {
				data = this.getColumnHeader(event, viewer, point, layoutNode);
			}
			if (data !== -1) {
				NotificationCenter.getInstance().send(new Notification(JSG.LAYOUT_DOUBLE_CLICK_NOTIFICATION, {
					open: true
				}));
			}
		}

	}

	onMouseDown(event, viewer, dispatcher) {
		if (viewer.getGraph().getMachineContainer().getMachineState().getValue() !== 1) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const point = this.pointToNode(controller, event, viewer);
			const layoutNode = controller.getModel();
			let index = this.getColumn(event, viewer, point, layoutNode);
			if (index !== -1) {
				const interaction = this.activateInteraction(new LayoutNodeInteraction(controller, false, index),
					dispatcher);
				interaction.onMouseDown(event, viewer);
				event.hasActivated = true;
				event.doRepaint = true;
			} else {
				index = this.getRow(event, viewer, point, layoutNode);
				if (index !== -1) {
					const interaction = this.activateInteraction(new LayoutNodeInteraction(controller, true, index),
						dispatcher);
					interaction.onMouseDown(event, viewer);
					event.hasActivated = true;
					event.doRepaint = true;
				} else {
					index = this.getRowHeader(event, viewer, point, layoutNode);
					if (index !== -1) {
						const newSelection = [];
						const selectionProvider = viewer.getSelectionProvider();

						layoutNode.columnData.forEach((column, columnIndex) => {
							const node = layoutNode.getItemAt(index * layoutNode.columnData.length + columnIndex);
							// if we store parent controller we can use getModelController which traverse only direct children...
							const contr = controller.getControllerByModelId(node.getId());
							if (contr !== undefined) {
								newSelection.push(contr);
							}
						});
						selectionProvider.setSelection(newSelection, {obj: 'layoutsectionrow', index});
						event.hasActivated = true;
					} else {
						index = this.getColumnHeader(event, viewer, point, layoutNode);
						if (index !== -1) {
							const newSelection = [];
							const selectionProvider = viewer.getSelectionProvider();

							layoutNode.rowData.forEach((row, rowIndex) => {
								const node = layoutNode.getItemAt(
									rowIndex * layoutNode.columnData.length + index);
								// if we store parent controller we can use getModelController which traverse only direct children...
								const contr = controller.getControllerByModelId(node.getId());
								if (contr !== undefined) {
									newSelection.push(contr);
								}
							});
							selectionProvider.setSelection(newSelection, {obj: 'layoutsectioncolumn', index});
							event.hasActivated = true;
						}
					}
				}
			}
		}
	}

	onMouseUp(event, viewer, dispatcher) {
	}

	onMouseMove(event, viewer, dispatcher) {
		if (viewer.getGraph().getMachineContainer().getMachineState().getValue() !== 1) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const point = this.pointToNode(controller, event, viewer);
			const layoutNode = controller.getModel();
			if (this.getColumn(event, viewer, point, layoutNode) !== -1) {
				dispatcher.setCursor(Cursor.Style.SHEETCOLUMNSIZE);
			} else if (this.getRow(event, viewer, point, layoutNode) !== -1) {
				dispatcher.setCursor(Cursor.Style.SHEETROWSIZE);
			} else if (this.getColumnHeader(event, viewer, point, layoutNode) !== -1) {
				dispatcher.setCursor(Cursor.Style.SHEETCOLUMN);
			} else if (this.getRowHeader(event, viewer, point, layoutNode) !== -1) {
				dispatcher.setCursor(Cursor.Style.SHEETROW);
			} else {
				return;
			}
			event.hasActivated = true;
			event.doRepaint = true;
		}
	}


	static get KEY() {
		return KEY;
	}
}
