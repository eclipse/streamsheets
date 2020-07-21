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
const AttributeList = require('./AttributeList');
const NumberAttribute = require('./NumberAttribute');
const FormatAttributes = require('./FormatAttributes');
const StringAttribute = require('./StringAttribute');
const BooleanAttribute = require('./BooleanAttribute');
const RangeConstraint = require('../expr/RangeConstraint');


const NAME = 'textformat';
const TemplateID = 'TextFormatAttributes.Template';

/**
 * This AttributeList defines default attributes for text format of a {{#crossLink
 * "TextNode"}}{{/crossLink}}. The members can be used to directly influence the textformat of a
 * TextNode.
 *
 * @example
 *      var node = new Node();
 *      var label = node.addLabel(new TextNode("Test");
 *      // get textformat attributes for node
 *      var textformat = label.getTextFormat();
 *      // set text to 10 pt and green.
 *      textformat.setFontSize(10);
 *      textformat.setFontColor("#00FF00");
 *
 * @class TextFormatAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined format
 *     attributes.
 */
class TextFormatAttributes extends AttributeList {
	constructor(mapExpr) {
		super(TextFormatAttributes.NAME, mapExpr);
		this.setParent(TextFormatAttributes.template);
	}

	newInstance(mapExpr) {
		return new TextFormatAttributes(mapExpr);
	}

	getClassString() {
		return 'TextFormatAttributes';
	}

	/**
	 * Creates a new list containing only those attributes which have the same value in each of the selected
	 * {{#crossLink "GraphItem"}}{{/crossLink}}s.
	 *
	 * @method retainFromSelection
	 * @param {Array} selection An array of selected <code>GraphItem</code>s.
	 * @return {FormatAttributes} A list containing only those attributes which have the same value in
	 *     each of the selected <code>GraphItem</code>s.
	 * @static
	 */
	static retainFromSelection(selection) {
		function unionCondition(attr1, attr2) {
			return (
				attr1 &&
				attr2 &&
				attr1.getExpression().isEqualTo(attr2.getExpression())
			);
		}

		if (selection.length !== 0) {
			let i;
			let n;
			// copy formats including all template attributes:
			const formats = selection[0]
				.getModel()
				.getTextFormat()
				.toFlatList();

			for (i = 1, n = selection.length; i < n; i += 1) {
				formats.retainAll(
					selection[i].getModel().getTextFormat(),
					unionCondition
				);
			}
			return formats;
		}

		return undefined;
	}

	/**
	 * Applies the values of given TextFormatAttributes to this instance.
	 *
	 * @method setFormatTo
	 * @param {TextFormatAttributes} format The Format object to get the values from.
	 * @return {Boolean} <code>true</code> if at least one attribute was changed, <code>false</code> otherwise.
	 */
	setFormatTo(format, item) {
		this.reset();
		return this.applyMap(format.toMap(), item);
	}

	/**
	 * Applies the text format values to given Graphics object.
	 *
	 * @method applyToGraphics
	 * @param {Graphics} graphics The Graphics object to apply the text format to.
	 * @param {Booleam} [noZoom] Specify <code>true</code> to ignore current zoom for font-size value.
	 */
	applyToGraphics(graphics, noZoom) {
		const TEXTFORMAT = TextFormatAttributes;
		const zoom = noZoom ? graphics.getCoordinateSystem().getZoom(true) : 1;
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setFillColor(
			this.getAttribute(TEXTFORMAT.FONTCOLOR).getValue()
		);
		graphics.setLineColor(
			this.getAttribute(TEXTFORMAT.FONTCOLOR).getValue()
		);
		graphics.setTextBaseline(
			this.getAttribute(TEXTFORMAT.BASELINE).getValue()
		);
		graphics.setTextAlign(
			this.getAttribute(TEXTFORMAT.HORIZONTALALIGN).getValue()
		);
		graphics.setFontName(this.getAttribute(TEXTFORMAT.FONTNAME).getValue());
		graphics.setFontSize(
			this.getAttribute(TEXTFORMAT.FONTSIZE).getValue() / zoom
		);
		graphics.setFontStyle(
			this.getAttribute(TEXTFORMAT.FONTSTYLE).getValue()
		);
	}

	removeFromGraphics(graphics) {
		graphics.setFontStyle(0);
	}

