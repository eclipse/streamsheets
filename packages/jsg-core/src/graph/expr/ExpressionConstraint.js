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
const Strings = require('../../commons/Strings');
const Numbers = require('../../commons/Numbers');

/**
 * <code>ExpressionConstraint</code>s are used to validate and transform expression values. Validation is done via
 * {{#crossLink "ExpressionConstraint/isValid:method"}}{{/crossLink}} which is called when a value is
 * set. The value transformation is done by {{#crossLink
 * "ExpressionConstraint/getValue:method"}}{{/crossLink}} which gets called whenever an expression value
 * is requested. Here constraints can try to transform the value to a special type if it is not already of that type.
 * If transformation is not applicable an optional default value can be returned.<br/> To support persistence a
 * constraint must provide <code>save(writer)</code>, <code>read(node)</code> and
 * <code>getClassString()</code> methods. The class name is used to restore the constraint from the expression instance
 * which triggers read and it will be called with <code>new</code> and no parameter. Before a constraint is asked to
 * save itself {{#crossLink "ExpressionConstraint/doSave:method"}}{{/crossLink}} is called. Constraints
 * can prevent the saving request if they return <code>false</code>.<br/>
 * The default implementation validates against <code>String</code> and <code>Number</code> values and tries to
 * transform any value to this types. Subclasses can overwrite this to implement custom behavior.<br/> Please refer to
 * {{#crossLink "NumberConstraint"}}{{/crossLink}} or {{#crossLink
 * "NumberRangeConstraint"}}{{/crossLink}} as examples for custom constraints.
 *
 * @class ExpressionConstraint
 * @constructor
 * @param {Boolean|Number|String|Object} [defValue] An optional default value if expression value cannot be
 *     transformed.
 */
class ExpressionConstraint {
	constructor(defValue) {
		/**
		 * An optional default value to use if an expression value cannot be transformed to a type defined by this
		 * constraint.<br/> See {{#crossLink "ExpressionConstraint/getValue:method"}}{{/crossLink}} too.
		 *
		 * @property defValue
		 * @type {Boolean|Number|String}
		 */
		this.defValue = defValue;
		/**
		 * Marks this constraint as a default constraint. This property is set to <code>true</code> by default.<br/>
		 * It can be and is used to  implement application dependent behavior, e.g. a default constraint might not be
		 * saved, see {{#crossLink "ExpressionConstraint/doSave:method"}}{{/crossLink}}.
		 *
		 * @property isDefault
		 * @type {Boolean}
		 */
		this.isDefault = true;
		/**
		 * Flag which signals that this constraint should be used to always check expression value, not only
		 * dynamically
		 * resolved ones. Default is <code>false</code> which means that only the value derived from an inner
		 * <code>Term</code> is checked. Note: almost always it is not required to srt this to <code>true</code>.
		 *
		 * @property alwaysCheckValue
		 * @type {Boolean}
		 * @since 1.6.44
		 */
		this.alwaysCheckValue = false;
	}

	/**
	 * Returns the complete class String of this <code>ExpressionConstraint</code> instance. The class string is the
	 * name of the <code>ExpressionConstraint</code> instance including its complete path, e.g. the class string of
	 * this general
	 * <code>ExpressionConstraint</code> is <code>ExpressionConstraint</code>.<br/>
	 *
	 * @method getClassString
	 * @return {String} The complete class string of this <code>ExpressionConstraint</code> instance.
	 */
	getClassString() {
		return 'ExpressionConstraint';
	}

	/**
	 * Called before this constraint is requested to save itself.<br/>
	 * Returns <code>true</code> to trigger save or <code>false</code> to cancel it. Subclasses may overwrite. Default
	 * implementation simply checks if this constraint is marked as default, see
	 * {{#crossLink "ExpressionConstraint/isDefault:property"}}{{/crossLink}}.
	 *
	 * @method doSave
	 * @param {BooleanExpression} expr The expression to which this constraint is registered to.
	 * @return {Boolean} <code>true</code> if this constraint should be saved, <code>false</code> otherwise.
	 */
	doSave() {
		return !this.isDefault;
	}

