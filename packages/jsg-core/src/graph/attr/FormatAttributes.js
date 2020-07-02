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
const NumberRangeConstraint = require('../expr/NumberRangeConstraint');
const StringAttribute = require('./StringAttribute');
const RangeConstraint = require('../expr/RangeConstraint');
const GraphUtils = require('../GraphUtils');

const NAME = 'format';
const TemplateID = 'FormatAttributes.Template';

/**
 * This AttributeList defines default attributes for formatting a {{#crossLink
 * "GraphItem"}}{{/crossLink}}. The members can be used to directly influence the format of a GraphItem
 * including fill and line as well as shadow formatting.
 *
 * @example
 *      var node = new Node();
 *      // get format attributes for node
 *      var format = node.getFormat();
 *      format.setFillColor("#FF0000");
 *      format.setLineColor("#00FF00");
 *
 * @class FormatAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined format attributes.
 */
class FormatAttributes extends AttributeList {
	constructor(mapExpr) {
		super(FormatAttributes.NAME, mapExpr);
		this.setParent(FormatAttributes.template);
	}

	newInstance(mapExpr) {
		return new FormatAttributes(mapExpr);
	}

	getClassString() {
		return 'FormatAttributes';
	}

	static brighten(hex, percent) {
		// strip the leading # if it's there
		hex = hex.replace(/^\s*#|\s*$/g, '');

		// convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
		if (hex.length === 3) {
			hex = hex.replace(/(.)/g, '$1$1');
		}

		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);

		/* eslint-disable no-bitwise */
		return `#${(0 | ((1 << 8) + r + ((256 - r) * percent) / 100))
			.toString(16)
			.substr(1)}${(0 | ((1 << 8) + g + ((256 - g) * percent) / 100))
			.toString(16)
			.substr(1)}${(0 | ((1 << 8) + b + ((256 - b) * percent) / 100))
			.toString(16)
			.substr(1)}`;
		/* eslint-enable no-bitwise */
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
				attr1 !== undefined &&
				attr2 !== undefined &&
				attr1.getExpression().isEqualTo(attr2.getExpression())
			);
		}

		if (selection.length !== 0) {
			let i;
			let n;
			// copy formats including all template attributes:
			const format = selection[0]
				.getModel()
				.getFormat()
				.toFlatList();

			for (i = 1, n = selection.length; i < n; i += 1) {
				format.retainAll(
					selection[i].getModel().getFormat(),
					unionCondition
				);
			}
			return format;
		}
		return undefined;
	}

	/**
	 * Applies the values of given FormatAttributes to this instance.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFormatTo
	 * @param {FormatAttributes} format The Format object to get the values from.
	 * @return {Boolean} <code>true</code> if at least one attribute was changed, <code>false</code> otherwise.
	 */
	setFormatTo(format) {
		this.reset();
		return this.applyMap(format.toMap());
	}

	/**
	 * Checks, if a format has a visible fill format.
	 *
	 * @method hasFill
	 * @return {Boolean} True, if a fill is visible, otherwise false.
	 * @deprecated Subject to be removed without replacement. It is preferred to simply call
	 * {{#crossLink "FormatAttributes/applyFillToGraphics:method"}}{{/crossLink}} which returns a
	 *     <code>boolean</code> to indicate if a fill was applied or not.
	 */
	hasFill() {
		const fillstyle = this.getAttribute(FormatAttributes.FILLSTYLE);
		return (
			fillstyle !== undefined &&
			fillstyle.getValue() !== FormatAttributes.FillStyle.NONE
		);
	}

	/**
	 * Checks, if a format has a visible border.
	 *
	 * @method hasBorder
	 * @return {Boolean} True, if a border is visible, otherwise false.
	 * @deprecated Subject to be removed without replacement. It is preferred to simply call
	 * {{#crossLink "FormatAttributes/applyLineToGraphics:method"}}{{/crossLink}} which returns a
	 *     <code>boolean</code> to indicate if a stroke was applied or not.
	 */
	hasBorder() {
		const lineWidth = this.getAttribute(
			FormatAttributes.LINEWIDTH
		).getValue();
		const linestyle = this.getAttribute(
			FormatAttributes.LINESTYLE
		).getValue();
		return (
			(lineWidth > 0 ||
				lineWidth === FormatAttributes.LineStyle.HAIRLINE) &&
			linestyle !== FormatAttributes.LineStyle.NONE
		);
	}

	/**
	 * Applies current fill formats, e.g. {{#crossLink
	 * "FormatAttributes/FILLSTYLE:property"}}{{/crossLink}} or {{#crossLink
	 * "FormatAttributes/FILLCOLOR:property"}}{{/crossLink}}, to given <code>graphics</code>.<br/>
	 * @method applyFillToGraphics
	 * @param {Graphics} graphics The currently used graphics to which the formats should be applied.
	 * @param {Rectangle} bounds A rectangle which is required for gradient fills.
	 * @return {Boolean} Returns <code>true</code> if fill formats were applied, <code>false</code> otherwise.
	 */
	applyFillToGraphics(graphics, bounds) {
		const FORMAT = FormatAttributes;

		// we first set fill-style to see if we should apply at all...
		const fillstyle = graphics.setFillStyle(
			this.getAttribute(FORMAT.FILLSTYLE).getValue()
		);
		const applied =
			fillstyle !== undefined &&
			fillstyle !== FormatAttributes.FillStyle.NONE;
		if (applied) {
			const transparency = this.getAttribute(
				FORMAT.TRANSPARENCY
			).getValue();
			if (transparency !== 100) {
				graphics.setTransparency(transparency);
			}

			graphics.setLineCorner(
				this.getAttribute(FORMAT.LINECORNER).getValue()
			);

			let color = this.getAttribute(FORMAT.FILLCOLOR).getValue();
			const brightness = this.getAttribute(FORMAT.BRIGHTNESS).getValue();
			if (brightness !== 0) {
				color = FORMAT.brighten(color, brightness);
			}
			graphics.setFillColor(color);

			switch (fillstyle) {
				case FORMAT.FillStyle.GRADIENT: {
					const type = this.getAttribute(
						FORMAT.GRADIENTTYPE
					).getValue();
					const grcolor = this.getAttribute(
						FORMAT.GRADIENTCOLOR
					).getValue();
					const colorStops = this.getAttribute(
						FORMAT.GRADIENTCOLORSTOPS
					).getValue();
					if (type === FORMAT.GradientStyle.LINEAR) {
						const angle = this.getAttribute(
							FORMAT.GRADIENTANGLE
						).getValue();
						graphics.setGradientLinear(
							bounds,
							color,
							grcolor,
							colorStops,
							angle
						);
					} else {
						const offX = this.getAttribute(
							FORMAT.GRADIENTOFFSET_X
						).getValue();
						const offY = this.getAttribute(
							FORMAT.GRADIENTOFFSET_Y
						).getValue();
						graphics.setGradientRadial(
							bounds,
							color,
							grcolor,
							colorStops,
							offX,
							offY
						);
					}
					break;
				}
				case FORMAT.FillStyle.PATTERN: {
					const pattern = this.getAttribute(
						FORMAT.PATTERN
					).getValue();
					const patternstyle = this.getAttribute(
						FORMAT.PATTERNSTYLE
					).getValue();
					graphics.setPattern(bounds, pattern, patternstyle);
					break;
				}
				default:
					break;
			}
		}
		return applied;
	}

	/**
	 * Applies current line formats, e.g. {{#crossLink
	 * "FormatAttributes/LINESTYLE:property"}}{{/crossLink}} or {{#crossLink
	 * "FormatAttributes/LINECOLOR:property"}}{{/crossLink}}, to given <code>graphics</code>.<br/> To
	 * remove applied formats use {{#crossLink
	 * "FormatAttributes/removeLineFromGraphics:method"}}{{/crossLink}}.
	 * @method applyLineToGraphics
	 * @param {Graphics} graphics The currently used graphics to which the formats should be applied.
	 * @return {Boolean} Returns <code>true</code> if line formats were applied, <code>false</code> otherwise.
	 */
	applyLineToGraphics(graphics) {
		// we first try to set line style and width to see if we should apply at all...
		const linestyle = graphics.setLineStyle(
			this.getAttribute(FormatAttributes.LINESTYLE).getValue()
		);
		const linewidth = graphics.setLineWidth(
			this.getAttribute(FormatAttributes.LINEWIDTH).getValue()
		);
		const applied =
			(linewidth > 0 ||
				linewidth === FormatAttributes.LineStyle.HAIRLINE) &&
			linestyle !== FormatAttributes.LineStyle.NONE;
		if (applied) {
			const transparency = this.getAttribute(
				FormatAttributes.LINETRANSPARENCY
			).getValue();
			if (transparency !== 100) {
				graphics.setTransparency(transparency);
			}

			if (linewidth > 1) {
				graphics.setLineCap(
					this.getAttribute(FormatAttributes.LINECAP).getValue()
				);
				graphics.setLineJoin(
					this.getAttribute(FormatAttributes.LINEJOIN).getValue()
				);
				graphics.setMiterLimit(
					this.getAttribute(FormatAttributes.MITERLIMIT).getValue()
				);
			}

			graphics.setLineColor(
				this.getAttribute(FormatAttributes.LINECOLOR).getValue()
			);
			graphics.setLineShape(
				this.getAttribute(FormatAttributes.LINESHAPE).getValue()
			);

			let arrow = this.getAttribute(
				FormatAttributes.LINEARROWSTART
			).getValue();
			if (arrow !== FormatAttributes.ArrowStyle.NONE) {
				graphics.setLineArrowStart(
					this.getAttribute(
						FormatAttributes.LINEARROWSTART
					).getValue(),
					this.getAttribute(
						FormatAttributes.LINEARROWSTARTWIDTH
					).getValue(),
					this.getAttribute(
						FormatAttributes.LINEARROWSTARTLENGTH
					).getValue()
				);
			}

			arrow = this.getAttribute(FormatAttributes.LINEARROWEND).getValue();
			if (arrow !== FormatAttributes.ArrowStyle.NONE) {
				graphics.setLineArrowEnd(
					this.getAttribute(FormatAttributes.LINEARROWEND).getValue(),
					this.getAttribute(
						FormatAttributes.LINEARROWENDWIDTH
					).getValue(),
					this.getAttribute(
						FormatAttributes.LINEARROWENDLENGTH
					).getValue()
				);
			}
			graphics.setLineCorner(
				this.getAttribute(FormatAttributes.LINECORNER).getValue()
			);
		}
		return applied;
	}

	/**
	 * Removes previously applied line formats.<br/>
	 * See {{#crossLink "FormatAttributes/applyLineToGraphics:method"}}{{/crossLink}}.
	 * @method removeLineFromGraphics
	 * @param {Graphics} graphics The graphics to which the line formats were applied.
	 */
	removeLineFromGraphics(graphics) {
		graphics.resetLine();

		// const FormatAttributes = FormatAttributes;
		// const parent = this._parent;
		// if (parent) {
		// 	// reset graphics values with ones from template... => maybe it is better to store old graphics values in
		// 	// applyLineToGraphics...
		// 	graphics.setLineCap(parent.getAttribute(FormatAttributes.LINECAP).getValue());
		// 	graphics.setLineJoin(parent.getAttribute(FormatAttributes.LINEJOIN).getValue());
		// 	graphics.setMiterLimit(parent.getAttribute(FormatAttributes.MITERLIMIT).getValue());
		// 	graphics.setLineStyle(parent.getAttribute(FormatAttributes.LINESTYLE).getValue());
		// 	graphics.setLineShape(parent.getAttribute(FormatAttributes.LINESHAPE).getValue());
		// 	graphics.setLineArrowStart(this.getAttribute(FormatAttributes.LINEARROWSTART).getValue(),
		// 		this.getAttribute(FormatAttributes.LINEARROWSTARTWIDTH).getValue(),
		// 		this.getAttribute(FormatAttributes.LINEARROWSTARTLENGTH).getValue());
		// 	graphics.setLineArrowEnd(this.getAttribute(FormatAttributes.LINEARROWEND).getValue(),
		// 		this.getAttribute(FormatAttributes.LINEARROWENDWIDTH).getValue(),
		// 		this.getAttribute(FormatAttributes.LINEARROWENDLENGTH).getValue());
		// 	graphics.setLineCorner(parent.getAttribute(FormatAttributes.LINECORNER).getValue());
		//
		// 	if (this.getAttribute(FormatAttributes.LINETRANSPARENCY).getValue() !== 100) {
		// 		graphics.setTransparency(100);
		// 	}
		// }
	}

	/**
	 * Applies current shadow formats, e.g. {{#crossLink
	 * "FormatAttributes/SHADOWOFFSET_X:property"}}{{/crossLink}} or {{#crossLink
	 * "FormatAttributes/SHADOWBLUR:property"}}{{/crossLink}}, to given <code>graphics</code>. To remove
	 * applied formats use {{#crossLink
	 * "FormatAttributes/removeShadowFromGraphics:method"}}{{/crossLink}}.
	 * @method applyShadowToGraphics
	 * @param {Graphics} graphics The currently used graphics to which the formats should be applied.
	 * @param {Rectangle} bounds A bounding rectangle where the shadow shall be drawn.
	 * @return {Boolean} Returns <code>true</code> if shadow formats were applied, <code>false</code> otherwise.
	 */
	applyShadowToGraphics(graphics, bounds) {
		let offsetX = this.getAttribute(
			FormatAttributes.SHADOWOFFSET_X
		).getValue();
		let offsetY = this.getAttribute(
			FormatAttributes.SHADOWOFFSET_Y
		).getValue();
		const shadowBlur = this.getAttribute(
			FormatAttributes.SHADOWBLUR
		).getValue();
		let applied = false;

		if (offsetX !== 0 || offsetY !== 0 || shadowBlur !== 0) {
			const shadowColor = this.getAttribute(
				FormatAttributes.SHADOWCOLOR
			).getValue();
			switch (
				this.getAttribute(FormatAttributes.SHADOWDIRECTION).getValue()
			) {
				case FormatAttributes.ShadowDirection.LEFTTOP:
					offsetX = -offsetX;
					offsetY = -offsetY;
					break;
				case FormatAttributes.ShadowDirection.RIGHTTOP:
					offsetY = -offsetY;
					break;
				case FormatAttributes.ShadowDirection.LEFTBOTTOM:
					offsetX = -offsetX;
					break;
				default:
					break;
			}
			applied = graphics.setShadow(
				shadowColor,
				offsetX,
				offsetY,
				shadowBlur,
				bounds
			);
		}
		return applied;
	}

	/**
	 * Removes previously applied shadow formats.<br/>
	 * See {{#crossLink "FormatAttributes/applyShadowToGraphics:method"}}{{/crossLink}}.
	 * @method removeShadowFromGraphics
	 * @param {Graphics} graphics The graphics to which the shadow formats were applied.
	 */
	removeShadowFromGraphics(graphics) {
		graphics.resetShadow();
		graphics.setLineCorner(0);
		if (
			this.getAttribute(FormatAttributes.TRANSPARENCY).getValue() !== 100
		) {
			graphics.setTransparency(100);
		}
	}

	/**
	 * Returns the fill color using a hexadecimal RGB String prefixed by a '#' char.
	 *
	 * @method getFillColor
	 * @return {Attribute} Color attribute.
	 */
	getFillColor() {
		return this.getAttribute(FormatAttributes.FILLCOLOR);
	}

	/**
	 * Sets a new fill color. The color must be given as a hexadecimal RGB string, prefixed by a '#' char.
	 * For example to set a red color use '#FF0000'.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFillColor
	 * @param {BooleanExpression | String} color Color to assign.
	 */
	setFillColor(color) {
		this.setAttribute(FormatAttributes.FILLCOLOR, color);
	}

	/**
	 * Set fill color using red, green and blue values.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFillColorRGB
	 * @param {Number} r Red part of the color. Values between 0 and 255 are valid.
	 * @param {Number} g Green part of the color. Values between 0 and 255 are valid.
	 * @param {Number} b Blue part of the color. Values between 0 and 255 are valid.
	 */
	setFillColorRGB(r, g, b) {
		this.setFillColor(GraphUtils.colorFromRGB(r, g, b));
	}

	/**
	 * Returns current fill style.
	 *
	 * @method getFillStyle
	 * @return {Attribute} Current style attribute.
	 */
	getFillStyle() {
		return this.getAttribute(FormatAttributes.FILLSTYLE);
	}

	/**
	 * Set a new fill style.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setFillStyle
	 * @param {BooleanExpression | FormatAttributes.FillStyle} style New fill style for format.
	 */
	setFillStyle(style) {
		this.setAttribute(FormatAttributes.FILLSTYLE, style);
	}

	/**
	 * Returns brightness factor between 0 (dark) to 100 (bright).
	 *
	 * @method getBrightness
	 * @return {Attribute} Current brightness attribute.
	 */
	getBrightness() {
		return this.getAttribute(FormatAttributes.BRIGHTNESS);
	}

	/**
	 * Set a brightness factor for the format.</br>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setBrightness
	 * @param {BooleanExpression | Number} brightness Brightness factor between 0 (dark) to 100 (bright)
	 */
	setBrightness(brightness) {
		this.setAttribute(FormatAttributes.BRIGHTNESS, brightness);
	}

	/**
	 * Returns transparency factor between 0 (transparent) to 100 (intransparent).
	 *
	 * @method getTransparency
	 * @return {Attribute} Current transparency attribute.
	 */
	getTransparency() {
		return this.getAttribute(FormatAttributes.TRANSPARENCY);
	}

	/**
	 * Set a transparent fill factor for the format.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setTransparency
	 * @param {BooleanExpression | Number} transparency Transparency factor between 0 (transparent) to 100
	 *     (intransparent)
	 */
	setTransparency(transparency) {
		this.setAttribute(FormatAttributes.TRANSPARENCY, transparency);
	}

	/**
	 * Returns the gradient color using a hexadecimal RGB String prefixed by a '#' char.
	 *
	 * @method getGradientColor
	 * @return {Attribute} Color attribute.
	 */
	getGradientColor() {
		return this.getAttribute(FormatAttributes.GRADIENTCOLOR);
	}

	/**
	 * Set a new gradient color. The color must be given as a hexadecimal RGB string, preceeded by a '#' char.
	 * The color is used as the target color for the gradient. The source color is set using setFillColor.
	 * For example to set a red gradient color use '#FF0000'.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientColor
	 * @param {BooleanExpression | String} color Color to assign.
	 */
	setGradientColor(color) {
		this.setAttribute(FormatAttributes.GRADIENTCOLOR, color);
	}

	/**
	 * Returns the gradient color stops. The color stops are defined by a sequence of strings
	 * separated by commas. A single color stop is defined by a pair of strings. The first string
	 * identifies the relative color stop position (between 0 and 1) and the second string the hexadecimal
	 * color string for the color stop. An example would be
	 * "0.2, #FF0000, 0.4, #CCFFAA", which defines two color stops with its relative position and color.
	 *
	 * @method getGradientColorStops
	 * @return {Attribute} Color stops attribute.
	 * @since 1.6.20
	 */
	getGradientColorStops() {
		return this.getAttribute(FormatAttributes.GRADIENTCOLORSTOPS);
	}

	/**
	 * Sets new gradient color stops. The color stops are defined by a sequence of strings
	 * separated by commas. The first string
	 * identifies the relative color stop position (between 0 and 1) and the second string the hexadecimal
	 * color string for the color stop. An example would be
	 * "0.2, #FF0000, 0.4, #CCFFAA", which defines two color stops with its relative position and color.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientColorStops
	 * @param {BooleanExpression | String} colorstops Color stops to assign.
	 * @since 1.6.20
	 */
	setGradientColorStops(colorstops) {
		this.setAttribute(FormatAttributes.GRADIENTCOLORSTOPS, colorstops);
	}

	/**
	 * Set gradient color using red, green and blue values.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientColorRGB
	 * @param {Number} r Red part of the color. Values between 0 and 255 are valid.
	 * @param {Number} g Green part of the color. Values between 0 and 255 are valid.
	 * @param {Number} b Blue part of the color. Values between 0 and 255 are valid.
	 */
	setGradientColorRGB(r, g, b) {
		this.setGradientColor(GraphUtils.colorFromRGB(r, g, b));
	}

	/**
	 * Get the angle for a linear gradient in degrees.
	 *
	 * @method getGradientAngle
	 * @return {Attribute} Angle attribute of linear gradient.
	 */
	getGradientAngle() {
		return this.getAttribute(FormatAttributes.GRADIENTANGLE);
	}

	/**
	 * Set the angle for a linear gradient. Currently only values of 0, 45, 90, 135 are allowed.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientAngle
	 * @param {BooleanExpression | Number} angle. Angle of linear gradient in degrees.
	 */
	setGradientAngle(angle) {
		this.setAttribute(FormatAttributes.GRADIENTANGLE, angle);
	}

	/**
	 * Returns the horizontal offset for a radial gradient.
	 *
	 * @method getGradientOffsetX
	 * @return {Attribute} Horizontal offset attribute.
	 */
	getGradientOffsetX() {
		return this.getAttribute(FormatAttributes.GRADIENTOFFSET_X);
	}

	/**
	 * Defines the horizontal offset for a radial gradient. Allowed values range from 0 to 100 percent.
	 * A value of 50 center the gradient in the middle of the object.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientOffsetX
	 * @param {BooleanExpression | Number} offset Horizontal offset.
	 */
	setGradientOffsetX(offset) {
		this.setAttribute(FormatAttributes.GRADIENTOFFSET_X, offset);
	}

	/**
	 * Returns the vertical offset for a radial gradient.
	 *
	 * @method getGradientOffsetY
	 * @return {Attribute} Vertical offset attribute.
	 */
	getGradientOffsetY() {
		return this.getAttribute(FormatAttributes.GRADIENTOFFSET_Y);
	}

	/**
	 * Defines the vertical offset for a radial gradient. Allowed values range from 0 to 100 percent.
	 * A value of 50 center the gradient in the middle of the object.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientOffsetY
	 * @param {BooleanExpression | Number} offset Vertical offset.
	 */
	setGradientOffsetY(offset) {
		this.setAttribute(FormatAttributes.GRADIENTOFFSET_Y, offset);
	}

	/**
	 * Returns the gradient type.
	 *
	 * @method getGradientType
	 * @return {Attribute} Current gradient type attribute.
	 */
	getGradientType() {
		return this.getAttribute(FormatAttributes.GRADIENTTYPE);
	}

	/**
	 * Sets the gradient type.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setGradientType
	 * @param {BooleanExpression | FormatAttributes.GradientStyle} type Gradient type to set.
	 */
	setGradientType(type) {
		this.setAttribute(FormatAttributes.GRADIENTTYPE, type);
	}

	/**
	 * Return the current URL for an image used to a pattern fill.
	 *
	 * @method getPattern
	 * @return{Attribute} Current pattern attribute.
	 */
	getPattern() {
		return this.getAttribute(FormatAttributes.PATTERN);
	}

	/**
	 * Defines a image for a pattern fill. The image must be an url to an image available on the server.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setPattern
	 * @param {BooleanExpression | String} pattern URL to image.
	 */
	setPattern(pattern) {
		this.setAttribute(FormatAttributes.PATTERN, pattern);
	}

	/**
	 * Return the current PatternStyle used for a pattern fill.
	 *
	 * @method getPatternStyle
	 * @return{Attribute} Current pattern style attribute.
	 */
	getPatternStyle() {
		return this.getAttribute(FormatAttributes.PATTERNSTYLE);
	}

	/**
	 * Defines the PatternStyle for a pattern fill. The image can be displayed using several options.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setPatternStyle
	 * @param {BooleanExpression | FormatAttributes.PatternStyle} style Pattern style used for
	 *     displaying the pattern.
	 */
	setPatternStyle(style) {
		this.setAttribute(FormatAttributes.PATTERNSTYLE, style);
	}

	/**
	 * Returns the line cap attribute.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineCap"}}{{/crossLink}} for information on
	 * supported line caps.
	 *
	 * @method getLineCap
	 * @return {Attribute} The line cap attribute.
	 * @since 1.6.0
	 */
	getLineCap() {
		return this.getAttribute(FormatAttributes.LINECAP);
	}

	/**
	 * Sets the new line cap to use.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineCap"}}{{/crossLink}} for information on
	 * supported line caps.
	 *
	 * @method setLineCap
	 * @param {BooleanExpression | FormatAttributes.LineCap} cap The new line cap value.
	 * @since 1.6.0
	 */
	setLineCap(cap) {
		this.setAttribute(FormatAttributes.LINECAP, cap);
	}

	/**
	 * Returns the line join attribute.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineJoin"}}{{/crossLink}} for information on
	 * supported line join values.
	 *
	 * @method getLineJoin
	 * @return {Attribute} The line join attribute.
	 * @since 1.6.15
	 */
	getLineJoin() {
		return this.getAttribute(FormatAttributes.LINEJOIN);
	}

	/**
	 * Sets the new line join to use.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineJoin"}}{{/crossLink}} for information on
	 * supported line join values.
	 *
	 * @method setLineJoin
	 * @param {BooleanExpression | FormatAttributes.LineJoin} join The new line join value.
	 * @since 1.6.15
	 */
	setLineJoin(join) {
		this.setAttribute(FormatAttributes.LINEJOIN, join);
	}

	/**
	 * Returns the miter limit attribute used for drawing line joins.<br/>
	 *
	 * @method getMiterLimit
	 * @return {Attribute} The miter limit attribute.
	 * @since 1.6.15
	 */
	getMiterLimit() {
		return this.getAttribute(FormatAttributes.MITERLIMIT);
	}

	/**
	 * Specifies a new miter limit to use. This value describes the maximum extension a line join of type
	 * {{#crossLink "FormatAttributes.LineJoin/MITER:property"}}{{/crossLink}} can have. So it only has
	 * affect if the line join attribute is set to <code>MITER</code>.
	 *
	 * @method setMiterLimit
	 * @param {BooleanExpression | Number} limit The new miter limit value.
	 * @since 1.6.11
	 */
	setMiterLimit(limit) {
		this.setAttribute(FormatAttributes.MITERLIMIT, limit);
	}

	/**
	 * Returns the line color using a hexadecimal RGB String prefixed by a '#' char.
	 *
	 * @method getLineColor
	 * @return {Attribute} Color attribute.
	 */
	getLineColor() {
		return this.getAttribute(FormatAttributes.LINECOLOR);
	}

	/**
	 * Set a new line color. The color must be given as a hexadecimal RGB string, prefixed by a '#' char.
	 * For example to set a red line color use '#FF0000'.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineColor
	 * @param {BooleanExpression | String} color Color to assign.
	 */
	setLineColor(color) {
		this.setAttribute(FormatAttributes.LINECOLOR, color);
	}

	/**
	 * Set line color using red, green and blue values.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineColorRGB
	 * @param {Number} r Red part of the color. Values between 0 and 255 are valid.
	 * @param {Number} g Green part of the color. Values between 0 and 255 are valid.
	 * @param {Number} b Blue part of the color. Values between 0 and 255 are valid.
	 */
	setLineColorRGB(r, g, b) {
		this.setLineColor(GraphUtils.colorFromRGB(r, g, b));
	}

	/**
	 * Returns the line corner in 1/100th mm.
	 *
	 * @method getLineCorner
	 * @return {Attribute} Corner radius attribute.
	 */
	getLineCorner() {
		return this.getAttribute(FormatAttributes.LINECORNER);
	}

	/**
	 * Set a new line corner radius. The corner radius must be given in 1/100 mm. It is only used for polylines.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineCorner
	 * @param {BooleanExpression | String} corner Corner radius to assign.
	 */
	setLineCorner(corner) {
		this.setAttribute(FormatAttributes.LINECORNER, corner);
	}

	/**
	 * Returns the current arrow type at the beginning of a line.
	 *
	 * @method getLineArrowStart
	 * @return {Attribute} Arrow type attribute.
	 */
	getLineArrowStart() {
		return this.getAttribute(FormatAttributes.LINEARROWSTART);
	}

	/**
	 * Defines an arrow for a line at the beginning of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowStart
	 * @param {BooleanExpression | FormatAttributes.ArrowStyle} arrow Arrow type.
	 */
	setLineArrowStart(arrow) {
		this.setAttribute(FormatAttributes.LINEARROWSTART, arrow);
	}

	/**
	 * Returns the current arrow length at the beginning of a line.
	 *
	 * @method getLineArrowStartLength
	 * @return {Attribute} Arrow length attribute.
	 * @since 2.0.22.13
	 */
	getLineArrowStartLength() {
		return this.getAttribute(FormatAttributes.LINEARROWSTARTLENGTH);
	}

	/**
	 * Defines the arrow length at the beginning of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowStartLength
	 * @param {BooleanExpression | Number} length Arrow length.
	 * @since 2.0.22.13
	 */
	setLineArrowStartLength(length) {
		this.setAttribute(FormatAttributes.LINEARROWSTARTLENGTH, length);
	}

	/**
	 * Returns the current arrow width at the beginning of a line.
	 *
	 * @method getLineArrowStartWidth
	 * @return {Attribute} Arrow width attribute.
	 * @since 2.0.22.13
	 */
	getLineArrowStartWidth() {
		return this.getAttribute(FormatAttributes.LINEARROWSTARTWIDTH);
	}

	/**
	 * Defines the arrow width at the beginning of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowStartWidth
	 * @param {BooleanExpression | Number} width Arrow width.
	 * @since 2.0.22.13
	 */
	setLineArrowStartWidth(width) {
		this.setAttribute(FormatAttributes.LINEARROWSTARTWIDTH, width);
	}

	/**
	 * Returns the current arrow type at the end of a line.
	 *
	 * @method getLineArrowEnd
	 * @return {Attribute} Arrow type attribute.
	 */
	getLineArrowEnd() {
		return this.getAttribute(FormatAttributes.LINEARROWEND);
	}

	/**
	 * Defines an arrow for a line at the end of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowEnd
	 * @param {BooleanExpression | FormatAttributes.ArrowStyle} arrow Arrow type.
	 */
	setLineArrowEnd(arrow) {
		this.setAttribute(FormatAttributes.LINEARROWEND, arrow);
	}

	/**
	 * Returns the current arrow length at the end of a line.
	 *
	 * @method getLineArrowEndLength
	 * @return {Attribute} Arrow length attribute.
	 * @since 2.0.22.13
	 */
	getLineArrowEndLength() {
		return this.getAttribute(FormatAttributes.LINEARROWENDLENGTH);
	}

	/**
	 * Defines the arrow length at the end of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowEndLength
	 * @param {BooleanExpression | Number} length Arrow length.
	 * @since 2.0.22.13
	 */
	setLineArrowEndLength(length) {
		this.setAttribute(FormatAttributes.LINEARROWENDLENGTH, length);
	}

	/**
	 * Returns the current arrow width at the end of a line.
	 *
	 * @method getLineArrowEndWidth
	 * @return {Attribute} Arrow width attribute.
	 * @since 2.0.22.13
	 */
	getLineArrowEndWidth() {
		return this.getAttribute(FormatAttributes.LINEARROWENDWIDTH);
	}

	/**
	 * Defines the arrow width at the end of the line.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineArrowEndWidth
	 * @param {BooleanExpression | Number} width Arrow width.
	 * @since 2.0.22.13
	 */
	setLineArrowEndWidth(width) {
		this.setAttribute(FormatAttributes.LINEARROWENDWIDTH, width);
	}

	/**
	 * Returns line transparency factor between 0 (transparent) to 100 (intransparent).
	 *
	 * @method getLineTransparency
	 * @return {Attribute} Current line transparency attribute.
	 * @since 2.0.21.0
	 */
	getLineTransparency() {
		return this.getAttribute(FormatAttributes.LINETRANSPARENCY);
	}

	/**
	 * Set a transparent line factor for the format.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineTransparency
	 * @param {BooleanExpression | Number} transparency Line Transparency factor between 0 (transparent) to 100
	 *     (intransparent)
	 * @since 2.0.21.0
	 */
	setLineTransparency(transparency) {
		this.setAttribute(FormatAttributes.LINETRANSPARENCY, transparency);
	}

	/**
	 * Returns the line color using a hexadecimal RGB String prefixed by a '#' char.
	 *
	 * @method getShadowColor
	 * @return {Attribute} Color attribute.
	 */
	getShadowColor() {
		return this.getAttribute(FormatAttributes.SHADOWCOLOR);
	}

	/**
	 * Set a new shadow color. The color must be given as a hexadecimal RGB string, prefixed by a '#' char.
	 * For example to set a red shadow color use '#FF0000'.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowColor
	 * @param {BooleanExpression | String} color Color to assign.
	 */
	setShadowColor(color) {
		this.setAttribute(FormatAttributes.SHADOWCOLOR, color);
	}

	/**
	 * Set shadow color using red, green and blue values.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowColorRGB
	 * @param {Number} r Red part of the color. Values between 0 and 255 are valid.
	 * @param {Number} g Green part of the color. Values between 0 and 255 are valid.
	 * @param {Number} b Blue part of the color. Values between 0 and 255 are valid.
	 */
	setShadowColorRGB(r, g, b) {
		this.setShadowColor(GraphUtils.colorFromRGB(r, g, b));
	}

	/**
	 * Returns the horizontal offset of a shadow.
	 *
	 * @method getShadowOffsetX
	 * @return {Attribute} Current horizontal offset attribute.
	 */
	getShadowOffsetX() {
		return this.getAttribute(FormatAttributes.SHADOWOFFSET_X);
	}

	/**
	 * Defines the horizontal offset of a shadow for an object.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowOffsetX
	 * @param {BooleanExpression | Number} offsetX Offset for a shadow. The offset defines the width and depth
	 *     of the shadow.
	 */
	setShadowOffsetX(offsetX) {
		this.setAttribute(FormatAttributes.SHADOWOFFSET_X, offsetX);
	}

	/**
	 * Returns the vertical offset of a shadow.
	 *
	 * @method getShadowOffsetY
	 * @return {Attribute} Current vertical offset attribute.
	 */
	getShadowOffsetY() {
		return this.getAttribute(FormatAttributes.SHADOWOFFSET_Y);
	}

	/**
	 * Defines the vertical offset of a shadow for an object.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowOffsetY
	 * @param {BooleanExpression | Number} offsetY Offset for a shadow. The offset defines the width and depth
	 *     of the shadow.
	 */
	setShadowOffsetY(offsetY) {
		this.setAttribute(FormatAttributes.SHADOWOFFSET_Y, offsetY);
	}

	/**
	 * Returns the shadow direction. The shadow direction defines in which direction the shadow is thrown.
	 *
	 * @method getShadowDirection
	 * @return {Attribute} Current shadow direction attribute.
	 */
	getShadowDirection() {
		return this.getAttribute(FormatAttributes.SHADOWDIRECTION);
	}

	/**
	 * Defines the shadow direction. The shadow direction defines in which direction the shadow is thrown.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowDirection
	 * @param {BooleanExpression | FormatAttributes.ShadowDirection} direction Shadow direction
	 *     to set.
	 */
	setShadowDirection(direction) {
		this.setAttribute(FormatAttributes.SHADOWDIRECTION, direction);
	}

	/**
	 * Return the factor on how much a shadow is blurred.
	 *
	 * @method getShadowBlur
	 * @return {Attribute} Blur attribute.
	 */
	getShadowBlur() {
		return this.getAttribute(FormatAttributes.SHADOWBLUR);
	}

	/**
	 * Defines a factor on how much a shadow is blurred. It can range from 0 (no blur) to 100.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setShadowBlur
	 * @param {BooleanExpression | Number} blur Blur factor.
	 */
	setShadowBlur(blur) {
		this.setAttribute(FormatAttributes.SHADOWBLUR, blur);
	}

	/**
	 * Returns the current line width.
	 *
	 * @method getLineWidth
	 * @return {Attribute} Current width attribute.
	 */
	getLineWidth() {
		return this.getAttribute(FormatAttributes.LINEWIDTH);
	}

	/**
	 * Defines the line width.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineWidth
	 * @param {BooleanExpression | Number} width New line width.
	 */
	setLineWidth(width) {
		this.setAttribute(FormatAttributes.LINEWIDTH, width);
	}

	/**
	 * Returns current line style.
	 *
	 * @method getLineStyle
	 * @return {Attribute} Line style attribute.
	 */
	getLineStyle() {
		return this.getAttribute(FormatAttributes.LINESTYLE);
	}

	/**
	 * Sets line style using a predefined type.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineStyle
	 * @param {BooleanExpression | FormatAttributes.LineStyle} style Line style type.
	 */
	setLineStyle(style) {
		this.setAttribute(FormatAttributes.LINESTYLE, style);
	}

	/**
	 * Returns current line shape.
	 *
	 * @method getLineShape
	 * @return {Attribute} Line shape attribute.
	 */
	getLineShape() {
		return this.getAttribute(FormatAttributes.LINESHAPE);
	}

	/**
	 * Sets line shape using a predefined type.<br/>
	 * Note: if this AttributeList is attached to a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} is raised.
	 *
	 * @method setLineShape
	 * @param {BooleanExpression | FormatAttributes.LineShape} shape Line shape type.
	 */
	setLineShape(shape) {
		this.setAttribute(FormatAttributes.LINESHAPE, shape);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== FormatAttributes.TemplateID
		);
	}

	static get TemplateID() {
		return TemplateID;
	}

	/**
	 * Our unique name constant.
	 *
	 * @property NAME
	 * @type {String}
	 * @static
	 * @for FormatAttributes
	 */
	static get NAME() {
		return NAME;
	}
	/**
	 * Predefined constant to reference brightness attribute.
	 *
	 * @property BRIGHTNESS
	 * @type {String}
	 * @static
	 */
	static get BRIGHTNESS() {
		return 'brightness';
	}
	/**
	 * Predefined constant to reference fill style attribute.
	 *
	 * @property FILLSTYLE
	 * @type {String}
	 * @static
	 */
	static get FILLSTYLE() {
		return 'fillstyle';
	}
	/**
	 * Predefined constant to reference fill color attribute.
	 *
	 * @property FILLCOLOR
	 * @type {String}
	 * @static
	 */
	static get FILLCOLOR() {
		return 'fillcolor';
	}
	/**
	 * Predefined constant to reference gradient color attribute.
	 *
	 * @property GRADIENTCOLOR
	 * @type {String}
	 * @static
	 */
	static get GRADIENTCOLOR() {
		return 'gradientcolor';
	}
	/**
	 * Predefined constant to reference gradient color stops attribute.
	 *
	 * @property GRADIENTCOLORSTOPS
	 * @type {String}
	 * @static
	 */
	static get GRADIENTCOLORSTOPS() {
		return 'gradientcolorstops';
	}
	/**
	 * Predefined constant to reference gradient angle attribute.
	 *
	 * @property GRADIENTANGLE
	 * @type {String}
	 * @static
	 */
	static get GRADIENTANGLE() {
		return 'gradientangle';
	}
	/**
	 * Predefined constant to reference gradient type attribute.
	 *
	 * @property GRADIENTTYPE
	 * @type {String}
	 * @static
	 */
	static get GRADIENTTYPE() {
		return 'gradienttype';
	}
	/**
	 * Predefined constant to reference attribute for gradient offset in x direction.
	 *
	 * @property GRADIENTOFFSET_X
	 * @type {String}
	 * @static
	 */
	static get GRADIENTOFFSET_X() {
		return 'gradientoffset_x';
	}
	/**
	 * Predefined constant to reference attribute for gradient offset in y direction.
	 *
	 * @property GRADIENTOFFSET_Y
	 * @type {String}
	 * @static
	 */
	static get GRADIENTOFFSET_Y() {
		return 'gradientoffset_y';
	}
	/**
	 * Predefined constant to reference line cap attribute.
	 *
	 * @property LINECAP
	 * @type {String}
	 * @static
	 */
	static get LINECAP() {
		return 'linecap';
	}
	/**
	 * Predefined constant to reference line join attribute.
	 *
	 * @property LINEJOIN
	 * @type {String}
	 * @static
	 */
	static get LINEJOIN() {
		return 'linejoin';
	}
	/**
	 * Predefined constant to reference miter limit attribute.
	 *
	 * @property MITERLIMIT
	 * @type {String}
	 * @static
	 */
	static get MITERLIMIT() {
		return 'miterlimit';
	}

	/**
	 * Predefined constant to reference line color attribute.
	 *
	 * @property LINECOLOR
	 * @type {String}
	 * @static
	 */
	static get LINECOLOR() {
		return 'linecolor';
	}
	/**
	 * Predefined constant to reference line width attribute.
	 *
	 * @property LINEWIDTH
	 * @type {String}
	 * @static
	 */
	static get LINEWIDTH() {
		return 'linewidth';
	}
	/**
	 * Predefined constant to reference line style attribute.
	 *
	 * @property LINESTYLE
	 * @type {String}
	 * @static
	 */
	static get LINESTYLE() {
		return 'linestyle';
	}
	/**
	 * Predefined constant to reference line shape attribute.
	 *
	 * @property LINESHAPE
	 * @type {String}
	 * @static
	 */
	static get LINESHAPE() {
		return 'lineshape';
	}
	/**
	 * Predefined constant to reference line arrow start attribute.
	 *
	 * @property LINEARROWSTART
	 * @type {Number}
	 * @static
	 */
	static get LINEARROWSTART() {
		return 'linearrowstart';
	}
	/**
	 * Width of start arrow.
	 *
	 * @property LINEARROWSTARTWIDTH
	 * @type {Number}
	 * @static
	 * @since 2.0.22.13
	 */
	static get LINEARROWSTARTWIDTH() {
		return 'linearrowstartwidth';
	}
	/**
	 * Length of start arrow.
	 *
	 * @property LINEARROWSTARTLENGTH
	 * @type {Number}
	 * @static
	 * @since 2.0.22.13
	 */
	static get LINEARROWSTARTLENGTH() {
		return 'linearrowstartlength';
	}
	/**
	 * Predefined constant to reference line arrow end attribute.
	 *
	 * @property LINEARROWEND
	 * @type {Number}
	 * @static
	 */
	static get LINEARROWEND() {
		return 'linearrowend';
	}
	/**
	 * Width of end arrow.
	 *
	 * @property LINEARROWENDWIDTH
	 * @type {Number}
	 * @static
	 * @since 2.0.22.13
	 */
	static get LINEARROWENDWIDTH() {
		return 'linearrowendwidth';
	}
	/**
	 * Length of end arrow.
	 *
	 * @property LINEARROWENDLENGTH
	 * @type {Number}
	 * @static
	 * @since 2.0.22.13
	 */
	static get LINEARROWENDLENGTH() {
		return 'linearrowendlength';
	}
	/**
	 * Predefined constant to reference line corner attribute.
	 *
	 * @property LINECORNER
	 * @type {String}
	 * @static
	 */
	static get LINECORNER() {
		return 'linecorner';
	}
	/**
	 * Predefined constant to reference line transparency attribute.
	 *
	 * @property LINETRANSPARENCY
	 * @type {Number}
	 * @static
	 * @since 2.0.21.0
	 */
	static get LINETRANSPARENCY() {
		return 'linetransparency';
	}

	/**
	 * Predefined constant to reference pattern attribute.
	 *
	 * @property PATTERN
	 * @type {String}
	 * @static
	 */
	static get PATTERN() {
		return 'pattern';
	}
	/**
	 * Predefined constant to reference pattern style attribute.
	 *
	 * @property PATTERNSTYLE
	 * @type {String}
	 * @static
	 */
	static get PATTERNSTYLE() {
		return 'patternstyle';
	}
	/**
	 * Predefined constant to reference shadow color attribute.
	 *
	 * @property SHADOWCOLOR
	 * @type {String}
	 * @static
	 */
	static get SHADOWCOLOR() {
		return 'shadowcolor';
	}
	/**
	 * Predefined constant to reference attribute for shadow offset in x direction
	 *
	 * @property SHADOWOFFSET_X
	 * @type {String}
	 * @static
	 */
	static get SHADOWOFFSET_X() {
		return 'shadowoffset_x';
	}
	/**
	 * Predefined constant to reference attribute for shadow offset in y direction.
	 *
	 * @property SHADOWOFFSET_Y
	 * @type {String}
	 * @static
	 */
	static get SHADOWOFFSET_Y() {
		return 'shadowoffset_y';
	}
	/**
	 * Predefined constant to reference shadow blur attribute.
	 *
	 * @property SHADOWBLUR
	 * @type {String}
	 * @static
	 */
	static get SHADOWBLUR() {
		return 'shadowblur';
	}
	/**
	 * Predefined constant to reference shadow direction attribute.
	 *
	 * @property SHADOWDIRECTION
	 * @type {String}
	 * @static
	 */
	static get SHADOWDIRECTION() {
		return 'shadowdirection';
	}
	/**
	 * Predefined constant to reference transparency attribute.
	 *
	 * @property TRANSPARENCY
	 * @type {String}
	 * @static
	 */
	static get TRANSPARENCY() {
		return 'transparency';
	}

	static createTemplate() {
		const attributes = new FormatAttributes();

		function addAttribute(attribute, value, constraint) {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		}

		// simply add default attributes:
		addAttribute(new NumberAttribute(FormatAttributes.BRIGHTNESS), 0);

		addAttribute(
			new StringAttribute(FormatAttributes.FILLCOLOR),
			JSG.theme.fill
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.FILLSTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.FillStyle,
				FormatAttributes.FillStyle.SOLID
			)
		);

		addAttribute(
			new StringAttribute(FormatAttributes.GRADIENTCOLOR),
			'#CCCCCC'
		);
		addAttribute(
			new StringAttribute(FormatAttributes.GRADIENTCOLORSTOPS),
			''
		);
		addAttribute(new NumberAttribute(FormatAttributes.GRADIENTANGLE), 0);
		addAttribute(
			new NumberAttribute(FormatAttributes.GRADIENTTYPE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.GradientStyle,
				FormatAttributes.GradientStyle.LINEAR
			)
		);
		addAttribute(new NumberAttribute(FormatAttributes.GRADIENTOFFSET_X), 0);
		addAttribute(new NumberAttribute(FormatAttributes.GRADIENTOFFSET_Y), 0);

		addAttribute(
			new StringAttribute(FormatAttributes.LINECAP),
			FormatAttributes.LineCap.BUTT
		);
		addAttribute(
			new StringAttribute(FormatAttributes.LINEJOIN),
			FormatAttributes.LineJoin.MITER
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.MITERLIMIT),
			FormatAttributes.LineJoin.MiterLimitDefault
		);
		addAttribute(
			new StringAttribute(FormatAttributes.LINECOLOR),
			JSG.theme.border
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEWIDTH),
			FormatAttributes.LineStyle.HAIRLINE
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINESTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.LineStyle,
				FormatAttributes.LineStyle.SOLID
			)
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINESHAPE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.LineShape,
				FormatAttributes.LineShape.SINGLE
			)
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWSTART),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.ArrowStyle,
				FormatAttributes.ArrowStyle.NONE
			)
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWSTARTWIDTH),
			200
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWSTARTLENGTH),
			200
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWEND),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.ArrowStyle,
				FormatAttributes.ArrowStyle.NONE
			)
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWENDWIDTH),
			200
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINEARROWENDLENGTH),
			200
		);
		addAttribute(new NumberAttribute(FormatAttributes.LINECORNER), 0);

		addAttribute(new StringAttribute(FormatAttributes.PATTERN), '');
		addAttribute(
			new NumberAttribute(FormatAttributes.PATTERNSTYLE),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.PatternStyle,
				FormatAttributes.PatternStyle.STRETCH
			)
		);

		addAttribute(
			new StringAttribute(FormatAttributes.SHADOWCOLOR),
			'#DDDDDD'
		);
		addAttribute(new NumberAttribute(FormatAttributes.SHADOWOFFSET_X), 0);
		addAttribute(new NumberAttribute(FormatAttributes.SHADOWOFFSET_Y), 0);
		addAttribute(new NumberAttribute(FormatAttributes.SHADOWBLUR), 0);
		addAttribute(
			new NumberAttribute(FormatAttributes.SHADOWDIRECTION),
			undefined,
			RangeConstraint.fromPropertiesOf(
				FormatAttributes.ShadowDirection,
				FormatAttributes.ShadowDirection.RIGHTBOTTOM
			)
		);

		addAttribute(
			new NumberAttribute(FormatAttributes.TRANSPARENCY),
			100,
			new NumberRangeConstraint(0, 100, 100)
		);
		addAttribute(
			new NumberAttribute(FormatAttributes.LINETRANSPARENCY),
			undefined,
			new NumberRangeConstraint(0, 100, 100)
		);

		return attributes.toTemplate(FormatAttributes.TemplateID);
	}
}


