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
/* global document */

import {
	Point,
	Rectangle,
	Arrays,
	Dictionary,
	MathUtils,
	FormatAttributes,
	BoundingBox,
	GraphSettings,
	default as JSG
} from '@cedalo/jsg-core';
import SelectionStyle from '../../graph/view/selection/SelectionStyle';

const RECT_POINTS = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];

const tmppoints = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];

/**
 * A predefined filter object used to realize a kind of black-white drawing.<br/>
 * Each filter object must provide two functions, namely an <code>update</code> and an <code>apply</code> function. The
 * <code>update</code> function is called at the beginning and end of a drawing block. At the beginning either the
 * currently drawn view is passed or a <code>"n.a."</code> string. To signal the end of a drawing block
 * <code>update</code> is simply called with <code>undefined</code>.<br/> Unlike <code>update</code> the
 * <code>apply</code> function is called during drawing operations to change certain format values. Currently following
 * format settings are passed to the
 * <code>apply</code> function as strings:
 * <ul>
 *     <li><code>fontcolor</code></li>
 *     <li><code>fillcolor</code></li>
 *     <li><code>fillstyle</code></li>
 *     <li><code>linestyle</code></li>
 *     <li><code>linecolor</code></li>
 *     <li><code>shadowblur</code></li>
 *     <li><code>shadowoffset</code></li>
 * </ul>
 * If the format is not handled by the <code>apply</code> function it should return the default value which is passed
 * as
 * second parameter.</br>
 *
 * @property BW_FILTER
 * @type {Object}
 * @static
 * @since 2.0.22.0
 */
const BW_FILTER = (() => {
	const filter = {};
	filter.view = undefined;
	filter.views = [];
	filter.defaults = {
		fontcolor: '#000000',
		fillcolor: '#FFFFFF',
		fillstyle: undefined,
		shadowblur: 0,
		shadowoffset: 0,
		linecolor: '#000000'
	};
	/**
	 * Called at the beginning and end of a drawing block.
	 * @method update
	 * @param {View|String} [view] If a drawing block begins the currently drawn view or <code>"n.a."</code> is
	 * specified. At the end of a drawing block <code>view</code> is <code>undefined</code>.
	 */
	filter.update = (view) => {
		const { views } = filter;
		if (!view) {
			views.pop();
		} else {
			// push even if it is no view to stay in sync with pop on restore...
			views.push(view);
		}
		// update currently used view...
		filter.view = views.length ? views[views.length - 1] : undefined;
	};
	/**
	 * Applies this filter on the format specified by given <code>type</code> string.
	 * @method apply
	 * @param {String} type One of the predefined format type strings.
	 * @param {Object} def A default value to return if format type is not handled.
	 * @return {Object} Either a filtered value or the default.
	 */
	filter.apply = (type, def) => {
		let val = def;
		const { view } = filter;
		// apply filter only to views which have a model...
		if (view && view.getItem && view.getItem()) {
			val = filter.defaults[type];
			val = val !== undefined ? val : def;
		}
		return val;
	};
	return filter;
})();

/**
 * The Graphics class encapsulates all graphic output. It provides output, transformation and information functions to
 * visualize graphical information within a canvas object. In general the Graphics class should not be used directly
 * and you should visualize your output using the GraphItems. <br/> As of version <code>2.0.22.0</code> an optional
 * filter object can be set to influence certain drawing formats. Please refer to provided {{#crossLink
 * "Graphics/BW_FILTER:property"}}{{/crossLink}} for more information about the filter feature.
 *
 * @example
 *     // canvas given
 *     var graphics = new Graphics(canvas, new CoordinateSystem());
 *     // set red line color
 *     graphics.setLineColor('#FF0000');
 *     // set blue fill color
 *     graphics.setFillColor('#0000FF');
 *     graphics.drawEllipse(new Rectangle(1000, 1000, 500, 500));
 *
 *
 * @class Graphics
 * @constructor
 * @param {Canvas} canvas Canvas to be used for output.
 * @param {CoordinateSystem} coordinateSystem Coordinate System to be used within graphics. The
 *     coordinate system is used for some necessary conversions between logical and device units
 */
class Graphics {
	constructor(canvas, coordinateSystem) {
		this._context2D = canvas && canvas.getContext('2d');
		this._cs = coordinateSystem;

		this._lineWidth = FormatAttributes.LineStyle.HAIRLINE;
		this._lineStyle = FormatAttributes.LineStyle.SOLID;
		this._lineShape = FormatAttributes.LineShape.SINGLE;
		this._lineArrowStart = FormatAttributes.ArrowStyle.NONE;
		this._lineArrowEnd = FormatAttributes.ArrowStyle.NONE;
		this._lineCorner = 0;

		this._patternMap = new Dictionary();
		this._patternStyle = undefined;
		this._pattern = undefined;
		this._fillStyle = FormatAttributes.FillStyle.SOLID;
		this._fillColor = '#FFFFFF';

		this._fontName = 'Verdana';
		this._fontSize = 8;
		this._fontStyle = JSG.TextFormatAttributes.FontStyle.NORMAL;
		this._horizontalAlignment = JSG.TextFormatAttributes.TextAlignment.CENTER;

		this.translateStack = [];
		this.m = [1, 0, 0, 1, 0, 0];
		this.antialias = false;
		this._portPointMap = new Dictionary();
		this._transparencyEnabled = true;

		/**
		 * An optional filter property to influence drawing. Please refer to provided {{#crossLink
		 * "Graphics/BW_FILTER:property"}}{{/crossLink}} for more information about the filter feature.
		 * @property filter
		 * @type {Object}
		 * @since 2.0.22.0
		 */
		this.filter = undefined;
	}

	// empty func only implemented in SVGraphics to add context information
	addInfo() {}

	addBoundingRectInfo() {}

	disableTransparency() {
		this._transparencyEnabled = false;
	}

	enableTransparency() {
		this._transparencyEnabled = true;
	}

	reset() {
		this._portPointMap.clear();
	}

	resetLine() {
		const FORMAT = FormatAttributes;
		this.setLineCap('butt');
		this.setLineJoin('miter');
		this.setMiterLimit(10);
		this.setLineStyle(FORMAT.LineStyle.SOLID);

		this._lineShape = FORMAT.LineShape.SINGLE;
		this._lineArrowStart = FORMAT.ArrowStyle.NONE;
		this._lineArrowEnd = FORMAT.ArrowStyle.NONE;

		this.setLineCorner(0);
		this.setTransparency(100);
	}

	/**
	 * Checks if a canvas is assigned.
	 *
	 * @method isContextDefined
	 * @return {Boolean} True, if a canvas is assigned, otherwise false.
	 * @private
	 */
	isContextDefined() {
		return this._context2D !== undefined;
	}

	/**
	 * Get attached Coordinate System.
	 *
	 * @method getCoordinateSystem
	 * @return {CoordinateSystem} Current Coordinate System.
	 */
	getCoordinateSystem() {
		return this._cs;
	}

	/**
	 * Set Coordinate System.
	 *
	 * @method setCoordinateSystem
	 * @param {CoordinateSystem} cs New Coordinate System.
	 */
	setCoordinateSystem(cs) {
		this._cs = cs;
	}

	/**
	 * Save the current canvas state including transformations, clip status and format definitions.<br/>
	 * As of version <code>2.0.22.0</code> this method takes an optional <code>view</code> parameter to support filter
	 * feature.
	 *
	 * @method save
	 * @param {View} [view] The currently drawn view should be passed to support filter feature.
	 */
	save(view) {
		this._context2D.save();
		this.translateStack.push(this.m.slice());
		if (this.filter) {
			this.filter.update(view || 'n.a.');
		}
	}

	/**
	 * Restore the last saved canvas status.
	 *
	 * @method restore
	 */
	restore() {
		this._context2D.restore();
		this.m = this.translateStack[this.translateStack.length - 1];
		this.translateStack.pop();
		if (this.filter) {
			this.filter.update();
		}
	}

	/**
	 * Get the current 2D canvas context. The context can be used for direct output to the underlying canvas. This
	 * should be used with care as derived classes can not handle the direct output.
	 *
	 * @method getContext
	 * @return {context2D} 2D Canvas context
	 */
	getContext() {
		return this._context2D;
	}

	/**
	 * Set the transparency of the output. Using the transparency items below the transparent items shine through.
	 *
	 * @method setTransparency
	 * @param {Number} transparency Grade of transparency. Values between 0 and 100 are allowed, where 0 stands for
	 *     complete transparency and 100 for no transparency.
	 */
	setTransparency(transparency) {
		if (this._transparencyEnabled && this._context2D.globalAlpha !== transparency / 100) {
			this._context2D.globalAlpha = transparency / 100;
		}
	}

	/**
	 * Translate the output by the given coordinates. All output generated after a call to translate will be drawn with
	 * an offset defined using this function.
	 *
	 * @method translate
	 * @param {Number} dx Horizontal offset.
	 * @param {Number} dy Vertical offset.
	 */
	translate(dx, dy) {
		this.translateM(dx, dy);
	}

	/**
	 * Scales the output by the given scale factors. All following output will be drawn using the given scaling factors.
	 *
	 * @method scale
	 * @param {Number} x Scale factor for horizontal coordinates.
	 * @param {Number} y Scale factor for vertical coordinates.
	 */
	scale(x, y) {
		this.scaleM(x, y);
	}

	/**
	 * Rotate the graphic context. All following draw operations will be rotated by the given angle.
	 *
	 * @method rotate
	 * @param {Number} angle Angle in radians.
	 */
	rotate(angle) {
		this.rotateM(angle);
	}

	/**
	 * Clip following output to a previously created path.
	 *
	 * @method clip
	 */
	clip() {
		this._context2D.clip();
	}

	rectangle(r) {
		this.rect(r.x, r.y, r.width, r.height);
	}

	drawRectangle(x, y, width, height) {
		const p1 = this.transformPoint(x, y, 0);
		width = Math.ceil(width);
		height = Math.ceil(height);

		const angle = this.getRotation();
		if (angle) {
			this._context2D.translate(p1.x, p1.y);
			this._context2D.rotate(angle);
			this._context2D.strokeRect(0, 0, width, height);
			this._context2D.rotate(-angle);
			this._context2D.translate(-p1.x, -p1.y);
		} else {
			this._context2D.strokeRect(p1.x, p1.y, width, height);
		}
	}

	fillRectangle(x, y, width, height) {
		this._fillOperation = true;
		const p1 = this.transformPoint(x, y, 0);
		width = Math.ceil(width);
		height = Math.ceil(height);

		const angle = this.getRotation();
		if (angle) {
			this._context2D.translate(p1.x, p1.y);
			this._context2D.rotate(angle);
			this._context2D.fillRect(0, 0, width, height);
			this._context2D.rotate(-angle);
			this._context2D.translate(-p1.x, -p1.y);
		} else {
			this._context2D.fillRect(p1.x, p1.y, width, height);
		}
		this._fillOperation = false;
	}

	fillRoundedRectangle(x, y, width, height, rlt, rrt, rlb, rrb) {
		this._fillOperation = true;
		const p1 = this.transformPoint(x, y, 0);
		width = Math.ceil(width);
		height = Math.ceil(height);

		this.beginPath();
		this._context2D.moveTo(p1.x + rlt, p1.y);
		this._context2D.arcTo(p1.x + width, p1.y, p1.x + width, p1.y + height, rrt);
		this._context2D.arcTo(p1.x + width, p1.y + height, p1.x, p1.y + height, rrb);
		this._context2D.arcTo(p1.x, p1.y + height, p1.x, p1.y, rlb);
		this._context2D.arcTo(p1.x, p1.y, p1.x + width, p1.y, rlt);
		this.closePath();
		this.fill();
		this._fillOperation = false;
	}

	drawRoundedRectangle(x, y, width, height, rlt, rrt, rlb, rrb) {
		this._fillOperation = true;
		const p1 = this.transformPoint(x, y, 0);
		width = Math.ceil(width);
		height = Math.ceil(height);

		this.beginPath();
		this._context2D.moveTo(p1.x + rlt, p1.y);
		this._context2D.arcTo(p1.x + width, p1.y, p1.x + width, p1.y + height, rrt);
		this._context2D.arcTo(p1.x + width, p1.y + height, p1.x, p1.y + height, rrb);
		this._context2D.arcTo(p1.x, p1.y + height, p1.x, p1.y, rlb);
		this._context2D.arcTo(p1.x, p1.y, p1.x + width, p1.y, rlt);
		this.closePath();
		this.stroke();
		this._fillOperation = false;
	}

	rect(x, y, width, height) {
		this._fillOperation = true;
		const p1 = this.transformPoint(x, y, 0);
		width = Math.ceil(width - 0.5);
		height = Math.ceil(height - 0.5);

		const angle = this.getRotation();
		if (angle) {
			this._context2D.translate(p1.x, p1.y);
			this._context2D.rotate(angle);
			this._context2D.rect(0, 0, width, height);
			this._context2D.rotate(-angle);
			this._context2D.translate(-p1.x, -p1.y);
		} else {
			this._context2D.rect(p1.x, p1.y, width, height);
		}
		this._fillOperation = false;
	}

	/**
	 * Clip following output to the given Rectangle.
	 *
	 * @method setClip
	 * @param {Rectangle} rect Rectangle to clip to..
	 */
	setClip(rect) {
		const pix = this._cs.deviceToLogX(1.5);
		const clipRect = JSG.rectCache.get().setTo(rect);

		this._fillOperation = true;

		clipRect.x -= pix;
		clipRect.y -= pix;
		clipRect.height += pix * 2;
		clipRect.width += pix * 2;

		const pts = clipRect.getPoints(RECT_POINTS);
		this.setClipArea(undefined, pts, undefined);
		JSG.rectCache.release(clipRect);

		this._fillOperation = false;
	}

