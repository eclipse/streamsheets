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
const TreeItemsNode = require('../model/TreeItemsNode');
const Numbers = require('../../commons/Numbers');

/**
 * @class SetTreeItemDataCommand
 * @type {module.SetTreeItemDataCommand}
 */
module.exports = class SetTreeItemDataCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			cmd = new SetTreeItemDataCommand(
				item,
				data.level,
				data.oldText,
				data.newText,
				data.isKeyEditing
			).initWithObject(data);
		}
		return cmd;
	}
	constructor(model, level, oldText, newText, key) {
		super(model);

		this._level = level;
		this._oldText = oldText;
		this._newText = newText;
		this._isKeyEditing = key;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.oldText = this._oldText;
		data.newText = this._newText;
		data.isKeyEditing = this._isKeyEditing;
		return data;
	}

	undo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		if (this._oldText) {
			if (this._isKeyEditing) {
				item.key = this._oldText;
			} else {
				item.value = this._oldText;
			}
		}
		this._graphItem.getGraph().markDirty();
		this._graphItem.updateLevels();
	}

	redo() {
		const item = this._graphItem.getTreeItemAt(this._level);
		if (item === undefined) {
			return;
		}

		if (this._newText !== undefined) {
			if (this._isKeyEditing) {
				item.key = this._newText;
			} else {
				if (this._newText.length) {
					if (this._newText[0] === '"') {
						item.type = TreeItemsNode.DataType.STRING;
					} else if (Numbers.canBeNumber(this._newText)) {
						item.type = TreeItemsNode.DataType.NUMBER;
						item.value = parseFloat(this._newText);
					} else if (
						this._newText === 'true' ||
						this._newText === 'false'
					) {
						item.type = TreeItemsNode.DataType.BOOLEAN;
						item.value = this._newText === 'true';
					} else {
						item.type = TreeItemsNode.DataType.STRING;
					}
				}

				item.value = this._newText;
			}
		}
		this._graphItem.updateLevels();
		this._graphItem.sendCustomUpdate(item);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
