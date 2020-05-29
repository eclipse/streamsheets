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
const JSG = require('../../JSG');
const Strings = require('../../commons/Strings');

/**
 * Class to provide a property. A property provides a getter and setter function to manipulate the
 * value of an attribute that is associated with it. Which attribute is associated with the property can be identified
 * by a unique id that has to be defined for the property.
 *
 * @class Property
 * @constructor
 * @param {String} id Name of property.
 * @param {String/Function} getter Function name of function or function to retrieve property value.
 * @param {String/Function} setter Function name of function or function to set property value
 */
class Property {
	constructor(id, getter, setter) {
		this.id = id;
		this.getter = getter;
		this.setter = setter;
		this.value = '';

		// TODO this is only for testing purpose
		// -> we want to specify the valid range of possible property values -> review...
		this.numeration = undefined;
	}

	/**
	 * Creates a copy of this Property instance.</br>
	 * <b>Note:</b> this will not copy any current property value!
	 *
	 * @method copy
	 * @return {Property} The copied Property.
	 */
	copy() {
		const copy = new Property(this.id, this.getter, this.setter);
		copy.value = this.value;
		return copy;
	}

	/**
	 * Calls the getter attached to the property to retrieve the value of this property.
	 *
	 * @method getValue
	 * @return {Variable} Value that was retrieved.
	 */
	getValue(...args) {
		if (this.getter) {
			// var args = Array.prototype.slice.call(arguments);
			const argList = args.slice(0);
			// The first parameter is expected to be the scope of defined getter, i.e. getter is called in scope of
			// first parameter.
			const scope = argList.shift();
			// pop of first element, which is the scope...
			return this._callFunction(this.getter, argList, scope);
		}
		return this.value;
	}

	/**
	 * Sets a value using the setter associated with this property.
	 *
	 * @method setValue
	 * @param {Object} scope Scope to use when calling the setter.
	 * @param {[]} args Argument to pass to setter.
	 */
	setValue(scope, ...args) {
		if (this.setter) {
			// var args = Array.prototype.slice.call(arguments);
			// const argList = args.slice(0);
			// scope = argList.shift();
			// pop of first element, which is the scope...
			this._callFunction(this.setter, args, scope);
		} else {
			this.value = args;
		}
	}

	_callFunction(funcOrString, args, scope) {
		if (funcOrString !== undefined) {
			const func = Strings.isString(funcOrString) ? scope[funcOrString] : funcOrString;
			return func.apply(scope, args);
		}
		return undefined;
	}

	/**
	 * Association a category with this property.
	 *
	 * @method setCategory
	 * @param {String} name Name of category.
	 */

	setCategory(name) {
		this.category = name;
	}

	/**
	 * Get the current category of this property.
	 *
	 * @method getCategory
	 * @return {String} Current category.
	 */

	getCategory() {
		return this.category;
	}
}

/**
 * Special Class to provide a property, which uses an attribute path. Attribute path can
 * be used to identify the attribute associated with the property and to automatically
 * deduct the getter and setter for this attribute.
 *
 * @class IndexProperty
 * @extends Property
 * @constructor
 * @param {String} path Path of attribute attached to this property.
 */
class AttributeProperty extends Property {
	constructor(path) {
		super(path);
		this.path = path;
	}

	static copy() {
		const copy = new AttributeProperty(this.path);
		copy.value = this.value;
		return copy;
	}

	getValue(...args) {
		// const argList = args.slice(0);
		// const scope = argList.shift();
		// pop of first element, which is the scope...
		const attr = args[0].getAttributeAtPath(this.path);
		return attr !== undefined ? attr.getExpression() : this.value;
	}

	setValue(scope, ...args) {
		// const argList = args.slice(0);
		// pop of first element, which is the scope...
		// var scope = args.shift();
		// pop of next element, which is the new value...
		const value = args[0]; // .shift();
		scope.setAttributeAtPath(this.path, value);
		this.value = value;
	}
}

module.exports = Property;
