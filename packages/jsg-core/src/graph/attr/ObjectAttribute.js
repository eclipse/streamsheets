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
const Attribute = require('./Attribute');
const ObjectExpression = require('../expr/ObjectExpression');

/**
 * An Attribute subclass with an {{#crossLink "ObjectExpression"}}{{/crossLink}} as value.</br>
 * Please refer to {{#crossLink "ObjectExpression"}}{{/crossLink}} for information about
 * what kind of objects can be stored.
 * <b>Note:</b> to prevent conflicts with other Attributes the Attribute name should be globally unique, at
 * least within its parent AttributeList.
 *
 * @class ObjectAttribute
 * @extends Attribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {Object || ObjectExpression} [value] An optional ObjectExpression or an Object to use as value.
 */
class ObjectAttribute extends Attribute {
	constructor(name, value) {
		super(name, new ObjectExpression(undefined));
		if (value !== undefined) {
			this._value.setExpressionOrValue(value);
		}
	}

	getClassString() {
		return 'ObjectAttribute';
	}

	newInstance() {
		return new ObjectAttribute(this.getName());
	}
}

module.exports = ObjectAttribute;
