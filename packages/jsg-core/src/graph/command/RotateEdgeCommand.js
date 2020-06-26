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
const { writeJSON } = require('./utils');
const Point = require('../../geometry/Point');
const InternalRotateItemCommand = require('./InternalRotateItemCommand');

/**
 * Command to rotate an edge.
 *
 * @example
 *     // interactionhandler and item given
 *     // Assigning a rotation around the center of an item.
 *     var cmd = new RotateEdgeCommand(edge, Math.PI / 4, item.getBoundingBox().getCenter());
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class RotateEdgeCommand
 * @extends InternalRotateItemCommand
 * @constructor
 * @param {GraphItem} edge The edge to rotate.
 * @param {Number} angle The rotation Angle in radians.
 * @param {Point} [point] An optional rotation point.
 */
class RotateEdgeCommand extends InternalRotateItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const newpt = new Point(data.point.x, data.point.y);
		return item
			? new RotateEdgeCommand(item, data.angle, newpt).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(edge, angle, point) {
		super(edge, angle, point);

		// preserve current points:
		this._edgepoints = edge.getPoints();
		// preserve size of necessary...
		this._size = edge.getSize();
		if (
			this._size.getWidth().hasFormula() ||
			this._size.getHeight().hasFormula()
		) {
			this._size = this._size.copy();
		} else {
			this._size = undefined;
		}
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
		// we might have to set size formula again...
		if (this._size) {
			this._graphItem.setSizeTo(this._size);
			this._graphItem.getSize().evaluate(this._graphItem);
		}
	}

	toObject() {
		const data = super.toObject();
		data.edgepoints = this._edgepoints;
		data.size = this._size ? writeJSON('oldsize', this._size) : undefined;
		return data;
	}
}

module.exports = RotateEdgeCommand;
