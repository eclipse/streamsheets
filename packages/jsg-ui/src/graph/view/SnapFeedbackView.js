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
import { default as JSG, FormatAttributes, Strings, Point } from '@cedalo/jsg-core';
import View from '../../ui/View';

/**
 * A View subclass to draw a red dashed line as snap hint while dragging a GraphItemView.<br/>
 * The line is drawn from this view's origin to the specified target point. Since this view is used
 * as a visual feedback while dragging, the origin and target points should be specified relative to
 * {{#crossLink "GraphView"}}{{/crossLink}}.
 *
 * @class SnapFeedbackView
 * @extends View
 * @constructor
 */
class SnapFeedbackView extends View {
	constructor() {
		super();
		this._lineColor = 'rgba(255,0,0,0.5)';
		this._lineStyle = FormatAttributes.LineStyle.DASH;
		this._lineWidth = FormatAttributes.LineStyle.HAIRLINE;
		this._origin = new Point(0, 0);
		this._target = new Point(0, 0);
	}

	/**
	 * Sets the origin of this view to given point.
	 *
	 * @method setOriginTo
	 * @param {Point} p The new origin location.
	 */
	setOriginTo(p) {
		this.setOrigin(p.x, p.y);
	}

	/**
	 * Sets the origin of this view to given x and y location.
	 *
	 * @method setOrigin
	 * @param {Number} x The x coordinate of new origin location.
	 * @param {Number} y The y coordinate of new origin location.
	 */
	setOrigin(x, y) {
		this._origin.set(x, y);
	}

	/**
	 * Returns the origin of this view.<br/>
	 *
	 * @method getOrigin
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The views origin.
	 */
	getOrigin(reusepoint) {
		const origin = reusepoint || new Point(0, 0);
		origin.setTo(this._origin);
		return origin;
	}

	/**
	 * Sets the target point to given one.
	 *
	 * @method setTargetTo
	 * @param {Point} p The new target point.
	 */
	setTargetTo(p) {
		this.setTarget(p.x, p.y);
	}

	/**
	 * Sets the target point to given x and y coordinates.
	 *
	 * @method setTarget
	 * @param {Number} x The x coordinate of new target location.
	 * @param {Number} y The y coordinate of new target location.
	 */
	setTarget(x, y) {
		this._target.set(x, y);
	}

	/**
	 * Returns the target point of this view.<br/>
	 *
	 * @method getTarget
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The views target point.
	 * @since 1.6.0
	 */
	getTarget(reusepoint) {
		const target = reusepoint || new Point(0, 0);
		return target.setTo(this._target);
	}

	/**
	 * Sets the new line color to use, default is rgba(255,0,0,0.5).
	 *
	 * @method setLineColor
	 * @param {String} color The new line color.
	 * @since 1.6.0
	 */
	setLineColor(color) {
		if (Strings.isString(color)) {
			this._lineColor = color;
		}
	}

	/**
	 * Sets the new line width to use.
	 *
	 * @method setLineWidth
	 * @param {Number} width The new line width.
	 * @since 1.6.0
	 */
	setLineWidth(width) {
		this._lineWidth = width || FormatAttributes.LineStyle.HAIRLINE;
	}

	/**
	 * Sets the new line style to use, default is {{#crossLink
	 * "FormatAttributes.LineStyle/DASH:property"}}{{/crossLink}}.
	 *
	 * @method setLineStyle
	 * @param {FormatAttributes.LineStyle} style The new line style.
	 * @since 1.6.0
	 */
	setLineStyle(style) {
		if (style) {
			this._lineStyle = style;
		}
	}

	draw(graphics) {
		let linewidth = this._lineWidth;
		if (linewidth !== FormatAttributes.LineStyle.HAIRLINE) {
			// don't zoom:
			linewidth = graphics.getCoordinateSystem().metricToLogXNoZoom(linewidth);
		}
		graphics.setLineWidth(linewidth);
		graphics.setLineColor(this._lineColor);
		graphics.setLineStyle(this._lineStyle);

		graphics.drawLine(this._origin, this._target);
	}
}

export default SnapFeedbackView;
