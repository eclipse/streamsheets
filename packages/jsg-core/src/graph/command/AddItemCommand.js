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
const { readGraphItem, writeGraphItem } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * This command adds a GraphItem to another GraphItem, if the command gets executed.
 *
 * @example
 *     // parent can be the Graph or another GraphItem.
 *     var newItem = new GraphItem(new RectangleShape());
 *     var cmd = new AddItemCommand(newItem, parent);
 *     interactionHandler.execute(cmd);
 *
 * @class AddItemCommand
 * @extends AbstractGroupUngroupCommand
 * @param {GraphItem} newItem GraphItem to be added.
 * @param  {GraphItem} parent GraphItem to add this newItem as a sub item to.
 * @param  {Number} [index] Optional. Target position in list of item to be added (optional). Default value is
 *     undefined, which will add the item to the end of the list.
 * @constructor
 */
class AddItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const parent = graph.getItemById(data.parentId) || graph;
		const item = graph.getItemById(data.itemId) || readGraphItem(data.json);
		return item
			? new AddItemCommand(item, parent, data.index).initWithObject(data)
			: undefined;
	}

	constructor(newItem, parent, index) {
		super(newItem);

		this._index = index;
		this._parent = parent;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		data.parentId = this._parent.getId();
		data.json = writeGraphItem(this._graphItem);
		return data;
	}

	/**
	 * Undo the operation. Here the previously added GraphItem will be removed again.
	 *
	 * @method undo
	 */
	undo() {
		// use current parent, because it could have changed and not necessarily with commands...
		const parent = this._graphItem.getParent() || this._parent;
		if (parent) parent.removeItem(this._graphItem);
	}

	/**
	 * Redo an undone operation. Here the GraphItem will be inserted again.
	 *
	 * @method redo
	 */
	redo() {
		this._parent.addItem(this._graphItem, this._index);
	}
}

module.exports = AddItemCommand;
