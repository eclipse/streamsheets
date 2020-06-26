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
const Property = require('./Property');

/**
 * Special Class to provide a property, which passes an index as the first
 * argument, when calling the getter or setter. A property provides a getter and setter function to manipulate the
 * value of an attribute that is associated with it. Which attribute is associated with the property can be identified
 * by a unique id that has to be defined for the property.
 *
 * @class IndexProperty
 * @extends Property
 * @constructor
 * @param {String} id Name of property.
 * @param {String/Function} getter Function name of function or function to retrieve property value.
 * @param {String/Function} setter Function name of function or function to set property value
 * @param {Number} index Index to use, when calling the getter or setter.
 */

class IndexProperty extends Property {
	constructor(id, getter, setter, index) {
		super(id, getter, setter);
		this.index = index;
	}

	copy() {
		const copy = new IndexProperty(this.id, this.getter, this.setter, this.index);
		copy.value = this.value;
		return copy;
	}

	_callFunction(funcOrString, args, scope) {
		args.unshift(this.index);
		return super._callFunction(funcOrString, args, scope);
	}
}

module.exports = IndexProperty;