	/**
	 * Get the vertical text alignment. Supported values are defined in {{#crossLink
	 * "TextFormatAttributes.TextBaseline"}}{{/crossLink}}.
	 *
	 * @method getBaseline
	 * @return {Attribute} Baseline alignment attribute.
	 * @since 1.6.3
	 */
	getBaseline() {
		return this.getAttribute(TextFormatAttributes.BASELINE);
	}

	/**
	 * Sets the new text baseline.
	 * Supported values are specified in {{#crossLink
	 * "TextFormatAttributes.TextBaseline"}}{{/crossLink}}.</br> Note: if this AttributeList is attached
	 * to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setBaseline
	 * @param {BooleanExpression | String} baseline The new text baseline to use.
	 * @since 1.6.3
	 */
	setBaseline(baseline) {
		this.setAttribute(TextFormatAttributes.BASELINE, baseline);
	}

	/**
	 * Get the vertical text alignment. Supported values are defined in {{#crossLink
	 * "TextFormatAttributes.VerticalTextAlign"}}{{/crossLink}}.
	 *
	 * @method getVerticalAlignment
	 * @return {Attribute} Vertical text alignment attribute.
	 * @since 2.0.0
	 */
	getVerticalAlignment() {
		return this.getAttribute(TextFormatAttributes.VERTICALALIGN);
	}

	/**
	 * Sets the new vertical text alignment. The vertical alignment is actually defined by the font baseline.
	 * Supported values are specified in {{#crossLink
	 * "TextFormatAttributes.VerticalTextAlign"}}{{/crossLink}}.</br> Note: if this AttributeList is
	 * attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setVerticalAlignment
	 * @param {BooleanExpression | String} baseline The new text baseline to use.
	 * @since 2.0.0
	 */
	setVerticalAlignment(align) {
		this.setAttribute(TextFormatAttributes.VERTICALALIGN, align);
	}

	/**
	 * Get the horizontal text alignment.
	 *
	 * @method getHorizontalAlignment
	 * @return {Attribute} Horizontal text alignment attribute.
	 */
	getHorizontalAlignment() {
		return this.getAttribute(TextFormatAttributes.HORIZONTALALIGN);
	}

	/**
	 * Define the horizontal text alignment.
	 * Supported values are specified in {{#crossLink
	 * "TextFormatAttributes.TextAlignment"}}{{/crossLink}}.</br> Note: if this AttributeList is
	 * attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setHorizontalAlignment
	 * @param {BooleanExpression | String} horizontalAlignment Horizontal text alignment.
	 */
	setHorizontalAlignment(horizontalAlignment) {
		this.setAttribute(
			TextFormatAttributes.HORIZONTALALIGN,
			horizontalAlignment
		);
	}

	/**
	 * Get the vertical text node position within the parent container or edge. The text position for nodes and edges
	 * are defined using different constants. The vertical text position within an edge defines the position along the
	 * line.
	 *
	 * @method getVerticalPosition
	 * @return {Attribute} Current vertical text position attribute.
	 */
	getVerticalPosition() {
		return this.getAttribute(TextFormatAttributes.VERTICALPOSITION);
	}

	/**
	 * Set the vertical text node position within the parent container or edge. The text position for nodes and edges
	 * are defined using different constants. The vertical text position within an edge defines the position along the
	 * line. Therefore you can define a START or END position for a label attached to a line. Just look an the
	 * definitions to choose the appropriate one.</br> Note: if this AttributeList is attached to a GraphItem
	 * attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setVerticalPosition
	 * @param {BooleanExpression | TextFormatAttributes.VerticalTextPosition} position New
	 *     vertical text position.
	 */
	setVerticalPosition(position) {
		this.setAttribute(TextFormatAttributes.VERTICALPOSITION, position);
	}

	/**
	 * Get the horizontal text node position within the parent container. The text position for nodes are defined
	 * using different constants.
	 *
	 * @method getHorizontalPosition
	 * @return {Attribute} Current horizontal text position attribute.
	 */
	getHorizontalPosition() {
		return this.getAttribute(TextFormatAttributes.HORIZONTALPOSITION);
	}

	/**
	 * Set the horizontal text node position within the parent container. The horizontal text position is currently not
	 * used for edges. Just look an the definitions to choose the appropriate one. </br> Note: if this AttributeList is
	 * attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setHorizontalPosition
	 * @param {BooleanExpression | TextFormatAttributes.HorizontalTextPosition} position New
	 *     horizontal text position.
	 */
	setHorizontalPosition(position) {
		this.setAttribute(TextFormatAttributes.HORIZONTALPOSITION, position);
	}