// PREDEFINED ATTRIBUTE VALUES:
/**
 * ArrowStyle definitions
 * @class ArrowStyle
 */
FormatAttributes.ArrowStyle = {
	/**
	 * No Arrow.
	 * @property NONE
	 * @final
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * A filled arrow as line end.
	 * @property ARROWFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWFILLED: 1,
	/**
	 * A small filled arrow as line end.
	 * @property ARROWFILLEDSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWFILLEDSMALL: 2,
	/**
	 * A half filled arrow as line end.
	 * Arrow Type Filled
	 * @property ARROWHALFFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWHALFFILLED: 3,
	/**
	 * A small and half filled arrow as line end.
	 * @property ARROWHALFFILLEDSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWHALFFILLEDSMALL: 4,
	/**
	 * A narrow and filled arrow as line end.
	 * @property ARROWNNARROWFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWNNARROWFILLED: 5,
	/**
	 * A small, narrow and filled arrow as line end.
	 * @property ARROWNARROWFILLEDSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWNARROWFILLEDSMALL: 6,
	/**
	 * Two filled arrows as line end.
	 * @property ARROWDOUBLEFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWDOUBLEFILLED: 7,
	/**
	 * Two small filled arrows as line end.
	 * @property ARROWDOUBLEFILLEDSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWDOUBLEFILLEDSMALL: 8,
	/**
	 * A simple arrow as line end.
	 * @property ARROW
	 * @final
	 * @type {Number}
	 */
	ARROW: 9,
	/**
	 * A small arrow as line end.
	 * @property ARROWSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWSMALL: 10,
	/**
	 * Two arrows as line end.
	 * @property ARROWDOUBLE
	 * @final
	 * @type {Number}
	 */
	ARROWDOUBLE: 11,
	/**
	 * Two small arrows as line end.
	 * @property ARROWDOUBLESMALL
	 * @final
	 * @type {Number}
	 */
	ARROWDOUBLESMALL: 12,
	/**
	 * An arrow with only one side of the arrow as line end.
	 * @property ARROWFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWSINGLESIDE: 13,
	/**
	 * A reversed filled arrow as line end.
	 * @property ARROWREVERSEFILLED
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSEFILLED: 14,
	/**
	 * A reversed small filled arrow as line end.
	 * @property ARROWREVERSEFILLEDSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSEFILLEDSMALL: 15,
	/**
	 * A reversed arrow as line end.
	 * @property ARROWREVERSE
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSE: 16,
	/**
	 * A reversed small arrow as line end.
	 * @property ARROWREVERSESMALL
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSESMALL: 17,
	/**
	 * A small and narrow arrow.
	 * @property ARROWREVERSENARROW
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSENARROW: 18,
	/**
	 * A reversed small and narrow arrow.
	 * @property ARROWREVERSENARROWSMALL
	 * @final
	 * @type {Number}
	 */
	ARROWREVERSENARROWSMALL: 19,
	/**
	 * An orthogonal line and a reversed arrow as line end.
	 * @property LINEARROWREVERSE
	 * @final
	 * @type {Number}
	 */
	LINEARROWREVERSE: 20,
	/**
	 * A circle and an arrow as line end.
	 * @property CIRCLEARROWREVERSE
	 * @final
	 * @type {Number}
	 */
	CIRCLEARROWREVERSE: 21,
	/**
	 * Circle as line end.
	 * @property CIRCLE
	 * @final
	 * @type {Number}
	 */
	CIRCLE: 22,
	/**
	 * Small circle as line end.
	 * @property CIRCLESMALL
	 * @final
	 * @type {Number}
	 */
	CIRCLESMALL: 23,
	/**
	 * Diamond as line end.
	 * @property DIAMOND
	 * @final
	 * @type {Number}
	 */
	DIAMOND: 24,
	/**
	 * Small diamond as line end.
	 * @property DIAMONDSMALL
	 * @final
	 * @type {Number}
	 */
	DIAMONDSMALL: 25,
	/**
	 * An narrow diamond as line end
	 * @property DIAMONDNARROW
	 * @final
	 * @type {Number}
	 */
	DIAMONDNARROW: 26,
	/**
	 * Narrow and small diamond as line end.
	 * @property DIAMONDNARROWSMALL
	 * @final
	 * @type {Number}
	 */
	DIAMONDNARROWSMALL: 27,
	/**
	 * A circle and two orthogonal lines as line end.
	 * @property CIRCLEDOUBLELINE
	 * @final
	 * @type {Number}
	 */
	CIRCLEDOUBLELINE: 28,
	/**
	 * Two orthogonal lines as line end.
	 * @property DOUBLELINE
	 * @final
	 * @type {Number}
	 */
	DOUBLELINE: 29,
	/**
	 * Square line end.
	 * @property SQUARE
	 * @final
	 * @type {Number}
	 */
	SQUARE: 30,
	/**
	 * Small squared line end.
	 * @property SQUARESMALL
	 * @final
	 * @type {Number}
	 */
	SQUARESMALL: 31,
	/**
	 * Narrow and diamond as line end.
	 * @property DIAMONDNARROWLONG
	 * @final
	 * @type {Number}
	 */
	DIAMONDLONG: 32,
	/**
	 * Narrow and diamond as line end.
	 * @property ARROWNARROWFILLEDLONG
	 * @final
	 * @type {Number}
	 */
	ARROWFILLEDLONG: 33,
	/**
	 * Narrow and diamond as line end.
	 * @property DIAGONALLINE
	 * @final
	 * @type {Number}
	 */
	DIAGONALLINE: 34,
	/**
	 * Narrow and diamond as line end.
	 * @property CIRCLESMALLAROUND
	 * @final
	 * @type {Number}
	 */
	CIRCLESMALLAROUND: 35,

	SIZEABLE_ARROW: 100,
	SIZEABLE_PARTIALARROW: 101,
	SIZEABLE_FILLEDARROW: 102,
	SIZEABLE_DIAMOND: 103,
	SIZEABLE_CIRCLE: 104,
	SIZEABLE_RECTANGLE: 105,
	SIZEABLE_DIAGONALLINE: 106
};
/**
 * LineStyle definitions
 * @class LineStyle
 */
