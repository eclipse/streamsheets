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
const ObjectFactory = require('../../ObjectFactory');
const ExpressionConstraint = require('./ExpressionConstraint');

/**
 * An <code>ExpressionConstraint</code> subclass to define a range of valid values.<br/>
 * Validation simply checks if given value is within defined range. No transformation is done, this means that for each
 * value which is not within defined range an optional default value is returned.<br/>
 * <b>Note:</b> <code>boolean</code>, <code>number</code> and <code>string</code> values can be saved and read but
 * object values must provide <code>save(writer)</code>, <code>read(node)</code> and <code>getClassName()</code>
 * methods to support persistence. The class name should reference the object constructor function which gets called
 * with <code>new</code> and without any parameters.
 *
 * @class RangeConstraint
 * @constructor
 * @extends ExpressionConstraint
 * @param {Array} range    An array of valid values.
 * @param {Number} [defValue] The default value to use whenever expression value is not valid, i.e. the value is not
 *     within specified range.
 */
class RangeConstraint extends ExpressionConstraint {
	constructor(range, defValue) {
		super(defValue);
		this.range = range;
	}

	/**
	 * Creates a new <code>RangeConstraint</code> instance whose range is based on the properties of given object.
	 *
	 * @method fromPropertiesOf
	 * @param {Object} obj The object whose own properties define the range.
	 * @param {Object} [defValue] An optional default value to use.
	 * @return {RangeConstraint} The created <code>RangeConstraint</code> instance.
	 */
	static fromPropertiesOf(obj, defValue) {
		const range = [];

		Object.keys(obj).forEach((prop) => {
			range.push(obj[prop]);
		});

		return new RangeConstraint(range, defValue);
	}

	getClassString() {
		return 'RangeConstraint';
	}

	save(writer) {
		writer.writeStartArray('val');

		this.range.forEach((val) => {
			this._saveValue('val', val, this._typeOf(val), writer);
		});

		writer.writeEndArray('val');

		const val = this.defValue;
		this._saveValue('def', val, this._typeOf(val), writer);

		return this.range.length > 0;
	}

	_saveValue(tag, value, type, writer) {
		if (value || value === 0) {
			switch (type) {
				case 'b':
				case 'n':
				case 's':
					writer.writeStartElement(tag);
					writer.writeAttributeString('v', value.toString());
					writer.writeAttributeString('t', type);
					writer.writeEndElement();
					break;
				default:
					this._saveObjectValue(tag, value, writer);
			}
		}
	}

	_saveObjectValue(tag, value, writer) {
		if (value.save && value.getClassName) {
			writer.writeStartElement(tag);
			writer.writeAttributeString('cl', value.getClassName());
			value.save(writer);
			writer.writeEndElement();
		}
	}

	read(reader, object) {
		let val;
		const range = [];

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'val':
					val = this._readValue(reader, child);
					if (val || val === 0) {
						range.push(val);
					}
					break;
				default:
					break;
			}
		});

		this.range = range;
		this.defValue = this._readValue(
			reader,
			reader.getObject(object, 'def')
		);
	}

	_readValue(reader, node) {
		let val;

		if (node) {
			const type = reader.getAttribute(node, 't');
			switch (type) {
				case 'b':
				case 'n':
				case 's':
					val = this._convert(reader.getAttribute(node, 'v'), type);
					break;
				default:
					val = this._readObjectValue(reader, node);
			}
		}
		return val;
	}

	_readObjectValue(reader, node) {
		const classname = reader.getAttribute(node, 'cl');
		const obj = ObjectFactory.create(classname);
		if (obj && obj.read) {
			obj.read(reader, node);
		}
		return obj;
	}

	copy() {
		return new RangeConstraint(this.range, this.defValue);
	}

	isValid(value) {
		let i;
		let n;
		let found = false;

		for (i = 0, n = this.range.length; i < n; i += 1) {
			if (this.range[i] === value) {
				found = true;
				break;
			}
		}
		return found;
	}

	getValue(value) {
		return this.isValid(value) ? value : this.defValue;
	}
}

module.exports = RangeConstraint;
