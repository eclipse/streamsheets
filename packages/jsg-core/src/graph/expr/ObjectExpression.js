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
const ObjectConstraint = require('./ObjectConstraint');
const Expression = require('./Expression');


/**
 * A simple {{#crossLink "BooleanExpression"}}{{/crossLink}} to wrap an arbitrary object as
 * an expression value. Since the value of this expression is always the provided object no formula
 * or term can be set.<br/>
 * <b>Note:</b> to support persistence the object value must provide <code>save(writer)</code>,
 * <code>read(node)</code> and <code>getClassName()</code> methods. The class name is used to restore the object from
 * the expression instance which triggers read and it will be called with <code>new</code> and no parameter.
 * In addition to support deep copy the object value should provide a <code>copy</code> method.
 *
 * @class ObjectExpression
 * @extends BooleanExpression
 * @constructor
 * @param {Object} value The object for this expression.
 */
class ObjectExpression extends Expression {
	constructor(value) {
		super();
		this._constraint = new ObjectConstraint();
		this.set(value);
	}

	newInstance() {
		const value =
			this._value && this._value.copy ? this._value.copy() : this.value;
		return new ObjectExpression(value);
	}

	copy() {
		const copy = this.newInstance();
		copy._constraint = this._constraint
			? this._constraint.copy()
			: undefined;
		return copy;
	}

	isEqualTo(other) {
		return other ? this.isValueEqualTo(other._value) : false;
	}

	isEqualToExpressionOrValue(other) {
		return other instanceof ObjectExpression
			? this.isEqualTo(other)
			: this.isValueEqualTo(other);
	}

	getValue() {
		return this._value;
	}

	setFormula() {
		return false;
	}

	setTerm() {
		return false;
	}

	set(value) {
		return this.setValue(value);
	}

	evaluate() {}

	resolveParentReference() {}

	toString() {
		return this._value && this._value.toString
			? this._value.toString()
			: 'n.d.';
	}

	toLocaleString() {
		return this.toString();
	}

	save(name, writer) {
		writer.writeStartElement(name);
		this._writeValue(writer);
		writer.writeEndElement();
	}

	_writeValue(writer) {
		if (
			this._value !== undefined &&
			this._value.save &&
			this._value.getClassName
		) {
			writer.writeAttributeString('cl', this._value.getClassName());
			this._value.save(writer);
		}
	}

	read(reader, node) {
		this._isLocked = false;
		this.set(this._readValue(reader, node));

		const locked = reader.getAttribute(node, 'locked');
		if (locked !== undefined) {
			this._isLocked = true;
		}
	}

	_readValue(reader, node) {
		const classname = reader.getAttribute(node, 'cl');
		const obj = ObjectFactory.create(classname);
		if (obj && obj.read) {
			obj.read(reader, node);
		}
		return obj;
	}
}

module.exports = ObjectExpression;
