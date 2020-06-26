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

/**
 * @class SetTreeItemExpandFlagCommand
 * @type {module.SetTreeItemExpandFlagCommand}
 */
module.exports = class SetTreeItemDisabledCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeItemDisabledCommand(
					item,
					data.level,
					data.disabled
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, disabled) {
		super(model);

		this._level = level;
		this._disabled = disabled;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._old = data.oldDisabled;
		return cmd;
	}
	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.disabled = this._disabled;
		data.oldDisabled = this._old;
		return data;
	}

	undo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		item.disabled = this._old;

		this._graphItem.getGraph().markDirty();
		this._graphItem.updateLevels();
	}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		this._old = item.disabled;
		item.disabled = this._disabled;

		this._graphItem.getGraph().markDirty();
	}
};
