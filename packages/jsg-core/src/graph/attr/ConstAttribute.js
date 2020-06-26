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


/**
 * A constant attribute is an {{#crossLink "Attribute"}}{{/crossLink}} whose value cannot or should not
 * be changed after its creation. To achieve this all methods which changes the attribute value or expression are
 * overwritten. Usually a constant attribute is created from a normal, i.e. mutable, attribute by calling {{#crossLink
 * "ConstAttribute/fromAttribute:method"}}{{/crossLink}}. This is important because this method stores
 * the class name of provided attribute so it can be restored via
 * {{#crossLink "ConstAttribute/toAttribute:method"}}{{/crossLink}}.</br>
 * Constant attributes are mainly used as content of a {{#crossLink
 * "ConstAttributeList"}}{{/crossLink}}.
 *
 * @class ConstAttribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {BooleanExpression} value An Attribute value expression
 */
class ConstAttribute extends Attribute {
	constructor(name, value) {
		super(name, value);
		this._name = name;
		this._clname = undefined;
		this.isConst = true;
	}

	/**
	 * Creates a new <code>ConstAttribute</code> instance based on given <code>Attribute</code>. The
	 * <code>Attribute</code> should correctly implement {{#crossLink
	 * "Attribute/getClassString:method"}}{{/crossLink}} so that an instance of it can be created by
	 * calling {{#crossLink "ConstAttribute/toAttribute:method"}}{{/crossLink}}.
	 *
	 * @method fromAttribute
	 * @param {Attribute} attr The attribute which provides the value for the constant attribute.
	 * @param {String} [name] An optional name used to rename created constant attribute. If not specified the name of
	 *     given attribute is used.
	 * @return {ConstAttribute} A new constant attribute instance based on given attribute.
	 * @static
	 */
	static fromAttribute(attr, name) {
		/* eslint-disable global-require */
		const ConstExpression = require('../expr/ConstExpression');
		/* eslint-enable global-require */
		const constAttr = new ConstAttribute(
			name || attr.getName(),
			ConstExpression.fromExpression(attr.getExpression())
		);
		// TODO: check if context is necessary as parameter
		constAttr.setTransient(attr.isTransient());
		constAttr.setDisplayName(attr.getDisplayName());
		Object.getPrototypeOf(constAttr).setTransient.call(
			constAttr,
			attr.isTransient()
		);
		Object.getPrototypeOf(constAttr).setDisplayName.call(
			constAttr,
			attr.getDisplayName()
		);
		constAttr._clname = attr.getClassString();
		return constAttr;
	}

	/**
	 * Creates a mutable <code>Attribute</code> from this <code>ConstAttribute</code> instance. If the
	 * <code>ConstAttribute</code> was created via {{#crossLink
	 * "ConstAttribute/fromAttribute:method"}}{{/crossLink}} the returned
	 * <code>Attribute</code> instance should be of same type as the <code>Attribute</code> provided to
	 * <code>fromAttribute</code>. By default the returned attribute is of type {{#crossLink
	 * "Attribute"}}{{/crossLink}}.
	 *
	 * @method toAttribute
	 * @return {Attribute} A new mutable attribute instance based on this constant attribute.
	 */
	toAttribute() {
		const constexpr = this.getExpression();
		// eslint-disable-next-line global-require
		const ObjectFactory = require('../../ObjectFactory');
		const attribute = ObjectFactory.create(this.getClassString());
		attribute._setName(this.getName());
		// apply expression constraint:
		attribute
			.getExpression()
			.setConstraint(constexpr.getConstraint().copy());
		attribute.setExpressionOrValue(constexpr);
		attribute.setTransient(this.isTransient());
		attribute.setDisplayName(this.getDisplayName());
		return attribute;
	}

	newInstance() {
		return new ConstAttribute(this._name, this._value);
	}

	copy() {
		const copy = this.newInstance();

		copy._transient = this.isTransient();
		copy._dplname = this.getDisplayName();
		copy._clname = this.getClassString();

		return copy;
	}

	getClassString() {
		return this._clname || Attribute.CLASSNAME;
	}

	_setName(/* name */) {}

	setDisplayName(/* name */) {}

	setExpressionOrValue(value) {
		return this._list ? this._list.setAttributeValue(this, value) : false;
	}

	replaceValueExpression(/* newexpr */) {
		return false;
	}

	reset() {}
}

module.exports = ConstAttribute;
