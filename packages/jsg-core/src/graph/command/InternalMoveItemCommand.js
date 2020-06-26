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
const Group = require('../model/Group');
const TextNode = require('../model/TextNode');
const {
	readGroupUndoInfo,
	readObject,
	writeGroupUndoInfo,
	writeJSON
} = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Pin = require('../Pin');

/**
 * Command to move a GraphItem to a new location.
 *
 * @example
 *     // interactionhandler and item given
 *     // move item to (1cm, 1cm)
 *     var cmd = new InternalMoveItemCommand(item, new Point(1000, 1000));
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class InternalMoveItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be moved.
 * @param {Point} newPinPoint The new Pin location relative to its parent.
 * @private
 */
class InternalMoveItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new InternalMoveItemCommand(
					item,
					new Point(data.pin.x, data.pin.y)
			  ).initWithObject(data)
			: undefined;
	}
	constructor(item, newPinPoint) {
		super(item);
		// explanation: we work with new-pin instead of translate to ease cmd usage if movement goes from one container
		// into another, ie. new-pin is already adjusted to new container. we save old pin to restore any formula...
		this._oldPin = item.getPin().copy();
		if (item.getParent() instanceof Group) {
			this._info = item.getParent().saveUndoInfo();
		}

		this._newPinPoint = newPinPoint.copy();

		if (this._graphItem instanceof TextNode) {
			this._vPos = item
				.getTextFormat()
				.getVerticalPosition()
				.getValue();
			this._hPos = item
				.getTextFormat()
				.getHorizontalPosition()
				.getValue();
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._hPos = data.hPos;
		cmd._vPos = data.vPos;
		cmd._oldPin = readObject(
			'oldpin',
			data.oldPin,
			new Pin(cmd._graphItem)
		);
		if (data.info) cmd._info = readGroupUndoInfo(data.info);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.pin = this._newPinPoint;
		data.oldPin = writeJSON('oldpin', this._oldPin);
		data.hPos = this._hPos;
		data.vPos = this._vPos;
		if (this._info) data.info = writeGroupUndoInfo(this._info);
		return data;
	}

	undo() {
		if (this._graphItem instanceof TextNode) {
			// first set v/h position to custom!! => because this might raise an event which in turn affects pin!!
			this._graphItem.getTextFormat().setVerticalPosition(this._vPos);
			this._graphItem.getTextFormat().setHorizontalPosition(this._hPos);
		}

		if (this._info) {
			this._graphItem.getParent().restoreUndoInfo(this._info);
		} else {
			// restore old pin:
			this._graphItem.getPin().setTo(this._oldPin);
			this._graphItem.getPin().evaluate(this._graphItem);
		}
	}

	redo() {
		if (this._graphItem instanceof TextNode) {
			// first set v/h position to custom!! => because this might raise an event which in turn affects pin!!
			this._graphItem
				.getTextFormat()
				.setVerticalPosition(
					JSG.TextFormatAttributes.VerticalTextPosition.CUSTOM
				);
			this._graphItem
				.getTextFormat()
				.setHorizontalPosition(
					JSG.TextFormatAttributes.HorizontalTextPosition.CUSTOM
				);
		}
		// set new pin:
		this._graphItem.setPinPointTo(this._newPinPoint);
		this._graphItem.getPin().evaluate(this._graphItem);
	}
}

module.exports = InternalMoveItemCommand;
