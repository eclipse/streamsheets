/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
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
const NumberAttribute = require('./NumberAttribute');

const TemplateID = 'LayoutCellAttributes.Template';

/**
 * An AttributeList which can be used by {{#crossLink "Layout"}}{{/crossLink}} instances to store
 * layout specific settings as {{#crossLink "Attribute"}}{{/crossLink}}s.
 *
 * @class LayoutCellAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class LayoutCellAttributes extends AttributeList {
	constructor(mapExpr) {
		super(LayoutCellAttributes.NAME, mapExpr);
		this.setParent(LayoutCellAttributes.template);
	}

	newInstance(mapExpr) {
		return new LayoutCellAttributes(mapExpr);
	}

	getClassString() {
		return 'LayoutCellAttributes';
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
		return this.getAttribute(LayoutCellAttributes.LAYOUT);
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
		this.setAttribute(LayoutCellAttributes.LAYOUT, type);
	}

	/**
	 * Returns the layout enabled attribute attached to a GraphItem. This attribute simply defines if currently used
	 * {{#crossLink "Layout"}}{{/crossLink}} is should be applied or not.<br/>
	 * Please see {{#crossLink "LayoutCellAttributes/isEnabled:method"}}{{/crossLink}} too.
	 *
	 * @method getEnabled
	 * @return {Attribute} Attribute with current layout enabled state.
	 */
	getEnabled() {
		return this.getAttribute(LayoutCellAttributes.ENABLED);
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

	getGap() {
		return this.getAttribute(LayoutCellAttributes.GAP);
	}

	setGap(value) {
		this.setAttribute(LayoutCellAttributes.GAP, value);
	}

	getMargin() {
		return this.getAttribute(LayoutCellAttributes.MARGIN);
	}

	setMargin(value) {
		this.setAttribute(LayoutCellAttributes.MARGIN, value);
	}

	getSections() {
		return this.getAttribute(LayoutCellAttributes.SECTIONS);
	}

	setSections(value) {
		this.setAttribute(LayoutCellAttributes.SECTIONS, value);
	}

	getMergeCount() {
		return this.getAttribute(LayoutCellAttributes.MERGECOUNT);
	}

	setMergeCount(value) {
		this.setAttribute(LayoutCellAttributes.MERGECOUNT, value);
	}
	/**
	 * Specifies if the {{#crossLink "Layout"}}{{/crossLink}} defined by
	 * {{#crossLink "LayoutCellAttributes/getLayout:method"}}{{/crossLink}} is should be applied or not.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setEnabled
	 * @param {BooleanExpression | Boolean} doIt Enable or disable current <code>Layout</code>.
	 */
	setEnabled(doIt) {
		this.setAttribute(LayoutCellAttributes.ENABLED, doIt);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== LayoutCellAttributes.TemplateID
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
		return 'LayoutCellAttributes';
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

	static get SECTIONS() {
		return 'sections';
	}

	static get GAP() {
		return 'gap';
	}

	static get MARGIN() {
		return 'margin';
	}

	static get MERGECOUNT() {
		return 'mergecound';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const attributes = new LayoutCellAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		addAttribute(new StringAttribute(LayoutCellAttributes.LAYOUT), 'row');
		addAttribute(new BooleanAttribute(LayoutCellAttributes.ENABLED), true);
		addAttribute(new NumberAttribute(LayoutCellAttributes.SECTIONS), 2);
		addAttribute(new NumberAttribute(LayoutCellAttributes.MARGIN), 200);
		addAttribute(new NumberAttribute(LayoutCellAttributes.GAP), 200);
		addAttribute(new NumberAttribute(LayoutCellAttributes.MERGECOUNT), 0);

		return attributes.toTemplate(LayoutCellAttributes.TemplateID);
	}
}

LayoutCellAttributes.template = LayoutCellAttributes.createTemplate();

module.exports = LayoutCellAttributes;
