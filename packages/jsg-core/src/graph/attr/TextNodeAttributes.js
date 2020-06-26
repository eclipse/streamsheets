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
const ItemAttributes = require('./ItemAttributes');
const BooleanAttribute = require('./BooleanAttribute');
const NumberAttribute = require('./NumberAttribute');

const NAME = 'TextNodeAttributes';
const TemplateID = 'TextNodeAttributes.Template';


/**
 * An AttributeList which defines Attributes and default values for
 * {{#crossLink "TextNode"}}{{/crossLink}}s.
 * This list is based on {{#crossLink "ItemAttributes"}}{{/crossLink}}.
 *
 * @class TextNodeAttributes
 * @extends ItemAttributes
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class TextNodeAttributes extends ItemAttributes {
	constructor(mapExpr) {
		super(mapExpr);
		this.setParent(TextNodeAttributes.template);
	}

	newInstance(mapExpr) {
		return new TextNodeAttributes(mapExpr);
	}

	getClassString() {
		return 'TextNodeAttributes';
	}

	/**
	 * Returns the current size mode attribute.</br>
	 * The value of returned attribute is either an <code>Expression</code> or one of the predefined
	 * {{#crossLink "TextNodeAttributes.SizeMode"}}{{/crossLink}} constants.
	 * @method getSizeMode
	 * @return {Attribute} The current size mode attribute.
	 */
	getSizeMode() {
		return this.getAttribute(TextNodeAttributes.SIZEMODE);
	}

	/**
	 * Sets the new size mode.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setSizeMode
	 * @param {BooleanExpression | TextNodeAttributes.SizeMode} sizemode The new size mode.
	 */
	setSizeMode(sizemode) {
		this.setAttribute(TextNodeAttributes.SIZEMODE, sizemode);
	}

	/**
	 * Returns the current size mode attribute.
	 * @method getMinimumHeight
	 * @return {Number} The current minimum height in 1/100th mm.
	 * @since 2.0.0
	 */
	getMinimumHeight() {
		return this.getAttribute(
			TextNodeAttributes.MINIMUMHEIGHT
		);
	}

	/**
	 * Sets the new minimum height.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setMinimumHeight
	 * @param {Number} height The new minimum height.
	 * @since 2.0.0
	 */
	setMinimumHeight(height) {
		this.setAttribute(
			TextNodeAttributes.MINIMUMHEIGHT,
			height
		);
	}

	/**
	 * Returns the current size mode attribute.
	 * @method getMaximumHeight
	 * @return {Number} The current maximum height in 1/100th mm.
	 * @since 2.0.1
	 */
	getMaximumHeight() {
		return this.getAttribute(
			TextNodeAttributes.MAXIMUMHEIGHT
		);
	}

	/**
	 * Sets the new maximum height. A maximum height of 0 corresponds to no maximum height.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setMaximumHeight
	 * @param {Number} height The new maximum height.
	 * @since 2.0.1
	 */
	setMaximumHeight(height) {
		this.setAttribute(
			TextNodeAttributes.MAXIMUMHEIGHT,
			height
		);
	}

	/**
	 * Returns the associated attribute. If a text is associated to its parent node, the selection behavior differs.
	 * @method getAssociated
	 * @return {boolean} The current associate state.
	 * @since 2.0.14.18
	 */
	getAssociated() {
		return this.getAttribute(TextNodeAttributes.ASSOCIATED);
	}

	/**
	 * Sets the new associated state. If a text is associated to its parent node, the selection behavior differs.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setAssociated
	 * @param {boolean} associated The new maximum height.
	 * @since 2.0.14.18
	 */
	setAssociated(associated) {
		this.setAttribute(
			TextNodeAttributes.ASSOCIATED,
			associated
		);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !==
				TextNodeAttributes.Template_ID
		);
	}
	// OUR PREDEFINED ATTRIBUTES:
	/**
	 * Predefined constant to reference size mode attribute.
	 *
	 * @property SIZEMODE
	 * @type {String}
	 * @static
	 * @for TextNodeAttributes
	 */
	static get SIZEMODE() {
		return 'sizemode';
	}

	/**
	 * Predefined constant to define a minimum height for a text node.
	 *
	 * @property MINIMUMHEIGHT
	 * @type {String}
	 * @static
	 * @for TextNodeAttributes
	 */
	static get MINIMUMHEIGHT() {
		return 'minimumheight';
	}

	/**
	 * Predefined constant to define a maximum height for a text node.
	 *
	 * @property MAXIMUMHEIGHT
	 * @type {String}
	 * @static
	 * @for TextNodeAttributes
	 */
	static get MAXIMUMHEIGHT() {
		return 'maximumheight';
	}

	/**
	 * Predefined constant to define the behavior for a text node. If a text node is associated to a node,
	 * its selection behavior differs from a free text node
	 *
	 * @property ASSOCIATED
	 * @type {boolean}
	 * @static
	 * @for TextNodeAttributes
	 */
	static get ASSOCIATED() {
		return 'associated';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const ATTR = ItemAttributes;
		const TXT_ATTR = TextNodeAttributes;
		const attributes = new TextNodeAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		// we base our def. template on ItemAttributes.Template, so:
		attributes.setParent(ItemAttributes.template);
		addAttribute(new BooleanAttribute(ATTR.CONTAINER), false);
		addAttribute(
			new NumberAttribute(ATTR.PORTMODE),
			ItemAttributes.PortMode.NONE
		);
		addAttribute(new BooleanAttribute(ATTR.SNAPTO), false);
		addAttribute(new BooleanAttribute(TXT_ATTR.ASSOCIATED), true);

		addAttribute(new NumberAttribute(ATTR.MARGINLEFT), 150);
		addAttribute(new NumberAttribute(ATTR.MARGINRIGHT), 150);
		addAttribute(new NumberAttribute(ATTR.MARGINTOP), 150);
		addAttribute(new NumberAttribute(ATTR.MARGINBOTTOM), 150);
		addAttribute(
			new NumberAttribute(TXT_ATTR.SIZEMODE),
			TXT_ATTR.SizeMode.TEXT
		);
		addAttribute(new NumberAttribute(TXT_ATTR.MINIMUMHEIGHT), 0);
		addAttribute(new NumberAttribute(TXT_ATTR.MAXIMUMHEIGHT), 0);

		return attributes.toTemplate(TextNodeAttributes.TemplateID);
	}
}

