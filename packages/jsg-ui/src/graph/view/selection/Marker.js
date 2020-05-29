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
import { default as JSG, Coordinate, Rectangle } from '@cedalo/jsg-core';
import Cursor from '../../../ui/Cursor';

/**
 * A Marker is used within the visual representation of a selection. It usually defines a special point within
 * current selection, e.g. a corner point of a selected rectangle or a certain point on a selected line.
 *
 * @class Marker
 * @constructor
 * @param {Number} pointIndex The point index to use, e.g. to specify a direction or a line segment.
 * @param {Coordinate} coordinate The location to place the marker at.
 * @param {Boolean} disabled Specify <code>true</code> to mark as disabled, <code>false</code> otherwise.
 */
class Marker {
	constructor(pointIndex, coordinate, disabled) {
		this._index = pointIndex;
		this._bounds = new Rectangle(0, 0, 0, 0);
		this._coordinate = coordinate || Coordinate.fromXY(0, 0);
		this._cursor = Cursor.Style.AUTO;
		this._disabled = disabled;
		this._active = false;
	}

	/**
	 * Sets the size of this Marker.<br/>
	 * Note: the given size is used for the width and height of this Marker.
	 *
	 * @method setSize
	 * @param {Number} size The new marker size.
	 */
	setSize(size) {
		this._bounds.height = size;
		this._bounds.width = size;
	}

	/**
	 * Returns the current marker position.
	 * @method getPosition
	 * @param {Point} reusepoint An optional <code>Point</code> to use. If not specified a new one will be
	 *     created.
	 * @return {Point} The current marker position.
	 * @since 2.0.7
	 */
	getPosition(reusepoint) {
		return this._coordinate.toPoint(reusepoint);
	}

	/**
	 * Sets the current marker position.
	 * @method setPosition
	 * @param {Point} point The new marker position.
	 * @since 2.0.7
	 */
	setPositionTo(point) {
		this._coordinate.setToPoint(point);
	}

	/**
	 * Draws a representation of this Marker using provided graphics instance.
	 *
	 * @method draw
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @param {SelectionHandlerFactory} style The current styles to use for drawing.
	 */
	draw(graphics, style) {
		const center = JSG.ptCache.get();
		const halfsize = this._bounds.width / 2;
		this._coordinate.toPoint(center);
		this._bounds.x = center.x - halfsize;
		this._bounds.y = center.y - halfsize;

		this.drawMarker(graphics, this._bounds, this._active);
		JSG.ptCache.release(center);
	}

	/**
	 * Simply passes the <code>drawMarker</code> request to given Graphics instance.
	 *
	 * @method drawMarker
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @param {Rectangle} bounds The marker bounds.
	 * @param {Boolean} active Specifies if this Marker should be drawn active or not.
	 */
	drawMarker(graphics, bounds, active) {
		graphics.drawMarker(bounds, active);
	}

	/**
	 * Checks if given location is within the bounds of this Marker. The location point should be given relative
	 * to global GraphView.
	 *
	 * @method containsPoint
	 * @param {Point} point The location to check.
	 * @return {Boolean} <code>true</code> if point is within the bounds of this marker, <code>false</code> otherwise.
	 */
	containsPoint(point, threshold) {
		const center = this._bounds.getCenter(JSG.ptCache.get());
		const contains =
			point.x >= center.x - threshold &&
			point.x <= center.x + threshold &&
			point.y >= center.y - threshold &&
			point.y <= center.y + threshold;
		JSG.ptCache.release(center);
		return contains;
	}
}

export default Marker;
