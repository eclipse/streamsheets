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
const AbstractItemCommand = require('./AbstractItemCommand');
const NumberExpression = require('../expr/NumberExpression');
const Size = require('../Size');

/**
 * This command is used to change the size mode of a given text node.
 *
 * @class SetTextSizeModeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {TextNode} textnode The text node which text should be set.
 * @param {BooleanExpression | TextNodeAttributes.SizeMode} sizemode The new size mode.
 */
class SetTextSizeModeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTextSizeModeCommand(item, data.sizeMode).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(textnode, sizemode) {
		super(textnode);

		this._oldsize = textnode.getSize().copy();
		this._oldsizemode = textnode
			.getItemAttributes()
			.getSizeMode()
			.getExpression()
			.copy();
		this._newsizemode = sizemode;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldsize = readObject('size', data.oldsize, new Size());
		cmd._oldsizemode = readObject(
			'sizemode',
			data.oldsizemode,
			new NumberExpression()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.sizeMode = this._newsizemode;
		data.oldsize = writeJSON('size', this._oldsize);
		data.oldsizemode = writeJSON('sizemode', this._oldsizemode);
		return data;
	}

	undo() {
		this._graphItem.getItemAttributes().setSizeMode(this._oldsizemode);
		this._graphItem.setSizeTo(this._oldsize);
	}

	redo() {
		this._graphItem.getItemAttributes().setSizeMode(this._newsizemode);
	}
}

module.exports = SetTextSizeModeCommand;
