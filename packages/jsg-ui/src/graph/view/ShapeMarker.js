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
import { Rectangle, Point, default as JSG } from '@cedalo/jsg-core';
import SelectionStyle from './selection/SelectionStyle';

/**
 * A simple data class representing a Marker within an EditShapeView.
 *
 * @class EditShapeView.Marker
 * @param {Number} index The Marker index within the list of all displayed markers.
 * @param {Point} origin The Marker origin at which it will be placed.
 * @param {Number} size The Marker size.
 * @constructor
 * @private
 */
class ShapeMarker {
	constructor(index, origin, size) {
		/**
		 * The marker index or -1 if this marker was not added yet.
		 *
		 * @property name
		 * @type Number
		 */
		this.index = index;
		this._origin = origin;
		this._insertIndex = -1;
		this._bounds = new Rectangle(origin.x, origin.y, size, size);
		this.center = new Point(0, 0);
		this._bounds.getCenter(this.center);
		this.isTemporary = false;
	}

	/**
	 * Draws this Marker using given graphics.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics class to use for drawing.
	 */
	draw(graphics) {
		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);

		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(SelectionStyle.MARKER_SIZE) / 2;
		const rect = JSG.rectCache.get();

		this._bounds.copy();
		rect.x = this._bounds.getCenterX() - markersize;
		rect.y = this._bounds.getCenterY() - markersize;
		rect.width = markersize * 2;
		rect.height = markersize * 2;
		graphics.drawMarker(rect, false);

		JSG.rectCache.release(rect);
	}

	/**
	 * Checks if given Point is within the bounds of this Marker.
	 *
	 * @method contains
	 * @param {Point} point The point to check.
	 * @return {Boolean} <code>true</code> if point is within Marker bounds, <code>false</code> otherwise.
	 */
	contains(point, tolerance) {
		const center = this._bounds.getCenter(JSG.ptCache.get());
		const contains =
			point.x >= center.x - tolerance &&
			point.x <= center.x + tolerance &&
			point.y >= center.y - tolerance &&
			point.y <= center.y + tolerance;
		JSG.ptCache.release(center);
		return contains;
	}

	/**
	 * Returns the Marker location, i.e. the top-left corner of its corresponding bounds rectangle.
	 *
	 * @method getLocation
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The marker location.
	 */
	getLocation(reusepoint) {
		const location = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		location.set(this._bounds.x, this._bounds.y);
		return location;
	}

	/**
	 * Returns the Marker center.
	 *
	 * @method getCenter
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The marker location.
	 */
	getCenter(reusepoint) {
		const center = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		center.set(this.center.x, this.center.y);
		return center;
	}

	/**
	 * Sets the Marker center.
	 *
	 * @method setCenter
	 * @param {Number} x The x coordinate of new center.
	 * @param {Number} y The y coordinate of new center.
	 */
	setCenter(x, y) {
		this.setLocation(x - this._bounds.width / 2, y - this._bounds.height / 2);
	}

	/**
	 * Sets the Marker center.
	 *
	 * @method setCenterTo
	 * @param {Point} point The coordinate of new center.
	 */
	setCenterTo(point) {
		this.setCenter(point.x, point.y);
	}

	/**
	 * Sets the Marker location, i.e. the top-left corner of its corresponding bounds rectangle.
	 *
	 * @method setLocationTo
	 * @param {Point} point The new top-left corner of its bounds rectangle.
	 */
	setLocationTo(point) {
		if (point) {
			this.setLocation(point.x, point.y);
		}
	}

	/**
	 * Sets the Marker location, i.e. the top-left corner of its corresponding bounds rectangle.
	 *
	 * @method setLocation
	 * @param {Number} x The x coordinate of new location.
	 * @param {Number} y The y coordinate of new location.
	 */
	setLocation(x, y) {
		this._bounds.x = x;
		this._bounds.y = y;
		this._bounds.getCenter(this.center);
	}
}

export default ShapeMarker;
