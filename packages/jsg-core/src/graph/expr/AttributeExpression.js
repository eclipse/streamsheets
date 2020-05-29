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
const AttributeReference = require('../parser/AttributeReference');
const StringExpression = require('./StringExpression');

/**
 * An AttributeExpression should solely be used to reference a single Attribute.
 *
 * @class AttributeExpression
 * @constructor
 * @extends BooleanExpression
 */
class AttributeExpression extends StringExpression {
	constructor(formula) {
		super('', formula);
	}

	newInstance() {
		return new AttributeExpression();
	}

	/**
	 * Returns the referenced attribute.</br>
	 * Note: <code>undefined</code> is returned if this expression is either not evaluated yet or the
	 * formula is invalid.
	 *
	 * @method getAttribute
	 * @return {Attribute} The referenced attribute or <code>undefined</code>.
	 */
	getAttribute() {
		const ref = this._getAttributeReference();
		return ref !== undefined ? ref.getAttribute() : undefined;
	}

	/**
	 * Returns the GraphItem to which the referenced attribute belongs.</br>
	 * Note: <code>undefined</code> is returned if this expression is either not evaluated yet or the
	 * formula is invalid.
	 *
	 * @method getAttributeOwner
	 * @return {GraphItem} The attribute owner or <code>undefined</code>.
	 */
	getAttributeOwner() {
		const ref = this._getAttributeReference();
		return ref !== undefined ? ref.getAttributeOwner() : undefined;
	}

	_getAttributeReference() {
		const operand = this._term && this._term.operand;
		return operand && operand instanceof AttributeReference
			? operand
			: undefined;
	}

	// overwritten, we don't clear term if value is undefined!
	getValue() {
		if (this._term !== undefined) {
			// store last term value...
			this._value = this._term.value;
		}
		return this._value;
	}

	/**
	 * Saves this Expression.</br>
	 * <b>Note:</b> this method takes an option GraphItem parameter. If given any possible Parent
	 * references in inner formula are replaced by the Id of the corresponding GraphItems before this
	 * expression is saved.
	 *
	 * @method save
	 * @param {String} name Name of created xml tag.
	 * @param {Writer} writer Writer object to save to.
	 * @param {GraphItem} [item] The GraphItem which uses this Expression. If given
	 * Parent references of inner formula are resolved.
	 */
	save(name, writer, item) {
		writer.writeStartElement(name);
		// only store reference formula:
		if (this._formula !== undefined) {
			const formula = item ? this.resolveFormula(item) : this._formula;
			this._writeFormulaAttribute(writer, formula);
		}

		if (this._isLocked) {
			writer.writeAttributeString('locked', 'true');
		}
		writer.writeEndElement();
	}

	resolveFormula(item) {
		const parentstr = `Item.${item.getParent().getId()}`;
		return this._formula.replace('Parent', parentstr);
	}

	read(reader, node) {
		this._isLocked = false;
		this.setFormula(this._readFormulaAttribute(reader, node));
		const locked = reader.getAttribute(node, 'locked');
		if (locked !== undefined) {
			this._isLocked = true;
		}
	}
}

module.exports = AttributeExpression;
