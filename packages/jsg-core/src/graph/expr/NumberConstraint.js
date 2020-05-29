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
const Numbers = require('../../commons/Numbers');

/**
 * A <code>NumberConstraint</code> is used to validate against number values. It is mainly used for
 * {{#crossLink "NumberExpression"}}{{/crossLink}}s.<br/>
 * Besides number values the boolean value <code>false</code> is transformed to 0 and <code>true</code> to 1. If a
 * string value represents a number it is transformed to. In all other cases an optional default value is returned.<br/>
 * Please refer to {{#crossLink "NumberRangeConstraint"}}{{/crossLink}} for an example of custom number
 * constraint.
 *
 * @class NumberConstraint
 * @constructor
 * @extends ExpressionConstraint
 * @param {Number} [defValue] The default value to use for an invalid expression value. If not provided 0 is used.
 */
class NumberConstraint extends ExpressionConstraint {
	constructor(defValue) {
		super(defValue || 0);
		this.decimals = 0;
	}

	getClassString() {
		return 'NumberConstraint';
	}

	copy() {
		const copy = new NumberConstraint(this.defValue);
		copy.decimals = this.decimals;
		return copy;
	}

	isValid(value) {
		return Numbers.isNumber(value) || Numbers.canBeNumber(value);
	}

	getValue(value) {
		value = value === false ? 0 : value === true ? 1 : value;
		return Numbers.isNumber(value)
			? value
			: Numbers.canBeNumber(value)
			? Number(value)
			: this.defValue;
	}
}

module.exports = NumberConstraint;
