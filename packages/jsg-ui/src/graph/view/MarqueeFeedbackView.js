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
import { default as JSG, FormatAttributes, Point, Rectangle } from '@cedalo/jsg-core';
import View from '../../ui/View';

/**
 * A View subclass to draw a simple translucent gray rectangle.</br>
 * This view is used as a visual feedback while spanning a selection box via mouse drag.
 *
 * @class MarqueeFeedbackView
 * @extends View
 * @constructor
 */
class MarqueeFeedbackView extends View {
	constructor() {
		super();

		this._bgColor = JSG.theme.feedbackFill;
		this._fgColor = JSG.theme.feedbackBorder;
		this._image = undefined;
		this._lineWidth = FormatAttributes.LineStyle.HAIRLINE;
		this._bounds = new Rectangle(0, 0, 0, 0);
	}

	containsPoint(point) {
		return this._bounds.containsPoint(point);
	}

	/**
	 * Returns the bounds of this view.
	 *
	 * @method getBounds
	 * @param {Rectangle} [reuserect] An optional Rectangle instance to reuse. If not provided a new one
	 *     will be created.
	 * @return {Rectangle} The current bounds of this view.
	 */
	getBounds(reuserect) {
		const bounds = reuserect || new Rectangle(0, 0, 0, 0);
		bounds.setTo(this._bounds);
		return bounds;
	}

	/**
	 * Sets the bounds of this view.
	 *
	 * @method setBounds
	 * @param {Number} x The new x coordinate of this view.
	 * @param {Number} y The new y coordinate of this view.
	 * @param {Number} w The new width of this view.
	 * @param {Number} h The new height of this view.
	 */
	setBounds(x, y, w, h) {
		this._bounds.set(x, y, w, h);
	}

	/**
	 * Returns the origin of this view. The origin is the top, left point of the bounds rectangle, i.e
	 * the x and y coordinate.
	 *
	 * @method getOrigin
	 * @param {Point} [reusepoint] An optional Point instance to reuse. If not provided a new one will be
	 *     created.
	 * @return {Point} The origin of this view.
	 */
	getOrigin(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		point.set(this._bounds.x, this._bounds.y);
		return point;
	}

	/**
	 * Returns the center of view bounds.
	 *
	 * @method getCenter
	 * @param {Point} [reusepoint] An optional Point instance to reuse. If not provided a new one will be
	 *     created.
	 * @return {Point} The center of current view bounds.
	 */
	getCenter(reusepoint) {
		return this._bounds.getCenter(reusepoint);
	}

	draw(graphics) {
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setFillColor(this._bgColor);
		graphics.setLineColor(this._fgColor);
		graphics.setLineWidth(this._lineWidth);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		if (this._image) {
			graphics.setShadow(
				'#AAAAAA',
				graphics.getCoordinateSystem().metricToDeviceX(100),
				graphics.getCoordinateSystem().metricToDeviceY(100),
				5
			);
		}
		graphics.fillRect(this._bounds);
		if (this._image) {
			graphics.setShadow('#AAAAAA', 0, 0, 0);
			const image = JSG.imagePool.add(this._image);
			if (image) {
				graphics.drawImage(
					image,
					this._bounds.x + this._bounds.height / 6,
					this._bounds.y + this._bounds.height / 6,
					this._bounds.width - this._bounds.height / 3,
					this._bounds.height - this._bounds.height / 3
				);
			}
		}
		graphics.drawRect(this._bounds);
	}
}

export default MarqueeFeedbackView;