FormatAttributes.LineStyle = {
	/**
	 * Solid line with 1 pixel width, which does not zoom.
	 * @property HAIRLINE
	 * @final
	 * @type {Number}
	 */
	HAIRLINE: -1,
	/**
	 * No visible line.
	 * @property NONE
	 * @final
	 * @type {Number}
	 */
	NONE: 0,
	/**
	 * Solid line.
	 * @property SOLID
	 * @final
	 * @type {Number}
	 */
	SOLID: 1,
	/**
	 * Line with dots.
	 * @property DOT
	 * @final
	 * @type {Number}
	 */
	DOT: 2,
	/**
	 * Lines with dashes.
	 * @property DASH
	 * @final
	 * @type {Number}
	 */
	DASH: 3,
	/**
	 * Line with dashes and dots.
	 * @property DASHDOT
	 * @type {Number}
	 * @final
	 */
	DASHDOT: 4,
	/**
	 * Line with dashes and double dots.
	 * @property DASHDOTDOT
	 * @final
	 * @type {Number}
	 */
	DASHDOTDOT: 5,
	/**
	 * Lines with short dashes.
	 * @property SDASH
	 * @final
	 * @type {Number}
	 */
	SDASH: 6,
	/**
	 * Lines with long dashes.
	 * @property LDASH
	 * @final
	 * @type {Number}
	 * @since 1.6.19
	 */
	LDASH: 7,
	/**
	 * Lines with dashes and short dashes.
	 * @property DASHSDASH
	 * @final
	 * @type {Number}
	 * @since 1.6.19
	 */
	DASHSDASH: 8,
	/**
	 * Lines with long dashes and short dashes.
	 * @property LDASHSDASH
	 * @final
	 * @type {Number}
	 * @since 1.6.19
	 */
	LDASHSDASH: 9,
	/**
	 * Lines with long dashes and short dashes.
	 * @property LDASHSDASHSDASH
	 * @final
	 * @type {Number}
	 * @since 1.6.19
	 */
	LDASHSDASHSDASH: 10
};
/**
 * LineCap definitions. Specifies the supported line endings.
 * @class LineCap
 */
