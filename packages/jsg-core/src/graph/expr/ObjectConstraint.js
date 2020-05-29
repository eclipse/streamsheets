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

/**
 * A simple <code>ExpressionConstraint</code> subclass. Since all object values are valid no validation and no
 * transformation is done.
 *
 * @class ObjectConstraint
 * @constructor
 * @extends ExpressionConstraint
 * @param {Number} [defValue] The default value to use for an invalid expression value.
 */
class ObjectConstraint extends ExpressionConstraint {
	getClassString() {
		return 'ObjectConstraint';
	}

	copy() {
		const copy = new ObjectConstraint(this.defValue);
		return copy;
	}

	isValid() {
		return true;
	}

	getValue(value) {
		return this.isValid(value) ? value : this.defValue || value;
	}
}

module.exports = ObjectConstraint;