	/**
	 * Clips following output to given rectangle.</br>
	 * The difference to {{#crossLink "Graphics/setClip:method"}}{{/crossLink}} is that this method
	 * translates given rectangle to current canvas state including all transformations and rotations.
	 *
	 * @method setImageClip
	 * @param {Rectangle} rect Rectangle to clip to.
	 */
	setImageClip(rect) {
		this.beginPath();
		const p = this.transformPoint(rect.x, rect.y, 0);
		p.x -= 0.5;
		p.y -= 0.5;
		this._context2D.rect(p.x, p.y, MathUtils.round(rect.width), MathUtils.round(rect.height));
		//    this._context2D.rect(rect.x, rect.y, rect.width, rect.height);
		this.closePath();
		this.clip();
	}

	addClipRect(rect) {
		const p = this.transformPoint(rect.x, rect.y, 0);
		p.x -= 0.5;
		p.y -= 0.5;
		this._context2D.rect(p.x, p.y, MathUtils.round(rect.width), MathUtils.round(rect.height));
	}

	/**
	 * Clip output to a given polygon or bezier path, defined by the passed point definitions. A bezier is defined by
	 * the context point that is part of the curve and two control points, that define the shape of the curve. The
	 * first control point (cpFrom) precedes the point on the curve and defines how the curve point is approached from
	 * the previous point and the second control point (cpTo) defines how the curve is continued after the context
	 * point.
	 *
	 * @method setClipArea
	 * @param {Point[]} [cpFrom] Bezier control points. This point list defines the control points
	 *     preceding the context points. If not defined, only the second points parameter will be used and the clip
	 *     region is defined as a polygon.
	 * @param {Point[]} points Points, definining the polygon or the context points of a bezier.
	 * @param {Point[]} [cpTo] Bezier control points. This point list defines the control points following
	 *     the context points. If not defined, only the second points parameter will be used and the clip region is
	 *     defined as a polygon.
	 */
	setClipArea(cpTo, points, cpFrom) {
		if (points.length === 0) {
			return;
		}

		let i;
		let n;

		this.beginPath();
		this.moveTo(points[0].x, points[0].y);
		if (cpFrom !== undefined && cpTo !== undefined) {
			for (i = 1, n = points.length; i < n; i += 1) {
				this.bezierCurveTo(cpTo[i - 1].x, cpTo[i - 1].y, cpFrom[i].x, cpFrom[i].y, points[i].x, points[i].y);
			}
			this.bezierCurveTo(
				cpTo[points.length - 1].x,
				cpTo[points.length - 1].y,
				cpFrom[0].x,
				cpFrom[0].y,
				points[0].x,
				points[0].y
			);
		} else {
			for (i = 1, n = points.length; i < n; i += 1) {
				this.lineTo(points[i].x, points[i].y);
			}
		}
		this.closePath();
		this.clip();
	}

	/**
	 * Set a fill color to be used for the following drawing operations.
	 *
	 * @method setFillColor
	 * @param {String} color Fill color definition. The fill color is given as a hexadecimal string preceded by a hash
	 *     (#). '#FFFFFF' is defined as a white fill color. and '#000000' would define a black fill color.
	 */
	setFillColor(color) {
		color = this._filter('fillcolor', color);
		if (this._context2D.fillStyle !== color) {
			this._context2D.fillStyle = color;
			this._fillColor = color;
		}
	}

	/**
	 * Returns the currently used fill color.</br>
	 * See {{#crossLink "Graphics/setFillColor:method"}}{{/crossLink}} for additional information about
	 * valid fill color values.
	 *
	 * @method getFillColor
	 * @return {String} The currently used fill color.
	 */
	getFillColor() {
		return this._fillColor;
	}

	/**
	 * Set line cap to be used for the following drawing operations.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineCap"}}{{/crossLink}} for information on
	 * supported line caps.
	 *
	 * @method setLineCap
	 * @param {String} cap The line cap to use.
	 * @since 1.6.0
	 */
	setLineCap(cap) {
		if (cap && this._context2D.lineCap !== cap) {
			this._context2D.lineCap = cap;
		}
	}

	/**
	 * Sets the line join to be used for the following drawing operations.<br/>
	 * Please refer to {{#crossLink "FormatAttributes.LineJoin"}}{{/crossLink}} for information on
	 * supported line joins.
	 *
	 * @method setLineJoin
	 * @param {String} join The line join to use.
	 * @since 1.6.15
	 */
	setLineJoin(join) {
		if (join && this._context2D.lineJoin !== join) {
			this._context2D.lineJoin = join;
		}
	}

	/**
	 * Sets the miter limit to be used for line joins. The limit describes the maximum extension a line join of type
	 * {{#crossLink "FormatAttributes.LineJoin/MITER:property"}}{{/crossLink}} can have. Please refer to
	 * {{#crossLink "Graphics.prototype/setLineJoin:method"}}{{/crossLink}} too.
	 *
	 * @method setMiterLimit
	 * @param {Number} limit The miter limit given in our internal metric value, i.e. in 1/100th mm.
	 * @since 1.6.15
	 */
	setMiterLimit(limit) {
		limit = limit !== FormatAttributes.MiterLimitDefault ? this._cs.metricToLogX(limit) : limit;
		// zoom is in cs! -> this might lead to a miter clip on different zoom level... review...
		this._context2D.miterLimit = this._cs.logToDeviceX(limit);
	}

	/**
	 * Set a line color to be used for the following drawing operations.
	 *
	 * @method setLineColor
	 * @param {String} color Line color definition. The line color is given as a hexadecimal string preceded by a hash
	 *     (#). '#FFFFFF' is defined as a white fill color. and '#000000' would define a black fill color.
	 */
	setLineColor(color) {
		color = this._filter('linecolor', color);
		if (this._context2D.strokeStyle !== color) {
			this._context2D.strokeStyle = color;
		}
	}

	/**
	 * Define a line style to be used for the following drawing operations.
	 *
	 * @method setLineStyle
	 * @param {FormatAttributes.LineStyle} style New line style definition.
	 * @return {Number} The applied style which might be changed by an optional filter.
	 */
	setLineStyle(style) {
		style = this._filter('linestyle', style);
		this._lineStyle = style;
		return style;
	}

	setLineShape(shape) {
		this._lineShape = shape;
	}

	/**
	 * Define a fill style to be used for the following drawing operations.
	 *
	 * @method setFillStyle
	 * @param {FormatAttributes.FillStyle} style New fill style definition.
	 * @return {Number} The applied style which might be changed by an optional filter.
	 */
	setFillStyle(style) {
		style = this._filter('fillstyle', style);
		this._fillStyle = style;
		return style;
	}

	/**
	 * Return the current fill style.
	 *
	 * @method getFillStyle
	 * @return {Number} The current fill style.
	 * @since 3.0
	 */
	getFillStyle() {
		return this._fillStyle;
	}

	/**
	 * Defines horizontal text alignment to be used for the following text drawing operations.</br>
	 * Note: the given alignment is not directly applied. It is only utilized by a call to
	 * {{#crossLink "Graphics/fillText:method"}}{{/crossLink}}.
	 *
	 * @method setTextAlign
	 * @param {JSG.TextFormatAttributes.TextAlignment} align New text alignment.
	 */
	setTextAlign(align) {
		this._horizontalAlignment = align;
	}

	/**
	 * Defines horizontal text alignment to be used for the following text drawing operations.</br>
	 * In contrast to {{#crossLink "Graphics/setTextAlign:method"}}{{/crossLink}} this method applies
	 * the given alignment to internal drawing context directly.
	 *
	 * @method setTextAlignment
	 * @param {JSG.TextFormatAttributes.TextAlignment} align New text alignment.
	 */
	setTextAlignment(align) {
		switch (align) {
			case JSG.TextFormatAttributes.TextAlignment.LEFT:
				this._context2D.textAlign = 'left';
				break;
			case JSG.TextFormatAttributes.TextAlignment.CENTER:
				this._context2D.textAlign = 'center';
				break;
			case JSG.TextFormatAttributes.TextAlignment.RIGHT:
				this._context2D.textAlign = 'right';
				break;
		}
		this._horizontalAlignment = align;
	}

	/**
	 * Defines the vertical placement of text output relative to the given coordinate.
	 *
	 * @method setTextBaseline
	 * @param {String} baseline Baseline definitions like in canvas specification (alphabetic, top, hanging, middle,
	 *     ideographic, bottom).
	 */
	setTextBaseline(baseline) {
		this._context2D.textBaseline = baseline;
	}

	/**
	 * Set the font name of the font to be used for text output. You need to call setFont to activate the font settings
	 * for text output.
	 *
	 * @method setFontName
	 * @param {String} name New font name. The use of 'Websafe' fonts is recommended.
	 */
	setFontName(name) {
		this._fontName = name;
	}

	/**
	 * Set the font size of the font to be used for text output. You need to call setFont to activate the font settings
	 * for text output.
	 *
	 * @method setFontSize
	 * @param {Number} size New font size in point.
	 */
	setFontSize(size) {
		this._fontSize = size;
	}

	/**
	 * Set the font style of the font to be used for text output. You need to call setFont to activate the font
	 * settings for text output.
	 *
	 * @method setFontStyle
	 * @param {JSG.TextFormatAttributes.FontStyle} style New font style.
	 */
	setFontStyle(style) {
		this._fontStyle = style;
	}

	getFontStyle() {
		return this._fontStyle;
	}

	/**
	 * Activate the font information for the following text output. After setting the font information (setFontName
	 * etc.), the font has to be activated before text output will use the font information.
	 *
	 * @method setFont
	 */
	setFont() {
		let font = '';

		if (this._fontStyle & JSG.TextFormatAttributes.FontStyle.BOLD) {
			font += 'bold ';
		}
		if (this._fontStyle & JSG.TextFormatAttributes.FontStyle.ITALIC) {
			font += 'italic ';
		}

		if (this._fontName !== undefined && this._fontSize) {
			const size = this._fontSize * this._cs.getZoom(true);
			if (this._fontName.indexOf(' ') === -1) {
				font += `${size}pt ${this._fontName}`;
			} else {
				font += `${size}pt ${this._fontName},${this._fontName.replace(' ', '')}`;
			}
		}

		if (font !== this._context2D.font) {
			this._context2D.font = font;
		}

		switch (this._horizontalAlignment) {
			case JSG.TextFormatAttributes.TextAlignment.LEFT:
				this._context2D.textAlign = 'left';
				break;
			case JSG.TextFormatAttributes.TextAlignment.CENTER:
				this._context2D.textAlign = 'center';
				break;
			case JSG.TextFormatAttributes.TextAlignment.RIGHT:
				this._context2D.textAlign = 'right';
				break;
		}
	}

	setFontTo(font) {
		this._context2D.font = font;
	}

	/**
	 * Draw an elliptical border on the canvas.
	 *
	 * @method drawEllipse
	 * @param {Rectangle} rect Bounding rectangle of the ellipse to be drawn.
	 */
	drawEllipse(rect) {
		if (this._lineStyle === FormatAttributes.LineStyle.NONE) {
			return;
		}

		if (rect.width !== 0 && rect.height !== 0) {
			const kappa = 0.5522848;
			const ox = (rect.width / 2) * kappa; // control point offset horizontal
			const oy = (rect.height / 2) * kappa; // control point offset vertical
			const xe = rect.x + rect.width; // x-end
			const ye = rect.y + rect.height; // y-end
			const xm = rect.x + rect.width / 2; // x-middle
			const ym = rect.y + rect.height / 2;
			// y-middle

			this.beginPath();
			this.moveTo(rect.x, ym);
			this.bezierCurveTo(rect.x, ym - oy, xm - ox, rect.y, xm, rect.y);
			this.bezierCurveTo(xm + ox, rect.y, xe, ym - oy, xe, ym);
			this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
			this.bezierCurveTo(xm - ox, ye, rect.x, ym + oy, rect.x, ym);
			this.closePath();
			this.stroke();
		}
	}

	/**
	 * Draw a line on the canvas.
	 *
	 * @method drawLine
	 * @param {Point} start Start point of the line.
	 * @param {Point} end End point of the line.
	 */
	drawLine(start, end) {
		const linestyle = this._lineStyle;
		if (linestyle === FormatAttributes.LineStyle.NONE) {
			return;
		}

		this.beginPath();

		let lineWidth;
		let pattern;

		if (linestyle === FormatAttributes.LineStyle.SOLID || this._context2D.setLineDash) {
			if (linestyle !== FormatAttributes.LineStyle.SOLID && this._context2D.setLineDash) {
				lineWidth = this._dashLineWidth || Math.max(this._context2D.lineWidth, 1);
				pattern = this.getDashPattern(lineWidth);
				this._context2D.setLineDash(pattern);
			}
			this.moveTo(start.x, start.y);
			this.lineTo(end.x, end.y);
		} else {
			lineWidth = this._dashLineWidth || Math.max(this._context2D.lineWidth, this._cs.deviceToLogX(1));
			pattern = this.getDashPattern(lineWidth);
			const lt = (a, b) => a <= b;
			const gt = (a, b) => a >= b;
			const capmin = (a, b) => Math.min(a, b);
			const capmax = (a, b) => Math.max(a, b);
			const checkX = {
				thereYet: gt,
				cap: capmin
			};
			const checkY = {
				thereYet: gt,
				cap: capmin
			};
			const roundTo = (number, decimals) => {
				const factor = 10 ** decimals;
				return Math.round(number * factor) / factor;
			};

			const lineStart = start.copy();
			const lineEnd = end.copy();
			if (
				Number.isNaN(lineEnd.x) ||
				Number.isNaN(lineEnd.y) ||
				Number.isNaN(lineStart.x) ||
				Number.isNaN(lineStart.y)
			) {
				JSG.debug.log('invalid parameters in Graphics#drawLine !!!');
				return;
			}
			lineStart.x = roundTo(start.x, 5);
			lineStart.y = roundTo(start.y, 5);
			lineEnd.x = roundTo(end.x, 5);
			lineEnd.y = roundTo(end.y, 5);

			if (lineStart.y - lineEnd.y > 0) {
				checkY.thereYet = lt;
				checkY.cap = capmax;
			}
			if (lineStart.x - lineEnd.x > 0) {
				checkX.thereYet = lt;
				checkX.cap = capmax;
			}

			this.moveTo(lineStart.x, lineStart.y);
			let offsetX = lineStart.x;
			let offsetY = lineStart.y;
			let idx = 0;
			let drawDash = true;

			while (!(checkX.thereYet(offsetX, lineEnd.x) && checkY.thereYet(offsetY, lineEnd.y))) {
				const ang = Math.atan2(lineEnd.y - lineStart.y, lineEnd.x - lineStart.x);
				const len = pattern[idx];
				offsetX = checkX.cap(lineEnd.x, offsetX + Math.cos(ang) * len);
				offsetY = checkY.cap(lineEnd.y, offsetY + Math.sin(ang) * len);
				if (drawDash) {
					this.lineTo(offsetX, offsetY);
				} else {
					this.moveTo(offsetX, offsetY);
				}
				idx = (idx + 1) % pattern.length;
				drawDash = !drawDash;
			}
		}
		this.stroke();

		this.clearLineDash();
	}

