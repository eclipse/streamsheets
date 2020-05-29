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
const {
	readGraphItem,
	readGroupUndoInfo,
	readObject,
	writeGroupUndoInfo,
	writeJSON
} = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const BoundingBox = require('../../geometry/BoundingBox');
const Pin = require('../Pin');
const Size = require('../Size');
const NumberExpression = require('../expr/NumberExpression');
const Group = require('../model/Group');

/**
 * Command to resize an object or set a new bounding box.
 *
 * @example
 *
 *     // interactionhandler and item given
 *     // resizing an item to assign a vertical and horizontal size of 2 cm, while keeping the position.
 *     var box = new BoundingBox(2000, 2000);
 *     var origin = item.getOrigin();
 *     box.setTopLeft(origin);
 *     var cmd = new InternalResizeItemCommand(item, box);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class InternalResizeItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem or line to change.
 * @param {BoundingBox} bbox New item dimensions.
 */
class InternalResizeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = readGraphItem(data.json);
		const newbox = readObject('newbox', data.newbox, new BoundingBox());
		return item
			? new InternalResizeItemCommand(item, newbox).initWithObject(data)
			: undefined;
	}

	constructor(item, bbox) {
		super(item);

		// the old bbox consists of:
		this._oldPin = item.getPin().copy();
		this._oldSize = item.getSize(true).copy();
		this._oldAngleExpr = item.getAngle().copy();
		this._newbbox = bbox.copy();

		if (item.getParent() instanceof Group) {
			this._info = item.getParent().saveUndoInfo();
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldPin = readObject(
			'oldpin',
			data.oldPin,
			new Pin(cmd._graphItem)
		);
		cmd._oldSize = readObject('oldsize', data.oldSize, new Size());
		cmd._oldAngleExpr = readObject(
			'oldangle',
			data.oldAngle,
			new NumberExpression()
		);
		if (data.info) cmd._info = readGroupUndoInfo(data.info);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.tl = this._newbbox._topleft;
		data.br = this._newbbox._bottomright;
		if (this._newbbox._rotmatrix.hasRotation()) {
			data.rot = this._newbbox._rotmatrix.toString();
		}
		data.newbox = writeJSON('newbox', this._newbbox);
		data.oldPin = writeJSON('oldpin', this._oldPin);
		data.oldSize = writeJSON('oldsize', this._oldSize);
		data.oldAngle = writeJSON('oldangle', this._oldAngleExpr);
		if (this._info) data.info = writeGroupUndoInfo(this._info);
		return data;
	}

	/**
	 * Undo the resize operation.
	 *
	 * @method undo
	 */
	undo() {
		if (this._info) {
			this._graphItem.getParent().restoreUndoInfo(this._info);
		} else if (this._graphItem.isSizeable()) {
			this._graphItem.getPin().setTo(this._oldPin);
			this._graphItem.setSizeTo(this._oldSize);
			this._graphItem.setAngle(this._oldAngleExpr);
			this._graphItem.evaluate();
		}
	}

	/**
	 * Redo the resize operation.
	 *
	 * @method redo
	 */
	redo() {
		if (this._graphItem.isSizeable()) {
			this._graphItem.setBoundingBoxTo(this._newbbox);
		}
	}
}

module.exports = InternalResizeItemCommand;
