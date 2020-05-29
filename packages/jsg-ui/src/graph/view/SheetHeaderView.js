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
import { default as JSG, Point } from '@cedalo/jsg-core';
import NodeView from './NodeView';

/**
 * This view is for a {{#crossLink "SheetHeaderNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class SheetHeaderView
 * @extends NodeView
 * @param {SheetHeaderNode} item The corresponding SheetHeaderNode model.
 * @constructor
 */
export default class SheetHeaderView extends NodeView {
	draw(graphics) {
		const origin = this.getScrollOffset();

		graphics.translate(-origin.x, -origin.y);

		super.draw(graphics);

		graphics.translate(origin.x, origin.y);
	}

	getWorksheetView() {
		let parent = this.getParent();
		if (parent) {
			parent = parent.getParent();
			if (parent) {
				return parent.getContentView();
			}
		}
		return undefined;
	}

	getScrollOffset() {
		const ws = this.getWorksheetView();
		if (ws) {
			return ws.getScrollOffset();
		}

		return new Point(0, 0);
	}
}
