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
const StringAttribute = require('../attr/StringAttribute');

/**
 * Command to add a new attribute to a GraphItem.
 *
 * @example
 *     // InteractionHandler and GraphItem given
 *     // Assigning a new attribute to an item.
 *     var cmd = new AddAttributeCommand(item, "CUSTOM:NAME", "NAME", "Michael");
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class AddAttributeCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item The GraphItem to add the attribute value to.
 * @param {String} path A complete attribute path, i.e. a single path of Attribute names. If left out, the attribute
 *     will be added to the base path.
 * @param {String} name Attribute name.
 * @param {BooleanExpression | Object} value The new attribute value or expression.
 * @since 1.6.0
 */
class AddAttributeCommand extends AbstractItemCommand {
	constructor(item, path, name, value) {
		super(item);

		this._path = path;
		this._attr = StringAttribute.create(name, value, '');
	}

	undo() {
		if (this._path.length) {
			this._graphItem.removeAttributeAtPath(this._path);
		} else {
			this._graphItem.removeAttribute(this._attr);
		}
	}

	redo() {
		if (this._path.length) {
			this._graphItem.addAttributeAtPath(this._path, this._attr, true);
		} else {
			this._graphItem.addAttribute(this._attr);
		}
	}
}

module.exports = AddAttributeCommand;
