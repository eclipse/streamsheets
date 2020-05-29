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
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Pin = require('../Pin');

/**
 * Command to set the Pin of a GraphItem.
 *
 * @class SetPinCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to set the Pin of.
 * @param {Pin|Point} newPin The new Pin or pin-point.
 */
class SetPinCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetPinCommand(
					item,
					new Point(data.pin.x, data.pin.y)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, newPin) {
		super(item);

		this._oldPin = item.getPin().copy();
		this._newPin = newPin.copy();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldPin = readObject(
			'oldpin',
			data.oldPin,
			new Pin(cmd._graphItem)
		);
		return cmd;
	}
	toObject() {
		const data = super.toObject();
		data.pin = this._newPin.getPoint();
		data.oldPin = writeJSON('oldpin', this._oldPin);
		return data;
	}

	undo() {
		// restore old pin:
		this._graphItem.getPin().setTo(this._oldPin);
		this._graphItem.getPin().evaluate(this._graphItem);
	}

	redo() {
		if (this._newPin instanceof Point) {
			this._graphItem.getPin().setPointTo(this._newPin);
		} else {
			this._graphItem.getPin().setTo(this._newPin);
		}
		this._graphItem.getPin().evaluate(this._graphItem);
	}
}

module.exports = SetPinCommand;
