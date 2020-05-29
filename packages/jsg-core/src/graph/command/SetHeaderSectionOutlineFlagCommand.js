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

module.exports = class SetHeaderSectionOutlineFlagCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const cmd = new SetHeaderSectionOutlineFlagCommand(
			item,
			data.index,
			data.flag
		).initWithObject(data);
		return cmd;
	}

	constructor(item, index, flag) {
		super(item);

		this._item = item;
		this._index = index;
		this._flag = flag;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.flag = this._flag;
		return data;
	}

	undo() {
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		this._graphItem.setSectionClosed(this._index, this._flag);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
