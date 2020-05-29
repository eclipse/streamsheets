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
const ExpressionConstraint = require('./ExpressionConstraint');
const Strings = require('../../commons/Strings');

/**
 * A <code>StringConstraint</code> is used to validate against string values. It is mainly used for
 * {{#crossLink "StringExpression"}}{{/crossLink}}s.<br/>
 * If expression value does not represent a string the constraint tries to transformed into one by calling
 * <code>toString</code> on this value. Therefore the expression value should provide this method otherwise the default
 * value is used.
 *
 * @class StringConstraint
 * @constructor
 * @extends ExpressionConstraint
 * @param {String} [defValue] The default value to use for an invalid expression value. If not provided an empty string
 *     is used.
 */
class StringConstraint extends ExpressionConstraint {
	constructor(defValue) {
		super(defValue || '');
	}

	getClassString() {
		return 'StringConstraint';
	}

	copy() {
		return new StringConstraint(this.defValue);
	}

	isValid(value) {
		return Strings.isString(value);
	}

	getValue(value) {
		return this.isValid(value)
			? value
			: value && value.toString
			? value.toString()
			: this.defValue;
	}
}

module.exports = StringConstraint;
