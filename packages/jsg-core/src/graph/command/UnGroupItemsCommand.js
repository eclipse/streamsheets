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
const JSG = require('../../JSG');
const {
	readObject,
	readGraphItem,
	writeGraphItem,
	writeJSON
} = require('./utils');
const AbstractGroupUngroupCommand = require('./AbstractGroupUngroupCommand');
const Arrays = require('../../commons/Arrays');
const GroupCreator = require('./GroupCreator');
const GroupCreatorSimple = require('./GroupCreator');
const BoundingBox = require('../../geometry/BoundingBox');
const Group = require('../model/Group');

/**
 * Command to ungroup the selected group by adding grouped (sub)items to the parent container again.
 *
 * @example
 *     // interactionhandler and item given
 *     var cmd = new UnGroupItemsCommand(item);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class UnGroupItemsCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Group to ungroup.
 */
class UnGroupItemsCommand extends AbstractGroupUngroupCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new UnGroupItemsCommand(item).initWithObject(data)
			: undefined;
	}

	constructor(item) {
		const creator =
			item instanceof Group
				? new GroupCreator()
				: new GroupCreatorSimple();
		super(creator);

		this._group = item;
		this._groupbox = this._group.getBoundingBox();
		// preserve grouped items for undo...
		this._items = Arrays.addAll([], item.getItems());
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._groupbox = readObject(
			'groupbox',
			data.groupbox,
			new BoundingBox()
		);
		cmd._items = data.groupitems.map((item) => readGraphItem(item));
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.itemId = this._group.getId();
		data.groupbox = writeJSON('groupbox', this._groupbox);
		data.groupitems = this._items.map((item) => writeGraphItem(item));
		return data;
	}

	restoreStateAfterUndo(viewer) {
		this.selectAll(this._group, viewer);
	}

	restoreStateAfterRedo(viewer) {
		this.selectAll(this._items, viewer);
	}

	doAfterRedo(selection) {
		Arrays.addAll(selection, this._items);
	}

	doAfterUndo(selection) {
		selection.push(this._group);
	}

	/**
	 * Execute the ungroup operation.
	 *
	 * @method execute
	 */
	execute() {
		this.redo();
	}

	/**
	 * Undo the ungroup operation.
	 *
	 * @method undo
	 */
	undo() {
		this.group(this._items, this._group);
	}

	// overwritten to return bounding-box of removed group! (might differ from items box, if ungroup was applied to
	// normal node...)
	getGroupBBox(items, reusebox) {
		return reusebox ? reusebox.setTo(this._groupbox) : this._groupbox;
	}

	/**
	 * Redo the ungroup operation.
	 *
	 * @method redo
	 */
	redo() {
		this.ungroup(this._group);
	}
}

module.exports = UnGroupItemsCommand;
