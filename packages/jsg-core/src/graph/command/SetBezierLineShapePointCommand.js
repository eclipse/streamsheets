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
const { readObject, writeJSON } = require('./utils');
const Point = require('../../geometry/Point');
const BezierCoordinate = require('../BezierCoordinate');
const AbstractItemCommand = require('./AbstractItemCommand');
const Coordinate = require('../Coordinate');

/**
 * Command to set a point and its corresponding control points of a <code>LineConnection</code> with a
 * {{#crossLink "BezierLineShape"}}{{/crossLink}} visualization.
 *
 * @class SetBezierLineShapePointCommand
 * @extends AbstractGroupUngroupCommand
 * @param {LineConnection} item <code>LineConnection</code> whose point should be set.
 * @param {Number} index The index of the point to set.
 * @param {Point} [newpt] An optional new line point.
 * @param {Point} [newcpto] An optional new first control point.
 * @param {Point} [newcpfrom] An optional new second control point.
 * @constructor
 * @since 1.6.15
 */
class SetBezierLineShapePointCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const line = graph.getItemById(data.itemId);
		if (line) {
			let point;
			let cpToPoint;
			let cpFromPoint;

			if (data.point) {
				point = new Point(data.point.x, data.point.y);
			}
			if (data.cpToPoint) {
				cpToPoint = new Point(data.cpToPoint.x, data.cpToPoint.y);
			}
			if (data.cpFromPoint) {
				cpFromPoint = new Point(data.cpFromPoint.x, data.cpFromPoint.y);
			}
			cmd = new SetBezierLineShapePointCommand(
				line,
				point,
				cpToPoint,
				cpFromPoint
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, index, newpt, newcpto, newcpfrom) {
		super(item);

		const lineshape = item.getShape();
		this.index = index;
		this.oldCoord = newpt
			? lineshape.getCoordinateAt(index).copy()
			: undefined;
		this.oldCpToCoord = newcpto
			? lineshape.getCpToCoordAt(index).copy()
			: undefined;
		this.oldCpFromCoord = newcpfrom
			? lineshape.getCpFromCoordAt(index).copy()
			: undefined;

		this.newCoord = newpt ? Coordinate.fromPoint(newpt) : undefined;
		this.newCpToCoord = newcpto ? Coordinate.fromPoint(newcpto) : undefined;
		this.newCpFromCoord = newcpfrom
			? Coordinate.fromPoint(newcpfrom)
			: undefined;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		if (data.oldCoord) {
			cmd.oldCoord = readObject(
				'oldcoord',
				data.oldCoord,
				new BezierCoordinate()
			);
		}
		if (data.oldCpToCoord) {
			cmd.oldCpToCoord = readObject(
				'oldcptocoord',
				data.oldCpToCoord,
				BezierCoordinate()
			);
		}
		if (data.oldCpFromCoord) {
			cmd.oldCpFromCoord = readObject(
				'oldcpfromcoord',
				data.oldCpFromCoord,
				new BezierCoordinate()
			);
		}
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.index = this.index;
		if (this.newCoord) data.point = this.newCoord.toPoint();
		if (this.newCpToCoord) data.cpToPoint = this.newCpToCoord.toPoint();
		if (this.newCpFromCoord)
			data.cpFromPoint = this.newCpFromCoord.toPoint();
		// save undo data:
		if (this.oldCoord) data.oldCoord = writeJSON('oldcoord', this.oldCoord);
		if (this.oldCpToCoord)
			data.oldCoord = writeJSON('oldcptocoord', this.oldCpToCoord);
		if (this.oldCpFromCoord)
			data.oldCoord = writeJSON('oldcpfromcoord', this.oldCpFromCoord);
		return data;
	}

	undo() {
		const { index } = this;
		const lineshape = this._lineshape();
		if (this.oldCoord) {
			lineshape.setCoordinateAtTo(index, this.oldCoord);
		}
		if (this.oldCpToCoord) {
			lineshape.setCpToCoordAtTo(index, this.oldCpToCoord);
		}
		if (this.oldCpFromCoord) {
			lineshape.setCpFromCoordAtTo(index, this.oldCpFromCoord);
		}
	}

	redo() {
		const { index } = this;
		const lineshape = this._lineshape();
		if (this.newCoord) {
			lineshape.setCoordinateAtTo(index, this.newCoord);
		}
		if (this.newCpToCoord) {
			lineshape.setCpToCoordAtTo(index, this.newCpToCoord);
		}
		if (this.newCpFromCoord) {
			lineshape.setCpFromCoordAtTo(index, this.newCpFromCoord);
		}
	}

	_lineshape() {
		return this._graphItem.getShape();
	}
}

module.exports = SetBezierLineShapePointCommand;
