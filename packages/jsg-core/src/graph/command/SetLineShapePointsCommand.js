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
 * Command to replace the points of a line. The BoundingBox is not automatically
 * recalculated.
 *
 * @example
 *     // interactionhandler and item given
 *     // insert 2 new points at index 2
 *     var points = [];
 *     points.push(new Point(0, 0));
 *     points.push(new Point(500, 500));
 *     var cmd = new SetLineShapePointsCommand(item, points);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetLineShapePointsCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Line to replace points in.
 * @param {Point[]} newpoints Array of new points specified in parent coordinate system
 */
class SetLineShapePointsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const line = graph.getItemById(data.itemId);
		return line
			? new SetLineShapePointsCommand(line, []).initWithObject(data)
			: undefined;
	}

	constructor(item, newpoints) {
		// TODO RENAME!! ITs VERY CONFUSING TO MENTION SHAPE!! WE SET LINE POINTS AND EXPECT NEWPOINTS RELATIVE TO LINE
		// PARENT!!
		super(item);

		function copy(points) {
			const pts = [];
			points.forEach((point) => {
				pts.push(point.copy());
			});
			return pts;
		}

		function copyToParent(points) {
			const ptCopy = [];
			points.forEach((point) => {
				ptCopy.push(item.translateToParent(point.copy()));
			});
			return ptCopy;
		}

		this._newpoints = copy(newpoints);
		this._oldpoints = copyToParent(item._shape.getPoints());
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._newpoints = data.newpoints.map(
			(point) => new Point(point.x, point.y)
		);
		cmd._oldpoints = data.oldpoints.map(
			(point) => new Point(point.x, point.y)
		);
		return cmd;
	}
	toObject() {
		const data = super.toObject();
		data.newpoints = this._newpoints;
		data.oldpoints = this._oldpoints;
		return data;
	}

	/**
	 * Undo the line point replacement.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setPoints(this._oldpoints);
	}

	/**
	 * Redo the line point replacement.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.setPoints(this._newpoints);
	}
}

module.exports = SetLineShapePointsCommand;
