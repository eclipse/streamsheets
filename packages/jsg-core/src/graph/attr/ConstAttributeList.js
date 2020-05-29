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
const MapExpressionUpperCase = require('../expr/MapExpressionUpperCase');
const AttributeList = require('./AttributeList');
const ConstAttribute = require('./ConstAttribute');

/**
 * A <code>ConstAttributeList</code> is an immutable {{#crossLink "AttributeList"}}{{/crossLink}}. That
 * means that after its creation <code>Attribute</code>s cannot, or should not, be added or removed. To achieve this
 * all
 * methods which add or remove <code>Attribute</code>s to or from this list are overwritten. Usually the
 * <code>Attribute</code>s of a <code>ConstAttributeList</code> are instances of {{#crossLink
 * "ConstAttribute"}}{{/crossLink}} and therefore immutable too.</br> To create a
 * <code>ConstAttributeList</code> use {{#crossLink "ConstAttributeList/fromList:method"}}{{/crossLink}}
 * and to create a mutable list again use {{#crossLink
 * "ConstAttributeList/toList:method"}}{{/crossLink}}.</br> The main usage of a
 * <code>ConstAttributeList</code> is to act as a base class for {{#crossLink
 * "Template"}}{{/crossLink}}s.
 *
 * @class ConstAttributeList
 * @extends AttributeList
 * @constructor
 * @param {String} name A unique name for this ConstAttributeList
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class ConstAttributeList extends AttributeList {
	constructor(name, mapExpr) {
		super(name, mapExpr);
		this.isConst = true;
		this._clname = undefined;
	}

	/**
	 * Creates a new <code>ConstAttributeList</code> from given <code>AttributeList</code>. The created
	 * <code>ConstAttributeList</code> contains {{#crossLink "ConstAttribute"}}{{/crossLink}}s for each
	 * attribute the provided list contains.</br> The given <code>AttributeList</code> should correctly implement
	 * {{#crossLink "Attribute/getClassString:method"}}{{/crossLink}} so that an instance of it can be
	 * created by calling {{#crossLink "ConstAttributeList/toList:method"}}{{/crossLink}}.
	 *
	 * @method fromList
	 * @param {AttributeList} attrlist The list of attributes to create <code>ConstAttributeList</code>
	 *     from.
	 * @param {String} [name] An optional name for the new <code>ConstAttributeList</code>. If not provided the name of
	 * given <code>AttributeList</code> is used.
	 * @return {ConstAttributeList} A new <code>ConstAttributeList</code> based on given
	 *     <code>AttributeList</code>.
	 * @static
	 */
	static fromList(attrlist, name) {
		const mapExpr = new MapExpressionUpperCase();

		attrlist.getExpression().iterate((id, attr) => {
			attr = ConstAttribute.fromAttribute(attr);
			mapExpr.putElement(id, attr);
		});

		const constlist = new ConstAttributeList(
			name || attrlist.getName(),
			mapExpr
		);
		constlist._clname = attrlist.getClassString();
		constlist.setParent(attrlist.getParent());
		return constlist;
	}

	/**
	 * Creates a new mutable <code>AttributeList</code> containing mutable <code>Attribute</code>s based on this
	 * <code>ConstAttributeList</code>. The returned list is an instance of the class which was automatically set if
	 * this <code>ConstAttributeList</code> was created via {{#crossLink
	 * "ConstAttributeList/fromList:method"}}{{/crossLink}} or which could be defined manually by
	 * calling {{#crossLink "ConstAttributeList/setClassString:method"}}{{/crossLink}}. If no class was
	 * defined the returned list is of type {{#crossLink "AttributeList"}}{{/crossLink}} by default.
	 *
	 * @method toList
	 * @return {AttributeList} A mutable attribute list.
	 */
	toList() {
		let list = ObjectFactory.create(this._clname);
		list = list || new AttributeList();
		list._setName(this.getName());
		list.setParent(this.getParent());
		// convert our attributes to normal attributes...
		this.getExpression().iterate((id, attr) => {
			list.addAttribute(attr.toAttribute());
		});
		return list;
	}

	toAttribute() {
		return this.toList();
	}

	newInstance(mapExpr) {
		let _mexpr;
		if (mapExpr) {
			_mexpr = new MapExpressionUpperCase();
			mapExpr.iterate((id, attr) => {
				_mexpr.putElement(id, attr.copy());
			});
		}
		return new ConstAttributeList(this.getName(), _mexpr);
	}

	copy() {
		return this.newInstance(this.getExpression());
	}

	getClassString() {
		return this._clname || AttributeList.CLASSNAME;
	}

	/**
	 * Defines the class to use for creating a mutable list from this instance. The given class string must contain the
	 * complete path, i.e. it must include the complete namespace. E.g. the class string of an
	 * <code>AttributeList</code> is <code>AttributeList</code>.</br> See {{#crossLink
	 * "ConstAttributeList/toList:method"}}{{/crossLink}} too.
	 *
	 * @method setClassString
	 * @param {String} clstr The complete class string, i.e. including the namespace.
	 */
	setClassString(clstr) {
		this._clname = clstr;
	}

	reset() {}

	addAttribute(/* attribute */) {
		return undefined;
	}

	addAttributeAtPath(/* path, attribute */) {
		return undefined;
	}

	setAttribute(/* name, value */) {
		return false;
	}

	setAttributeAtPath(/* path, value */) {
		return false;
	}

	setAttributeValue(/* attribute, value */) {
		return false;
	}

	removeAttribute(/* attribute */) {
		return undefined;
	}

	_removeAttributeFromList(/* attribute, list */) {
		return undefined;
	}

	removeAttributeAtPath(/* path */) {
		return undefined;
	}

	retainAll(/* attributeList, condition */) {
		return false;
	}

	doSaveClassName() {
		return this.getClassString() !== AttributeList.CLASSNAME;
	}
}

module.exports = ConstAttributeList;
