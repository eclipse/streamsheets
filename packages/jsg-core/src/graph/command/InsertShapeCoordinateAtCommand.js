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
const AbstractItemCommand = require('./AbstractItemCommand');
/**
 * Command to insert a {{#crossLink "Coordinate"}}{{/crossLink}} into a {{#crossLink
 * "Shape"}}{{/crossLink}} of a given {{#crossLink "GraphItem"}}{{/crossLink}}
 * at specified index.
 *
 * @class InsertShapeCoordinateAtCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item The <code>GraphItem</code> whose <code>Shape</code> will be modified.
 * @param {Number} index The index to insert <code>Coordinate</code> at.
 * @param {Coordinate} newcoord The new <code>Coordinate</code> to insert.
 * @since 1.6.15
 */
class InsertShapeCoordinateAtCommand extends AbstractItemCommand {
	constructor(item, index, newcoord) {
		super(item);

		this.index = index;
		this.newcoord = newcoord.copy();
	}

	undo() {
		this._graphItem.getShape().removeCoordinateAt(this.index);
	}

	redo() {
		this._graphItem
			.getShape()
			.insertCoordinatesAt(this.index, this.newcoord);
	}
}

module.exports = InsertShapeCoordinateAtCommand;
