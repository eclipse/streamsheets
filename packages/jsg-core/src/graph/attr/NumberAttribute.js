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
const NumberExpression = require('../../graph/expr/NumberExpression');

/**
 * An Attribute subclass with a {{#crossLink "NumberExpression"}}{{/crossLink}} as value.</br>
 * <b>Note:</b> to prevent conflicts with other Attributes the Attribute name should be globally unique, at
 * least within its parent AttributeList.
 *
 * @class NumberAttribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {Number || NumberExpression} [value] An optional NumberExpression or Number to use as value.
 */
class NumberAttribute extends Attribute {
	constructor(name, value) {
		super(name, new NumberExpression(0));
		if (value !== undefined) {
			this._value.setExpressionOrValue(value);
		}
	}

	/**
	 * A convenience method to create a <code>NumberAttribute</code> with given name, value and display name.
	 *
	 * @method create
	 * @param {String} name The attribute name.
	 * @param {Number} [value] An optional value to initialize the attribute with.
	 * @param {String} [dplname] An optional display name for the attribute.
	 * @return {NumberAttribute} The newly created <code>NumberAttribute</code>.
	 * @static
	 */
	static create(name, value, dplname) {
		const attr = new NumberAttribute(name, value);
		attr.setDisplayName(dplname);
		return attr;
	}

	getClassString() {
		return 'NumberAttribute';
	}

	newInstance() {
		return new NumberAttribute(this.getName());
	}
};

module.exports = NumberAttribute;
