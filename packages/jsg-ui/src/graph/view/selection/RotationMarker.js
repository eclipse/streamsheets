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
import Marker from './Marker';

/**
 * A Marker subclass to represent a rotation handle.
 *
 * @class RotationMarker
 * @extends Marker
 * @constructor
 * @param {Number} pointIndex The point index to use, e.g. to specify a direction or a line segment.
 * @param {Coordinate} coordinate The location to place the marker at.
 */
class RotationMarker extends Marker {
	constructor(pointIndex, coordinate, disabled) {
		super(pointIndex, coordinate, disabled);

		this._pinbounds = new Rectangle(0, 0, 0, 0);
	}

	setSize(size) {
		super.setSize(size);

		this._pinbounds.width = size;
		this._pinbounds.height = size;
	}

	/**
	 * Returns the location of the rotation handle as point.
	 *
	 * @method getPinLocation
	 * @param {Point} [reusepoint] An optional point to reuse, if not supplied a new point will be created.
	 * @return {Point} The pin handler location.
	 */
	getPinLocation(reusepoint) {
		const pin = reusepoint || new Point(0, 0);
		return this._pinbounds.getCenter(pin);
	}

	/**
	 * Sets the new location of rotation handle.
	 *
	 * @method setPinLocation
	 * @param {Point} point The new location of rotation handle.
	 */
	setPinLocation(point) {
		this._pinbounds.x = point.x;
		this._pinbounds.y = point.y;
		this._coordinate.setX(point.x);
	}

	draw(graphics, style) {
		if (style.isRotateMarkerVisible && !this._disabled) {
			const end = JSG.ptCache.get();
			const start = JSG.ptCache.get();
			const center = JSG.ptCache.get();
			const halfsize = this._bounds.width / 2;

			this._coordinate.setY(-graphics.getCoordinateSystem().metricToLogXNoZoom(style.rotateMarkerDistance));
			this._coordinate.toPoint(center);
			this._bounds.x = center.x;
			this._bounds.y = center.y;

			// draw line:
			start.set(this._bounds.x, this._bounds.y);
			end.set(this._pinbounds.x, -125);
			graphics.setLineColor(style.lineColor);
			graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
			graphics.drawLine(start, end);
			JSG.ptCache.release(end, start, center);

			// draw marker and pin:
			this._bounds.x -= halfsize;
			this._bounds.y -= halfsize;
			this._pinbounds.x -= halfsize;
			this._pinbounds.y -= halfsize;

			graphics.setLineColor(style.markerBorderColor);
			graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

			this.drawMarker(graphics, this._bounds);
		}
	}
}

export default RotationMarker;
