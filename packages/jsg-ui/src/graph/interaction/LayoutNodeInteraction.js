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
	default as JSG, GraphUtils
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

	onMouseDown(event, viewer) {
		const node = this._controller.getModel();
		node.prepareResize(this.row, this.index);

		this._ptDown = this.pointToNode(event, viewer);
	}

	onMouseDrag(event, viewer) {
		this._ptDrag = this.pointToNode(event, viewer);
		const node = this._controller.getModel();

		node.resizeSection(node.resizeInfo.row ?
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
			data.expanded);

		viewer.getInteractionHandler().execute(cmd);

		super.onMouseUp(event, viewer);
	}
}
