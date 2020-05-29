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
const AttributeList = require('./AttributeList');
const StringAttribute = require('./StringAttribute');
const BooleanAttribute = require('./BooleanAttribute');

const TemplateID = 'LayoutAttributes.Template';

/**
 * An AttributeList which can be used by {{#crossLink "Layout"}}{{/crossLink}} instances to store
 * layout specific settings as {{#crossLink "Attribute"}}{{/crossLink}}s.
 *
 * @class LayoutAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class LayoutAttributes extends AttributeList {
	constructor(mapExpr) {
		super(LayoutAttributes.NAME, mapExpr);
		this.setParent(LayoutAttributes.template);
	}

	newInstance(mapExpr) {
		return new LayoutAttributes(mapExpr);
	}

	getClassString() {
		return 'LayoutAttributes';
	}

	copy() {
		return this.newInstance(this._value.copy());
	}

	/**
	 * Returns the Layout attribute attached to a GraphItem. This attribute simply defines the layout type currently
	 * used. To get the <code>Layout</code> instance use {{#crossLink
	 * "LayoutFactory/getLayout:method"}}{{/crossLink}}.
	 *
	 * @method getLayout
	 * @return {Attribute} Attribute with current layout name.
	 */
	getLayout() {
		return this.getAttribute(LayoutAttributes.LAYOUT);
	}

	/**
	 * Sets the type of the <code>Layout</code> to use for a GraphItem.<br/>
	 * For more information about <code>Layout</code>s refer to {{#crossLink
	 * "LayoutFactory"}}{{/crossLink}}.<br/> Note: if this AttributeList is attached to a GraphItem
	 * attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLayout
	 * @param {StringExpression | String} type Layout type of the layout to be used.
	 */
	setLayout(type) {
		this.setAttribute(LayoutAttributes.LAYOUT, type);
	}

	/**
	 * Returns the layout enabled attribute attached to a GraphItem. This attribute simply defines if currently used
	 * {{#crossLink "Layout"}}{{/crossLink}} is should be applied or not.<br/>
	 * Please see {{#crossLink "LayoutAttributes/isEnabled:method"}}{{/crossLink}} too.
	 *
	 * @method getEnabled
	 * @return {Attribute} Attribute with current layout enabled state.
	 */
	getEnabled() {
		return this.getAttribute(LayoutAttributes.ENABLED);
	}

	/**
	 * Convenience method which returns the enabled state for currently used {{#crossLink
	 * "Layout"}}{{/crossLink}}.<br/>
	 *
	 * @method isEnabled
	 * @return {Boolean} Returns <code>true</code> if current <code>Layout</code> is enabled, <code>false</code>
	 *     otherwise.
	 */
	isEnabled() {
		const enabled = this.getEnabled();
		return enabled ? enabled.getValue() : true;
	}

	/**
	 * Specifies if the {{#crossLink "Layout"}}{{/crossLink}} defined by
	 * {{#crossLink "LayoutAttributes/getLayout:method"}}{{/crossLink}} is should be applied or not.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setEnabled
	 * @param {BooleanExpression | Boolean} doIt Enable or disable current <code>Layout</code>.
	 */
	setEnabled(doIt) {
		this.setAttribute(LayoutAttributes.ENABLED, doIt);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== LayoutAttributes.TemplateID
		);
	}
	/**
	 * Our unique name constant.
	 *
	 * @property NAME
	 * @type {String}
	 * @static
	 */
	static get NAME() {
		return 'layoutattributes';
	}

	/**
	 * Predefined constant to reference layout attribute which specifies the {{#crossLink
	 * "Layout"}}{{/crossLink}} type. To get the <code>Layout</code> instance use {{#crossLink
	 * "LayoutFactory/getLayout:method"}}{{/crossLink}}.<br/>
	 *
	 * @property LAYOUT
	 * @type {String}
	 * @static
	 */
	static get LAYOUT() {
		return 'layout';
	}
	/**
	 * Predefined constant to reference enabled attribute which specifies if currently used {{#crossLink
	 * "Layout"}}{{/crossLink}} should be applied or not.<br/>
	 *
	 * @property ENABLED
	 * @type {String}
	 * @static
	 */
	static get ENABLED() {
		return 'enabled';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const attributes = new LayoutAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		addAttribute(new StringAttribute(LayoutAttributes.LAYOUT), 'None');
		addAttribute(new BooleanAttribute(LayoutAttributes.ENABLED), true);

		return attributes.toTemplate(LayoutAttributes.Template_ID);
	}
}

LayoutAttributes.template = LayoutAttributes.createTemplate();

module.exports = LayoutAttributes;
