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
const Coordinate = require('../Coordinate');
const { readObject, writeJSON } = require('./utils');

/**
 * Command to insert a point into a polyline or polygon.
 *
 * @example
 *     // interactionhandler and item given
 *     var cmd = new SetLineCoordinateAtCommand(item, 2, new Point(300, 300));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetLineCoordinateAtCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {Number} index Index, where the point shall be inserted.
 * @param {Coordinate} coordinate New coordinate.
 */
class SetLineCoordinateAtCommand extends AbstractItemCommand {
	static createFromObject(data = {}, context) {
		let cmd;
		const item = context.graph.getItemById(data.itemId);
		if (item) {
			cmd = new SetLineCoordinateAtCommand(
				item,
				data.index,
				readObject('coor', data.newCoor, new Coordinate())
			).initWithObject(data);
			if (data.oldCoor)
				cmd._oldCoor = readObject('coor', data.oldCoor, new Coordinate());
		}
		return cmd;
	}

	constructor(item, index, coordinate) {
		super(item);

		this._index = index;
		this._newCoor = coordinate.copy();
		this._oldCoor = undefined;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.newCoor = writeJSON('coor', this._newCoor);
		if (this._oldCoor) data.oldCoor = writeJSON('coor', this._oldCoor);
		return data;
	}
	/**
	 * Execute the point change.
	 *
	 * @method execute
	 */
	execute() {
		this._oldCoor = this._graphItem.getShape().getCoordinateAt(this._index);
		this.redo();
	}

	/**
	 * Undo the point change.
	 *
	 * @method undo
	 */
	undo() {
		if (this._oldCoor !== undefined) {
			this._graphItem.getShape().setCoordinateAtTo(this._index, this._oldCoor);
		}
	}

	/**
	 * Redo the point change.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.getShape().setCoordinateAtTo(this._index, this._newCoor);
	}
}

module.exports = SetLineCoordinateAtCommand;
