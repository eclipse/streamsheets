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
const { readObject, readShape, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Coordinate = require('../Coordinate');
const Edge = require('../model/Edge');

/**
 * Command to assign a new shape to an item.
 *
 * @example
 *     // interactionhandler and item given
 *     // Assigning a new EllipseShape to a GraphItem
 *     var cmd = new SetShapeCommand(item, new EllipseShape());
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetShapeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Item to assign shape to.
 * @param {Shape} newShape Shape to assign.
 */
class SetShapeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const newshape = readShape(data.newShape);
		return item
			? new SetShapeCommand(item, newshape).initWithObject(data)
			: undefined;
	}

	constructor(item, newShape) {
		super(item);
		this._oldShape = item._shape;
		this._newShape = newShape;
		// preserve old coordinates and in particular start & end coordinates...
		if (item instanceof Edge) {
			this._oldcoords = [];
			for (
				let i = 0, n = this._oldShape.getCoordinatesCount();
				i < n;
				i += 1
			) {
				this._oldcoords.push(this._oldShape.getCoordinateAt(i).copy());
			}
			this.endcoord = item.hasTargetAttached()
				? item.getEndCoordinate()
				: undefined;
			this.startcoord = item.hasSourceAttached()
				? item.getStartCoordinate()
				: undefined;
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldShape = readShape(data.oldShape);
		if (data.oldcoords) {
			cmd._oldcoords = data.oldcoords.map((coord) =>
				readObject('coord', coord, new Coordinate())
			);
		}
		if (data.endcoord)
			cmd.endcoord = readObject(
				'endcoord',
				data.endcoord,
				new Coordinate()
			);
		if (data.startcoord)
			cmd.startcoord = readObject(
				'startcoord',
				data.startcoord,
				new Coordinate()
			);
		return cmd;
	}
	toObject() {
		const data = super.toObject();
		data.newShape = writeJSON('shape', this._newShape);
		data.oldShape = writeJSON('shape', this._oldShape);
		if (this._oldcoords)
			data.oldcoords = this._oldcoords.map((coord) =>
				writeJSON('coord', coord)
			);
		if (this.endcoord) data.endcoord = writeJSON('endcoord', this.endcoord);
		if (this.startcoord)
			data.endcoord = writeJSON('startcoord', this.startcoord);
		return data;
	}

	/**
	 * Undo the shape assignment
	 *
	 * @method undo
	 */
	undo() {
		if (this._oldcoords) {
			this._oldShape.setCoordinates(this._oldcoords);
		}
		this.setAttachedCoordinates(this._oldShape);
		this._graphItem.setShapeTo(this._oldShape);
	}

	/**
	 * Redo the shape assignment
	 *
	 * @method redo
	 */
	redo() {
		this.setAttachedCoordinates(this._newShape);
		this._graphItem.setShapeTo(this._newShape);
	}

	setAttachedCoordinates(shape) {
		if (this.startcoord) {
			if (shape.getCoordinatesCount() < 1) {
				shape.addCoordinate(this.startcoord);
			} else {
				shape.setStartCoordinateTo(this.startcoord);
			}
		}
		if (this.endcoord) {
			if (shape.getCoordinatesCount() < 2) {
				shape.addCoordinate(this.endcoord);
			} else {
				shape.setEndCoordinateTo(this.endcoord);
			}
		}
	}
}

module.exports = SetShapeCommand;
