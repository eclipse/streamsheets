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
const InternalRotateItemCommand = require('./InternalRotateItemCommand');
const ShapePointsMap = require('./ShapePointsMap');

/**
 * Command to rotate a node.
 *
 * @example
 *     // interactionhandler and item given
 *     // Assigning a rotation around the center of an item.
 *     var cmd = new RotateNodeCommand(item, Math.PI / 4, item.getBoundingBox().getCenter());
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class RotateNodeCommand
 * @extends InternalRotateItemCommand
 * @constructor
 * @param {GraphItem} node The node to rotate..
 * @param {Number} angle The rotation angle in radians.
 * @param {Point} [point] An optional rotation point.
 */
class RotateNodeCommand extends InternalRotateItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const newpt = data.point
			? new Point(data.point.x, data.point.y)
			: undefined;
		return item
			? new RotateNodeCommand(item, data.angle, newpt).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(node, angle, point) {
		super(node, angle, point);

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
		// rotate back
		super.undo();

		// set old points again:
		const ports = this._graphItem.getPorts();
		ports.forEach((port) => {
			this._pointsMap.restore(port.getIncomingEdges());
			this._pointsMap.restore(port.getOutgoingEdges());
		});
	}
}

module.exports = RotateNodeCommand;