FormatAttributes.LineCap = {
	/**
	 * The default line ending. A flat edge which is perpendicular to the edge of the line.
	 * @property BUTT
	 * @final
	 * @type {String}
	 */
	BUTT: 'butt',
	/**
	 * A semicircle which has a diameter that is half the line width.
	 * @property ROUND
	 * @final
	 * @type {String}
	 */
	ROUND: 'round',
	/**
	 * A rectangle with the length of the line width and the width of half the line width which is placed flat
	 * perpendicular to the edge of the line.
	 * @property SQUARE
	 * @final
	 * @type {String}
	 */
	SQUARE: 'square'
};
/**
 * LineJoin definitions. Specifies the supported line joins values.<br/>
 * A line join determines how two connected line segments of a shape are joined together.
 * @class LineJoin
 * @since 1.6.15
 */
FormatAttributes.LineJoin = {
	/**
	 * A filled triangle connecting the two joined line segments, creates a beveled corner.
	 * @property BEVEL
	 * @final
	 * @type {String}
	 */
	BEVEL: 'bevel',
	/**
	 * A filled arc connecting the two joined line segments, creates a rounded corner.
	 * @property ROUND
	 * @final
	 * @type {String}
	 */
	ROUND: 'round',
	/**
	 * The default join value. The joined line segments are extended until they intersect and the resulting triangle is
	 * filled, creates a pointed corner.
	 * @property MITER
	 * @final
	 * @type {String}
	 */
	MITER: 'miter',
	/**
	 * The default value to limit a join of type {{#crossLink
	 * "FormatAttributes.LineJoin/MITER:property"}}{{/crossLink}}.
	 * @property MiterLimitDefault
	 * @final
	 * @type {Number}
	 */
	MiterLimitDefault: 500 // this is already in logical device
};