	/**
	 * Saves this ExpressionConstraint.<br/>
	 *
	 * @method save
	 * @param {Writer} writer Writer to use.
	 */
	save(writer) {
		const type = this._typeOf(this.defValue);
		const cancel = !(this.defValue || this.defValue === 0);
		writer.writeStartElement('ec');
		if (!cancel) {
			// we simply save default value if set...
			writer.writeAttributeString('def', this.defValue);
			if (type) {
				writer.writeAttributeString('t', type);
			}
		}
		return writer.writeEndElement(cancel);
	}

	/**
	 * Tries to determine the type of given value.
	 *
	 * @method _typeOf
	 * @param {Boolean|Number|String} value The value to get the type of.
	 * @return {String} A lowercase key for the type of given value.
	 * @private
	 */
	_typeOf(value) {
		let type;
		if (value || value === 0) {
			type = typeof value;
			type = type ? type[0].toLowerCase() : undefined;
		}
		return type;
	}

	/**
	 * Reads this ExpressionConstraint from given object.<br/>
	 *
	 * @method rea
	 * @param {Reader} reader Reader to use.
	 * @param {Object} node Object to read from.
	 */
	read(reader, node) {
		const exprcstr = reader.getObject(node, 'ec');

		if (exprcstr) {
			const val = reader.getAttribute(node, 'def');
			if (val) {
				this.isDefault = false;
				this.defValue = this._convert(
					val,
					reader.getAttribute(node, 't')
				);
			}
		}
	}

	/**
	 * Converts given value string to specified type.
	 *
	 * @method _convert
	 * @param {String} value The value string to convert.
	 * @param {String} type A key to specify the type to convert to.
	 * @return {Boolean|Number|String} The converted value.
	 * @private
	 */
	_convert(value, type) {
		switch (type) {
			case 'n':
				value = Number(value);
				break;
			case 'b':
				value = value === 'true';
				break;
			default:
				break;
		}
		return value;
	}

	/**
	 * Creates a copy of this <code>ExpressionConstraint</code>.
	 *
	 * @method copy
	 * @return {ExpressionConstraint} copied expression constraint
	 */
	copy() {
		return new ExpressionConstraint(this.defValue);
	}

	/**
	 * Checks if passed value is valid in the sense of this constraint. Returns <code>true</code> if it
	 * is, <code>false</code> otherwise. This method gets called when an expression value is set directly.<br/>
	 * Subclasses can overwrite to implement custom behavior. Default implementation simply validates against
	 * <code>String</code>
	 * <code>Number</code> and primitive boolean values.
	 *
	 * @method isValid
	 * @param {Object} value The value to check.
	 * @return {Boolean} <code>true</code> if passed value is valid against this constraint, <code>false</code>
	 *     otherwise
	 */
	isValid(value) {
		// if (model && Range) {
		// 	if (value instanceof Range) {
		// 		return true;
		// 	}
		// }

		return (
			Strings.isString(value) ||
			Numbers.isNumber(value) ||
			value === true ||
			value === false
		);
	}

	/**
	 * Returns and transforms given value if required. This method gets called when an expression value is
	 * requested.<br/> Subclasses can overwrite to implement custom behavior. Default implementation checks if passed
	 * value represents a
	 * <code>Number</code> or <code>String</code> and simply returns it in this case. Otherwise it tries to transform
	 * to
	 * <code>Number</code>. If transformation is not possible the defined default value is returned. Note that the
	 * default value is optional and therefore <code>undefined</code> could be returned.
	 *
	 * @method getValue
	 * @param {Object} value The value to transform
	 * @return {Number|String|Object} The transformed value or <code>undefined</code>.
	 */
	getValue(value) {
		if (this.isValid(value)) {
			return value;
		}

		return Numbers.canBeNumber(value) ? Number(value) : this.defValue;
	}
}

module.exports = ExpressionConstraint;
