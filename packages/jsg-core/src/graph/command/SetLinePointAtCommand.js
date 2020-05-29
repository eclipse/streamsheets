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
 * Command to insert a point into a polyline or polygon.
 *
 * @example
 *     // interactionhandler and item given
 *     var cmd = new SetLinePointAtCommand(item, 2, new Point(300, 300));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetLinePointAtCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {Number} index Index, where the point shall be inserted.
 * @param {Point} point New point in parent coordinate system.
 */
class SetLinePointAtCommand extends AbstractItemCommand {
	static createFromObject(data = {}, context) {
		let cmd;
		const item = context.graph.getItemById(data.itemId);
		if (item) {
			const point = new Point(data.point.x, data.point.y);
			cmd = new SetLinePointAtCommand(
				item,
				data.index,
				point
			).initWithObject(data);
			if (data.oldPoint)
				cmd._oldPoint = new Point(data.oldPoint.x, data.oldPoint.y);
		}
		return cmd;
	}

	constructor(item, index, point) {
		super(item);

		this._index = index;
		this._newpoint = point.copy();
		this._oldpoint = undefined;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.point = this._newpoint;
		if (this._oldpoint) data.oldPoint = this._oldpoint;
		return data;
	}
	/**
	 * Execute the point change.
	 *
	 * @method execute
	 */
	execute() {
		this._oldpoint = this._graphItem.getPointAt(this._index);
		this.redo();
	}

	/**
	 * Undo the point change.
	 *
	 * @method undo
	 */
	undo() {
		if (this._oldpoint !== undefined) {
			this._graphItem.setPointAt(this._index, this._oldpoint.copy());
		}
	}

	/**
	 * Redo the point change.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.setPointAt(this._index, this._newpoint.copy());
	}
}

module.exports = SetLinePointAtCommand;
