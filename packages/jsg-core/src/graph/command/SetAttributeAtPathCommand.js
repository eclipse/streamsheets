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
const ObjectFactory = require('../../ObjectFactory');
const AbstractItemCommand = require('./AbstractItemCommand');
const JSONReader = require('../../commons/JSONReader');
const JSONWriter = require('../../commons/JSONWriter');
const Expression = require('../expr/Expression');
const Attribute = require('../attr/Attribute');

const readExpression = ({ type, json }) => {
	const expr = ObjectFactory.create(type);
	const reader = new JSONReader(json);
	const root = reader.getObject(reader.getRoot(), 'expression');
	expr.read(reader, root);
	return expr;
};
const writeExpression = (expr) => {
	const data = {};
	if (expr instanceof Expression) {
		const writer = new JSONWriter();
		writer.writeStartDocument();
		expr.save('expression', writer);
		writer.writeEndDocument();
		data.json = writer.flush();
		data.type = expr.constructor.name;
	}
	return data;
};

/**
 * Command to change the value of an existing attribute.
 *
 * @example
 *     // interactionhandler and item given
 *     // Assigning the moveable flag to an item.
 *     var path = AttributeUtils.createPath(ItemAttributes.NAME,
 *     	 ItemAttributes.MOVEABLE);
 *     var cmd = new SetAttributeAtPathCommand(item, path, false); interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetAttributeAtPathCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Item to change an attribute of.
 * @param {String} path An existing attribute path which references the attribute to change.
 * @param {BooleanExpression | Object} newvalue New value of attribute.
 * @param {Boolean} create Create Attribute, if not exisiting.
 * @since 2.0.11
 */
class SetAttributeAtPathCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const newValue =
			data.newValue.type === 'static'
				? data.newValue.value
				: readExpression(data.newValue);
		return item
			? new SetAttributeAtPathCommand(
					item,
					data.path,
					newValue,
					data.create
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, path, newvalue, create) {
		super(item);

		const attr = item.getAttributeAtPath(path);
		this._path = path;
		this._newvalue = newvalue;
		this._oldvalue = attr ? attr.getExpression().copy() : new Expression(0);
		this._create = create;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldvalue = readExpression(data.oldValue);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.path = this._path;
		data.oldValue = writeExpression(this._oldvalue);
		data.newValue =
			this._newvalue instanceof Expression
				? writeExpression(this._newvalue)
				: { type: 'static', value: this._newvalue };
		data.create = this._create;
		return data;
	}

	/**
	 * Undo the attribute assignment.
	 *
	 * @method undo
	 */
	undo() {
		this._setAttributeTo(this._oldvalue);
	}

	/**
	 * Redo the attribute assignment.
	 *
	 * @method redo
	 */
	redo() {
		this._setAttributeTo(this._newvalue);
	}

	_setAttributeTo(value) {
		let attr = this._graphItem.getAttributeAtPath(this._path);

		// value of 0 or false should be allowed
		if (attr) {
			attr.setExpressionOrValue(value);
			attr.evaluate(this._graphItem);
		} else if (this._create) {
			attr = new Attribute('sheetformula', value);
			this._graphItem.addAttributeAtPath(this._path, attr);
			attr.evaluate(this._graphItem);
		}

		this._graphItem.updateSubAttributes();
	}
}

module.exports = SetAttributeAtPathCommand;
