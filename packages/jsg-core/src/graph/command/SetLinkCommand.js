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
 * Command to assign a new link to a GraphItem.
 *
 * @example
 *     // interactionhandler and node given
 *     var cmd = new SetLinkCommand(item, 'www.js-graph.de');
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetLinkCommand
 * @extends AbstractItemCommand
 * @constructor
 * @param {GraphItem} item Item to assign name to.
 * @param {StringExpression | String} name New link or link expression to assign.
 */
class SetLinkCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetLinkCommand(item, data.link).initWithObject(data)
			: undefined;
	}

	constructor(item, link) {
		super(item);

		this.oldLink = item.getLink().copy();
		this.newLink = link;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd.oldLink = readObject(
			'oldlink',
			data.oldLink,
			new StringExpression()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.link = this.newLink;
		data.oldLink = writeJSON('oldlink', this.oldLink);
		return data;
	}
	/**
	 * Undo the link change.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setLink(this.oldLink);
	}

	/**
	 * Redo the link change.
	 *
	 * @method Redo
	 */
	redo() {
		this._graphItem.setLink(this.newLink);
	}
}

module.exports = SetLinkCommand;
