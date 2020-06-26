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
const MapExpressionUpperCase = require('../expr/MapExpressionUpperCase');
const ConstAttribute = require('./ConstAttribute');
const ConstAttributeList = require('./ConstAttributeList');
const AttributeList = require('./AttributeList');

/**
 * A <code>Template</code> is a {{#crossLink "ConstAttributeList"}}{{/crossLink}} which is used to
 * globally predefine <code>Attributes</code>. It can be used as a parent for any {{#crossLink
 * "AttributeList"}}{{/crossLink}}. The recommended way to create a <code>Template</code> is by using
 * {{#crossLink "Template/fromList:method"}}{{/crossLink}} or by simply call {{#crossLink
 * "AttributeList/toTemplate:method"}}{{/crossLink}} from an arbitrary
 * <code>AttributeList</code>.<br/>
 * <code>Templates</code> are stored using a {{#crossLink "TemplateStore"}}{{/crossLink}} which provides
 * global access. <b>Note:</b> therefore it is a mandatory that the <code>Template</code> name is globally unique.
 *
 * @class Template
 * @extends ConstAttributeList
 * @constructor
 * @param {String} name A unique name for this Template.
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class Template extends ConstAttributeList {
	constructor(name, mapExpr) {
		super(name, mapExpr);
		this.isTemplate = true;
	}

	/**
	 * Creates a new <code>Template</code> from given <code>AttributeList</code>.</br>
	 * Note: the given <code>AttributeList</code> should correctly implement {{#crossLink
	 * "Attribute/getClassString:method"}}{{/crossLink}} so that an instance of it can be created by
	 * calling {{#crossLink "ConstAttributeList/toList:method"}}{{/crossLink}}.
	 *
	 * @method fromList
	 * @param {AttributeList} attrlist The list of attributes to create the <code>Template</code> from.
	 * @param {String} [name] An optional name for the new <code>Template</code>. If not provided the name of
	 * given <code>AttributeList</code> is used.
	 * @return {Template} A new <code>Template</code> based on given <code>AttributeList</code>.
	 * @static
	 */
	static fromList(attrlist, name) {
		const mapExpr = new MapExpressionUpperCase();

		attrlist.getExpression().iterate((id, attr) => {
			attr = ConstAttribute.fromAttribute(attr);
			mapExpr.putElement(id, attr);
		});
		const template = new Template(name || attrlist.getName(), mapExpr);
		template._clname = attrlist.getClassString();
		template.setParent(attrlist.getParent());
		return template;
	}

	/**
	 * Updates this <code>Template</code> with the attributes from given list or array.<br/>
	 * Note: attributes which are within <code>Template</code> will be replaced and attributes which are not in
	 * <code>Template</code> will be added.
	 *
	 * @method update
	 * @param {Array | AttributeList} list A list or array of attributes which define the new
	 *     <code>Template</code> settings.
	 * @return {Boolean} <code>true</code> if specified <code>Template</code> was changed, <code>false</code>
	 *     otherwise.
	 * @since 1.6.0
	 */
	update(list) {
		let changed = false;
		let oldattr;

		const visit = (attr) => {
			changed = true;
			// simply replace old attribute... -> works because AttributeReference uses path to reference attribute...
			oldattr = attr.isConst ? attr : ConstAttribute.fromAttribute(attr);
			AttributeList.addAttributeToList(oldattr, this);
		};

		if (Array.isArray(list)) {
			list.forEach(visit);
		} else {
			// assume passed list is of type AttributeList
			list.iterate(visit);
		}
		return changed;
	}

	/**
	 * Updates the {{#crossLink "Attribute"}}{{/crossLink}} specified by given name.<br/>
	 * Note: if the attribute is not within this template or within its parent hierarchy calling this method has no
	 * effect.
	 *
	 * @method updateAttribute
	 * @param {String} name The name of the <code>Attribute</code> to change.
	 * @param {BooleanExpression | Object} value The new value or Expression.
	 * @return {Boolean} <code>true</code> if specified <code>Attribute</code> was changed, <code>false</code>
	 *     otherwise.
	 * @since 1.6.0
	 */
	updateAttribute(name, value) {
		let changed = false;
		let oldattr = this.getAttribute(name);

		if (oldattr) {
			oldattr = oldattr.isConst ? oldattr.toAttribute() : oldattr;
			changed = oldattr.setExpressionOrValue(value);
			if (changed) {
				oldattr = ConstAttribute.fromAttribute(oldattr);
				AttributeList.addAttributeToList(oldattr, this);
			}
		}
		return changed;
	}
}

module.exports = Template;
