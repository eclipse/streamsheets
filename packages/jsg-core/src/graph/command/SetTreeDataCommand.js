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
 * Assign an object to the TreeItemsNode
 *
 * @class SetTreeDataCommand
 * @type {module.SetTreeDataCommand}
 */
module.exports = class SetTreeDataCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetTreeDataCommand(item, data.data).initWithObject(data)
			: undefined;
	}
	constructor(model, data) {
		super(model);

		this._data = data;
		this._oldData = model.getJsonTree();
	}
	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldData = data.oldData;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.data = this._data;
		data.oldData = this._oldData;
		return data;
	}

	undo() {
		this._graphItem.setJsonTree(this._oldData);
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		this._graphItem.setTree(this._data);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