/**
 * LineShape definitions
 * @class LineShape
 */
FormatAttributes.LineShape = {
	/**
	 * Single line.
	 * @property SINGLE
	 * @final
	 * @type {Number}
	 */
	SINGLE: 0,
	/**
	 * Double line.
	 * @property DOUBLE
	 * @final
	 * @type {Number}
	 */
	DOUBLE: 1
};

/**
 * FillStyle definitions
 * @class FillStyle
 */
FormatAttributes.FillStyle = {
	/**
	 * No fill.
	 * @property {Number} NONE
	 * @final
	 */
	NONE: 0,
	/**
	 * Solid fill with color.
	 * @property {Number} SOLID
	 * @final
	 */
	SOLID: 1,
	/**
	 * Gradient fill with foreground and background color.
	 * @property {Number} GRADIENT
	 * @final
	 */
	GRADIENT: 2,
	/**
	 * Pattern fill with image.
	 * @property {Number} PATTERN
	 * @final
	 */
	PATTERN: 3
};
/**
 * GradientStyle definitions
 * @class GradientStyle
 */
FormatAttributes.GradientStyle = {
	/**
	 * Linear gradient along line.
	 * @property {Number} LINEAR
	 * @final
	 */
	LINEAR: 0,
	/**
	 * Circular gradient fill around center.
	 * @property {Number} RADIAL
	 * @final
	 */
	RADIAL: 1
};
/**
 * PatternStyle definitions
 * @class FormatAttributes.PatternStyle
 */
