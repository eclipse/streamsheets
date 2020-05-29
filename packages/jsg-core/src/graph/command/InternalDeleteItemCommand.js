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
const ContentNode = require('../model/ContentNode');
const Group = require('../model/Group');
const {
	readGraphItem,
	readGroupUndoInfo,
	readObject,
	writeGraphItem,
	writeGroupUndoInfo,
	writeJSON
} = require('./utils');

/**
 * Command to to delete an item and remove it from its parent.
 *
 * @example
 *     // interactionhandler and item given
 *     var cmd = new InternalDeleteItemCommand(graphItem);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class InternalDeleteItemCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} graphItem GraphItem to be deleted.
 */
class InternalDeleteItemCommand extends AbstractItemCommand {
	static createFromObject(data = {}, context) {
		const { graph } = context;
		const item =
			graph.getItemById(data.itemId) || readGraphItem(data.itemJson);
		return item
			? new InternalDeleteItemCommand(item).initWithObject(data, context)
			: undefined;
	}

	constructor(graphItem) {
		super(graphItem);

		this._parent = graphItem._parent;
		if (this._parent) this._index = this._graphItem.getIndex();
		if (this._parent instanceof Group) {
			this._info = this._parent.saveUndoInfo();
		}
	}

	initWithObject(data, { graph }) {
		const cmd = super.initWithObject(data);
		cmd._index = data.index;
		cmd._parent = graph.getItemById(data.parentId);
		if (data.info) cmd._info = readGroupUndoInfo(data.info);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.index = this._index;
		if (this._parent) {
			if (
				this._parent._parent &&
				this._parent._parent instanceof ContentNode
			) {
				data.parentId = this._parent._parent.getId();
			} else {
				data.parentId = this._parent.getId();
			}
		}
		data.itemJson = writeGraphItem(this._graphItem);
		if (this._info) data.info = writeGroupUndoInfo(this._info);
		return data;
	}

	/**
	 * Undo the delete operation by adding it to the parent.
	 *
	 * @method undo
	 */
	undo() {
		if (this._parent) {
			this._parent.addItem(this._graphItem, this._index);
			if (this._info) {
				this._parent.restoreUndoInfo(this._info);
			}
		}
	}

	/**
	 * Redo a previously undone operation by adding it again.
	 *
	 * @method redo
	 */
	redo() {
		if (this._parent) {
			const attributes = this._graphItem.getItemAttributes();
			if (attributes.getSelected().getValue() === true) {
				attributes.setSelected(false);
			}
			// to ensure that contentnode is informed
			if (
				this._parent._parent &&
				this._parent._parent instanceof ContentNode
			) {
				this._parent._parent.removeItem(this._graphItem);
			} else {
				this._parent.removeItem(this._graphItem);
			}
		}
	}
}

module.exports = InternalDeleteItemCommand;
