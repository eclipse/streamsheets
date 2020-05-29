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
const Numbers = require('../../commons/Numbers');
const Strings = require('../../commons/Strings');
const ExpressionConstraint = require('./ExpressionConstraint');

/**
 * A <code>BooleanConstraint</code> is used to validate against primitive boolean values like <code>true</code> or
 * <code>false</code>. It is mainly used for {{#crossLink "BooleanExpression"}}{{/crossLink}}s.<br/>
 * Besides primitive booleans number values of 0 and empty strings are transformed to <code>false</code>. That means
 * that any non zero number or any non empty string is transformed to <code>true</code>. In all other cases an
 * optional default value is returned.
 *
 * @class BooleanConstraint
 * @constructor
 * @extends ExpressionConstraint
 * @param {Boolean} [defValue] The default value to use for an invalid expression value. If not given
 *     <code>false</code> is used.
 */
class BooleanConstraint extends ExpressionConstraint {
	constructor(defValue) {
		super(!!defValue || false);
	}

	getClassString() {
		return 'BooleanConstraint';
	}

	copy() {
		return new BooleanConstraint(this.defValue);
	}

	isValid(value) {
		return value === true || value === false;
	}

	getValue(value) {
		if (this.isValid(value)) {
			return value;
		}
		if (Numbers.isNumber(value)) {
			return value !== 0;
		}
		if (Strings.isString(value)) {
			// should return false boolean if string is "false"!
			return !(value === '' || value.toLowerCase() === 'false');
		}
		return this.defValue;
	}

	getNumericValue() {
		return this.getValue() ? 1 : 0;
	}
}

module.exports = BooleanConstraint;
