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
const Point = require('../../geometry/Point');
const InternalMoveItemCommand = require('./InternalMoveItemCommand');

/**
 * Command to move an Edge to a new location.
 *
 * @example
 *     // InteractionHandler and Edge given
 *     // move edge to (1cm, 1cm)
 *     var cmd = new MoveEdgeCommand(item, new Point(1000, 1000));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class MoveEdgeCommand
 * @extends InternalMoveItemCommand
 * @constructor
 * @param {Edge} edge The edge to be moved.
 * @param {Point} newPinPoint The new Pin location relative to its parent.
 */
class MoveEdgeCommand extends InternalMoveItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new MoveEdgeCommand(
					item,
					new Point(data.pin.x, data.pin.y)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(edge, newPinPoint) {
		super(edge, newPinPoint);
		// preserve current points:
		this._edgepoints = edge.getPoints();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._edgepoints = data.edgepoints.map(
			(point) => new Point(point.x, point.y)
		);
		return cmd;
	}

	undo() {
		super.undo();
		// set old edge points again...
		this._graphItem.setPoints(this._edgepoints);
	}

	toObject() {
		const data = super.toObject();
		data.edgepoints = this._edgepoints;
		return data;
	}
}

module.exports = MoveEdgeCommand;
