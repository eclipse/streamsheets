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
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Size = require('../Size');

/**
 * Command to set the Size of a GraphItem.
 *
 * @class SetSizeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to set the Size of.
 * @param {Size} newSize The new Size.
 */
class SetSizeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetSizeCommand(
					item,
					new Size(data.size.x, data.size.y)
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, newSize) {
		super(item);
		this._oldSize = item.getSize().copy();
		this._newSize = newSize.copy();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldSize = readObject('oldsize', data.oldSize, new Size());
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.size = this._newSize.toPoint();
		data.oldSize = writeJSON('oldsize', this._oldSize);
		return data;
	}

	undo() {
		// restore old pin:
		this._graphItem.setSizeTo(this._oldSize);
		this._graphItem.getSize().evaluate(this._graphItem);
	}

	redo() {
		this._graphItem.setSizeTo(this._newSize);
		this._graphItem.getSize().evaluate(this._graphItem);
	}
}

module.exports = SetSizeCommand;
