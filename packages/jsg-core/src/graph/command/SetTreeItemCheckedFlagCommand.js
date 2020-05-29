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

module.exports = class SetTreeItemCheckedFlagCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeItemCheckedFlagCommand(
					item,
					data.level,
					data.checked
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, checked) {
		super(model);

		this._checked = checked;
		this._level = level;
	}

	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.checked = this._checked;
		return data;
	}

	undo() {}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		item.checked = this._checked;

		this._graphItem.sendCustomUpdate(item);
		this._graphItem.getGraph().markDirty();
	}
};
