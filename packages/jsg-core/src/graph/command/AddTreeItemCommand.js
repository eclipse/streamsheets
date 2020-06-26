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
 * @class AddTreeItemCommand
 * @type {module.AddTreeItemCommand}
 */
module.exports = class AddTreeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new AddTreeItemCommand(
					item,
					data.index,
					data.newItem
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, index, newItem) {
		super(model);

		this._index = index;
		this._newItem = newItem;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.newItem = this._newItem;
		return data;
	}

	undo() {
		const model = this._graphItem.getJsonTree();

		Arrays.removeAt(model, this._index);
		this._graphItem.updateLevels();

		this._graphItem.getGraph().markDirty();
	}

	redo() {
		const model = this._graphItem.getJsonTree();

		if (this._index === -1) {
			model.push(this._newItem);
			this._index = model.length - 1;
		} else {
			Arrays.insertAt(model, this._index, this._newItem);
		}
		this._graphItem.updateLevels();
		this._graphItem.sendCustomAdd(this._newItem);

		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