	/**
	 * Get the current line height.
	 *
	 * @method getLineHeight
	 * @return {Attribute} Line height attribute
	 * @since 2.0.20.0
	 */
	getLineHeight() {
		return this.getAttribute(TextFormatAttributes.LINEHEIGHT);
	}

	/**
	 * Define the line height as a multiple of 1.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineHeight
	 * @param {BooleanExpression | Number} lineHeight New line height.
	 * @since 2.0.20.0
	 */
	setLineHeight(lineHeight) {
		this.setAttribute(TextFormatAttributes.LINEHEIGHT, lineHeight);
	}

	/**
	 * Get the current font size.
	 *
	 * @method getFontSize
	 * @return {Attribute} Font size attribute
	 */
	getFontSize() {
		return this.getAttribute(TextFormatAttributes.FONTSIZE);
	}

	/**
	 * Define the font size in points.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFontSize
	 * @param {BooleanExpression | Number} fontSize Font size in points.
	 */
	setFontSize(fontSize) {
		this.setAttribute(TextFormatAttributes.FONTSIZE, fontSize);
	}

	/**
	 * Returm the current font name.
	 *
	 * @method getFontName
	 * @return {Attribute} Current font name attribute.
	 */
	getFontName() {
		return this.getAttribute(TextFormatAttributes.FONTNAME);
	}

	/**
	 * Define the font name to be used.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFontName
	 * @param {BooleanExpression | String} fontName New font name.
	 */
	setFontName(fontName) {
		this.setAttribute(TextFormatAttributes.FONTNAME, fontName);
	}

	/**
	 * Return the current font color. The color is returned as a hexadecimal RGB string, preceded by a '#' char.
	 *
	 * @method getFontColor
	 * @return {Attribute} The current font color attribute.
	 */
	getFontColor() {
		return this.getAttribute(TextFormatAttributes.FONTCOLOR);
	}

	/**
	 * Set the font color. The color must be given as a hexadecimal RGB string, preceded by a '#' char.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFontColor
	 * @param {BooleanExpression | String} fontColor The new font color.
	 */
	setFontColor(fontColor) {
		this.setAttribute(TextFormatAttributes.FONTCOLOR, fontColor);
	}

	/**
	 * Define the new font style.
	 *
	 * @method getFontStyle
	 * @return {Attribute} The current font style attribute.
	 */
	getFontStyle() {
		return this.getAttribute(TextFormatAttributes.FONTSTYLE);
	}

	/**
	 * Define the font style.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFontStyle
	 * @param {NumberExpression | FontStyle} fontStyle The new font style.
	 */
	setFontStyle(fontStyle) {
		this.setAttribute(TextFormatAttributes.FONTSTYLE, fontStyle);
	}

	/**
	 * Gets rich text flag. If enabled, the user can apply text formatting to
	 * text parts.
	 *
	 * @method getRichText
	 * @return {Attribute} The current rich text attribute.
	 */
	getRichText() {
		return this.getAttribute(TextFormatAttributes.RICHTEXT);
	}

	/**
	 * Define the rich text flag. If enabled, the user can apply text formatting to text parts.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setRichText
	 * @param {BooleanExpression | boolean} richText True to enable rich text, otherwise false or an expression.
	 */
	setRichText(richText) {
		this.setAttribute(TextFormatAttributes.RICHTEXT, richText);
	}

	/**
	 * Gets icon id to display instead of text.
	 *
	 * @method getIcon
	 * @return {Attribute} The current icon attribute.
	 */
	getIcon() {
		return this.getAttribute(TextFormatAttributes.ICON);
	}

	/**
	 * Define the icon id. If set, the label displays an icon instead of the text content.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setIcon
	 * @param {BooleanExpression | Number} id Id of to be displayed icon, if 0, no icon is displayed.
	 */
	setIcon(id) {
		this.setAttribute(TextFormatAttributes.ICON, id);
	}

	/**
	 * Set the NumberFormat index for the Style.
	 *
	 * @method setNumberFormat
	 * @param {BooleanExpression} numberFormatIndex You can pass either an expression or a value.
	 * The value will automatically converted into
	 * a static expression.
	 */
	setNumberFormat(numberFormatIndex) {
		this.setAttribute(TextFormatAttributes.NUMBERFORMAT, numberFormatIndex);
	}

