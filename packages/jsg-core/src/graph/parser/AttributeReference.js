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
const GraphReference = require('./GraphReference');

/**
 * An instance of this class is used to reference an {{#crossLink "Attribute"}}{{/crossLink}} of a given
 * item. The attribute is determined by specified <code>path</code> parameter.</br>
 *
 * @class AttributeReference
 * @constructor
 * @param {GraphItem} item The referenced GraphItem model and attribute owner.
 * @param {String} path A path referencing an attribute.
 */
module.exports = class AttributeReference extends GraphReference {
	constructor(item, path) {
		super();
		this._item = item;
		this._path = path;
	}

	get target() {
		return this._item;
	}

	get value() {
		const attr = this.getAttribute();
		return attr ? attr.getValue() : 'undefined';
	}

	/**
	 * Creates a copy of this AttributeReference instance.
	 *
	 * @method copy
	 * @return {AttributeReference} A copy of this AttributeReference instance.
	 */
	copy() {
		return new AttributeReference(this._item, this._path);
	}

	/**
	 * Returns the attribute owner.</br>
	 *
	 * @method getAttributeOwner
	 * @return {GraphItem} item The attribute owner, might be <code>undefined</code>.
	 */
	getAttributeOwner() {
		return this._item;
	}

	/**
	 * Returns the referenced attribute. </br>
	 *
	 * @method getAttribute
	 * @return {Attribute} The referenced attribute, might be <code>undefined</code>.
	 */
	getAttribute() {
		return this._item.getAttributeAtPath(this._path);
	}

	getPropertyString() {
		const attr = this.getAttribute();
		return attr ? attr.getPath() : '';
	}
};
