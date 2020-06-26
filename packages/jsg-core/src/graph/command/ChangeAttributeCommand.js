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
const ObjectFactory = require('../../ObjectFactory');
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const Expression = require('../expr/Expression');


const writeValue = (value) => {
	const json = { type: 'static', value };
	if (value instanceof Expression) {
		json.type = value.constructor.name;
		json.value = writeJSON('val', value);
	}
	return json;
};
const readValue = (json) => {
	if (json.type === 'static') {
		return json.value;
	}
	// no static value, assume expression to restore:
	const value = ObjectFactory.create(json.type);
	return readObject('val', json.value, value);
};

/**
 * Command to change the value of a GraphItem attribute.
 *
 * @example
 *     // InteractionHandler and GraphItem given
 *     // Assigning a new fillcolor to an item.
 *     var cmd = new ChangeAttributeCommand(item, "FORMAT:FILLCOLOR", "#FF0000");
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ChangeAttributeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item The GraphItem to change the attribute value of.
 * @param {String} path A complete attribute path, i.e. a single path of Attribute names.
 * @param {BooleanExpression | Object} value The new attribute value or expression.
 * @param {BooleanExpression | Object} [oldValue] The old attribute value or expression.
 */
class ChangeAttributeCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			const newValue = readValue(data.newValue);
			const oldValue = readValue(data.oldValue);
			cmd = new ChangeAttributeCommand(item, data.path, newValue, oldValue).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, path, value, oldValue) {
		super(item);

		function getOldValue() {
			if (oldValue === undefined) {
				const attr = item.getAttributeAtPath(path);
				if (attr !== undefined) {
					oldValue = attr.getExpression();
				}
			}
			return oldValue instanceof Expression
				? oldValue.copy()
				: oldValue;
		}

		this._path = path;
		this._newValue = value;
		this._oldValue = getOldValue();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.path = this._path;
		data.newValue = writeValue(this._newValue);
		data.oldValue = writeValue(this._oldValue);
		return data;
	}

	undo() {
		this._graphItem.setAttributeAtPath(this._path, this._oldValue);
	}

	redo() {
		this._graphItem.setAttributeAtPath(this._path, this._newValue);
	}
}

module.exports = ChangeAttributeCommand;