	/**
	 * Returns the attribute for the NumberFormat index setting.
	 *
	 * @method getNumberFormat
	 * @return {Attribute} Attribute with current setting for the NumberFormat index.
	 */
	getNumberFormat() {
		return this.getAttribute(TextFormatAttributes.NUMBERFORMAT);
	}

	/**
	 * Set the LocalCulture index for the Style.
	 *
	 * @method setLocalCulture
	 * @param {BooleanExpression} cultureCode You can pass either a value (e.g. 'en-US', 'de-DE' etc.).
	 * The value will automatically converted into
	 * a static expression.
	 */
	setLocalCulture(cultureCode) {
		this.setAttribute(TextFormatAttributes.LOCALCULTURE, cultureCode);
	}

	/**
	 * Returns the attribute for the LocalCulture setting.
	 *
	 * @method getLocalCulture
	 * @return {Attribute} Attribute with current setting for the LocalCulture.
	 */
	getLocalCulture() {
		return this.getAttribute(TextFormatAttributes.LOCALCULTURE);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== TextFormatAttributes.Template_ID
		);
	}

	/**
	 * Our unique name constant.
	 *
	 * @property NAME
	 * @type {String}
	 * @static
	 * @for TextFormatAttributes
	 */
	static get NAME() {
		return NAME;
	}

	/**
	 * Predefined constant to reference icon attribute.
	 *
	 * @property ICON
	 * @type {String}
	 * @static
	 */
	static get ICON() {
		return 'icon';
	}
	/**
	 * Predefined constant to reference baseline attribute.
	 *
	 * @property BASELINE
	 * @type {String}
	 * @static
	 */
	static get BASELINE() {
		return 'baseline';
	}
	/**
	 * Predefined constant to reference vertical align attribute.
	 *
	 * @property VERTICALALIGN
	 * @type {String}
	 * @static
	 */
	static get VERTICALALIGN() {
		return 'valign';
	}
	/**
	 * Predefined constant to reference horizontal align attribute.
	 *
	 * @property HORIZONTALALIGN
	 * @type {String}
	 * @static
	 */
	static get HORIZONTALALIGN() {
		return 'halign';
	}
	/**
	 * Predefined constant to reference font size attribute.
	 *
	 * @property FONTSIZE
	 * @type {String}
	 * @static
	 */
	static get FONTSIZE() {
		return 'fontsize';
	}
	/**
	 * Predefined constant to reference font name attribute.
	 *
	 * @property FONTNAME
	 * @type {String}
	 * @static
	 */
	static get FONTNAME() {
		return 'fontname';
	}
	/**
	 * Predefined constant to reference font color attribute.
	 *
	 * @property FONTCOLOR
	 * @type {String}
	 * @static
	 */
	static get FONTCOLOR() {
		return 'fontcolor';
	}
	/**
	 * Predefined constant to reference font style attribute.
	 *
	 * @property FONTSTYLE
	 * @type {String}
	 * @static
	 */
	static get FONTSTYLE() {
		return 'fontstyle';
	}
	/**
	 * Predefined constant to reference vertical position attribute.
	 *
	 * @property VERTICALPOSITION
	 * @type {String}
	 * @static
	 */
	static get VERTICALPOSITION() {
		return 'vposition';
	}
	/**
	 * Predefined constant to reference horizontal position attribute.
	 *
	 * @property HORIZONTALPOSITION
	 * @type {String}
	 * @static
	 */
	static get HORIZONTALPOSITION() {
		return 'hpostion';
	}
	/**
	 * Predefined constant to reference rich text attribute.
	 *
	 * @property RICHTEXT
	 * @type {String}
	 * @static
	 */
	static get RICHTEXT() {
		return 'richtext';
	}
	/**
	 * Predefined constant to reference line height attribute.
	 *
	 * @property LINEHEIGHT
	 * @type {Number}
	 * @static
	 * @since 2.0.20.0
	 */
	static get LINEHEIGHT() {
		return 'lineheight';
	}
	/**
	 * Predefined constant to reference number format attribute.
	 *
	 * @property NUMBERFORMAT
	 * @type {String}
	 * @static
	 */
	static get NUMBERFORMAT() {
		return 'numberformat';
	}
	/**
	 * Predefined constant to reference local culture attribute.
	 *
	 * @property LOCALCULTURE
	 * @type {String}
	 * @static
	 */
	static get LOCALCULTURE() {
		return 'localculture';
	}

	static get TemplateID() {
		return TemplateID;
	}

	static createTemplate() {
		const TEXTFORMAT = TextFormatAttributes;
		const attributes = new TextFormatAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		addAttribute(new NumberAttribute(TEXTFORMAT.FONTSIZE), 8);
		addAttribute(new StringAttribute(TEXTFORMAT.FONTNAME), 'Verdana');
		addAttribute(new StringAttribute(TEXTFORMAT.FONTCOLOR), JSG.theme.text);
		addAttribute(
			new NumberAttribute(TEXTFORMAT.FONTSTYLE),
			TEXTFORMAT.FontStyle.NORMAL
		);

		addAttribute(
			new NumberAttribute(TEXTFORMAT.VERTICALPOSITION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				TEXTFORMAT.VerticalTextPosition,
				TEXTFORMAT.VerticalTextPosition.CENTER
			)
		);
		addAttribute(
			new NumberAttribute(TEXTFORMAT.VERTICALALIGN),
			undefined,
			RangeConstraint.fromPropertiesOf(
				TEXTFORMAT.VerticalTextAlignment,
				TEXTFORMAT.VerticalTextAlignment.CENTER
			)
		);
		addAttribute(
			new StringAttribute(TEXTFORMAT.BASELINE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				TEXTFORMAT.TextBaseline,
				TEXTFORMAT.TextBaseline.ALPHABETIC
			)
		);
		addAttribute(
			new NumberAttribute(TEXTFORMAT.HORIZONTALPOSITION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				TEXTFORMAT.HorizontalTextPosition,
				TEXTFORMAT.HorizontalTextPosition.CENTER
			)
		);
		addAttribute(
			new NumberAttribute(TEXTFORMAT.HORIZONTALALIGN),
			undefined,
			RangeConstraint.fromPropertiesOf(
				TEXTFORMAT.TextAlignment,
				TEXTFORMAT.TextAlignment.CENTER
			)
		);

		addAttribute(new BooleanAttribute(TEXTFORMAT.RICHTEXT), true);
		addAttribute(new NumberAttribute(TEXTFORMAT.ICON), 0);
		addAttribute(new NumberAttribute(TEXTFORMAT.LINEHEIGHT), 1.2);
		addAttribute(new StringAttribute(TEXTFORMAT.NUMBERFORMAT), 'General');
		addAttribute(new StringAttribute(TEXTFORMAT.LOCALCULTURE), 'general');

		return attributes.toTemplate(TextFormatAttributes.TemplateID);
	}
}

