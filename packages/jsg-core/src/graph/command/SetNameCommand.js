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
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const StringExpression = require('../expr/StringExpression');

/**
 * Command to assign a new name to a GraphItem.
 *
 * @example
 *     // interactionhandler and node given
 *     var cmd = new SetNameCommand(item, 'NewName');
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetNameCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Item to assign name to.
 * @param {StringExpression | String} name New name or name expression to assign.
 */
class SetNameCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetNameCommand(item, data.newName).initWithObject(data)
			: undefined;
	}

	constructor(item, name) {
		super(item);
		this.oldName = item.getName().copy();
		this.newName = name;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd.oldName = readObject(
			'oldname',
			data.oldName,
			new StringExpression()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.newName = this.newName;
		data.oldName = writeJSON('oldname', this.oldName);
		return data;
	}

	/**
	 * Undo the name change.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setName(this.oldName);
	}

	/**
	 * Redo the name change.
	 *
	 * @method Redo
	 */
	redo() {
		this._graphItem.setName(this.newName);
	}
}

module.exports = SetNameCommand;
