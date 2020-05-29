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
const StringConstraint = require('./StringConstraint');

/**
 * A string expression should be used for string values. It uses a
 * {{#crossLink "StringConstraint"}}{{/crossLink}} to transform expression value into a string if
 * required.
 *
 * @class StringExpression
 * @constructor
 * @extends BooleanExpression
 */
class StringExpression extends Expression {
	constructor(value, formula, term) {
		super();
		this._constraint = new StringConstraint();
		this.set(value, formula, term);
	}

	newInstance() {
		return new StringExpression();
	}
}

module.exports = StringExpression;
