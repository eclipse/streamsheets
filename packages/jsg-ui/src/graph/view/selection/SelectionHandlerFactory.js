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
import { default as JSG, TextNode, OrthoLineShape, LineConnection, LineNode } from '@cedalo/jsg-core';
import BBoxSelectionHandler from './BBoxSelectionHandler';
import GroupSelectionHandler from './GroupSelectionHandler';
import LineNodeSelectionHandler from './LineNodeSelectionHandler';
import LineSelectionHandler from './LineSelectionHandler';
import OrthoLineSelectionHandler from './OrthoLineSelectionHandler';
import NodeSelectionHandler from './NodeSelectionHandler';
import TextSelectionHandler from './TextSelectionHandler';

/**
 * A simple factory to create a {{#crossLink "SelectionHandler"}}{{/crossLink}} for single or
 * multiple selection. Custom applications can provide their own factory implementation and register it via
 * {{#crossLink "SelectionView/setHandlerFactory:method"}}{{/crossLink}}.
 *
 * @class SelectionHandlerFactory
 * @constructor
 */
class SelectionHandlerFactory {
	/**
	 * Called to create a SelectionHandler for given selection.<br/>
	 * Note: this simply checks if we have single or multiple selection and calls corresponding methods respectively.
	 * If
	 * a handler was created the passed SelectionView is registered to it.
	 *
	 * @method createSelectionHandler
	 * @param {SelectionView} selectionView The SelectionView to create the handler for. Note
	 *     that this view is registered to the created handler.
	 * @return {SelectionHandler} The SelectionHandler to display selection.
	 */
	createSelectionHandler(selectionView) {
		let selHandler;
		const selectedViews = selectionView.getViews();
		switch (selectedViews.length) {
			case 0:
				selHandler = undefined;
				break;
			case 1:
				selHandler = this.createSingleSelectionHandler(selectedViews[0]);
				break;
			default:
				selHandler = this.createMultipleSelectionHandler(selectedViews);
		}
		if (selHandler) {
			selHandler.register(selectionView);
		}
		return selHandler;
	}

	/**
	 * Called to create a SelectionHandler for given single selection.
	 *
	 * @method createSingleSelectionHandler
	 * @param {View} selView The view instance to mark as selected.
	 * @return {SelectionHandler} The SelectionHandler to display given single selection.
	 */
	createSingleSelectionHandler(selView) {
		let selHandler;
		const item = selView.getItem();

		if (item instanceof LineConnection) {
			selHandler =
				item._shape instanceof OrthoLineShape
					? new OrthoLineSelectionHandler(selView)
					: new LineSelectionHandler(selView);
		} else if (item instanceof LineNode) {
			selHandler = new LineNodeSelectionHandler(selView);
		} else if (item instanceof TextNode) {
			selHandler = new TextSelectionHandler(selView);
		} else if (JSG.isGroup(item)) {
			// ( item instanceof Group) {
			selHandler = new GroupSelectionHandler(selView);
		} else {
			selHandler = new NodeSelectionHandler(selView);
		}
		return selHandler;
	}

	/**
	 * Called to create a SelectionHandler for given multiple selection.
	 *
	 * @method createMultipleSelectionHandler
	 * @param {Array} selViews A list of {{#crossLink "View"}}{{/crossLink}}s to mark as selected.
	 * @return {SelectionHandler} The SelectionHandler to display given multiple selection.
	 */
	createMultipleSelectionHandler(selViews) {
		return new BBoxSelectionHandler(selViews);
	}
}

export default SelectionHandlerFactory;