/**
 * Text alignment definitions
 * @class TextFormatAttributes.TextAlignment
 */
TextFormatAttributes.TextAlignment = {
	/**
	 * Left align text.
	 * @property {Number} LEFT
	 * @final
	 */
	LEFT: 0,
	/**
	 * Center text horizontally.
	 * @property {Number} CENTER
	 * @final
	 */
	CENTER: 1,
	/**
	 * Right align text.
	 * @property {Number} RIGHT
	 * @final
	 */
	RIGHT: 2,
	DEFAULT: 3
};

/**
 * Text alignment definitions
 * @class TextFormatAttributes.VerticalTextAlignment
 */
TextFormatAttributes.VerticalTextAlignment = {
	/**
	 * Top align text.
	 * @property {Number} TOP
	 * @final
	 */
	TOP: 0,
	/**
	 * Center text vertically.
	 * @property {Number} CENTER
	 * @final
	 */
	CENTER: 1,
	/**
	 * Bottom align text.
	 * @property {Number} BOTTOM
	 * @final
	 */
	BOTTOM: 2
};
/**
 * Text baseline definitions. This class specifies constants for supported font baseline values which define a vertical
 * text alignment.
 * @class TextFormatAttributes.TextBaseline
 * @since 1.6.3
 */
TextFormatAttributes.TextBaseline = {
	/**
	 * Aligns text below baseline.
	 * @property {String} TOP
	 * @final
	 */
	TOP: 'top',
	/**
	 * Specifies a hanging text alignment which results in a bit lower align then
	 * {{#crossLink "TextFormatAttributes.TextBaseline/TOP:property"}}{{/crossLink}}.
	 * @property {String} HANGING
	 * @final
	 */
	HANGING: 'hanging',
	/**
	 * Vertically centers text.
	 * @property {String} MIDDLE
	 * @final
	 */
	MIDDLE: 'middle',
	/**
	 * Moves the baseline at the vertical bottom of fonts like Latin or Arabic.
	 * @property {String} ALPHABETIC
	 * @final
	 */
	ALPHABETIC: 'alphabetic',
	/**
	 * Moves the baseline at the horizontal bottom of fonts like Hangul or Hiragana.
	 * @property {String} IDEOGRAPHIC
	 * @final
	 */
	IDEOGRAPHIC: 'ideographic',
	/**
	 * Aligns the text above baseline.
	 * @property {String} BOTTOM
	 * @final
	 */
	BOTTOM: 'bottom'
};
/**
 * Text position definitions
 * @class TextFormatAttributes.VerticalTextPosition
 */
