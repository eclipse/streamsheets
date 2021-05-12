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
		const cols = data.filter((column) => {
			rect.x += column.layoutSize - 100;
			if (rect.containsPoint(point)) {
				return true;
			}
			rect.x += 100;
			return false;
		});

		return cols.length ? cols[0] : undefined;
	}

	getColumnHeader(event, viewer, point, layoutNode) {
		const data = layoutNode.columnData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.height = 300;

		const cols = data.filter((column) => {
			rect.width = column.layoutSize;
			if (rect.containsPoint(point)) {
				return true;
			}
			rect.x += column.layoutSize;
			return false;
		});

		return cols.length ? cols[0] : undefined;
	}

	getRowHeader(event, viewer, point, layoutNode) {
		const data = layoutNode.rowData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.width = 300;

		const rows = data.filter((row) => {
			rect.height = row.layoutSize;
			if (rect.containsPoint(point)) {
				return true;
			}
			rect.y += row.layoutSize;
			return false;
		});

		return rows.length ? rows[0] : undefined;
	}

	getRow(event, viewer, point, layoutNode) {
		const data = layoutNode.rowData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.width = layoutNode.getWidth().getValue();
		rect.height = 200;

		const rows = data.filter((row) => {
			rect.y += row.layoutSize - 100;
			if (rect.containsPoint(point)) {
				return true;
			}
			rect.y += 100;
			return false;
		});

		return rows.length ? rows[0] : undefined;
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

	onMouseDown(event, viewer, dispatcher) {
		if (viewer.getGraph().getMachineContainer().getMachineState().getValue() !== 1) {
			return;
		}

		const controller = this._getControllerAt(event.location, viewer, dispatcher);
		if (controller) {
			const point = this.pointToNode(controller, event, viewer);
			const layoutNode = controller.getModel();
			let data = this.getColumn(event, viewer, point, layoutNode);
			if (data) {
				const interaction = this.activateInteraction(new LayoutNodeInteraction(controller, false, data),
					dispatcher);
				interaction.onMouseDown(event, viewer);
				event.hasActivated = true;
				event.doRepaint = true;
			} else {
				data = this.getRow(event, viewer, point, layoutNode);
				if (data) {
					const interaction = this.activateInteraction(new LayoutNodeInteraction(controller, true, data),
						dispatcher);
					interaction.onMouseDown(event, viewer);
					event.hasActivated = true;
					event.doRepaint = true;
				} else {
					data = this.getRowHeader(event, viewer, point, layoutNode);
					if (data) {
						const rowIndex = layoutNode.rowData.indexOf(data);
						const newSelection = [];
						const selectionProvider = viewer.getSelectionProvider();

						layoutNode.columnData.forEach((column, columnIndex) => {
							const node = layoutNode.getItemAt(rowIndex * layoutNode.columnData.length + columnIndex);
							// if we store parent controller we can use getModelController which traverse only direct children...
							const contr = controller.getControllerByModelId(node.getId());
							if (contr !== undefined) {
								newSelection.push(contr);
							}
						});
						selectionProvider.setSelection(newSelection, {obj: 'layoutsection', data});
						event.hasActivated = true;
					} else {
						data = this.getColumnHeader(event, viewer, point, layoutNode);
						if (data) {
							const columnIndex = layoutNode.columnData.indexOf(data);
							const newSelection = [];
							const selectionProvider = viewer.getSelectionProvider();

							layoutNode.rowData.forEach((row, rowIndex) => {
								const node = layoutNode.getItemAt(
									rowIndex * layoutNode.columnData.length + columnIndex);
								// if we store parent controller we can use getModelController which traverse only direct children...
								const contr = controller.getControllerByModelId(node.getId());
								if (contr !== undefined) {
									newSelection.push(contr);
								}
							});
							selectionProvider.setSelection(newSelection, {obj: 'layoutsection', data});
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
			if (this.getColumn(event, viewer, point, layoutNode)) {
				dispatcher.setCursor(Cursor.Style.SHEETCOLUMNSIZE);
			} else if (this.getRow(event, viewer, point, layoutNode)) {
				dispatcher.setCursor(Cursor.Style.SHEETROWSIZE);
			} else if (this.getColumnHeader(event, viewer, point, layoutNode)) {
				dispatcher.setCursor(Cursor.Style.SHEETCOLUMN);
			} else if (this.getRowHeader(event, viewer, point, layoutNode)) {
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
