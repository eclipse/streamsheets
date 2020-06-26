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
const Arrays = require('../../commons/Arrays');

/**
 * @class DeleteTreeItemCommand
 * @type {module.DeleteTreeItemCommand}
 */
module.exports = class DeleteTreeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new DeleteTreeItemCommand(item, data.level).initWithObject(data)
			: undefined;
	}

	constructor(model, level) {
		super(model);
		this._level = level;
		if (level !== -1) {
			const item = this._graphItem.getTreeItemAt(this._level);
			if (item === undefined) {
				return;
			}

			this._itemCount = model.getSubTreeForItem(item).length;
		}
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldItems = data.oldItems;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.oldItems = this._oldItems;
		return data;
	}

	undo() {
		const model = this._graphItem.getJsonTree();
		if (this._level === -1) {
			this._graphItem.setJsonTree(this._oldItems);
		} else {
			Arrays.insertAt(model, this._level, this._oldItems);
		}
		this._graphItem.updateLevels();
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		const model = this._graphItem.getJsonTree();
		if (this._level === -1) {
			this._oldItems = model;
			this._graphItem.setJson('{}');
		} else {
			this._oldItems = model.splice(this._level, this._itemCount + 1);
		}
		this._graphItem.updateLevels();
		this._graphItem.sendCustomDelete(this._oldItems);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
