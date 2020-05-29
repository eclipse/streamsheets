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
// const JSG = require('../../JSG');
const NumberConstraint = require('./NumberConstraint');
const Numbers = require('../../commons/Numbers');

/**
 * A <code>NumberConstraint</code> subclass to define a constraint based on specified number range.<br/>
 * Validation simply checks if given value is within this range. A transformation is not done, that means that for each
 * value which not represents a number an optional default value is returned and all other number values are bound to
 * specified range.
 *
 * @class NumberRangeConstraint
 * @constructor
 * @extends NumberConstraint
 * @param {Number} min    The range minimum, inclusive.
 * @param {Number} max    The range maximum, inclusive.
 * @param {Number} [defValue] The default value to use whenever expression value is not valid, i.e. the value is not
 *     within specified number range.
 */
class NumberRangeConstraint extends NumberConstraint {
	constructor(min, max, defValue) {
		super(defValue);
		this.min = min;
		this.max = max;
	}

	getClassString() {
		return 'NumberRangeConstraint';
	}

	save(writer) {
		writer.writeStartElement('nrc');
		writer.writeAttributeNumber('min', this.min);
		writer.writeAttributeNumber('max', this.max);
		writer.writeAttributeNumber('def', this.defValue);
		return writer.writeEndElement();
	}

	read(reader, node) {
		const nrc = reader.getObject(node, 'nrc');

		function getValue(attr, def) {
			let val = reader.getAttribute(node, attr);
			val = val ? Number(val) : undefined;
			return !Number.isNaN(val) ? val : def;
		}

		if (nrc) {
			this.isDefault = false;
			this.min = getValue('min', 0);
			this.max = getValue('max', 0);
			this.defValue = getValue('def', 0);
		}
	}

	copy() {
		return new NumberRangeConstraint(this.min, this.max, this.defValue);
	}

	isValid(value) {
		return (
			Numbers.isNumber(value) && value >= this.min && value <= this.max
		);
	}

	getValue(value) {
		if (Numbers.isNumber(value)) {
			value = Math.max(Math.min(value, this.max), this.min);
		} else {
			value = this.defValue;
		}
		return value;
	}
}

module.exports = NumberRangeConstraint;
