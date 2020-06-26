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
const JSG = require('../../JSG');
const AbstractItemCommand = require('./AbstractItemCommand');
/**
 * Command to remove a {{#crossLink "Coordinate"}}{{/crossLink}} from the {{#crossLink
 * "Shape"}}{{/crossLink}} of a given {{#crossLink "GraphItem"}}{{/crossLink}}
 * at specified index.<br/>
 *
 * @class RemoveShapeCoordinateAtCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item The <code>GraphItem</code> whose <code>Shape</code> will be modified.
 * @param {Number} index The index of the <code>Coordinate</code> to remove.
 * @since 1.6.15
 */
class RemoveShapeCoordinateAtCommand extends AbstractItemCommand {
	constructor(item, index) {
		super(item);

		this.index = index;
		this.oldcoord = item
			.getShape()
			.getCoordinateAt(index)
			.copy();
	}

	undo() {
		this._graphItem
			.getShape()
			.insertCoordinatesAt(this.index, this.oldcoord);
	}

	redo() {
		this._graphItem.getShape().removeCoordinateAt(this.index);
	}
}

module.exports = RemoveShapeCoordinateAtCommand;
