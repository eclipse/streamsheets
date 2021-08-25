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
	default as JSG, GraphUtils, Rectangle
} from '@cedalo/jsg-core';

import Interaction from './Interaction';

export default class LayoutNodeInteraction extends Interaction {
	constructor(controller, row, index) {
		super();

		this._controller = controller;
		this.row = row;
		this.index = index;
	}

	deactivate(viewer) {
		super.deactivate(viewer);
	}

	pointToNode(event, viewer) {
		const point = event.location.copy();
		viewer.translateFromParent(point);

		GraphUtils.traverseDown(viewer.getGraphView(), this._controller.getView(), (v) => {
			v.translateFromParent(point);
			return true;
		});

		return point;
	}

	getData() {
		if (this.row) {
			return this._controller.getModel().rowData[this.index];
		}

		return this._controller.getModel().columnData[this.index];
	}

	getRowInside(event, viewer, point, layoutNode) {
		const data = layoutNode._virtualRowData ? layoutNode._virtualRowData : layoutNode.rowData;
		const rect = new Rectangle();

		rect.x = 0;
		rect.y = 0;
		rect.width = layoutNode.getWidth().getValue();

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


	prepareResize(node, row, index, event, viewer) {
		this.resizeInfo = {
			row,
			index,
			sectionSize: row ? node.rowData[index].size : node.columnData[index].size,
			size: row ? node.getHeight().getValue() : node.getWidth().getValue(),
		};

		if (row) {
			this.resizeInfo.sectionSizes = [];
			node.rowData.forEach((rowa, rowIndex) => {
				this.resizeInfo.sectionSizes.push(row.size);
			});
		} else {
			let columnData;
			this.resizeInfo.sectionSizes = [];
			this.resizeInfo.layoutSizes = [];
			if (node._virtualRowData) {
				const pt = this.pointToNode(event, viewer);
				const rowIndex = this.getRowInside(event, viewer, pt, node);
				if (rowIndex === -1) {
					return;
				}
				columnData = node._virtualRowData[rowIndex].columnData;
			} else {
				columnData = node.columnData;
			}

			columnData.forEach((column, colIndex) => {
				this.resizeInfo.sectionSizes.push(column.size);
				this.resizeInfo.layoutSizes.push(column.layoutSize);
			});
		}
	}

	resizeSection(node, delta) {
		const info = this.resizeInfo;
		const data = info.row ?
			node.rowData[info.index] :
			node.columnData[info.index];
		const dataNext = info.row ?
			node.rowData[info.index + 1] :
			node.columnData[info.index + 1];

		if (data.sizeMode === 'relative') {
			const totalRelSize = info.sectionSizes[info.index] + info.sectionSizes[info.index + 1];
			const totalAbsSize = info.layoutSizes[info.index] + info.layoutSizes[info.index + 1];
			let leftSize = (info.layoutSizes[info.index] + delta) / totalAbsSize * totalRelSize;
			let rightSize = (info.layoutSizes[info.index + 1] - delta) / totalAbsSize * totalRelSize;
			const leftSizeAbs = leftSize * info.size / 100;
			const rightSizeAbs = rightSize * info.size / 100;
			if (leftSizeAbs < data.minSize && rightSizeAbs < dataNext.minSize) {
				return;
			} else if (leftSizeAbs < data.minSize) {
				leftSize = data.minSize / info.size * 100;
				rightSize = totalRelSize - leftSize;
			} else if (rightSizeAbs < dataNext.minSize) {
				rightSize = dataNext.minSize / info.size * 100;
				leftSize = totalRelSize - rightSize;
			}
			if (leftSizeAbs > data._layoutMinSize) {
				data.size = leftSize;
				dataNext.size = rightSize;
			}
		} else {
			data.size = Math.max(0, info.sectionSize + delta);
		}
		if (info.row) {
			node.setHeight(info.size + delta);
		}

		node.layout();
	}

	onMouseDown(event, viewer) {
		const node = this._controller.getModel();
		this.prepareResize(node, this.row, this.index, event, viewer);
		this._oldState = this.getData().copy();
		this._ptDown = this.pointToNode(event, viewer);
	}

	onMouseDrag(event, viewer) {
		this._ptDrag = this.pointToNode(event, viewer);
		const node = this._controller.getModel();

		this.resizeSection(node, this.resizeInfo.row ?
			this._ptDrag.y - this._ptDown.y :
			this._ptDrag.x - this._ptDown.x);

		viewer.getGraph().markDirty();

		event.doRepaint = true;
		event.isConsumed = true;
	}

	onMouseUp(event, viewer) {
		if (!this._ptDrag) {
			super.onMouseUp(event, viewer);
			return;
		}
		const data = this.getData();
		const node = this._controller.getModel();
		const cmd = new JSG.SetLayoutSectionCommand(node,
			this.index,
			this.row,
			data.size,
			data.minSize,
			data.sizeMode,
			data.expandable,
			data.expanded,
			this._oldState,
			node.resizeInfo);

		viewer.getInteractionHandler().execute(cmd);

		super.onMouseUp(event, viewer);
	}
}