/**
 * Size mode definitions.</br>
 * These constants influence how the size of a {{#crossLink "TextNode"}}{{/crossLink}}
 * is calculated.
 * @class TextNodeAttributes.SizeMode
 */
TextNodeAttributes.SizeMode = {
	/**
	 * Specifies that the size of a {{#crossLink "TextNode"}}{{/crossLink}} is
	 * defined is not changed by its current text content. There will be no wrapping or ellipsis effect.
	 * @property {Number} TEXT
	 * @final
	 */
	NONE: 0,
	/**
	 * Default size mode.</br>
	 * Specifies that the size of a {{#crossLink "TextNode"}}{{/crossLink}} is
	 * defined by its current text content.
	 * @property {Number} TEXT
	 * @final
	 */
	TEXT: 1,
	/**
	 * Specifies that the size of a {{#crossLink "TextNode"}}{{/crossLink}} is
	 * defined by its current width, i.e. the width is constant and only its height grows.</br>
	 * Note: this means that the TextNode text is wrapped.
	 * @property {Number} WIDTH
	 * @final
	 */
	WIDTH: 2,
	/**
	 * Specifies that the visible text within a {{#crossLink "TextNode"}}{{/crossLink}} is
	 * limited by its current height.</br> Any text that does not fit into the textnode area will be cut off.
	 * This is visualized by ellipsing the text. This flag has to be combined with the WIDTH flag.
	 * @property {Number} HEIGHT
	 * @final
	 * @since 1.6.7
	 */
	HEIGHT: 4
};

TextNodeAttributes.template = TextNodeAttributes.createTemplate();

module.exports = TextNodeAttributes;
