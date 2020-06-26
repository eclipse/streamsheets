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
const BooleanExpression = require('../expr/BooleanExpression');

/**
 * An Attribute subclass with a {{#crossLink "BooleanExpression"}}{{/crossLink}} as value.</br>
 * <b>Note:</b> to prevent conflicts with other Attributes the Attribute name should be globally unique, at
 * least within its parent AttributeList.
 *
 * @class BooleanAttribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {Boolean || BooleanExpression} [value] An optional BooleanExpression or Boolean to use as
 *     value.
 */
class BooleanAttribute extends Attribute {
	constructor(name, value) {
		super(name, new BooleanExpression(true));
		if (value !== undefined) {
			this._value.setExpressionOrValue(value);
		}
	}

	/**
	 * A convenience method to create a <code>BooleanAttribute</code> with given name, value and display name.
	 *
	 * @method create
	 * @param {String} name The attribute name.
	 * @param {Boolean} [value] An optional value to initialize the attribute with.
	 * @param {String} [dplname] An optional display name for the attribute.
	 * @return {BooleanAttribute} The newly created <code>BooleanAttribute</code>.
	 * @static
	 */
	static create(name, value, dplname) {
		const attr = new BooleanAttribute(name, value);
		attr.setDisplayName(dplname);
		return attr;
	}

	getClassString() {
		return 'BooleanAttribute';
	}

	newInstance() {
		return new BooleanAttribute(this.getName());
	}
}

module.exports = BooleanAttribute;
