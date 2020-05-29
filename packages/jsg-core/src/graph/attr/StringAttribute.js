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
// const JSG = require('../../JSG');
const Attribute = require('./Attribute');
const StringExpression = require('../../graph/expr/StringExpression');

/**
 * An Attribute subclass with a {{#crossLink "StringExpression"}}{{/crossLink}} as value.</br>
 * <b>Note:</b> to prevent conflicts with other Attributes the Attribute name should be globally unique, at
 * least within its parent AttributeList.
 *
 * @class StringAttribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {String || StringExpression} [value] An optional StringExpression or String to use as value.
 */
class StringAttribute extends Attribute {
	constructor(name, value) {
		super(name, new StringExpression(''));
		if (value !== undefined) {
			this._value.setExpressionOrValue(value);
		}
	}

	/**
	 * A convenience method to create a <code>StringAttribute</code> with given name, value and display name.
	 *
	 * @method create
	 * @param {String} name The attribute name.
	 * @param {String} [value] An optional value to initialize the attribute with.
	 * @param {String} [dplname] An optional display name for the attribute.
	 * @return {StringAttribute} The newly created <code>StringAttribute</code>.
	 * @static
	 */
	static create(name, value, dplname) {
		const attr = new StringAttribute(name, value);
		attr.setDisplayName(dplname);
		return attr;
	}

	getClassString() {
		return 'StringAttribute';
	}

	newInstance() {
		return new StringAttribute(this.getName());
	}
};

module.exports = StringAttribute;
