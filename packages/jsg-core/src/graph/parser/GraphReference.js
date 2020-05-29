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
const { Reference } = require('@cedalo/parser');

const INVALID = -1;
/**
 * An instance of this class is used to reference a certain property of a specified item.</br>
 * Pay attention to the fact that a Reference might not be resolved. In this case the inner used
 * GraphItem is undefined and the {{#crossLink "Reference/getValue:method"}}{{/crossLink}}
 * simply returns the string reference representation.
 * Note: item properties could be structured into different objects. That is why the third parameter
 * is required. The propertyObject actually holds the referenced property.
 *
 * @class Reference
 * @constructor
 * @param {GraphItem} item The referenced GraphItem model.
 * @param {String} property The referenced property.
 * @param {GraphItem|Object} propertyObject The object which actually provides the referenced property..
 */
module.exports = class GraphReference extends Reference {
	constructor(item, property, propertyObject) {
		super();

		this._item = item;
		this._property = property;
		this._propertyObject = propertyObject;
		this._str = undefined;
		// contains the raw string in case of an unresolved reference...
	}

	get target() {
		return this._item;
	}

	/**
	 * Creates a copy of this Reference instance.
	 *
	 * @method copy
	 * @return {Reference} A copy of this Reference instance.
	 */
	copy() {
		const copy = new GraphReference(this._item, this._property, this._propertyObject);
		copy._str = this._str;
		return copy;
	}

	/**
	 * Returns the value of referenced property. </br>
	 * If this Reference is not resolved the raw string which describes this reference operand is returned.
	 * Note: if the property is a Reference too its reference property value is returned.
	 *
	 * @method getValue
	 * @return {Object|String} The value of referenced property or the raw reference description.
	 */
	getValue() {
		return this.value;
	}

	get value() {
		if (this.isResolved()) {
			// value of referenced property could be an expression too:
			const value = this._property.getValue(this._propertyObject);
			// we check for getValue implementation to take Attributes into account!
			return value && value.getValue ? value.getValue() : value;
		}
		// not resolved => simply return raw string...
		return this._str;
	}

	/**
	 * Returns a string representation of this Reference.</br>
	 * If this Reference is not resolved the raw string which describes this reference operand is returned.
	 *
	 * @method toString
	 * @param {GraphItem} [forItem] An optional GraphItem model used to resolve parent references.
	 * @return {String} A string description of this reference or the raw reference description if this
	 * Reference instance is not resolved.
	 */
	toString(forItem, useName) {
		if (this.isResolved() && this._item && this._item.isA === 'GraphItem') {
			const propString = this.getPropertyString();
			if (!forItem) {
				if (useName) {
					return `${this._item.getName().getValue()}!${propString}`;
				}
				return `Item.${this._item.getId()}!${propString}`;
			}

			if (forItem === this._item) {
				return propString;
			}
			if (forItem._parent === this._item) {
				return `Parent!${propString}`;
			}
			if (useName) {
				return `${this._item.getName().getValue()}!${propString}`;
			}
			return `Item.${this._item.getId()}!${propString}`;
		}
		// not resolved => simply return raw string...
		return this._str;
	}

	/**
	 * Returns a string representation of referenced property object. As default this simply returns the
	 * property id. Subclasses may overwrite.<br/>
	 * Note: if this Reference instance is not resolved, the raw property reference string is returned.
	 * E.g. from a raw reference description like <code>Item.2!width</code> only <code>width</code> is
	 * returned in case of an unresolved reference.
	 *
	 * @method getPropertyString
	 * @return {String} The property string representation.
	 */
	getPropertyString() {
		return this.isResolved() ? this._property.id : this._property;
	}

	static get INVALID() {
		return INVALID;
	}
};
