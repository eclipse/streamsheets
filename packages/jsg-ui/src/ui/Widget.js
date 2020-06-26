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
import {
	default as JSG,
	FormatAttributes,
	Point,
	Rectangle,
} from '@cedalo/jsg-core';
import View from './View';

/**
 * A widget is the base class for any UI components used within this framework.</br>
 * It simply extends the view by providing bounds and {{#crossLink "FormatAttributes"}}{{/crossLink}} to
 * determine its visual representation.
 *
 * @class Widget
 * @extends View
 * @constructor
 */
class Widget extends View {
	constructor() {
		super();
		this._format = new FormatAttributes();
		this._format.setLineStyle(FormatAttributes.LineStyle.NONE);
		this._bounds = new Rectangle(0, 0, 0, 0);
	}

	/**
	 * Adds a sub-widget to this widget.
	 *
	 * @method add
	 * @param {Widget} widget Widget to add.
	 * @return {Widget} The added widget as convenience.
	 */
	add(widget) {
		return super.addView(widget);
	}

	/**
	 * Removes a sub-widget from this widget.
	 *
	 * @method remove
	 * @param {Widget} widget Widget to remove.
	 */
	remove(widget) {
		super.removeView(widget);
	}

	/**
	 * Get the bounds of the widget.
	 *
	 * @method getBounds
	 * @param {Rectangle} [reuserect] Optional rectangle that can be used to be filled with the bounds.
	 * @return {Rectangle} Current bounds of the widget.
	 */
	getBounds(reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		rect.setTo(this._bounds);
		return rect;
	}

	/**
	 * Get the client area of the widget. The client area is the internal rectangle of the widget. The origin is always
	 * placed at the 0, 0 coordinate.
	 *
	 * @method getClientArea
	 * @param {Rectangle} [reuserect] Optional rectangle that can be used to be filled with the client
	 *     area.
	 * @return {Rectangle} Current client area of the widget.
	 */
	getClientArea(reuserect) {
		const cArea = this.getBounds(reuserect);
		cArea.set(0, 0, cArea.width, cArea.height);

		return cArea;
	}

	/**
	 * Get the location or origin of the widget within its parent
	 *
	 * @method getLocation
	 * @param {Point} [reusepoint] Point that can be used to copy the information to.
	 * @return {Point} Current location within parent
	 */
	getLocation(reusepoint) {
		const location = reusepoint || new Point(0, 0);
		location.set(this._bounds.x, this._bounds.y);
		return location;
	}

	/**
	 * Get the size the widget.
	 *
	 * @method getSize
	 * @param {Point} [reusepoint] Point that can be used to copy the information to.
	 * @return {Point} Current size of the widget.
	 */
	getSize(reusepoint) {
		const size = reusepoint || new Point(0, 0);
		return size.set(this._bounds.width, this._bounds.height);
	}

	/**
	 * Get current format definition. The format is used to determine the visual representation of this widget, like
	 * background color or border style for example.
	 *
	 * @method getFormat
	 * @return {FormatAttributes} Format definition class.
	 */

	getFormat() {
		return this._format;
	}


	/**
	 * Set the bounds of the widget within its parent.
	 *
	 * @method setBounds
	 * @param {Number} x X-Position.
	 * @param {Number} y Y-Position.
	 * @param {Number} width Width of the widget.
	 * @param {Number} height Height of the widget.
	 */
	setBounds(x, y, width, height) {
		this._setLocation(x, y);
		this._setSize(width, height);
	}

	/**
	 * Set the bounds of the widget within its parent.
	 *
	 * @method setBoundsTo
	 * @param {Rectangle} rect New bounds.
	 */
	setBoundsTo(rect) {
		this.setBounds(rect.x, rect.y, rect.width, rect.height);
	}

	/**
	 * Set the location or origin of the widget within its parent
	 *
	 * @method setLocation
	 * @param {Number} x X-Position.
	 * @param {Number} y Y-Position.
	 */
	setLocation(x, y) {
		this._setLocation(x, y);
	}

