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
const { readJSON, writeObject } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const AttributeUtils = require('../attr/AttributeUtils');

/**
 * Command to remove an attribute from a GraphItem.
 *
 * @example
 *     // InteractionHandler and GraphItem given
 *     var cmd = new RemoveAttributeCommand(item, "CUSTOM:NAME");
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class RemoveAttributeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item The GraphItem to remove the attribute from.
 * @param {String} path A complete attribute path, i.e. a single path of Attribute names.
 * @since 1.6.0
 */
class RemoveAttributeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new RemoveAttributeCommand(item, data.path).initWithObject(data)
			: undefined;
	}

	constructor(item, path) {
		super(item);
		this._path = path;
		this._attr = item.getAttributeAtPath(path);
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._attr = readJSON('attr', data.attr.json, ({ reader, root }) =>
			AttributeUtils.readAttribute(reader, data.attr.name, root)
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.path = this._path;
		data.attr = {
			name: this._attr.getName(),
			json: writeObject('attr', this._attr)
		};
		return data;
	}

	undo() {
		this._graphItem.addAttributeAtPath(this._path, this._attr);
	}

	redo() {
		this._graphItem.removeAttributeAtPath(this._path);
	}
}

module.exports = RemoveAttributeCommand;
