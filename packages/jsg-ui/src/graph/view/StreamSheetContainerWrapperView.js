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
	GraphUtils,
} from '@cedalo/jsg-core';

import NodeView from './NodeView';

export default class StreamSheetContainerWrapperView extends NodeView {

	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);
		const view = this.getCellsView();
		if (view) {
			graphics.save();
			// due to setting clip area...
			this._shapeRenderer.setClipArea(this._item._shape, graphics);
			view.drawFill(graphics, format, rect);
			view.drawBorder(graphics, format, rect);
			graphics.restore();
		}
	}

	getCellsView() {
		const attr = this.getItem().getAttributeAtPath('streamsheet');
		const graphView = this.getGraphView();

		if (!attr || !graphView) {
			return undefined;
		}

		const id = attr.getValue();
		let view;

		GraphUtils.traverseView(graphView, (v) => {
			if (v.getItem && v.getItem().getId() === id) {
				view = v._subviews[4];
			}
		}, false);

		return view ? view.getContentPane()._subviews[0] : undefined;
	}
}