	/**
	 * Set the location or origin of the widget within its parent
	 *
	 * @method setLocation
	 * @param {Point} point New position.
	 */
	setLocationTo(point) {
		this._setLocation(point.x, point.y);
	}

	/**
	 * Internal method to set widget location.
	 *
	 * @method _setLocation
	 * @param {Number} x The new x position.
	 * @param {Number} y The new y position.
	 * @private
	 */
	_setLocation(x, y) {
		this._bounds.x = x;
		this._bounds.y = y;
	}

	/**
	 * Set the size of the widget.
	 *
	 * @method setSize
	 * @param {Number} width Width of the widget.
	 * @param {Number} height Height of the widget.
	 */
	setSize(width, height) {
		this._setSize(width, height);
	}

	/**
	 * Set the size of the widget.
	 *
	 * @method setSizeTo
	 * @param {Point} size New size.
	 */
	setSizeTo(size) {
		this._setSize(size.x, size.y);
	}

	/**
	 * Internal method to set widget size.
	 *
	 * @method _setSize
	 * @param {Number} w The new width.
	 * @param {Number} h The new height.
	 * @private
	 */
	_setSize(w, h) {
		this._bounds.width = w;
		this._bounds.height = h;

		this._fireOnResize();
	}

	contains(x, y) {
		return this._bounds.contains(x, y);
	}

	/**
	 * Translate the given coordinate from a coordinate within the parent view to a corresponding coordinate of this
	 * view.
	 *
	 * @method translateFromParent
	 * @param {Point} point Coordinate to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateFromParent(point) {
		point.translate(-this._bounds.x, -this._bounds.y);
		return point;
	}

	/**
	 * Translate the given coordinate from a coordinate within this view to a corresponding coordinate of the parent
	 * view.
	 *
	 * @method translateToParent
	 * @param {Point} point Coordinate to translate.
	 * @return {Point} Given and now translated point as convenience.
	 */
	translateToParent(point) {
		point.translate(this._bounds.x, this._bounds.y);
		return point;
	}

	/**
	 * Draws this widget. Subclasses should not overwrite this method, but instead implement drawBackground,
	 * drawClientArea or drawBorder.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics to use for output.
	 */
	draw(graphics) {
		if (this.isVisible()) {
			if (this._format.applyFillToGraphics(graphics, this._bounds)) {
				this._format.applyShadowToGraphics(graphics, this._bounds);
				this.drawBackground(graphics);
				this._format.removeShadowFromGraphics(graphics);
			}

			graphics.save(this);
			graphics.startGroup();
			this.drawClientArea(graphics);
			graphics.endGroup();
			graphics.restore();

			if (this._format.applyLineToGraphics(graphics)) {
				this.drawBorder(graphics);
				this._format.removeLineFromGraphics(graphics);
			}
		}
	}

	/**
	 * Draws the background of this widget. By default the background is filled with a white rectangle.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics to use for output.
	 */
	drawBackground(graphics) {
		graphics.fillRect(this._bounds);
	}

	/**
	 * Draws the client area of this widget. By default all sub-views of this widget are drawn within the client area.
	 *
	 * @method drawClientArea
	 * @param {Graphics} graphics Graphics to use for output.
	 */
	drawClientArea(graphics) {
		if (this.hasSubviews()) {
			graphics.startGroup();
			graphics.translate(this._bounds.x, this._bounds.y);
			this.drawSubViews(graphics);
//        graphics.translate(-this._bounds.x, -this._bounds.y);
			graphics.endGroup();
		}
	}

	/**
	 * Draws the border of this widget. By default a black frame is drawn, if the line style of the format is not set
	 * to invisible.
	 *
	 * @method drawBorder
	 * @param {Graphics} graphics Graphics to use for output.
	 */
	drawBorder(graphics) {
		graphics.drawRect(this._bounds);
	}
}

export default Widget;
