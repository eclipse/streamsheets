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
 * @class SetTreeItemShowDepthCommand
 * @type {module.SetTreeShowDepthCommand}
 */
module.exports = class SetTreeItemShowDepthCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeItemShowDepthCommand(
					item,
					data.level,
					data.depth
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, depth) {
		super(model);

		this._level = level;
		this._depth = depth;
		// mark as volatile since we do no undo...
		this.isVolatile = true;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.depth = this._depth;
		data.level = this._level;
		return data;
	}

	undo() {
		// TODO
	}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		const model = this._graphItem.getJsonTree();
		let i;
		let subItem;

		if (item.expanded !== null) {
			item.expanded = true;
		}

		for (i = this._level + 1; i < model.length; i += 1) {
			subItem = model[i];
			if (subItem.depth === item.depth) {
				break;
			}
			if (subItem.depth < item.depth + this._depth) {
				if (subItem.expanded !== null) {
					subItem.expanded = true;
				}
			}
		}

		this._graphItem._currentExpandToDepth = undefined;
		this._graphItem.updateLevels();
		this._graphItem.getGraph().markDirty();
	}
};
