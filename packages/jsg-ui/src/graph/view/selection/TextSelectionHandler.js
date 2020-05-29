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
import { default as JSG } from '@cedalo/jsg-core';
import BBoxSelectionHandler from './BBoxSelectionHandler';
import SelectionHandle from './SelectionHandle';
import Cursor from '../../../ui/Cursor';

/**
 * A special BBoxSelectionHandler subclass to handle the single selection of a {{#crossLink
 * "TextNode"}}{{/crossLink}}. It is created via {{#crossLink
 * "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class TextSelectionHandler
 * @extends BBoxSelectionHandler
 * @constructor
 * @param {GraphItemView} view The view which represent current text selection.
 */
class TextSelectionHandler extends BBoxSelectionHandler {
	constructor(view) {
		super(view);
		// TODO: check if placing this line after super() does not have any sideeffects
		this._view = view;
	}

	getHandleAt(point, event, reusehandle) {
		const handle = reusehandle || new SelectionHandle();
		const bbox = JSG.boxCache.get().setTo(this._bbox);
		const threshold = this._view
			.getItem()
			.getGraph()
			.getFindRadius();

		handle.reset();
		bbox.reduceBy(threshold);
		// we first check if we are in our bbox:
		if (bbox.containsPoint(point)) {
			if (
				this._view
					.getItem()
					.getLink()
					.getValue() !== '' &&
				event.event.ctrlKey
			) {
				handle.setCursor(Cursor.Style.EXECUTE);
				handle.setType(SelectionHandle.TYPE.EXECUTE);
			}
		}
		JSG.boxCache.release(bbox);
		return handle.getType() !== undefined ? handle : super.getHandleAt(point, event, handle);
	}
}

export default TextSelectionHandler;
