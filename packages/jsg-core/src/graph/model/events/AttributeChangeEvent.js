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
const Event = require('./Event');
const Arrays = require('../../../commons/Arrays');

/**
 * A special event subclass to handle the value change of an {{#crossLink "Attribute"}}{{/crossLink}}.
 * <b>Note:</b> in case of an {{#crossLink "AttributeList"}}{{/crossLink}} the
 * <code>newValue</code> contains the added or removed attribute and
 * {{#crossLink "AttributeChangeEvent/getOldValue:method"}}{{/crossLink}}
 * always returns <code>undefined</code>
 *
 *
 * @class AttributeChangeEvent
 * @constructor
 * @extends Event
 * @param {String} detailId One of the predefined detail IDs to classify the kind of change.
 * @param {Attribute} attribute The attribute that will be changed.
 * @param {BooleanExpression | Object} newValue The new attribute value.
 */
class AttributeChangeEvent extends Event {
	constructor(detailId, attribute, newValue) {
		super();
		this.id = Event.ATTRIBUTE;
		this.detailId = detailId;

		this._attribute = attribute;
		this._newValue = newValue;
		/* eslint-disable global-require */
		/* eslint-enable global-require */
		this._oldValue =
			attribute === undefined || this.isAttributeList(attribute) ? undefined : attribute.getExpression().copy();
	}

	isAttributeList(attribute) {
		return attribute.isList();
	}

	set(detailId, attribute, newValue) {
		this.detailId = detailId;
		this._attribute = attribute;
		this._newValue = newValue;
		this._oldValue =
			attribute === undefined || this.isAttributeList(attribute) ? undefined : attribute.getExpression().copy();
	}

	/**
	 * Checks if the {{#crossLink "AttributeList"}}{{/crossLink}} the modified attribute
	 * belongs to has given name. If the modified attribute itself is an attribute-list then its name is checked.
	 *
	 * @method isCategory
	 * @param {String} name The name of the attributes parent AttributeList.
	 * @return {Boolean} <code>true</code> if the attribute parent has specified name, <code>false</code> otherwise.
	 */
	isCategory(name) {
		const parent = this.isAttributeList(this._attribute) ? this._attribute : this._attribute.getAttributeList();
		const category = parent ? parent.getName() : undefined;
		return category === name;
	}

	/**
	 * Checks if the name of modified attribute is equal to one of the provided names.
	 *
	 * @method hasAttribute
	 * @param {String} names* A list of names to check the attribute name against.
	 * @return {Boolean} <code>true</code> if at least on name matches the attribute name, <code>false</code> otherwise.
	 */
	hasAttribute(...args) {
		let res = false;
		const name = this._attribute.getName();
		const _names = Arrays.toArray(args);
		let i;

		for (i = 0; i < _names.length; i += 1) {
			if (_names[i] === name) {
				res = true;
				break;
			}
		}
		return res;
	}

	/**
	 * Returns the modified attribute.
	 *
	 * @method getAttribute
	 * @return {Attribute} The modified attribute.
	 */
	getAttribute() {
		return this._attribute;
	}

	/**
	 * Returns the new value for changed attribute.
	 *
	 * @method getNewValue
	 * @return {BooleanExpression} The new value for changed attribute.
	 */
	getNewValue() {
		return this._newValue;
	}

	/**
	 * Returns the old attribute value.
	 *
	 * @method getOldValue
	 * @return {BooleanExpression} The old attribute value or <code>undefined</code>.
	 */
	getOldValue() {
		return this._oldValue;
	}

	/**
	 * Detail event id to signal that an {{#crossLink "Attribute"}}{{/crossLink}} was
	 * added to an {{#crossLink "AttributeList"}}{{/crossLink}}.
	 *
	 * @property ADD
	 * @type {String}
	 * @static
	 */
	static get ADD() {
		return 'attribute.add';
	}
	/**
	 * Detail event id to signal that an {{#crossLink "Attribute"}}{{/crossLink}} was
	 * removed from an {{#crossLink "AttributeList"}}{{/crossLink}}.
	 *
	 * @property REMOVE
	 * @type {String}
	 * @static
	 */
	static get REMOVE() {
		return 'attribute.remove';
	}

	/**
	 * Detail event id to signal that the value of an {{#crossLink "Attribute"}}{{/crossLink}}
	 * was changed.
	 *
	 * @property CHANGE
	 * @type {String}
	 * @static
	 * @deprecated use {{#crossLink "AttributeChangeEvent/VALUE:property"}}{{/crossLink}} instead.
	 */
	static get CHANGE() {
		return 'attribute.change';
	}
	/**
	 * Detail event id to signal that the value of an {{#crossLink "Attribute"}}{{/crossLink}}
	 * was changed.
	 *
	 * @property VALUE
	 * @type {String}
	 * @static
	 */
	static get VALUE() {
		return 'attribute.value';
	}

	/**
	 * Detail event id to signal that several attributes of an {{#crossLink "AttributeList"}}{{/crossLink}}
	 * were changed. The {{#crossLink "AttributeChangeEvent/getNewValue:method"}}{{/crossLink}}
	 * returns a {{#crossLink "Dictionary"}}{{/crossLink}} with attribute names and their new values.
	 *
	 * @property BULK
	 * @type {String}
	 * @static
	 */
	static get BULK() {
		return 'attribute.bulk';
	}
}

module.exports = AttributeChangeEvent;
