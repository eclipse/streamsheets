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
const JSG = require('../JSG');
const Arrays = require('../commons/Arrays');
const BoundingBox = require('./BoundingBox');
const Point = require('./Point');
const Rectangle = require('./Rectangle');
const MathUtils = require('./MathUtils');

/**
 * The PointList class manages a list of {{#crossLink "Point"}}{{/crossLink}} objects.
 * PointList defines a container of {{#crossLink "Point"}}{{/crossLink}}s.
 * The following example creates a PointList and adds points to it:
 *
 * @example
 *     var points = new PointList(), pt,
 *
 *     pt = new Point(10, 10);
 *     points.addPoint(pt);
 *
 *     pt = new Point(20, 20);
 *     points.addPoint(pt);
 *
 * @class PointList
 * @constructor
 */
class PointList {
	constructor() {
		this._points = [];
	}

	/**
	 * Creates an new instance of <code>PointList</code> from given array of points.<br/>
	 * Note: the returned list contains copies of specified points.
	 *
	 * @method fromPoints
	 * @param  {Array} pts An array of {{#crossLink "Point"}}{{/crossLink}}s to add to the new
	 * <code>PointList</code>.
	 * @return {PointList} A new <code>PointList</code> instance.
	 * @static
	 */
	static fromPoints(pts) {
		const list = new PointList();
		pts.forEach((point) => {
			list.addPoint(point.copy());
		});
		return list;
	}

	/**
	 * Copy point list.
	 *
	 * @method copy
	 * @return {PointList} A copy of this point list.
	 */
	copy() {
		const copy = new PointList();
		copy.addPoints(this._points);
		return copy;
	}

	/**
	 * Calls given function on all {@link Point}s of this list.
	 *
	 * @example
	 *     pointlist.forEach(function(point, index) {
	 *         //...do something with point...
	 *     });
	 * @method forEach
	 * @param {function} func The function to call on each point.
	 */
	forEach(func) {
		this._points.forEach((point, index) => {
			func(point, index);
		});
	}

	/**
	 * Save the PointList.
	 *
	 * @method save
	 * @param {String} name Name for object.
	 * @param {Writer} writer Writer object to save to.
	 */
	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeStartArray('point');

