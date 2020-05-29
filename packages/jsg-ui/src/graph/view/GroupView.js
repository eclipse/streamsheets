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
import NodeView from './NodeView';

/**
 * This view is used to display a {{#crossLink "Group"}}{{/crossLink}} model.</br>
 * By default a <code>GroupView</code> does not draw anything. However custom class may change this. To create an
 * instance of this view {{#crossLink "GroupController/createView:method"}}{{/crossLink}} method
 * should be called.
 *
 * @class GroupView
 * @extends GraphItemView
 * @param {Group} item The corresponding group model.
 * @constructor
 */
class GroupView extends NodeView {
	// overwritten to bail out early...
	drawFill(graphics, format, rect) {}

	// overwritten to bail out early...
	drawBorder(graphics, format, rect) {}

	// overwritten to bail out early...
	drawDecorations(graphics, rect) {}
}

export default GroupView;
