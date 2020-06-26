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
const Point = require('../../geometry/Point');
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * A command provided to allow changing the reshape coordinates. The Reshape Coordinates define how
 * predefined shapes (Start, certain Rectangle, Arrows ...) are visualized. A user can change the shape by
 * changing the reshape factor. The result depends on the specific item. For Rectangles with corner or
 * round edges, you can change the size of the corners.
 *
 * @example
 *     // interactionhandler and item given
 *     // change the first reshape coordinate of an item by setting the x factor to 0.5.
 *     var cmd = new ReshapeItemCommand(item, 0, new Point(0.5, 0);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ReshapeItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} line GraphItem or line to change.
 * @param {Number} index Index of Reshape coordinate to be changed.
 * @param {Point} point New resize coordinate as a point. Please be
 * aware that the influence of changing this coordinate depends on the type of the
 * predefined shape. It can be a factor for the size of a corner or an absolute value.
 */
class ReshapeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, context) {
		let cmd;
		const item = context.graph.getItemById(data.itemId);
		if (item) {
			const point = new Point(data.point.x, data.point.y);
			cmd = new ReshapeItemCommand(
				item,
				data.index,
				point
			).initWithObject(data);
			cmd._oldPoint = new Point(data.oldPoint.x, data.oldPoint.y);
		}
		return cmd;
	}

	constructor(item, index, point) {
		super(item);

		const coordinate = item.getReshapeCoordinateAt(index);

		this._index = index;
		this._point = point.copy();
		this._oldPoint = coordinate.toPoint();
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.point = this._point;
		data.oldPoint = this._oldPoint;
		return data;
	}

	/**
	 * Undo the change of the reshape coordinate
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setReshapeCoordinateAt(this._index, this._oldPoint);

		const coordinate = this._graphItem.getReshapeCoordinateAt(this._index);
		const shapeBuilder = coordinate.getShapeBuilder();
		if (shapeBuilder) {
			shapeBuilder.call(this._graphItem);
		}
	}

	/**
	 * Redo the change of the reshape coordinate
	 *
	 * @method redo
	 */
	redo() {
		const coordinate = this._graphItem.getReshapeCoordinateAt(this._index);

		let xValue = Math.min(coordinate.getXMax(), this._point.x);
		xValue = Math.max(coordinate.getXMin(), xValue);

		let yValue = Math.min(coordinate.getYMax(), this._point.y);
		yValue = Math.max(coordinate.getYMin(), yValue);

		this._graphItem.setReshapeCoordinateAt(this._index, xValue, yValue);

		const shapeBuilder = coordinate.getShapeBuilder();
		if (shapeBuilder) {
			shapeBuilder.call(this._graphItem);
		}
	}
}

module.exports = ReshapeItemCommand;
