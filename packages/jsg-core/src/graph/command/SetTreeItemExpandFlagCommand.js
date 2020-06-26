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
module.exports = class SetTreeItemExpandFlagCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeItemExpandFlagCommand(
					item,
					data.level,
					data.expand
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, expand) {
		super(model);

		this._level = level;
		this._expand = expand;
	}

	toObject() {
		const data = super.toObject();
		data.expand = this._expand;
		data.level = this._level;
		return data;
	}

	undo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		item.expanded = this._old;

		this._graphItem.getGraph().markDirty();
		this._graphItem.updateLevels();
	}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		// do not auto extend tree any more
		this._graphItem._currentExpandToDepth = undefined;

		this._old = item.expand;
		item.expanded = this._expand;

		this._graphItem.updateLevels();
		this._graphItem.getGraph().markDirty();
	}
};