FormatAttributes.PatternStyle = {
	/**
	 * Stretch image to fill object.
	 * @property {Number} STRETCH
	 * @final
	 */
	STRETCH: 0,
	/**
	 * Repeat image to fill object.
	 * @property {Number} REPEAT
	 * @final
	 */
	REPEAT: 1,
	/**
	 * Center image in object. Does not rescale the image.
	 * @property {Number} CENTER
	 * @final
	 */
	CENTER: 2,
	/**
	 * Stretch image to fill object keeping the height/width ratio.
	 * @property {Number} STRETCHPROPORTIONAL
	 * @final
	 */
	STRETCHPROPORTIONAL: 3
};
/**
 * ShadowDirection definitions
 * @class ShadowDirection
 */
FormatAttributes.ShadowDirection = {
	/**
	 * Shadow to left and top direction.
	 * @property {Number} LEFTTOP
	 * @final
	 */
	LEFTTOP: 0,
	/**
	 * Shadow to left and bottom direction.
	 * @property {Number} LEFTTOP
	 * @final
	 */
	LEFTBOTTOM: 1,
	/**
	 * Shadow to right and top direction.
	 * @property {Number} RIGHTTOP
	 * @final
	 */
	RIGHTTOP: 2,
	/**
	 * Shadow to right and bottom direction.
	 * @property {Number} RIGHTBOTTOM
	 * @final
	 */
	RIGHTBOTTOM: 3
};

FormatAttributes.template = FormatAttributes.createTemplate();

module.exports = FormatAttributes;
