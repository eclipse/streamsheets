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
const Expression = require('./Expression');

/**
 * Creates a new <code>Expression</code> with given formula or term and default value.</br>
 * <b>Note:</b> call {{#crossLink "BooleanExpression/evaluate:method"}}{{/crossLink}} to
 * compile the formula into a corresponding term.
 *
 * @class ConstExpression
 * @constructor
 * @param {Object} [value] The optional default value to use if neither a formula nor term is present.
 * @param {String} [formula] The optional formula to use.
 * @param {Term} [term] The optional term to get the value from.
 */
class ConstExpression extends Expression {
	constructor(value, formula, term) {
		super(value, formula, term);
		this._term = term;
		this._value = value;
		this._formula = formula;
	}

	/**
	 * Creates a constant expression from given expression.
	 *
	 * @method fromExpression
	 * @param  {BooleanExpression} expr An expression the constant expression is based of.
	 * @return {ConstExpression} A constant expression, based on given one.
	 * @static
	 */
	static fromExpression(expr) {
		function get(value) {
			return value && value.copy ? value.copy() : value;
		}

		const term = get(expr.getTerm());
		const constexpr = new ConstExpression(
			expr.getValue(),
			expr.getFormula(),
			term
		);
		Object.getPrototypeOf(constexpr).setConstraint.call(
			constexpr,
			get(expr.getConstraint())
		);
		return constexpr;
	}

	newInstance() {
		return new ConstExpression(
			this.getValue(),
			this.getFormula(),
			this.getTerm()
		);
	}

	copy() {
		return this.newInstance();
	}

	setLocked() {
		return false;
	}

	setConstraint() {
		return false;
	}

	setValue() {
		return false;
	}

	setFormula() {
		return false;
	}

	setTerm() {
		return false;
	}

	setTo() {
		return false;
	}

	set() {
		return false;
	}

	setExpressionOrValue() {
		return false;
	}
}

module.exports = ConstExpression;