		this.points.forEach((point) => {
			writer.writeStartElement('point');
			writer.writeAttributeNumber('x', point.x, 2);
			writer.writeAttributeNumber('y', point.y, 2);
			writer.writeEndElement();
		});
		writer.writeEndArray('point');
		writer.writeEndElement();
	}

	/**
	 * Delete all points in PointList.
	 *
	 * @method clear
	 */
	clear() {
		this._points = [];
	}

	/**
	 * Gives access to the point array.
	 *
	 * @method getPoints
	 * @return {Array} Array with {@link Point}.
	 */
	getPoints() {
		return this._points;
	}

	/**
	 * Return the point list length.
	 *
	 * @method length
	 * @return {Number} Number of points in this list.
	 */
	length() {
		return this._points.length;
	}

	/**
	 * Set new point list.
	 *
	 * @method setPoints
	 * @param {Array} points Array with new {@link Point}s.
	 */
	setPoints(points) {
		// TODO (ah): review - remove!! Used only in ScalableGraphics and SVGraphics
		this._points = points;
	}

	/**
	 * Fill with this point list with points of other point list.
	 * @method setTo
	 * @param {PointList} pointList Another PointList.
	 */
	setTo(pointlist) {
		if (pointlist !== undefined) {
			const newpoints = pointlist._points;
			this.keepPoints(newpoints.length);

			newpoints.forEach((point, index) => {
				this._points[index].setTo(point);
			});
		}
	}

	/**
	 * Get point at specified index.
	 *
	 * @method getPointAt
	 * @param {Number} index Index of item to be retrieved.
	 * @return {Point} Point at index.
	 */
	getPointAt(index) {
		return index >= 0 && index < this._points.length
			? this._points[index]
			: undefined;
	}

	/**
	 * Checks if PointList is empty.
	 *
	 * @method isEmpty
	 * @return <code>true</code> if PointList has at least one point,
	 *          <code>false </code> otherwise.
	 */
	isEmpty() {
		return this._points.length === 0;
	}

	/**
	 * Set point coordinates at index
	 *
	 * @method setPointAtTo
	 * @param {Number} index Index of point to be changed.
	 * @param {Point} point The point to take the coordinates from
	 */
	setPointAtTo(index, point) {
		this.setPointAt(index, point.x, point.y);
	}

	/**
	 * Set point coordinates at index
	 *
	 * @method setPointAt
	 * @param index Index of point to be changed.
	 * @param {Number} x New x-coordinate.
	 * @param {Number} y New y-coordinate.
	 */
	setPointAt(index, x, y) {
		if (index >= 0 && index < this._points.length) {
			this._points[index].set(x, y);
		}
	}

	/**
	 * Add a copy of given point to PointList
	 *
	 * @method addPoint
	 * @param {Point} point New point
	 */
	addPoint(point) {
		this._points.push(point.copy());
	}

	/**
	 * Adds a new point to PointList at the given index. The current point at index and all subsequent
	 * points are moved to the right, i.e. one is added to their indices. If specified index is less than
	 * zero calling this method has no effect. If it is equal or greater than the current size of the
	 * list, the given point is simply pushed at the end of this list.
	 *
	 * @method addPointAt
	 * @param {Number} index the index of the new point in PointList
	 * @param {Point} point New point
	 */
	addPointAt(index, point) {
		if (index >= 0) {
			if (index < this._points.length) {
				Arrays.insertAt(this._points, index, point.copy());
			} else {
				this._points.push(point.copy());
			}
		}
	}

	/**
	 * Add array of points to PointList
	 *
	 * @method addPoints
	 * @param {Array} points Array of {@link Point}s to be added.
	 */
	addPoints(points) {
		points.forEach((point) => {
			this._points.push(point.copy());
		});
	}

	/**
	 * Remove point at index.
	 *
	 * @method removePointAt
	 * @param {Number} index Index of point to be removed.
	 */
	removePointAt(index) {
		if (index >= 0 && index < this._points.length) {
			Arrays.removeAt(this._points, index);
		}
	}

	/**
	 * Keeps the specified number of points within this list. Afterwards the list has exactly count
	 * items, i.e. list#size() == count.
	 *
	 * @method keepPoints
	 * @param {Number} count The number of points to keep.
	 */
	keepPoints(count) {
		let i;

		for (i = this._points.length; i < count; i += 1) {
			this._points.push(new Point(0, 0));
		}
		this._points.length = count;
	}

	/**
	 * Returns the center of the bounding rectangle of this PointList.
	 *
	 * @method getCenter
	 * @param {Point} reusepoint The point to reuse
	 * @return {Point} Center point.
	 */
	getCenter(reusepoint) {
		const bounds = this.getBoundingRect(JSG.rectCache.get());
		const center = bounds.getCenter(reusepoint);

		JSG.rectCache.release(bounds);
		return center;
	}

	/**
	 * Rotates all points around given center by specified angle (in radiant)
	 *
	 * @method rotate
	 * @param {Number} angle Rotation angle.
	 * @param {Point} center Point to rotate around.
	 */
	rotate(angle, center) {
		this.points.forEach((point, index) => {
			this.points[index] = MathUtils.getRotatedPoint(
				point,
				center,
				angle
			);
		});
	}

	/**
	 * Scale all points by given factors.
	 *
	 * @method scale
	 * @param {Number} sX Factor for x-coordinates.
	 * @param {Number} sY Factor for y-coordinates.
	 */
	scale(sX, sY) {
		this.points.forEach((point, index) => {
			this._points[index].x *= sX;
			this._points[index].y *= sY;
		});
	}

	/**
	 * Translate all points by given point coordinate. Translate adds the given coordinate to all points in the
	 * PointList.
	 *
	 * @method translateTo
	 * @param {Point} point Coordinates to translate by.
	 */
	translateTo(point) {
		this.translate(point.x, point.y);
	}

	/**
	 * Translate all points by given coordinates. Translate adds the given coordinates to all points in the PointList.
	 *
	 * @method translate
	 * @param {Number} dX X-Coordinate to translate by.
	 * @param {Number} dY Y-Coordinate to translate by.
	 */
	translate(dX, dY) {
		this.points.forEach((point, index) => {
			this._points[index].x += dX;
			this._points[index].y += dY;
		});
	}

	// TODO REVIEW - START:
	movePointAt(index, dX, dY) {
		if (index < 0 || index >= this._points.length) {
			return;
		}
		this._points[index].x += dX;
		this._points[index].y += dY;
	}

	getBoundingRect(reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);

		if (this._points.length === 0) {
			rect.set(0, 0, 0, 0);
		} else {
			let minX = this._points[0].x;
			let minY = this._points[0].y;
			let maxX = minX;
			let maxY = minY;
			let i;
			let n;
			for (i = 1, n = this._points.length; i < n; i += 1) {
				minX = Math.min(minX, this._points[i].x);
				minY = Math.min(minY, this._points[i].y);
				maxX = Math.max(maxX, this._points[i].x);
				maxY = Math.max(maxY, this._points[i].y);
			}
			rect.set(minX, minY, Math.abs(maxX - minX), Math.abs(maxY - minY));
		}

		return rect;
	}

	// return an unrotated bbox!!
	getBoundingBox(reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);

		if (this._points.length !== 0) {
			let minX = this._points[0].x;
			let minY = this._points[0].y;
			let maxX = minX;
			let maxY = minY;
			let i;
			let n;

			for (i = 1, n = this._points.length; i < n; i += 1) {
				minX = Math.min(minX, this._points[i].x);
				minY = Math.min(minY, this._points[i].y);
				maxX = Math.max(maxX, this._points[i].x);
				maxY = Math.max(maxY, this._points[i].y);
			}
			bbox.setTopLeft(minX, minY);
			bbox.setSize(Math.abs(maxX - minX), Math.abs(maxY - minY));
		}
		bbox.setAngle(0);

		return bbox;
	}

	// TODO REVIEW - END

	/**
	 * Checks whether a point lies inside the polygon described by the PointList
	 *
	 * @method contains
	 * @param {Point} point Coordinates to check.
	 * @return <code>true</code> if point lies inside polygon,
	 *          <code>false </code> otherwise.
	 */
	contains(point) {
		return MathUtils.isPointInPolygon(this._points, point);
	}

	/**
	 * Returns the smallest distance from the point to the polyline
	 *
	 * @method distance
	 * @param {Point} point Coordinates to check.
	 * @param {boolean} closed Polyline is closed.
	 * @return <code>true</code> if point lies on polyline,
	 *          <code>false </code> otherwise.
	 */
	distance(point, closed) {
		let dist;
		let i;
		let n;
		let ldist;
		const { getLinePointDistance } = MathUtils;

		for (i = 1, n = this._points.length; i < n; i += 1) {
			ldist = getLinePointDistance(
				this._points[i - 1],
				this._points[i],
				point
			);
			if (!Number.isNaN(ldist)) {
				if (dist === undefined) {
					dist = ldist;
				} else {
					dist = Math.min(dist, ldist);
				}
			}
		}

		if (closed && this._points.length > 1) {
			ldist = getLinePointDistance(
				this._points[i - 1],
				this._points[0],
				point
			);
			if (!Number.isNaN(ldist)) {
				dist = Math.min(dist, ldist);
			}
		}

		return dist;
	}

	/**
	 * Return the distance of any point in the point list from the given point, if within a given tolerance. The
	 * method also checks as an option, if the point is close to the center of the imaginary line between two points.
	 *
	 * @method getOffsetFromPoint
	 * @param {Point} point Point to check for.
	 * @param {Number} tolerance Tolerance to check within.
	 * @param {boolean} closed Emulate closed polygon, if true.
	 * @param {boolean} center If true, checks also, if the point is close to the middle of a polyline segment.
	 * @return {Point} The offset of the point and the point being close or undefined, if no point close.
	 */
	getOffsetFromPoint(point, tolerance, closed, center, reusepoint) {
		let distance;
		let i;
		let n;
		const { getLineLength } = MathUtils;
		let pt;

		for (i = 0, n = this._points.length; i < n; i += 1) {
			if (!center) {
				distance = getLineLength(point, this._points[i]);
				if (!Number.isNaN(distance)) {
					if (distance < tolerance) {
						pt = reusepoint || new Point(0, 0);
						pt.set(
							point.x - this._points[i].x,
							point.y - this._points[i].y
						);
						return pt;
					}
				}
			}

			if (center && (i || closed)) {
				const pointCenter = JSG.ptCache.get();
				if (i) {
					pointCenter.set(
						(this._points[i].x + this._points[i - 1].x) / 2,
						(this._points[i].y + this._points[i - 1].y) / 2
					);
				} else if (closed) {
					pointCenter.set(
						(this._points[n - 1].x + this._points[0].x) / 2,
						(this._points[n - 1].y + this._points[0].y) / 2
					);
				}
				distance = getLineLength(point, pointCenter);
				if (!Number.isNaN(distance)) {
					if (distance < tolerance) {
						pt = reusepoint || new Point(0, 0);
						pt.set(
							point.x - pointCenter.x,
							point.y - pointCenter.y
						);
						JSG.ptCache.release(pointCenter);
						return pt;
					}
				}
				JSG.ptCache.release(pointCenter);
			}
		}

		return undefined;
	}

	/**
	 * Return the distance of any line or segment deducted from the point list from the given point, if within a given
	 * tolerance.
	 *
	 * @method getOffsetFromSegment
	 * @param {Point} point Point to check for.
	 * @param {Point} pointGrid Grid point to align offset to.
	 * @param {Number} tolerance Tolerance to check within.
	 * @param {boolean} closed Emulate closed polygon, if true.
	 * @return {Point} The offset of the point and the point being close or undefined, if no point close
	 * to the segment.
	 */
	getOffsetFromSegment(point, pointGrid, tolerance, closed) {
		let dist;
		let ldist;
		let p1;
		let p2;
		let i;
		let n;

		for (i = 1, n = this._points.length; i < n; i += 1) {
			ldist = MathUtils.getLinePointDistance(
				this._points[i - 1],
				this._points[i],
				point
			);
			if (!Number.isNaN(ldist)) {
				if (dist === undefined) {
					dist = ldist;
					p1 = i - 1;
					p2 = i;
				} else if (dist > ldist) {
					dist = ldist;
					p1 = i - 1;
					p2 = i;
				}
			}
		}

		if (closed && this._points.length) {
			ldist = MathUtils.getLinePointDistance(
				this._points[i - 1],
				this._points[0],
				point
			);
			if (!Number.isNaN(ldist)) {
				if (dist > ldist) {
					dist = ldist;
					p1 = i - 1;
					p2 = 0;
				}
			}
		}

		if (dist < tolerance && p1 !== undefined && p2 !== undefined) {
			return MathUtils.getLinePointOffset(
				this._points[p1],
				this._points[p2],
				pointGrid
			);
		}

		return undefined;
	}

	/**
	 * Returns number of points in this list.
	 *
	 * @method size
	 * @return {Number} Number of points.
	 */
	size() {
		return this._points.length;
	}
}

module.exports = PointList;