TextFormatAttributes.VerticalTextPosition = {
	/**
	 * Text is positioned by its coordinate
	 * @property {Number} CUSTOM
	 * @final
	 */
	CUSTOM: 0,
	/**
	 * Place text vertically above box.
	 * @property {Number} ONTOP
	 * @final
	 */
	ONTOP: 1,
	/**
	 * Place text before line.
	 * @property {Number} BEFORESTART
	 * @final
	 */
	BEFORESTART: 1,
	/**
	 * Top align text or at beginning of line
	 * @property {Number} TOP
	 * @final
	 */
	TOP: 2,
	/**
	 * Place text at beginning of line
	 * @property {Number} START
	 * @final
	 */
	START: 2,
	/**
	 * Center text.
	 * @property {Number} CENTER
	 * @final
	 */
	CENTER: 3,
	/**
	 * Place text at bottom.
	 * @property {Number} BOTTOM
	 * @final
	 */
	BOTTOM: 4,
	/**
	 * Place text at end of line..
	 * @property {Number} END
	 * @final
	 */
	END: 4,
	/**
	 * Place text below bottom of box.
	 * @property {Number} BELOWBOTTOM
	 * @final
	 */
	BELOWBOTTOM: 5,
	/**
	 * Place text behind end of line.
	 * @property {Number} BEHINDEND
	 * @final
	 */
	BEHINDEND: 5,
	/**
	 * For orthogonal lines, place label at the beginning of the line, either below first
	 * horizontal line or right of first vertical line.
	 * @property {Number} BEHINDEND
	 * @final
	 */
	BELOWRIGHTSTART: 6
};
/**
 * Text position definitions
 * @class TextFormatAttributes.HorizontalTextPosition
 */
TextFormatAttributes.HorizontalTextPosition = {
	/**
	 * Text is positioned by its coordinate
	 * @property {Number} CUSTOM
	 * @final
	 */
	CUSTOM: 0,
	/**
	 * Place text left to the box or at in direction of the line to the left
	 * @property {Number} TOLEFT
	 * @final
	 */
	TOLEFT: 1,
	/**
	 * Left align text or at in direction of the line to the left
	 * @property {Number} LEFT
	 * @final
	 */
	LEFT: 2,
	/**
	 * Center text horizontally.
	 * @property {Number} CENTER
	 * @final
	 */
	CENTER: 3,
	/**
	 * Right align text or at in direction of the line to the right
	 * @property {Number} RIGHT
	 * @final
	 */
	RIGHT: 4,
	/**
	 * Place text right to the box or at in direction of the line to the right
	 * @property {Number} TORIGHT
	 * @final
	 */
	TORIGHT: 5
};
/**
 * FontStyle definitions
 * @class TextFormatAttributes.FontStyle
 */
TextFormatAttributes.FontStyle = {
	/**
	 * Default font style.
	 * @property {Number} NORMAL
	 * @final
	 */
	NORMAL: 0,
	/**
	 * Bold font style.
	 * @property {Number} BOLD
	 * @final
	 */
	BOLD: 1,
	/**
	 * Italic font style.
	 * @property {Number} ITALIC
	 * @final
	 */
	ITALIC: 2,
	/**
	 * Underline font style.
	 * @property {Number} UNDERLINE
	 * @final
	 */
	UNDERLINE: 4
};

TextFormatAttributes.template = TextFormatAttributes.createTemplate();

module.exports = TextFormatAttributes;