	/**
	 * Draw an arrow at the end of the line. The start and end points are needed to calculate the direction of the
	 * line.
	 * The arrow is drawn using the current line color and fill color.
	 *
	 * @method drawArrow
	 * @param {Point} start Start point of the line.
	 * @param {Point} end End point of the line.
	 * @param {FormatAttributes.ArrowStyle} type Arrow style.
	 * @param {Number} type Arrow style.
	 * @param {Number} [width] An optional value to use as arrow width. If not provided the arrow size is determined by
	 *     specified arrow style.
	 * @param {Number} [length] An optional value to use as arrow length. If not provided the arrow size is determined
	 *     by specified arrow style. See {{#crossLink
	 *     "Graphics/getArrowWidthByType:method"}}{{/crossLink}}
	 */
	drawArrow(start, end, type, width, length) {
		if (type === FormatAttributes.ArrowStyle.NONE) {
			return undefined;
		}

		if (width === undefined) {
			width = 200; // this.getArrowWidthByType(type);
		}
		if (length === undefined) {
			length = 200;
		}
		// set the two arrow base points
		let fill = true;
		const alpha = Math.atan2(end.y - start.y, end.x - start.x);

		this.beginPath();

		if (type >= FormatAttributes.ArrowStyle.SIZEABLE_ARROW) {
			const alphaCosW = (Math.cos(alpha) * width) / 2;
			const alphaCosL = Math.cos(alpha) * length;
			const alphaSinW = (Math.sin(alpha) * width) / 2;
			const alphaSinL = Math.sin(alpha) * length;

			switch (type) {
				case FormatAttributes.ArrowStyle.SIZEABLE_ARROW:
					this.moveTo(end.x - alphaCosL + alphaSinW, end.y - alphaSinL - alphaCosW);
					this.lineTo(end.x, end.y);
					this.lineTo(end.x - alphaCosL - alphaSinW, end.y - alphaSinL + alphaCosW);
					fill = false;
					break;
				case FormatAttributes.ArrowStyle.SIZEABLE_FILLEDARROW:
					this.moveTo(end.x - alphaCosL + alphaSinW, end.y - alphaSinL - alphaCosW);
					this.lineTo(end.x, end.y);
					this.lineTo(end.x - alphaCosL - alphaSinW, end.y - alphaSinL + alphaCosW);
					this.closePath();
					fill = true;
					break;
				case FormatAttributes.ArrowStyle.SIZEABLE_PARTIALARROW:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - alphaCosL - alphaSinW, end.y - alphaSinL + alphaCosW);
					this.lineTo(end.x - alphaCosL / 2, end.y - alphaSinL / 2);
					this.lineTo(end.x - alphaCosL + alphaSinW, end.y - alphaSinL - alphaCosW);
					this.closePath();
					fill = true;
					break;
				case FormatAttributes.ArrowStyle.SIZEABLE_DIAMOND:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - alphaCosL / 2 - alphaSinW, end.y - alphaSinL / 2 + alphaCosW);
					this.lineTo(end.x - alphaCosL, end.y - alphaSinL);
					this.lineTo(end.x - alphaCosL / 2 + alphaSinW, end.y - alphaSinL / 2 - alphaCosW);
					this.closePath();
					fill = true;
					break;
				case FormatAttributes.ArrowStyle.SIZEABLE_CIRCLE: {
					this.circle(
						end.x - (width / 2) * Math.cos(alpha),
						end.y - (width / 2) * Math.sin(alpha),
						width / 2
					);
					break;
				}
				case FormatAttributes.ArrowStyle.SIZEABLE_RECTANGLE:
					this.moveTo(end.x - alphaSinW, end.y + alphaCosW);
					this.lineTo(end.x - alphaCosL - alphaSinW, end.y - alphaSinL + alphaCosW);
					this.lineTo(end.x - alphaCosL + alphaSinW, end.y - alphaSinL - alphaCosW);
					this.lineTo(end.x + alphaSinW, end.y - alphaCosW);
					this.closePath();
					fill = true;
					break;
				case FormatAttributes.ArrowStyle.SIZEABLE_DIAGONALLINE: {
					const alphaCosL2 = Math.cos(alpha) * length * 1.5;
					const alphaSinL2 = Math.sin(alpha) * length * 1.5;
					this.moveTo(end.x - alphaSinW - alphaCosL / 2, end.y + alphaCosW - alphaSinL / 2);
					this.lineTo(end.x - alphaCosL2 + alphaSinW, end.y - alphaSinL2 - alphaCosW);
					this.closePath();
					fill = true;
					break;
				}
			}
		} else {
			// old style -> remove later
			let angle = 3.14 / 2;
			width = this.getArrowWidthByType(type);

			switch (type) {
				case FormatAttributes.ArrowStyle.DIAMONDLONG:
					angle = 3.14 / 4;
					break;
				case FormatAttributes.ArrowStyle.ARROWFILLEDLONG:
					angle = 3.14 / 6;
					break;
				case FormatAttributes.ArrowStyle.ARROWFILLED:
				case FormatAttributes.ArrowStyle.ARROWFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROWHALFFILLED:
				case FormatAttributes.ArrowStyle.ARROWHALFFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROW:
				case FormatAttributes.ArrowStyle.ARROWSMALL:
				case FormatAttributes.ArrowStyle.ARROWSINGLESIDE:
				case FormatAttributes.ArrowStyle.ARROWREVERSEFILLED:
				case FormatAttributes.ArrowStyle.ARROWREVERSEFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROWREVERSE:
				case FormatAttributes.ArrowStyle.ARROWREVERSESMALL:
				case FormatAttributes.ArrowStyle.CIRCLE:
				case FormatAttributes.ArrowStyle.CIRCLESMALL:
				case FormatAttributes.ArrowStyle.CIRCLESMALLAROUND:
				case FormatAttributes.ArrowStyle.CIRCLEDOUBLELINE:
				case FormatAttributes.ArrowStyle.DOUBLELINE:
				case FormatAttributes.ArrowStyle.SQUARE:
				case FormatAttributes.ArrowStyle.SQUARESMALL:
				case FormatAttributes.ArrowStyle.DIAGONALLINE:
					angle = 3.14 / 3;
					break;
				case FormatAttributes.ArrowStyle.DIAMOND:
				case FormatAttributes.ArrowStyle.DIAMONDSMALL:
				case FormatAttributes.ArrowStyle.ARROWNNARROWFILLED:
				case FormatAttributes.ArrowStyle.ARROWNARROWFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROWDOUBLEFILLED:
				case FormatAttributes.ArrowStyle.ARROWDOUBLEFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROWDOUBLE:
				case FormatAttributes.ArrowStyle.ARROWDOUBLESMALL:
				case FormatAttributes.ArrowStyle.ARROWREVERSENARROW:
				case FormatAttributes.ArrowStyle.ARROWREVERSENARROWSMALL:
				case FormatAttributes.ArrowStyle.LINEARROWREVERSE:
				case FormatAttributes.ArrowStyle.CIRCLEARROWREVERSE:
					angle = 3.14 / 2;
					break;
				case FormatAttributes.ArrowStyle.DIAMONDNARROW:
				case FormatAttributes.ArrowStyle.DIAMONDNARROWSMALL:
					angle = 3.14 / 1.5;
					break;
			}

			const theta = angle / 2;
			const factor = width / 2 / Math.sin(angle / 2);

			switch (type) {
				case FormatAttributes.ArrowStyle.ARROWDOUBLE:
				case FormatAttributes.ArrowStyle.ARROWDOUBLESMALL:
					this.moveTo(
						end.x - factor * Math.cos(alpha - theta) - factor * Math.cos(alpha),
						end.y - factor * Math.sin(alpha - theta) - factor * Math.sin(alpha)
					);
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(
						end.x - factor * Math.cos(alpha + theta) - factor * Math.cos(alpha),
						end.y - factor * Math.sin(alpha + theta) - factor * Math.sin(alpha)
					);
					this.moveTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					fill = false;
					break;
				case FormatAttributes.ArrowStyle.ARROW:
				case FormatAttributes.ArrowStyle.ARROWSMALL:
					this.moveTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					fill = false;
					break;
				case FormatAttributes.ArrowStyle.ARROWDOUBLEFILLED:
				case FormatAttributes.ArrowStyle.ARROWDOUBLEFILLEDSMALL:
					this.moveTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(
						end.x - factor * Math.cos(alpha - theta) - factor * Math.cos(alpha),
						end.y - factor * Math.sin(alpha - theta) - factor * Math.sin(alpha)
					);
					this.lineTo(
						end.x - factor * Math.cos(alpha + theta) - factor * Math.cos(alpha),
						end.y - factor * Math.sin(alpha + theta) - factor * Math.sin(alpha)
					);
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.ARROWFILLED:
				case FormatAttributes.ArrowStyle.ARROWFILLEDSMALL:
				case FormatAttributes.ArrowStyle.ARROWFILLEDLONG:
				case FormatAttributes.ArrowStyle.ARROWNNARROWFILLED:
				case FormatAttributes.ArrowStyle.ARROWNARROWFILLEDSMALL:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.ARROWHALFFILLED:
				case FormatAttributes.ArrowStyle.ARROWHALFFILLEDSMALL:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - (factor / 3) * Math.cos(alpha), end.y - (factor / 3) * Math.sin(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.ARROWREVERSE:
				case FormatAttributes.ArrowStyle.ARROWREVERSESMALL:
				case FormatAttributes.ArrowStyle.ARROWREVERSENARROW:
				case FormatAttributes.ArrowStyle.ARROWREVERSENARROWSMALL:
					fill = false;
					this.moveTo(end.x - (width / 2) * Math.sin(alpha), end.y + (width / 2) * Math.cos(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(end.x + (width / 2) * Math.sin(alpha), end.y - (width / 2) * Math.cos(alpha));
					break;
				case FormatAttributes.ArrowStyle.ARROWREVERSEFILLED:
				case FormatAttributes.ArrowStyle.ARROWREVERSEFILLEDSMALL:
					this.moveTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(end.x - (width / 2) * Math.sin(alpha), end.y + (width / 2) * Math.cos(alpha));
					this.lineTo(end.x + (width / 2) * Math.sin(alpha), end.y - (width / 2) * Math.cos(alpha));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.ARROWSINGLESIDE:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.LINEARROWREVERSE:
					fill = false;
					this.moveTo(end.x - (width / 2) * Math.sin(alpha), end.y + (width / 2) * Math.cos(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(end.x + (width / 2) * Math.sin(alpha), end.y - (width / 2) * Math.cos(alpha));
					this.moveTo(
						end.x - factor * 1.2 * Math.cos(alpha - theta),
						end.y - factor * 1.2 * Math.sin(alpha - theta)
					);
					this.lineTo(
						end.x - factor * 1.2 * Math.cos(alpha + theta),
						end.y - factor * 1.2 * Math.sin(alpha + theta)
					);
					break;
				case FormatAttributes.ArrowStyle.CIRCLEARROWREVERSE:
					this.moveTo(end.x - (width / 2) * Math.sin(alpha), end.y + (width / 2) * Math.cos(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(end.x + (width / 2) * Math.sin(alpha), end.y - (width / 2) * Math.cos(alpha));
					this.stroke();

					this.beginPath();
					this.circle(
						end.x - width * 1.5 * Math.cos(alpha),
						end.y - width * 1.5 * Math.sin(alpha),
						width / 2
					);
					break;
				case FormatAttributes.ArrowStyle.CIRCLE:
				case FormatAttributes.ArrowStyle.CIRCLESMALL:
					this.circle(
						end.x - (width / 2) * Math.cos(alpha),
						end.y - (width / 2) * Math.sin(alpha),
						width / 2
					);
					break;
				case FormatAttributes.ArrowStyle.CIRCLESMALLAROUND:
					this.circle(end.x, end.y, width / 2);
					break;
				case FormatAttributes.ArrowStyle.DIAMOND:
				case FormatAttributes.ArrowStyle.DIAMONDSMALL:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * 1.5 * Math.cos(alpha), end.y - factor * 1.5 * Math.sin(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.DIAMONDLONG:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * 2 * Math.cos(alpha), end.y - factor * 2 * Math.sin(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.DIAMONDNARROW:
				case FormatAttributes.ArrowStyle.DIAMONDNARROWSMALL:
					this.moveTo(end.x, end.y);
					this.lineTo(end.x - factor * Math.cos(alpha - theta), end.y - factor * Math.sin(alpha - theta));
					this.lineTo(end.x - factor * Math.cos(alpha), end.y - factor * Math.sin(alpha));
					this.lineTo(end.x - factor * Math.cos(alpha + theta), end.y - factor * Math.sin(alpha + theta));
					this.closePath();
					break;
				case FormatAttributes.ArrowStyle.CIRCLEDOUBLELINE:
					this.circle(
						end.x - width * 1.6 * Math.cos(alpha),
						end.y - width * 1.6 * Math.sin(alpha),
						width / 2
					);
					this.fill();
					fill = false;
					this.moveTo(
						end.x - (width / 2) * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - (width / 2) * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - (width / 2) * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - (width / 2) * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					this.moveTo(
						end.x - width * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - width * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					break;
				case FormatAttributes.ArrowStyle.DOUBLELINE:
					this.moveTo(
						end.x - (width / 2) * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - (width / 2) * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - (width / 2) * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - (width / 2) * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					this.moveTo(
						end.x - width * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - width * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					break;
				case FormatAttributes.ArrowStyle.DIAGONALLINE:
					this.moveTo(
						end.x - width * 2 * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - width * 2 * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - width * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					break;
				case FormatAttributes.ArrowStyle.SQUARE:
				case FormatAttributes.ArrowStyle.SQUARESMALL:
					this.moveTo(
						end.x - width * Math.cos(alpha) + (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) - (width / 2) * Math.cos(alpha)
					);
					this.lineTo(
						end.x - width * Math.cos(alpha) - (width / 2) * Math.sin(alpha),
						end.y - width * Math.sin(alpha) + (width / 2) * Math.cos(alpha)
					);
					this.lineTo(end.x - (width / 2) * Math.sin(alpha), end.y + (width / 2) * Math.cos(alpha));
					this.lineTo(end.x + (width / 2) * Math.sin(alpha), end.y - (width / 2) * Math.cos(alpha));
					this.closePath();
					break;
			}
		}

		if (fill && this._fillStyle !== FormatAttributes.FillStyle.NONE) {
			this.fill();
		}

		this.stroke();

		return width;
	}

	/**
	 * Utility function to retrieve the arrow width based on the arrow type
	 *
	 * @method getArrowWidthByType
	 * @param {FormatAttributes.ArrowStyle} type Arrow style.
	 * @return {Number} Arrow width in 1/100th mm.
	 * @private
	 */
	getArrowWidthByType(type) {
		switch (type) {
			case FormatAttributes.ArrowStyle.ARROWFILLEDSMALL:
			case FormatAttributes.ArrowStyle.ARROWSMALL:
			case FormatAttributes.ArrowStyle.ARROWNARROWFILLEDSMALL:
			case FormatAttributes.ArrowStyle.ARROWHALFFILLEDSMALL:
			case FormatAttributes.ArrowStyle.ARROWDOUBLEFILLEDSMALL:
			case FormatAttributes.ArrowStyle.ARROWDOUBLESMALL:
			case FormatAttributes.ArrowStyle.ARROWREVERSEFILLEDSMALL:
			case FormatAttributes.ArrowStyle.ARROWREVERSESMALL:
			case FormatAttributes.ArrowStyle.ARROWREVERSENARROWSMALL:
			case FormatAttributes.ArrowStyle.CIRCLESMALL:
			case FormatAttributes.ArrowStyle.DIAMONDSMALL:
			case FormatAttributes.ArrowStyle.DIAMONDNARROWSMALL:
			case FormatAttributes.ArrowStyle.SQUARESMALL:
				return this._cs.metricToLogX(175);
		}

		return this._cs.metricToLogX(250);
	}

	/**
	 * Set the width of a line for the next drawing operations.
	 *
	 * @method setLineWidth
	 * @param {Number} width Width in 1/100th mm.
	 * @return {Number} The applied width which might be changed by an optional filter.
	 */
	setLineWidth(width) {
		const wNew = this._cs.metricToLogX(width);
		if (wNew !== this._context2D.lineWidth) {
			this._context2D.lineWidth = wNew;
		}
		this._lineWidth = width;
		return width;
	}

	/**
	 * Define the rounding of polyline edges or corners. It can be used to draw a rounded rectangle or to display
	 * rounded corners, when drawing a polygon or polyline.
	 *
	 * @method setLineCorner
	 * @param {Number} cornerSize Size of round in 1/100th mm.
	 */
	setLineCorner(cornerSize) {
		this._lineCorner = cornerSize;
	}

	/**
	 * Define the arrow style drawn at the beginning of a line, if you draw a line or polyline.
	 *
	 * @method setLineArrowStart
	 * @param {FormatAttributes.ArrowStyle} arrow Arrow style.
	 * @param {Number} [width] Width of arrow. Only used for SIZEABLE Arrows.
	 * @param {Number} [length] length of arrow. Only used for SIZEABLE Arrows.
	 */
	setLineArrowStart(arrow, width, length) {
		this._lineArrowStart = arrow;
		this._lineArrowStartWidth = width;
		this._lineArrowStartLength = length;
	}

	/**
	 * Define the arrow style drawn at the end of a line, if you draw a line or polyline.
	 *
	 * @method setLineArrowEnd
	 * @param {FormatAttributes.ArrowStyle} arrow Arrow style.
	 * @param {Number} [width] Width of arrow. Only used for SIZEABLE Arrows.
	 * @param {Number} [length] length of arrow. Only used for SIZEABLE Arrows.
	 */
	setLineArrowEnd(arrow, width, length) {
		this._lineArrowEnd = arrow;
		this._lineArrowEndWidth = width;
		this._lineArrowEndLength = length;
	}

	/**
	 * Define the shadow used for the next drawing operation
	 *
	 * @method setShadow
	 * @param {String} color Hexadecimal color string to define the shadow color
	 * @param {Number} offsetX Horizontal width of the shadow in 1/100th mm.
	 * @param {Number} offsetY Vertical height of the shadow in 1/100th mm.
	 * @param {Number} blur Blur factor, where 0 is no blur.
	 * @param {Rectangle} bounds Bounding Rectangle where the shadow shall be drawn.
	 * @return {Boolean} Returns <code>true</code> if shadow was applied, <code>false</code> otherwise. Note that this
	 * could be influenced by an optional {{#crossLink "Graphics/filter:property"}}{{/crossLink}}.
	 */
	setShadow(color, offsetX, offsetY, blur, bounds) {
		blur = this._filter('shadowblur', blur);
		offsetX = this._filter('shadowoffset', offsetX);
		offsetY = this._filter('shadowoffset', offsetY);
		const apply = offsetX || offsetY || blur;
		if (apply) {
			this._context2D.shadowColor = color;
			this._context2D.shadowOffsetX = this._cs.metricToLogX(offsetX);
			this._context2D.shadowOffsetY = this._cs.metricToLogX(offsetY);
			this._context2D.shadowBlur = blur;
		}
		return apply;
	}

	/**
	 * Resets currently defined shadow values to their defaults, i.e. this results in no visible shadow.
	 *
	 * @method resetShadow
	 */
	resetShadow() {
		this._context2D.shadowOffsetX = 0;
		this._context2D.shadowOffsetY = 0;
		this._context2D.shadowBlur = 0;
		this._context2D.shadowColor = '#000000';
	}

	/**
	 * Set an image pattern to use for the next fill operation. The pattern is automatically added to a global
	 * ImagePool.
	 *
	 * @method setPattern
	 * @param {Rectangle} bounds Bounding Rectangle where the pattern shall be drawn.
	 * @param {String} pattern URL of the pattern.
	 * @param {FormatAttributes.PatternStyle} patternStyle Pattern output options. An image can be drawn
	 *     stretched, center or being repeated.
	 */
	setPattern(bounds, pattern, patternStyle) {
		JSG.imagePool.add(pattern);

		this._pattern = pattern;
		this._bounds = bounds;
		this._patternStyle = patternStyle;
	}

	/**
	 * Set a linear gradient to be used for the next fill output.
	 *
	 * @method setGradientLinear
	 * @param {Rectangle} bounds Bounding Rectangle where the gradient shall be drawn.
	 * @param {String} color1 Hexadecimal color string to define the color to start from
	 * @param {String} color2 Hexadecimal color string to define the color to go to.
	 * @param {String} colorStops String to define a set of color stops.
	 * @param {Number} angle Gradient angle in degrees.
	 */
	setGradientLinear(bounds, color1, color2, colorStops, angle) {
		if (!this.isContextDefined()) {
			return;
		}

		const vector = this.evaluateLinearGradientVector(bounds, angle);
		const gradient = this.createLinearGradient(vector[0].x, vector[0].y, vector[1].x, vector[1].y);

		color1 = this._filter('fillcolor', color1);
		color2 = this._filter('fillcolor', color2);
		try {
			gradient.addColorStop(0, color1);
			if (colorStops.length) {
				this.addColorStops(gradient, colorStops);
			}
			gradient.addColorStop(1, color2);

			this._context2D.fillStyle = gradient;
		} catch (e) {
			this._context2D.fillStyle = '#FFFFFF';
		}
	}

	/**
	 * Evaluate the vector to be used for the linear gradient. This vector is needed to correctly define begin, start
	 * and direction of the gradient.
	 * @method evaluateLinearGradientVector
	 * @param {Rectangle} bounds Bounding Rectangle where the gradient shall be drawn.
	 * @param {Number} angle Gradient angle in degrees.
	 * @return {Point[]} Evaluated result vector
	 * @private
	 */
	evaluateLinearGradientVector(bounds, angle) {
		const points = bounds.getPoints();
		const vector = [new Point(0, 0), new Point(0, 0)];

		angle = Math.round(angle);
		// angle %= 360;
		angle = ((angle % 360) + 360) % 360;

		if (angle === 90) {
			vector[0].set(points[0].x, points[0].y);
			vector[1].set(points[3].x, points[3].y);
		} else if (angle === 0) {
			vector[0].set(points[0].x, points[0].y);
			vector[1].set(points[1].x, points[1].y);
		} else if (angle === 180) {
			vector[0].set(points[1].x, points[1].y);
			vector[1].set(points[0].x, points[0].y);
		} else if (angle === 270) {
			vector[0].set(points[3].x, points[3].y);
			vector[1].set(points[0].x, points[0].y);
		} else {
			let start1;
			let start2;
			if (angle >= 0 && angle < 90) {
				[start1] = points;
				[, , start2] = points;
			} else if (angle > 90 && angle <= 180) {
				[, start1] = points;
				[, , , start2] = points;
			} else if (angle > 180 && angle <= 270) {
				[, , start1] = points;
				[start2] = points;
			} else if (angle > 270) {
				[, , , start1] = points;
				[, start2] = points;
			}

			const m = Math.tan(MathUtils.toRadians(angle));
			const l1Start = start1;
			const l1End = JSG.ptCache.get(start1.x + 200, 0);

			l1End.y = m * l1End.x + (l1Start.y - m * l1Start.x);

			const m2 = Math.tan(MathUtils.toRadians(angle + 90));
			const l2Start = start2;
			const l2End = JSG.ptCache.get(start2.x + 200, 0);

			l2End.y = m2 * l2End.x + (l2Start.y - m2 * l2Start.x);

			const intersection = JSG.ptCache.get(0, 0);

			if (MathUtils.getIntersectionOfLines(l1Start, l1End, l2Start, l2End, intersection, true)) {
				vector[0].set(start1.x, start1.y);
				vector[1].set(intersection.x, intersection.y);
			} else {
				vector[0].set(points[0].x, points[0].y);
				vector[1].set(points[3].x, points[3].y);
			}

			JSG.ptCache.release(l1End, l2End, intersection);
		}

		return vector;
	}

	/**
	 * Create a linear canvas gradient using the vector coordinates given.
	 *
	 * @method createLinearGradient
	 * @param {Number} x0  The X-coordinate of the start point of the gradient .
	 * @param {Number} y0  The Y-coordinate of the start point of the gradient .
	 * @param {Number} x1  The X-coordinate of the end point of the gradient .
	 * @param {Number} y1  The Y-coordinate of the end point of the gradient .
	 * @return {Object} Linear gradient, that can be used for fill operations.
	 */
	createLinearGradient(x0, y0, x1, y1) {
		if (!this.isContextDefined()) {
			return undefined;
		}

		const p0 = this.transformPoint(x0, y0, 0);
		const p1 = this.transformPoint(x1, y1, 1);
		const gradient = this._context2D.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
		return gradient;
	}

	/**
	 * Set a radial gradient to be used for the next fill operation. The gradient starts at the offset position and
	 * ends at the border of the bounds.
	 *
	 * @method setGradientLinear
	 * @param {Rectangle} bounds Bounding Rectangle where the gradient shall be drawn.
	 * @param {String} color Hexadecimal color string to define the color to start from
	 * @param {String} color Hexadecimal color string to define the color to go to.
	 * @param {String} colorStops String to define a set of color stops.
	 * @param {Number} offsetX Horizontal offset of the center of the gradient relative to the bounds in percent.
	 * @param {Number} offsetY Vertical offset of the center of the gradient relative to the bounds in percent.
	 */
	setGradientRadial(bounds, color1, color2, colorStops, offsetX, offsetY) {
		let radialOffsetX = offsetX;
		let radialOffsetY = offsetY;

		if (offsetX < 50) {
			radialOffsetX = 100 - offsetX;
		}
		if (offsetY < 50) {
			radialOffsetY = 100 - offsetY;
		}

		offsetX = bounds.width !== 0 ? (offsetX / 100) * bounds.width : 0;
		offsetY = bounds.height !== 0 ? (offsetY / 100) * bounds.height : 0;
		const gradient = this.createRadialGradient(
			bounds.x + offsetX,
			bounds.y + offsetY,
			0,
			bounds.x + offsetX,
			bounds.y + offsetY,
			Math.max((bounds.width * radialOffsetX) / 100, (bounds.height * radialOffsetY) / 100)
		);

		color1 = this._filter('fillcolor', color1);
		color2 = this._filter('fillcolor', color2);
		try {
			gradient.addColorStop(0, color1);
			if (colorStops.length) {
				this.addColorStops(gradient, colorStops);
			}
			gradient.addColorStop(1, color2);

			this._context2D.fillStyle = gradient;
		} catch (e) {
			this._context2D.fillStyle = '#FFFFFF';
		}
	}

	/**
	 * Create a radial canvas gradient.
	 *
	 * @method createLinearGradient
	 * @param {Number} x0  The X-coordinate of the center of the inner circle of the gradient .
	 * @param {Number} y0  The Y-coordinate of the center of the inner circle of the gradient .
	 * @param {Number} r0  Radius of the inner circel to start from.
	 * @param {Number} x1  The X-coordinate of the center point of the outer circle of the gradient .
	 * @param {Number} y1  The Y-coordinate of the center point of the outer circle of the gradient .
	 * @param {Number} r1  Radius of the outer circle to goto.
	 * @return {Object} Radial gradient, that can be used for fill operations.
	 */
	createRadialGradient(x0, y0, r0, x1, y1, r1) {
		if (!this.isContextDefined()) {
			return undefined;
		}

		const p0 = this.transformPoint(x0, y0, 0);
		const p1 = this.transformPoint(x1, y1, 1);
		const gradient = this._context2D.createRadialGradient(p0.x, p0.y, Math.max(1, r0), p1.x, p1.y, Math.max(1, r1));
		return gradient;
	}

	/**
	 * Adds color stops to an existing gradient
	 *
	 * @method addColorStops
	 * @param {CanvasGradient} gradient Gradient to add color stops to.
	 * @param {String} stops String with color stop definitions.
	 * @private
	 * @since 1.6.20
	 */
	addColorStops(gradient, stops) {
		const sections = stops.split(',');
		let i;
		let pos;
		let color;

		if (sections.length & 1) {
			// invalid definition
			return;
		}

		for (i = 0; i < sections.length; i += 2) {
			pos = Number(sections[i]);
			color = sections[i + 1].trim();
			color = this._filter('fillcolor', color);
			if (pos !== undefined && color !== undefined) {
				gradient.addColorStop(pos, color);
			}
		}
	}

	/**
	 * Draw an image to the canvas.
	 *
	 * @method drawImage
	 * @param {Image} image Image to be displayed. The image can be any object that can be passed to the canvas
	 *     drawImage method.
	 * @param {Number} x X-Position of the image to be drawn.
	 * @param {Number} y Y-Position of the image to be drawn.
	 * @param {Number} [width] Width of the image to be drawn. If the parameter is left out, the image will be drawn
	 *     using its natural size.
	 * @param {Number} [height] Height of the image to be drawn.  If the parameter is left out, the image will be drawn
	 *     using its natural size.
	 */
	drawImage(image, x, y, width, height, sx, sy, swidth, sheight) {
		if (!this.isContextDefined() || image === undefined) {
			return;
		}

		if (typeof image.naturalWidth !== 'undefined' && image.naturalWidth === 0 && image.src.indexOf('.svg') === -1) {
			// probably not available
			if (image !== undefined && image._backupImage) {
				image = image._backupImage;
			} else {
				image = JSG.imagePool.get(JSG.ImagePool.IMG_NOTAVAIL);
				if (image === undefined || image.naturalWidth === 0) {
					return;
				}
			}
		}

		const p = this.transformPoint(x, y, 0);
		// images need to be drawn on full pixels, which is already the case for fill operations
		if (!this._fillOperation) {
			p.x -= 0.5;
			p.y -= 0.5;
		}

		const angle = this.getRotation();
		if (angle && width && height) {
			this._context2D.translate(p.x, p.y);
			this._context2D.rotate(angle);
			this._context2D.drawImage(image, 0, 0, width, height);
			this._context2D.rotate(-angle);
			this._context2D.translate(-p.x, -p.y);
		} else if (sx !== undefined && sy !== undefined && swidth !== undefined && sheight !== undefined) {
			this._context2D.drawImage(image, sx, sy, swidth, sheight, p.x, p.y, width, height);
		} else if (width !== undefined && height !== undefined) {
			this._context2D.drawImage(image, p.x, p.y, width, height);
		} else {
			this._context2D.drawImage(image, p.x, p.y);
		}
	}

	getImageData(x, y, width, height) {
		const p = this.transformPoint(x, y, 0);

		return this._context2D.getImageData(p.x, p.y, width, height);
	}

	putImageData(image, x, y) {
		if (!this.isContextDefined() || image === undefined) {
			return;
		}

		const p = this.transformPoint(x, y, 0);
		this._context2D.putImageData(image, p.x, p.y);
	}

	/**
	 * Draw a rectangular frame.
	 *
	 * @method drawRect
	 * @param {Rectangle} rect Rectangle coordinates to draw.
	 */
	drawRect(rect) {
		if (this._lineStyle === FormatAttributes.LineStyle.NONE) {
			return;
		}

		this.drawPolyline(rect.getPoints(RECT_POINTS), true);
	}

	/**
	 * Fill a rectangular area.
	 *
	 * @method fillRect
	 * @param {Rectangle} rect Rectangle coordinates to draw.
	 */
	fillRect(rect) {
		const px = this._cs.deviceToLogX(1);
		const py = this._cs.deviceToLogY(1);

		rect.width += px;
		rect.height += py;

		this.fillPolyline(rect.getPoints(RECT_POINTS));

		rect.width -= px;
		rect.height -= py;
	}

	/**
	 * Draws a single pixel.
	 *
	 * @method drawPixel
	 * @param {Number} x X-Coordinate of the Pixel to draw.
	 * @param {Number} y Y-Coordinate of the Pixel to draw.
	 * @since 1.6.0
	 */
	drawPixel(x, y) {
		const p = this.transformPoint(x, y, 0);
		this._context2D.fillRect(p.x, p.y, 1, 1);
	}

	/**
	 * Fill a text with the current fill and font definition. If the font style contains underline, the style is
	 * emulated drawing a line.
	 *
	 * @method fillText
	 * @param {String} text Text to be filled.
	 * @param {Number} x X-Position of the text to be drawn.
	 * @param {Number} y Y-Position of the text to be drawn.
	 */
	fillText(text, x, y) {
		if (this.filter) {
			this._context2D.fillStyle = this._filter('fontcolor', this._fillColor);
		}

		// we have to emulate underline as canvas does not support underlined text
		if (this._fontStyle & JSG.TextFormatAttributes.FontStyle.UNDERLINE) {
			let start = JSG.ptCache.get(0, 0);
			let end = JSG.ptCache.get(0, 0);
			// get more points if needed
			const sizeLine = this.measureText(text).width;
			let width = 0;

			switch (this._horizontalAlignment) {
				case JSG.TextFormatAttributes.TextAlignment.LEFT:
					start.x = x;
					end.x = x + sizeLine;
					break;
				case JSG.TextFormatAttributes.TextAlignment.CENTER:
					start.x = x - sizeLine / 2;
					end.x = x + sizeLine / 2 + 1;
					break;
				case JSG.TextFormatAttributes.TextAlignment.RIGHT:
					start.x = x - sizeLine;
					end.x = x;
					break;
			}
			const height = (this._fontSize / 72) * JSG.dpi.y * this._cs.getZoom(true);
			switch (this._context2D.textBaseline) {
				case 'baseline':
				case 'alphabetic':
				case 'bottom':
					start.y = y + 2;
					end.y = start.y;
					break;
				case 'middle':
					start.y = y + height / 2 + 2;
					end.y = start.y;
					break;
			}

			if (this._fontSize > 14) {
				width = this._lineWidth;
				this._context2D.lineWidth = this._fontSize / 10;
				start.y += this._fontSize / 10;
				end.y = start.y;
			}

			this.beginPath();
			start = this.transformPoint(start.x, start.y, 0);
			this._context2D.moveTo(start.x, start.y);
			end = this.transformPoint(end.x, end.y, 1);
			this._context2D.lineTo(end.x, end.y);
			this.stroke();
			JSG.ptCache.release(start, end);

			if (this._fontSize > 14) {
				this._context2D.lineWidth = width;
			}
		}
		const p = this.transformPoint(x, y, 0);
		const angle = this.getRotation();
		if (angle) {
			this._context2D.translate(p.x, p.y);
			this._context2D.rotate(angle);
			this._context2D.fillText(text, 0, 0);
			this._context2D.rotate(-angle);
			this._context2D.translate(-p.x, -p.y);
		} else {
			this._context2D.fillText(text, p.x, p.y);
		}
	}

	/**
	 * Draw a text frame with the current line style and font definition.
	 *
	 * @method drawText
	 * @param {String} text Text to be filled.
	 * @param {Number} x X-Position of the text to be drawn.
	 * @param {Number} y Y-Position of the text to be drawn.
	 */
	drawText(text, x, y) {
		if (this.filter) {
			this._context2D.fillStyle = this._filter('fontcolor', this._fillColor);
		}
		const p = this.transformPoint(x, y, 0);
		this._context2D.strokeText(text, p.x, p.y);
	}

	/**
	 * Measure the text dimensions. Currently only the width is calculated. The width is always returned in device
	 * units. Scaling or apply metric or other conversion to logical units is not applied.
	 *
	 * @method measureText
	 * @param {String} text Text to be measured.
	 * @return {Object} Structure with the size information. Currently only the width member of the Object is valid.
	 */
	measureText(text) {
		return this._context2D.measureText(text);
	}

	relativeToDevice(p) {
		return this.transformPoint(p.x, p.y, 0);
	}

	/**
	 * Draw a polyline border.</br>
	 * <b>Note:</b> the optional <code>renderContext</code> object can be used to retrieve useful information
	 * which are calculated during drawing. Currently only <code>startArrow</code> and <code>endArrow</code> properties
	 * are used, which contains an array of two points between an arrow is drawn. The <code>renderContext</code> is API
	 * internal only!!
	 *
	 * @method drawPolyline
	 * @param {Point[]} points Points of the polyline to draw.
	 * @param {boolean} closed True, to automatically close the polyline by connecting the last with the first point of
	 *     the polyline, otherwise false.
	 * @param {Object} [renderContext] API internal context object to store information calculated during drawing.
	 */
	drawPolyline(points, closed, renderContext) {
		let color;
		let width;

		this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);

		if (this._lineShape === FormatAttributes.LineShape.DOUBLE) {
			width = this._context2D.lineWidth;
			color = this._context2D.strokeStyle;

			this._context2D.lineWidth = width * 3;
			this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);

			this._drawPolyline(points, closed, renderContext);

			this._context2D.lineWidth = width;
			this._context2D.strokeStyle = '#FFFFFF';
		}

		this._drawPolyline(points, closed, renderContext);

		if (this._lineShape === FormatAttributes.LineShape.DOUBLE) {
			this._context2D.strokeStyle = color;
			this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);
		}
	}

	checkDirection(points) {
		const pStart = this.relativeToDevice(points[0]);
		let key = `${pStart.x},${pStart.y}`;
		let direction = this._portPointMap.get(key);
		if (direction === 'in') {
			// if lines comes in at this port, switch direction
			return true;
		}
		if (direction === undefined) {
			// add start point line as outgoint line
			this._portPointMap.set(key, 'out');
			// check end point
			const pEnd = this.relativeToDevice(points[points.length - 1]);
			key = `${pEnd.x},${pEnd.y}`;
			direction = this._portPointMap.get(key);
			if (direction === undefined) {
				this._portPointMap.set(key, 'in');
			} else if (direction === 'out') {
				return true;
			}
		}

		return false;
	}

	_drawPolyline(points, closed, renderContext) {
		const linestyle = this._lineStyle;
		if (linestyle === FormatAttributes.LineStyle.NONE || points.length < 2) {
			return;
		}

		let i;
		let n;
		let pt;
		let lastpt;
		const cr = this._cs.metricToLogX(this._lineCorner);

		if (cr) {
			// if (false && closed && linestyle === FormatAttributes.LineStyle.SOLID) {
			// 	const pts = this.getRoundedPoints(points, this._lineCorner * 2);
			// 	const len = pts.length;
			// 	for (i = 0; i < len; i += 1) {
			// 		pt = pts[i];
			// 		if (i === 0) {
			// 			this.beginPath();
			// 			this.moveTo(pt[0].x, pt[0].y);
			// 		} else {
			// 			this.lineTo(pt[0].x, pt[0].y);
			// 		}
			// 		if (this._lineCorner > 0) {
			// 			this.quadraticCurveTo(pt[1].x, pt[1].y, pt[2].x, pt[2].y);
			// 		}
			// 	}
			// 	if (closed) {
			// 		this.closePath();
			// 	}
			// 	this._context2D.stroke();
			// } else {
			const bpoints = [];
			const cpTo = [];
			const cpFrom = [];

			this.getRoundedPolygonBezier(cpTo, cpFrom, bpoints, points, closed, cr);
			this.drawBezier(cpTo, bpoints, cpFrom, closed, renderContext);
			JSG.ptCache.releaseBulk();
			// }
		} else {
			let switchDirection = false;
			if (linestyle === FormatAttributes.LineStyle.SOLID || this._context2D.setLineDash) {
				if (linestyle !== FormatAttributes.LineStyle.SOLID && this._context2D.setLineDash) {
					const lineWidth = this._dashLineWidth || Math.max(this._context2D.lineWidth, 1);
					const pattern = this.getDashPattern(lineWidth, lineWidth * 5, lineWidth * 3, lineWidth * 2);
					this._context2D.setLineDash(pattern);
					if (!closed) {
						switchDirection = this.checkDirection(points);
					}
				}

				this.beginPath();
				if (switchDirection) {
					lastpt = points[points.length - 1];
					pt = lastpt;
					this.moveTo(pt.x, pt.y);
					for (i = points.length - 2; i >= 0; i -= 1) {
						pt = points[i];
						this.lineTo(pt.x, pt.y);
						lastpt = pt;
					}
				} else {
					[lastpt] = points;
					pt = lastpt;
					this.moveTo(pt.x, pt.y);
					for (i = 1, n = points.length; i < n; i += 1) {
						pt = points[i];
						this.lineTo(pt.x, pt.y);
						lastpt = pt;
					}
				}
				if (closed) {
					this.closePath();
				}
				this.stroke();
			} else {
				[lastpt] = points;
				pt = lastpt;
				for (i = 1, n = points.length; i < n; i += 1) {
					pt = points[i];
					this.drawLine(lastpt, pt);
					lastpt = pt;
				}
				if (closed) {
					this.drawLine(points[i - 1], points[0]);
				}
			}
		}

		this.clearLineDash();

		if (!closed) {
			this.drawLineEndings(
				points[0],
				points[1],
				points[points.length - 2],
				points[points.length - 1],
				renderContext
			);
		}
	}

	/**
	 * API internal method to update BoundingBox of given render context.</br>
	 * <b>Don't use!</b>
	 *
	 * @method _updateRenderContextBBox
	 * @param {Object} renderContext The render context object to update.
	 * @param {String} boxProperty The property which defines the BoundingBox to update.
	 * @param {Point} point The new box location.
	 * @param {Number} size    The new box size.
	 * @private
	 */
	_updateRenderContextBBox(renderContext, boxProperty, point, size) {
		if (renderContext !== undefined && size !== undefined) {
			let box = renderContext[boxProperty];
			// we want to reuse old BoundingBox...
			box = box !== undefined ? box : new BoundingBox(0, 0);
			box.reset();
			box.setSize(size, size);
			box.setTopLeft(point.x - size / 2, point.y);
			renderContext[boxProperty] = box;
			// have to set again in case it was undefined before...
		}
	}

	getRoundedPoints(pts, radius) {
		let i1;
		let i2;
		let i3;
		let p1;
		let p2;
		let p3;
		let prevPt;
		let nextPt;
		const len = pts.length;
		const res = new Array(len);

		for (i2 = 0; i2 < len; i2 += 1) {
			i1 = i2 - 1;
			i3 = i2 + 1;
			if (i1 < 0) {
				i1 = len - 1;
			}
			if (i3 === len) {
				i3 = 0;
			}
			p1 = pts[i1];
			p2 = pts[i2];
			p3 = pts[i3];
			const l1 = MathUtils.getLineLength(p1, p2) / 2;
			const l2 = MathUtils.getLineLength(p2, p3) / 2;
			const corner = Math.min(radius, Math.min(l1, l2));
			prevPt = this.getRoundedPoint(p1.x, p1.y, p2.x, p2.y, corner, false);
			nextPt = this.getRoundedPoint(p2.x, p2.y, p3.x, p3.y, corner, true);
			res[i2] = [prevPt, p2, nextPt];
		}

		return res;
	}

	getRoundedPoint(x1, y1, x2, y2, radius, first) {
		const total = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
		const idx = first ? radius / total : (total - radius) / total;
		return { x: x1 + idx * (x2 - x1), y: y1 + idx * (y2 - y1) };
	}

	/**
	 * Evaluate a bezier poly line representing a polyline with rounded corners. Given a polyline represented by the
	 * points parameter, the necessary bezier curve points will be evaluated by filling the three point arrays (cpTo,
	 * cpFrom, bpoints) to be able to simply draw a bezier in conclusion.
	 *
	 * @method getRoundedPolygonBezier
	 * @param {Points[]} cpTo Control points before the context points of the resulting bezier.
	 * @param {Points[]} cpFrom Control points behind the context points of the resulting bezier.
	 * @param {Points[]} bpoints Context points of the resulting bezier.
	 * @param {Points[]} points Points of the input polyline.
	 * @param {boolean} closed True, to automatically close the polyline by connecting the last with the first point of
	 *     the polyline, otherwise false.
	 * @param {Number} cr Radius of the corner rounding.
	 * @private
	 */
	getRoundedPolygonBezier(cpTo, cpFrom, bpoints, points, closed, cr) {
		if (!closed) {
			cpFrom.push(points[0]);
			bpoints.push(points[0]);
		}

		let i;
		let n;

		for (i = 1, n = closed ? points.length + 1 : points.length; i < n; i += 1) {
			if (i < n - 1 || closed) {
				let post;
				let pre;
				let pt;
				if (i === points.length) {
					[, post] = points;
					pre = points[points.length - 1];
					[pt] = points;
				} else if (i === points.length - 1) {
					[post] = points;
					pre = points[i - 1];
					pt = points[i];
				} else {
					post = points[i + 1];
					pre = points[i - 1];
					pt = points[i];
				}

				const l1 = MathUtils.getLineLength(pt, pre) / 2;
				const l2 = MathUtils.getLineLength(pt, post) / 2;
				const corner = Math.min(cr * 2, Math.min(l1, l2));

				let alpha = Math.atan2(pt.y - pre.y, pt.x - pre.x);
				const factor = corner / 2 / Math.sin(Math.PI / 4);
				let sinA = Math.sin(alpha) * factor;
				let cosA = Math.cos(alpha) * factor;

				if (!closed || i > 1) {
					cpTo.push(JSG.ptCache.get(pt.x - cosA, pt.y - sinA, true));
				}

				if (bpoints.length) {
					cpFrom.push(bpoints[bpoints.length - 1]);
				}

				bpoints.push(JSG.ptCache.get(pt.x - cosA, pt.y - sinA, true));
				cpTo.push(JSG.ptCache.get(pt.x - cosA * 0.45, pt.y - sinA * 0.45, true));

				alpha = Math.atan2(post.y - pt.y, post.x - pt.x);
				sinA = Math.sin(alpha) * factor;
				cosA = Math.cos(alpha) * factor;

				cpFrom.push(JSG.ptCache.get(pt.x + cosA * 0.45, pt.y + sinA * 0.45, true));
				bpoints.push(JSG.ptCache.get(pt.x + cosA, pt.y + sinA, true));

				if (closed && i === n - 1) {
					Arrays.insertAt(cpFrom, 0, bpoints[bpoints.length - 1]);
					cpTo.push(bpoints[0]);
				}
			} else {
				cpTo.push(points[i]);
				cpFrom.push(bpoints[bpoints.length - 1]);
				bpoints.push(points[i]);
				cpTo.push(points[i]);
			}
		}
	}

	/**
	 * Fill a polyline with the current fill definition.
	 *
	 * @method fillPolyline
	 * @param {Point[]} points Points of the polyline to draw.
	 */
	fillPolyline(points) {
		if (points.length === 0) {
			return;
		}

		// fills must be aligned to full pixel
		this._fillOperation = true;

		const cr = this._cs.metricToLogX(this._lineCorner);
		if (cr) {
			const bpoints = [];
			const cpTo = [];
			const cpFrom = [];

			this.getRoundedPolygonBezier(cpTo, cpFrom, bpoints, points, true, cr);
			this.fillBezier(cpTo, bpoints, cpFrom);
			JSG.ptCache.releaseBulk();
		} else {
			let i;
			let n;
			let pt;
			let lastpt;

			[lastpt] = points;
			pt = lastpt;
			this.beginPath();
			this.moveTo(pt.x, pt.y);
			for (i = 1, n = points.length; i < n; i += 1) {
				// this.lineTo(points[i].x, points[i].y);
				pt = points[i];
				this.lineTo(pt.x, pt.y);
				lastpt = pt;
			}
			this.closePath();

			this.fill(undefined, points, undefined);
		}

		this._fillOperation = false;
	}

	/**
	 * Fill an area defined by the passed point lists with a pattern fill. The pattern must have
	 * been set previously using setPattern.
	 *
	 * @method fillWithPattern
	 * @param {Point[]} cpFrom Bezier control points. This point list defines the control points preceding
	 *     the context points. If not defined, only the second points parameter will be used and the fill area is
	 *     defined as a polygon.
	 * @param {Point[]} points Points, defining the polygon or the context points of a bezier.
	 * @param {Point[]} cpTo Bezier control points. This point list defines the control points following
	 *     the context points. If not defined, only the second points parameter will be used and the fill area is
	 *     defined as a polygon.
	 * @private
	 */
	fillWithPattern(cpTo, points, cpFrom) {
		let center;
		const angle = this.getRotation();

		if (!points) {
			return;
		}

		const fillWithSinglePattern = (image) => {
			if (this._context2D.shadowOffsetX || this._context2D.shadowOffsetY) {
				this._context2D.fillStyle = this._fillColor;
				this._context2D.fill();
				// to paint shadow
				this._context2D.shadowOffsetX = 0;
				// just once
				this._context2D.shadowOffsetY = 0;
				this._context2D.shadowBlur = 0;
			}
			this.save();
			this.setClipArea(cpTo, points, cpFrom);
			this.translate(center.x, center.y);
			if (this._patternStyle === FormatAttributes.PatternStyle.STRETCH) {
				this.drawImage(
					image,
					-this._bounds.width / 2,
					-this._bounds.height / 2,
					this._bounds.width,
					this._bounds.height
				);
			} else if (this._patternStyle === FormatAttributes.PatternStyle.STRETCHPROPORTIONAL) {
				let ratio = 1;
				const heighWidthRatio =
					this._bounds.width !== 0 ? this._bounds.height / this._bounds.width : this._bounds.height;
				if (image.naturalWidth) {
					ratio = image.naturalHeight / image.naturalWidth;
				}
				if (this._bounds.width && ratio > heighWidthRatio) {
					this.drawImage(
						image,
						-this._bounds.height / ratio / 2,
						-this._bounds.height / 2,
						this._bounds.height / ratio,
						this._bounds.height
					);
				} else {
					this.drawImage(
						image,
						-this._bounds.width / 2,
						(-this._bounds.width * ratio) / 2,
						this._bounds.width,
						this._bounds.width * ratio
					);
				}
			} else {
				this.drawImage(
					image,
					-this._cs.deviceToLogX(image.naturalWidth / 2) * this._cs.getZoom(),
					-this._cs.deviceToLogY(image.naturalHeight / 2) * this._cs.getZoom(),
					this._cs.deviceToLogX(image.naturalWidth) * this._cs.getZoom(),
					this._cs.deviceToLogY(image.naturalHeight) * this._cs.getZoom()
				);
			}
			this.restore();
		};

		const fillWithRepeatPattern = (image) => {
			const p = this.transformPoint(0, 0, 0);
			let pattern;

			this._context2D.translate(p.x, p.y);
			if (angle) {
				this._context2D.rotate(angle);
			}

			if (this._patternMap.contains(image.src)) {
				// FF does not like to many patterns, therefore we pool them
				pattern = this._patternMap.get(image.src);
			} else {
				if (this._cs.getZoom() === 1) {
					pattern = this._context2D.createPattern(image, 'repeat');
				} else {
					const cnv = document.createElement('canvas');
					cnv.width = image.naturalWidth * this._cs.getZoom();
					cnv.height = image.naturalHeight * this._cs.getZoom();
					cnv.getContext('2d').drawImage(image, 0, 0, cnv.width, cnv.height);
					pattern = this._context2D.createPattern(cnv, 'repeat');
				}
				this._patternMap.put(image.src, pattern);
			}
			if (pattern !== undefined) {
				this._context2D.fillStyle = pattern;
				this._context2D.fill();
			}
			if (angle) {
				this._context2D.rotate(-angle);
			}
			this._context2D.translate(-p.x, -p.y);
		};

		const image = this.getImage(this._pattern);
		if (image === undefined) {
			return;
		}
		center = this._bounds.getCenter(JSG.ptCache.get());
		if (this._patternStyle === FormatAttributes.PatternStyle.REPEAT) {
			fillWithRepeatPattern(image, cpTo, points, cpFrom);
		} else {
			fillWithSinglePattern(image, cpTo, points, cpFrom);
		}
		JSG.ptCache.release(center);
	}

	/**
	 * Get an image from the pool.
	 *
	 * @method getImage
	 * @param {String} url URL of the image.
	 * @return {Image} The image, if it is found in the image pool, otherwise a default image showing that the
	 * image is currently not available.
	 * @private
	 */
	getImage(url) {
		let image = JSG.imagePool.get(url);
		if (
			image === undefined ||
			image.complete === false ||
			(typeof image.naturalWidth !== 'undefined' && image.naturalWidth === 0)
		) {
			if (image._backupImage !== undefined) {
				image = image._backupImage;
			} else {
				image = JSG.imagePool.get(JSG.ImagePool.IMG_NOTAVAIL);
				if (!image) {
					return undefined;
				}
			}
		}

		return image;
	}

	/**
	 * Utility function to convert a set of points to a rect, if possible, which is only the case if the points
	 * describe a rectangle
	 *
	 * @method getRectFromPoints
	 * @param {Point[]} points Point list to convert.
	 * @param {Rectangle} [resuerect] A rectangle to reuse. If not provided a new one will be created.
	 * @return {Rectangle} The created rectangle or <code>undefined</code> if given points don't represent
	 *     a rectangle.
	 * @private
	 */
	getRectFromPoints(points, reuserect) {
		if (points.length !== 4) {
			return undefined;
		}

		if (points[0].x !== points[3].x) {
			return undefined;
		}
		if (points[1].x !== points[2].x) {
			return undefined;
		}
		if (points[0].y !== points[1].y) {
			return undefined;
		}
		if (points[2].y !== points[3].y) {
			return undefined;
		}

		const rect = reuserect || new Rectangle();
		return rect.set(points[0].x, points[0].y, points[1].x - points[0].x, points[3].y - points[0].y);
	}

	/**
	 * Draw a bezier curve defined by the passed point lists.</br>
	 * <b>Note:</b> the optional <code>renderContext</code> object can be used to retrieve useful information
	 * which are calculated during drawing. Currently only <code>startArrow</code> and <code>endArrow</code> properties
	 * are used, which contains an array of two points between an arrow is drawn. The <code>renderContext</code> is API
	 * internal only!!
	 *
	 * @method drawBezier
	 * @param {Point[]} cpFrom Bezier control points. This point list defines the control points preceding
	 *     the context points.
	 * @param {Point[]} points Points, defining the polygon or the context points of a bezier.
	 * @param {Point[]} cpTo Bezier control points. This point list defines the control points following
	 *     the context points.
	 * @param {Boolean} closed True to automatically close the bezier by connecting the last with the first context
	 *     point of the bezier.
	 * @param {Object} [renderContext] API internal context object to store information calculated during drawing.
	 */

	drawBezier(cpTo, points, cpFrom, closed, renderContext) {
		let color;
		let width;

		this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);

		if (this._lineShape === FormatAttributes.LineShape.DOUBLE) {
			width = this._context2D.lineWidth;
			color = this._context2D.strokeStyle;

			this._context2D.lineWidth = width * 3;
			this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);

			this._drawBezier(cpTo, points, cpFrom, closed, renderContext);

			this._context2D.lineWidth = width;
			this._context2D.strokeStyle = '#FFFFFF';
		}

		this._drawBezier(cpTo, points, cpFrom, closed, renderContext);

		if (this._lineShape === FormatAttributes.LineShape.DOUBLE) {
			this._context2D.strokeStyle = color;
			this._dashLineWidth = Math.max(this._context2D.lineWidth, 1);
		}
	}

	_drawBezier(cpTo, points, cpFrom, closed, renderContext) {
		function computeCubicBaseValue(t, a, b, c, d) {
			const mt = 1 - t;
			return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
		}

		const linestyle = this._lineStyle;
		if (linestyle === FormatAttributes.LineStyle.NONE) {
			return;
		}

		if (points.length < 2) {
			return;
		}

		this.beginPath();

		let i;
		let n;
		let t;
		let lineWidth;
		let pattern;

		if (linestyle === FormatAttributes.LineStyle.SOLID || this._context2D.setLineDash) {
			let switchDirection = false;
			if (linestyle !== FormatAttributes.LineStyle.SOLID && this._context2D.setLineDash) {
				lineWidth = this._dashLineWidth || Math.max(this._context2D.lineWidth, 1);
				pattern = this.getDashPattern(lineWidth, lineWidth * 5, lineWidth * 3, lineWidth * 2);
				this._context2D.setLineDash(pattern);
				if (!closed) {
					switchDirection = this.checkDirection(points);
				}
			}

			if (switchDirection) {
				this.moveTo(points[points.length - 1].x, points[points.length - 1].y);
				for (i = points.length - 2; i >= 0; i -= 1) {
					this.bezierCurveTo(
						cpFrom[i + 1].x,
						cpFrom[i + 1].y,
						cpTo[i].x,
						cpTo[i].y,
						points[i].x,
						points[i].y
					);
				}
			} else {
				this.moveTo(points[0].x, points[0].y);
				for (i = 1, n = points.length; i < n; i += 1) {
					this.bezierCurveTo(
						cpTo[i - 1].x,
						cpTo[i - 1].y,
						cpFrom[i].x,
						cpFrom[i].y,
						points[i].x,
						points[i].y
					);
				}
			}

			if (closed) {
				this.bezierCurveTo(
					cpTo[points.length - 1].x,
					cpTo[points.length - 1].y,
					cpFrom[0].x,
					cpFrom[0].y,
					points[0].x,
					points[0].y
				);
				this.closePath();
			}
		} else {
			lineWidth = this._dashLineWidth || Math.max(this._lineWidth, this._cs.deviceToLogX(1));
			pattern = this.getDashPattern(lineWidth, lineWidth * 5, lineWidth * 3, lineWidth * 2);

			n = closed ? points.length : points.length - 1;

			const pLast = points[0].copy();
			const pStartDash = pLast.copy();
			let pCenter = pLast.copy();
			const p = JSG.ptCache.get(0, 0);
			let space = false;
			let center = false;
			let idx = 0;
			let len = pattern[idx];

			this.moveTo(pLast.x, pLast.y);

			for (i = 0; i < n; i += 1) {
				for (t = 0; t < 1.0; t += 1.0 / 150.0) {
					if (i === points.length - 1) {
						p.x = computeCubicBaseValue(t, points[i].x, cpTo[i].x, cpFrom[0].x, points[0].x);
						p.y = computeCubicBaseValue(t, points[i].y, cpTo[i].y, cpFrom[0].y, points[0].y);
					} else {
						p.x = computeCubicBaseValue(t, points[i].x, cpTo[i].x, cpFrom[i + 1].x, points[i + 1].x);
						p.y = computeCubicBaseValue(t, points[i].y, cpTo[i].y, cpFrom[i + 1].y, points[i + 1].y);
					}

					const length = MathUtils.getLineLength(pLast, p);

					if (length > len / 2 && !center) {
						pCenter = p.copy();
						center = true;
					}

					if (length > len) {
						if (space) {
							pStartDash.x = p.x;
							pStartDash.y = p.y;
							this.moveTo(p.x, p.y);
							space = false;
						} else {
							this.bezierCurveTo(pCenter.x, pCenter.y, pCenter.x, pCenter.y, p.x, p.y);
							space = true;
						}
						center = false;
						pLast.x = p.x;
						pLast.y = p.y;
						idx = (idx + 1) % pattern.length;
						len = pattern[idx];
					}
				}
			}
			JSG.ptCache.release(p);
		}

		this.stroke();

		this.clearLineDash();

		if (!closed) {
			this.drawLineEndings(
				points[0],
				cpTo[0],
				cpFrom[cpFrom.length - 1],
				points[points.length - 1],
				renderContext
			);
		}
	}

	/**
	 * Get a line pattern definition base on the current style definition.
	 *
	 * @method getDashPattern
	 * @param {Number} linewidth Size of a dot.
	 * @private
	 */
	getDashPattern(lineWidth) {
		const dot = lineWidth;
		const dash = lineWidth * 5;
		const sdash = lineWidth * 3;
		const ldash = lineWidth * 10;
		const space = lineWidth * 3;
		const dotspace = lineWidth * 2;
		let pattern = [dash, space];

		switch (this._lineStyle) {
			case FormatAttributes.LineStyle.SDASH:
				pattern = [sdash, space];
				break;
			case FormatAttributes.LineStyle.DASH:
				pattern = [dash, space];
				break;
			case FormatAttributes.LineStyle.LDASH:
				pattern = [ldash, space];
				break;
			case FormatAttributes.LineStyle.DASHSDASH:
				pattern = [dash, space, sdash, space];
				break;
			case FormatAttributes.LineStyle.LDASHSDASH:
				pattern = [ldash, space, sdash, space];
				break;
			case FormatAttributes.LineStyle.LDASHSDASHSDASH:
				pattern = [ldash, space, sdash, space, sdash, space];
				break;
			case FormatAttributes.LineStyle.DASHDOT:
				pattern = [dash, space, dot, space];
				break;
			case FormatAttributes.LineStyle.DASHDOTDOT:
				pattern = [dot, space, dash, space, dot, space];
				break;
			case FormatAttributes.LineStyle.DOT:
				pattern = [dot, dotspace];
				break;
		}

		return pattern;
	}

	/**
	 * Determines the current line-dash pattern and tries to apply it using canvas <code>setLineDash</code> method. If
	 * native
	 * <code>setLineDash</code> method is not supported or if current line-style specifies no dash pattern
	 * <code>false</code> is returned.<br/> Please refer to {{#crossLink
	 * "Graphics/getDashPattern:method"}}{{/crossLink}} and
	 * {{#crossLink "Graphics/clearLineDash:method"}}{{/crossLink}} too.
	 *
	 * @method applyLineDash
	 * @return {Boolean} <code>true</code> if line dash was applied, <code>false</code> otherwise.
	 * @since 1.6.0
	 */
	applyLineDash() {
		// support for line dash:
		if (this._context2D.setLineDash && this._lineStyle > FormatAttributes.LineStyle.SOLID) {
			const lineWidth = /* this._dashLineWidth || */ Math.max(this._context2D.lineWidth, 1);
			const pattern = this.getDashPattern(lineWidth, lineWidth * 5, lineWidth * 3, lineWidth * 2);
			this._context2D.setLineDash(pattern);
			return true;
		}
		return false;
	}

	/**
	 * Clears a previously applied line-dash pattern.<br/>
	 * See {{#crossLink "Graphics/applyLineDash:method"}}{{/crossLink}} too.
	 *
	 * @method clearLineDash
	 */
	clearLineDash() {
		if (this._context2D.setLineDash) {
			this._context2D.setLineDash([]);
		}
	}

	/**
	 * Fill a bezier area defined by the passed point lists.
	 *
	 * @method fillBezier
	 * @param {Point[]} cpFrom Bezier control points. This point list defines the control points preceding
	 *     the context points.
	 * @param {Point[]} points Points, defining the polygon or the context points of a bezier.
	 * @param {Point[]} cpTo Bezier control points. This point list defines the control points following
	 *     the context points.
	 */
	fillBezier(cpTo, points, cpFrom) {
		if (this._fillStyle === FormatAttributes.FillStyle.NONE) {
			return;
		}

		if (points.length < 2) {
			return;
		}

		let i;
		let n;

		this.beginPath();
		this.moveTo(points[0].x, points[0].y);

		for (i = 1, n = points.length; i < n; i += 1) {
			this.bezierCurveTo(cpTo[i - 1].x, cpTo[i - 1].y, cpFrom[i].x, cpFrom[i].y, points[i].x, points[i].y);
		}
		this.bezierCurveTo(
			cpTo[points.length - 1].x,
			cpTo[points.length - 1].y,
			cpFrom[0].x,
			cpFrom[0].y,
			points[0].x,
			points[0].y
		);

		this.closePath();

		this.fill(cpTo, points, cpFrom);
	}

	/**
	 * Fill an elliptical area on the canvas.
	 *
	 * @method fillEllipse
	 * @param {Rectangle} rect Bounding rectangle of the ellipse to be drawn.
	 */
	fillEllipse(rect) {
		if (rect.width !== 0 && rect.height !== 0) {
			const coor = this.getEllipseCoordinates(rect);
			this.fillBezier(coor.cpToCoordinates, coor.coordinates, coor.cpFromCoordinates);
		}
	}

	getEllipseCoordinates(rect) {
		const cpFromCoordinates = [];
		const cpToCoordinates = [];
		const coordinates = [];

		cpFromCoordinates.push(new Point(rect.x + rect.width * 0.225, rect.y));
		coordinates.push(new Point(rect.x + rect.width * 0.5, rect.y));
		cpToCoordinates.push(new Point(rect.x + rect.width * 0.775, rect.y));

		cpFromCoordinates.push(new Point(rect.x + rect.width, rect.y + rect.height * 0.225));
		coordinates.push(new Point(rect.x + rect.width, rect.y + rect.height * 0.5));
		cpToCoordinates.push(new Point(rect.x + rect.width, rect.y + rect.height * 0.775));

		cpFromCoordinates.push(new Point(rect.x + rect.width * 0.775, rect.y + rect.height));
		coordinates.push(new Point(rect.x + rect.width * 0.5, rect.y + rect.height));
		cpToCoordinates.push(new Point(rect.x + rect.width * 0.225, rect.y + rect.height));

		cpFromCoordinates.push(new Point(rect.x, rect.y + rect.height * 0.775));
		coordinates.push(new Point(rect.x, rect.y + rect.height * 0.5));
		cpToCoordinates.push(new Point(rect.x, rect.y + rect.height * 0.225));

		return { cpToCoordinates, coordinates, cpFromCoordinates };
	}

	/**
	 * Move the current position within the current path to a specified location. The next line drawing or bezier curve
	 * drawing operation will start from there.
	 *
	 * @method moveTo
	 * @param {Number} x X-Coordinate to move to.
	 * @param {Number} y Y-Coordinate to move to.
	 */
	moveTo(x, y) {
		const old = this._fillOperation;

		if (!(this._context2D.lineWidth & 1)) {
			this._fillOperation = true;
		}
		const p = this.transformPoint(x, y, 0);
		this._context2D.moveTo(p.x, p.y);

		this._fillOperation = old;
	}

	/**
	 * Add a line from the current position (moveTo) to the given position to the current path.
	 *
	 * @method lineTo
	 * @param {Number} x X-Coordinate to draw to.
	 * @param {Number} y Y-Coordinate to draw to.
	 */
	lineTo(x, y) {
		const old = this._fillOperation;

		if (!(this._context2D.lineWidth & 1)) {
			this._fillOperation = true;
		}
		const p = this.transformPoint(x, y, 0);
		this._context2D.lineTo(p.x, p.y);

		this._fillOperation = old;
	}

	/**
	 * Add a bezier curve using the two control points to a path. The curve starts at the current position, defined by
	 * a previous call to moveTo.
	 *
	 * @method bezierCurveTo
	 * @param {Number} cp1x X-Coordinate of first control point.
	 * @param {Number} cp1y Y-Coordinate of first control point.
	 * @param {Number} cp2x X-Coordinate of the second control point.
	 * @param {Number} cp2y Y-Coordinate of the second control point.
	 * @param {Number} x X-Coordinate to draw to.
	 * @param {Number} y Y-Coordinate to draw to.
	 */
	bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
		if (!(this._context2D.lineWidth & 1)) {
			this._fillOperation = true;
		}
		const p = this.transformPoint(x, y, 0);
		const p1 = this.transformPoint(cp1x, cp1y, 1);
		const p2 = this.transformPoint(cp2x, cp2y, 2);

		this._context2D.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p.x, p.y);
		this._fillOperation = false;
	}

	/**
	 * Adds a quadratic bezier curve to a path with one control point. The curve starts at the current position,
	 * defined by a previous call to moveTo.
	 *
	 * @method quadraticCurveTo
	 * @param {Number} cpx X-Coordinate of the control point.
	 * @param {Number} cpy Y-Coordinate of the control point.
	 * @param {Number} x X-Coordinate to draw to.
	 * @param {Number} y Y-Coordinate to draw to.
	 * @since 1.6.0
	 */
	quadraticCurveTo(cpx, cpy, x, y) {
		const p = this.transformPoint(x, y, 0);
		const p1 = this.transformPoint(cpx, cpy, 1);
		this._context2D.quadraticCurveTo(p1.x, p1.y, p.x, p.y);
	}

	/**
	 * Add an arc to a path.
	 *
	 * @method arc
	 * @param {Number} x X-Coordinate of the center.
	 * @param {Number} y Y-Coordinate of the center.
	 * @param {Number} radius Radius of the arc.
	 * @param {Number} startAngle Start angle in radians.
	 * @param {Number} endAngle End angle in radians.
	 * @param {Number} anticlockwise Direction to draw to, false=clockwise, true=counterclockwise.
	 */
	arc(x, y, radius, startAngle, endAngle, anticlockwise) {
		const p = this.transformPoint(x, y, 0);
		this._context2D.arc(p.x, p.y, radius, startAngle, endAngle, anticlockwise);
	}

	arcTo(x, y, radius, startAngle, endAngle, anticlockwise) {
		const p = this.transformPoint(x, y, 0);
		this._context2D.arc(p.x, p.y, radius, startAngle, endAngle, anticlockwise);
	}

	ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
		if (radiusX <= 0 || radiusY <= 0) {
			return;
		}

		const p = this.transformPoint(x, y, 0);
		const angle = this.getRotation();
		this._context2D.ellipse(p.x, p.y, radiusX, radiusY, angle + rotation, startAngle, endAngle, anticlockwise);
	}

	/**
	 * Add a circle to a path.
	 *
	 * @method circle
	 * @param {Number} x X-Coordinate of the center.
	 * @param {Number} y Y-Coordinate of the center.
	 * @param {Number} radius Radius of the circle.
	 */

	circle(x, y, radius) {
		this.arc(x, y, radius, 0, Math.PI * 2, true);
	}

	/**
	 * Begin a new Path. Within the path you can bundle various drawing operations like moveTo, lineTo.
	 *
	 * @method beginPath
	 */
	beginPath() {
		this._context2D.beginPath();
	}

	/**
	 * Close a path by connecting the first point of the path with the final.
	 *
	 * @method closePath
	 */
	closePath() {
		this._context2D.closePath();
	}

	/**
	 * Stroke the current path using the current line definition. The path must have been created previously by using
	 * methods like moveTo, lineTo, bezierCurveTo.
	 *
	 * @method stroke
	 */
	stroke() {
		try {
			this._context2D.stroke();
		} catch (e) {
			// bug in IE 11, some bezier curves in combination with a linewidth > 1 und setLineDash throw an unexpected
			// exception, although coordinate are correct.
			this.clearLineDash();
			this._context2D.stroke();
		}
	}

	/**
	 * Fill the current path using the current fill definition. The path must have been created previously by using
	 * methods like moveTo, lineTo, bezierCurveTo. The point lists will only used for a specific fill pattern.
	 *
	 * @method fill
	 * @param {Point[]} cpFrom Bezier control points. This point list defines the control points preceding
	 *     the context points. If not defined, only the second points parameter will be used and the fill area is
	 *     defined as a polygon.
	 * @param {Point[]} points Points, defining the polygon or the context points of a bezier.
	 * @param {Point[]} cpTo Bezier control points. This point list defines the control points following
	 *     the context points. If not defined, only the second points parameter will be used and the fill area is
	 *     defined as a polygon.
	 */
	fill(cpTo, points, cpFrom) {
		if (points && this._fillStyle === FormatAttributes.FillStyle.PATTERN) {
			this.fillWithPattern(cpTo, points, cpFrom);
		} else {
			this._context2D.fill();
		}
	}

	/**
	 * Start a group. Default implementation does nothing.
	 *
	 * @method startGroup
	 * @param {GraphItem} Optional. Current GraphItem. May be undefined, if not drawing a graphitem.
	 * @return {boolean} True to indicate, that the item should not have an visual output or is handled specifically.
	 * @private
	 */
	startGroup(item) {
		return false;
	}

	/**
	 * End a group. Default implementation does nothing.
	 *
	 * @method endGroup
	 * @private
	 */
	endGroup() {}

	/**
	 * Draws a marker, i.e. an ellipse, within the area specified by given rectangle.
	 *
	 * @method drawMarker
	 * @param {Rectangle} rect The rectangle region to draw the marker in.
	 * @param {Boolean} active Flag to indicate if marker should be drawn in active style or not.
	 */
	drawMarker(rect, active) {
		let color;
		let width;
		const inner = JSG.rectCache.get();

		if (JSG.touchDevice && active) {
			width = this._lineWidth;
			inner.setTo(rect);
			inner.expandBy(this._cs.metricToLogXNoZoom(1000));

			this.setTransparency(20);
			this.fillEllipse(inner);

			inner.setTo(rect);
			inner.reduceBy(this._cs.metricToLogXNoZoom(50));

			this.setTransparency(100);
			this.fillEllipse(inner);

			inner.setTo(rect);
			inner.expandBy(this._cs.metricToLogXNoZoom(950));

			this.setLineWidth(50);
			this.drawEllipse(inner);
			this.setLineWidth(width);
			// } else {
			// 	color = this._fillColor;
			// 	inner.setTo(rect);
			//
			// 	this.setFillColor('#FFFFFF');
			// 	this.fillEllipse(rect);
			//
			// 	this.setFillColor(color);
			// 	inner.reduceBy(this._cs.metricToLogXNoZoom(50));
			// 	this.fillEllipse(inner);
			// 	this.drawEllipse(rect);
			// }
		} else if (SelectionStyle.FILL) {
			inner.setTo(rect);
			inner.expandBy(this._cs.metricToLogXNoZoom(25));
			this.fillEllipse(inner);
			this.drawEllipse(inner);
		} else {
			this.fillEllipse(rect);
			inner.setTo(rect);
			inner.expandBy(this._cs.metricToLogXNoZoom(50));
			this.drawEllipse(inner);
		}

		JSG.rectCache.release(inner);
	}

	/**
	 * Draws the line endings at given line points.</br>
	 * Line endings are specified by constants of {{#crossLink
	 * "FormatAttributes.ArrowStyle"}}{{/crossLink}}. Please refer to {{#crossLink
	 * "Graphics/drawArrow:method"}}{{/crossLink}} too.<br/>
	 * <b>Note:</b> the optional <code>renderContext</code> object can be used to retrieve useful information
	 * which are calculated during drawing. Currently only <code>startArrow</code> and <code>endArrow</code> properties
	 * are used, which contains an array of two points between an arrow is drawn. The <code>renderContext</code> is API
	 * internal only!!
	 *
	 * @method drawLineEndings
	 * @param {Point} start Start point of first line ending.
	 * @param {Point} next End point of first line ending.
	 * @param {Point} prev Start point of last line ending.
	 * @param {Point} end End point of last line ending.
	 * @param {Object} [renderContext] API internal context object to store information calculated during drawing.
	 * @since 1.6.17
	 */
	drawLineEndings(start, next, prev, end, renderContext) {
		const endWidth = this.drawArrow(
			prev,
			end,
			this._lineArrowEnd,
			this._lineArrowEndWidth,
			this._lineArrowEndLength
		);
		const startWidth = this.drawArrow(
			next,
			start,
			this._lineArrowStart,
			this._lineArrowStartWidth,
			this._lineArrowStartLength
		);

		this._updateRenderContextBBox(renderContext, 'startArrow', start, startWidth);
		this._updateRenderContextBBox(renderContext, 'endArrow', end, endWidth);
	}

	/**
	 * Multiplies internal state matrix by given one.
	 *
	 * @method multiply
	 * @param {Array} matrix A 2x3 matrix.
	 * @private
	 */
	multiply(matrix) {
		const m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
		const m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

		const m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
		const m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

		const dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
		const dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

		this.m[0] = m11;
		this.m[1] = m12;
		this.m[2] = m21;
		this.m[3] = m22;
		this.m[4] = dx;
		this.m[5] = dy;
	}

	/**
	 * Inverts given matrix.
	 *
	 * @method invert
	 * @param {Array} m A 2x3 matrix to invert.
	 * @return {Array} Inverted matrix.
	 * @private
	 */
	invert(m) {
		const mRet = [1, 0, 0, 1, 0, 0];
		const d = 1 / (m[0] * m[3] - m[1] * m[2]);

		mRet[0] = m[3] * d;
		mRet[1] = -m[1] * d;
		mRet[2] = -m[2] * d;
		mRet[3] = m[0] * d;
		mRet[4] = d * (m[2] * m[5] - m[3] * m[4]);
		mRet[5] = d * (m[1] * m[4] - m[0] * m[5]);

		return mRet;
	}

	/**
	 * Rotates inner state matrix by given angle.
	 *
	 * @method rotateM
	 * @param {Number} rad Rotation angle in radiant.
	 * @private
	 */
	rotateM(rad) {
		const c = Math.cos(rad);
		const s = Math.sin(rad);
		const m11 = this.m[0] * c + this.m[2] * s;
		const m12 = this.m[1] * c + this.m[3] * s;
		const m21 = this.m[0] * -s + this.m[2] * c;
		const m22 = this.m[1] * -s + this.m[3] * c;
		this.m[0] = m11;
		this.m[1] = m12;
		this.m[2] = m21;
		this.m[3] = m22;
	}

	/**
	 * Translates inner state matrix.
	 *
	 * @method translateM
	 * @param {Number} x x coordinate of applied translation.
	 * @param {Number} y y coordinate of applied translation.
	 * @private
	 */
	translateM(x, y) {
		this.m[4] += this.m[0] * x + this.m[2] * y;
		this.m[5] += this.m[1] * x + this.m[3] * y;
	}

	/**
	 * Scales inner state matrix.
	 *
	 * @method scaleM
	 * @param {Number} sx x coordinate of applied scaling.
	 * @param {Number} sy y coordinate of applied scaling.
	 * @private
	 */
	scaleM(sx, sy) {
		this.m[0] *= sx;
		this.m[1] *= sx;
		this.m[2] *= sy;
		this.m[3] *= sy;
	}

	/**
	 * Applies inner state, i.e. translation, scaling and rotation, to given point which is specified by x and y
	 * coordinates.
	 *
	 * @method transformPoint
	 * @param {Number} x x coordinate of point to transform.
	 * @param {Number} y y coordinate of point to transform.
	 * @param {Number} index Index of cache point to use
	 * @return {Point} The transformed point.
	 * @private
	 */
	transformPoint(x, y, index) {
		const xAbs = x * this.m[0] + y * this.m[2] + this.m[4];
		const yAbs = x * this.m[1] + y * this.m[3] + this.m[5];
		const p = tmppoints[index];

		if (this.antialias) {
			p.x = xAbs;
			p.y = yAbs;
		} else if (this._fillOperation) {
			p.x = Math.ceil(xAbs - 0.5);
			p.y = Math.ceil(yAbs - 0.5);
		} else {
			p.x = Math.ceil(xAbs - 0.5) + 0.5;
			p.y = Math.ceil(yAbs - 0.5) + 0.5;
		}

		return p;
	}

	/**
	 * Returns the rotation angle of specified point.
	 *
	 * @method getRotation
	 * @return {Number} Rotation angle of specified point in radiant.
	 * @private
	 */
	getRotation() {
		const result = Math.atan2(this.m[3], -this.m[1]);
		return result - Math.PI / 2;
	}

	/**
	 * Applies an optional filter to the format specified by given <code>type</code> string
	 * @method filter
	 * @param {String} type A format type string.
	 * @param {Object} def A default value which should be returned if passed type is not handled by the filter object.
	 * @return {Object} Filtered format value or given default if no filter object is currently set or the filter does
	 * not handle specified type.
	 * @private
	 * @since 2.0.22.0
	 */
	_filter(type, def) {
		return this.filter ? this.filter.apply(type, def) : def;
	}
}

/**
 * The global default filter to use.<br/>
 * By default the framework uses the {{#crossLink "Graphics/BW_FILTER:property"}}{{/crossLink}} filter
 * but applications may replace this with a custom default filter.
 *
 * @property DEF_FILTER
 * @type {Object}
 * @static
 * @since 2.0.22.0
 */
GraphSettings.DEF_FILTER = BW_FILTER;

export default Graphics;
