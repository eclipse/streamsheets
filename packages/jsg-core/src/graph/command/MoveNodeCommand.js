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
const InternalMoveItemCommand = require('./InternalMoveItemCommand');
const ShapePointsMap = require('./ShapePointsMap');

/**
 * Command to move a Node to a new location.
 *
 * @example
 *     // InteractionHandler and Node given
 *     // move node to (1cm, 1cm)
 *     var cmd = new MoveNodeCommand(item, new Point(1000, 1000));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class MoveNodeCommand
 * @extends InternalMoveItemCommand
 * @constructor
 * @param {Node} node The node to be moved.
 * @param {Point} newPinPoint The new Pin location relative to its parent.
 */
class MoveNodeCommand extends InternalMoveItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new MoveNodeCommand(
					item,
					new Point(data.pin.x, data.pin.y)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(node, newPinPoint) {
		super(node, newPinPoint);

		const ports = node.getPorts();

		// preserve current points of each attached edge:
		this._pointsMap = new ShapePointsMap();
		ports.forEach((port) => {
			this._pointsMap.store(port.getIncomingEdges());
			this._pointsMap.store(port.getOutgoingEdges());
		});
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._pointsMap.map.setMap(data.pointsMap);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.pointsMap = this._pointsMap.map.getMap();
		return data;
	}

	undo() {
		super.undo();

		// set old points again:
		const ports = this._graphItem.getPorts();

		ports.forEach((port) => {
			this._pointsMap.restore(port.getIncomingEdges());
			this._pointsMap.restore(port.getOutgoingEdges());
		});
	}
}

module.exports = MoveNodeCommand;
