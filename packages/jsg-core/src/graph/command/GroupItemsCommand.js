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
const AbstractGroupUngroupCommand = require('./AbstractGroupUngroupCommand');
const Arrays = require('../../commons/Arrays');

/**
 * Command to group the selected items in one group by adding them as subitems to a new created item.
 * The items will automatically resize with the group item by using formulas.
 *
 * @example
 *     // interactionhandler given
 *     var cmd = new GroupItemsCommand(interactionHandler.viewer.getSelection());
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class GroupItemsCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem[]} items Array of
 *     GraphItemControllers (deprecated) or GraphItems to group.
 * @param {Object} [creator] An optional object to create and initialize a new group item. If not provided the
 * {{#crossLink "GroupCreator"}}{{/crossLink}} object will be used.
 */
class GroupItemsCommand extends AbstractGroupUngroupCommand {
	constructor(selection, creator) {
		super(creator);

		this._group = undefined;
		this._items = this.getItemsFromSelection(selection);
	}

	restoreStateAfterUndo(viewer) {
		// select items
		this.selectAll(this._items, viewer);
	}

	restoreStateAfterRedo(viewer) {
		if (this._group !== undefined) {
			// select group
			this.selectAll(this._group, viewer);
		}
	}

	doAfterUndo(selection /* , viewer */) {
		// select items
		Arrays.addAll(selection, this._items);
	}

	doAfterRedo(selection /* , viewer */) {
		if (this._group !== undefined) {
			// select group
			selection.push(this._group);
		}
	}

	/**
	 * Execute grouping.
	 *
	 * @method execute
	 */
	execute() {
		this.saveBBoxes(this._items);
		this._group = this.newGroup();
		this.redo();
	}

	/**
	 * Undo the group operation.
	 *
	 * @method undo
	 */
	undo() {
		this.ungroup(this._group);
		this.restoreBBoxes(this._items);
	}

	/**
	 * Redo the group operation.
	 *
	 * @method redo
	 */
	redo() {
		this.group(this._items, this._group);
		// to restore id from during sync
		if (this._groupId) {
			this._group.setId(this._groupId);
		}
	}

	toObject() {
		const data = super.toObject();

		data.groupId = this._group.getId();
		data.items = [];

		this._items.forEach((item) => {
			data.items.push(item.getId());
		});

		data.creator = this._creator.constructor.name;

		return data;
	}
}

module.exports = GroupItemsCommand;
