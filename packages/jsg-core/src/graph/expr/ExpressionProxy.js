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
 * @class ExpressionProxy
 * @constructor
 */
class ExpressionProxy extends Expression {
	constructor(expression) {
		super();
		this._expression = expression;
		let term = expression.getTerm();
		term = term !== undefined ? term.copy() : undefined;
		this.set(expression.getValue(), expression.getFormula(), term);
	}

	/**
	 * Returns wrapped expression.
	 *
	 * @method getExpression
	 * @return {BooleanExpression} The wrapped expression.
	 */
	getExpression() {
		return this._expression;
	}

	copy() {
		return new ExpressionProxy(this._expression);
	}

	isEqualTo(other) {
		return this._expression.isEqualTo(other);
	}

	getFormula() {
		return this._expression.getFormula();
	}

	getTerm() {
		return this._expression.getTerm();
	}

	getValue() {
		return this._expression.getValue();
	}

	hasFormula() {
		return this._expression.hasFormula();
	}

	isLocked() {
		return this._expression.isLocked();
	}

	set(value, formula, term) {
		if (this._expression) {
			super.set(value, formula, term);
		}
	}

	setLocked(doIt) {
		this._expression.setLocked(doIt);
	}

	setConstraint(constraint) {
		this._expression.setConstraint(constraint);
	}

	setFormula(formula) {
		this._expression.setFormula(formula);
	}

	setTerm(term) {
		this._expression.setTerm(term);
	}

	setValue(value) {
		this._expression.setValue(value);
	}

	evaluate(item) {
		this._expression.evaluate(item);
	}

	toString(forItem) {
		return this._expression.toString(forItem);
	}

	toLocaleString(locale, forItem) {
		return this._expression.toLocaleString(locale, forItem);
	}

	_setTerm(term) {
		this._expression._setTerm(term);
	}

	save(name, writer) {
		this._expression.save(name, writer);
	}

	read(reader, node) {
		this._expression.read(reader, node);
	}
}

module.exports = ExpressionProxy;
