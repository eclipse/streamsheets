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
	constructor(controller, row, data) {
		super();

		this._controller = controller;
		this.row = row;
		this.data = data;
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

	onMouseDown(event, viewer) {
		this._oldSize = this.data.size;
		this._ptDown = this.pointToNode(event, viewer);
	}

	onMouseDrag(event, viewer) {
		this._ptDrag = this.pointToNode(event, viewer);

		if (this.row) {
			this.data.size = Math.max(this.data.minSize, this._oldSize + this._ptDrag.y - this._ptDown.y);
		} else {
			this.data.size = Math.max(this.data.minSize, this._oldSize + this._ptDrag.x - this._ptDown.x);
		}
		this._controller.getModel().layout();
		viewer.getGraph().markDirty();

		event.doRepaint = true;
		event.isConsumed = true;
	}

	onMouseUp(event, viewer) {

		if (this.row) {
			this.data.size = Math.max(this.data.minSize, this._oldSize + this._ptDrag.y - this._ptDown.y);
		} else {
			this.data.size = Math.max(this.data.minSize, this._oldSize + this._ptDrag.x - this._ptDown.x);
		}
		const node = this._controller.getModel();
		const index = this.row ? node.rowData.indexOf(this.data) : node.columnData.indexOf(this.data);
		const cmd = new JSG.SetLayoutSectionCommand(node,
			index,
			this.row,
			this.data.size,
			this.data.minSize,
			this.data.sizeMode);
		viewer.getInteractionHandler().execute(cmd);

		super.onMouseUp(event, viewer);
	}
}
