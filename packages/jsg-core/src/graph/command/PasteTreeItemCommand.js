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
const TreeItem = require('../model/TreeItem');

/**
 * @class PasteTreeItemCommand
 * @type {module.PasteTreeItemCommand}
 */
module.exports = class PasteTreeItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new PasteTreeItemCommand(
					item,
					data.level,
					data.data
			  ).initWithObject(data)
			: undefined;
	}

	constructor(model, level, data) {
		super(model);

		this._level = level;
		this._data = data;
	}
	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.level = this._level;
		data.data = this._data;
		return data;
	}

	undo() {
		// TODO
		this._graphItem.getGraph().markDirty();
	}

	redo() {
		let targetLevel = -1;
		let depthTarget = 0;
		let depthData = 0;
		const model = this._graphItem.getJsonTree();

		if (this._level !== -1) {
			const selectedItem = model[this._level];

			if (selectedItem) {
				const item = this._graphItem.getPastePosition(selectedItem);
				if (item) {
					targetLevel = item.level;
					depthTarget = item.depth;
				}
			}
		}

		this._index = targetLevel;

		if (this._data.length) {
			depthData = this._data[0].depth;
		}

		const items = [];

		this._data.forEach((item) => {
			const itemCopy = new TreeItem(
				undefined,
				item.key,
				item.value,
				item.depth + depthTarget - depthData,
				item.expanded
			);

			itemCopy.type = item.type;
			itemCopy.parent = -1;

			if (this._index === -1) {
				model.push(itemCopy);
			} else {
				Arrays.insertAt(model, targetLevel, itemCopy);
				targetLevel += 1;
			}
			items.push({
				source: item,
				target: itemCopy
			});
		});

		this._graphItem.updateLevels();
		this._graphItem.sendCustomPaste(items);
		this._graphItem.getGraph().markDirty();
	}

	doAfterRedo() {}

	doAfterUndo() {}
};
