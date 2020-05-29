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
 * @class SetTreeItemDepthCommand
 * @type {module.SetTreeItemDepthCommand}
 */
module.exports = class SetTreeItemDepthCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeItemDepthCommand(
					item,
					data.level,
					data.up
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, up) {
		super(model);

		this._level = level;
		this._up = up;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.up = this._up;
		data.level = this._level;
		return data;
	}

	undo() {
		this._graphItem.getGraph().markDirty();
		this._graphItem.updateLevels();
	}

	redo() {
		const model = this._graphItem.getJsonTree();
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		if (this._up) {
			if (item.depth === 0) {
				return;
			}

			this._graphItem.changeSubTreeDepth(item, -1);

			// change parent depth after children to be able to identify children
			item.depth -= 1;
		} else {
			if (this._level === 0) {
				return;
			}

			if (model[this._level - 1].depth < item.depth) {
				return;
			}
			this._graphItem.changeSubTreeDepth(item, 1);

			// change parent depth after children to be able to identify children
			item.depth += 1;
		}

		this._graphItem.updateLevels();
		this._graphItem.sendCustomUpdate(item);
		this._graphItem.getGraph().markDirty();
	}
};
