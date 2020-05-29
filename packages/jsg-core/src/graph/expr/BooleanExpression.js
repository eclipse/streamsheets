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
const BooleanConstraint = require('./BooleanConstraint');
const Expression = require('./Expression');

/**
 * A boolean expression should be used for boolean values. It uses a
 * {{#crossLink "BooleanConstraint"}}{{/crossLink}} to transform any non primitive boolean expression
 * values to a boolean.
 *
 * @class BooleanExpression
 * @constructor
 * @extends BooleanExpression
 */
class BooleanExpression extends Expression {
	constructor(value, formula, term) {
		super();
		this._constraint = new BooleanConstraint();
		this.set(value, formula, term);
	}

	newInstance() {
		return new BooleanExpression();
	}
}

module.exports = BooleanExpression;
