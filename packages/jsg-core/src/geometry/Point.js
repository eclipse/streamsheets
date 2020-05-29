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

/**
 * The Point class describes a 2D point.
 *
 * Points are used to describe geometric positions within the coordinate space.
 *
 * The following example creates a point and adds another points coordinates to it.
 *
 * @example
 *     var pt = new Point(0, 0);
 *     var ptAdd = new Point(10, 10);
 *     pt.add(ptAdd);
 *
 *  @class Point
 *  @constructor
 *  Create a 2D point
 *  @param {Number} x X Coordinate of the point.
 *  @param {Number} y Y Coordinate of the point.
 */
class Point {
	constructor(x, y) {
		/**
		 * X-Coordinate of the point.
		 * @property x
		 * @type {Number}
		 */
		this.x = x;
		/**
		 * Y-Coordinate of the point.
		 * @property y
		 * @type {Number}
		 */
		this.y = y;
		// pcnt++;
		// console.log('points: ' + pcnt);
	}

	static Factory() {
		return new Point(0, 0);
	}

	/**
	 * Set x and y values.
	 * @method set
	 * @param {Number} x The new x value.
	 * @param {Number} y The new y value.
	 * @return {Point} This point to support method concatenation.
	 */
	set(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	/**
	 * Assign new coordinates to the point.
	 * @method setTo
	 * @param {Point} point The point to take x, y values from.
	 * @return {Point} This point to support method concatenation.
	 */
	setTo(point) {
		this.x = point.x;
		this.y = point.y;
		return this;
	}

	/**
	 * Adds x and y values of specified point to this point.
	 * @method add
	 * @param {Point} point The point to add.
	 * @return {Point} This point to support method concatenation.
	 */
	add(point) {
		this.x += point.x;
		this.y += point.y;
		return this;
	}

	/**
	 * Subtracts x and y values of specified point from this point.
	 * @method subtract
	 * @param {Point} point The point to subtract.
	 * @return {Point} This point to support method concatenation.
	 */
	subtract(point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	}

	/**
	 * Rotates this point by specified angle.
	 * @method rotate
	 * @param {Number}angle The angle in radians.
	 * @return {Point} This point to support method concatenation.
	 */
	rotate(angle) {
		Point.rotatePoint(this, angle);
		return this;
	}

	static rotatePoint(point, angle) {
		if (angle !== 0) {
			const sin = Math.sin(angle);
			const cos = Math.cos(angle);
			const x = point.x * cos - point.y * sin;
			const y = point.x * sin + point.y * cos;
			point.set(x, y);
		}

		return point;
	}

	/**
	 * Calculate distance of a point from the origin (0, 0).
	 * @method length
	 * @return {Number} Distance to origin.
	 */
	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/**
	 * Calculate squared distance of a point from the origin (0, 0).
	 * @method lengthSquared
	 * @return {Number} Squared distance to origin.
	 */
	lengthSquared() {
		return this.x * this.x + this.y * this.y;
	}

	setLength(newlength) {
		// TODO review
		let length = this.length();
		length = length === 0 ? newlength : newlength / length;
		return this.multiply(length);
	}

	/**
	 * Multiplies x and y by the given factor.
	 * @method multiply
	 * @param {Number} factor Factor to multiply the coordinates of this point with.
	 * @return {Point} This point to support method concatenation.
	 */
	multiply(scalar) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	/**
	 * Normalizes this Point, i.e. divides it x and y components by its length. If this Point has no
	 * length, calling this method has no effect.
	 * @method normalize
	 * @return {Point} This point to support method concatenation.
	 */
	normalize() {
		const length = this.length();
		if (length !== 0) {
			this.x /= length;
			this.y /= length;
		}
		return this;
	}

	/**
	 * Returns the dot product of this point with given point.<br/>
	 * A dot product value greater 0 means that both points are pointing into same direction, a value
	 * less than 0 means opposite direction and a value equal to 0 means that both points are
	 * orthogonal to each other.
	 *
	 * @method dotProduct
	 * @param {Point} point The point to use for calculating the dot product.
	 * @return {Number} The dot product value.
	 */
	dotProduct(point) {
		return this.x * point.x + this.y * point.y;
	}

	/**
	 * Projects this point on the line specified by given points. <br/>
	 * Note that the projection might be on an extension of the line and not on the defined segment.
	 *
	 * @method projectOnLine
	 * @param {Point} lp1 The first line point.
	 * @param {Point} lp2 The second line point.
	 * @return {Point} This point to support method concatenation.
	 */
	projectOnLine(lp1, lp2) {
		const origin = JSG.ptCache.get().setTo(lp1);
		const basis = JSG.ptCache
			.get()
			.setTo(lp2)
			.subtract(origin);

		this.subtract(origin);
		let lamda = basis.dotProduct(basis);
		lamda = lamda !== 0 ? this.dotProduct(basis) / lamda : 0;
		this.setTo(basis)
			.multiply(lamda)
			.add(origin);
		JSG.ptCache.release(basis, origin);
		return this;
	}

	/**
	 * Calculates the distance of this point to specified line.
	 *
	 * @method distanceToLine
	 * @param {Point} lp1 The first line point.
	 * @param {Point} lp2 The second line point.
	 * @return {Number} The distance of this point to specified line.
	 */
	distanceToLine(lp1, lp2) {
		const a = lp2.x - lp1.x;
		const b = lp2.y - lp1.y;
		const length = Math.sqrt(a * a + b * b);
		return Math.abs((this.x - lp1.x) * b - (this.y - lp1.y) * a) / length;
		// var length = Math.sqrt((lp1.x - lp2.x) * (lp1.x - lp2.x) + (lp1.y - lp2.y) * (lp1.y - lp2.y));
		// return Math.abs(a * (this.y - lp1.y) - b * (this.x - lp1.x)) / length;
	}

	/**
	 * Calculates the distance of this point to specified point.
	 *
	 * @method distanceToPoint
	 * @param {Point} pt The point to determine the distance to.
	 * @param {Boolean} [squared] Set to <code>true</code> if returned distance should be squared, i.e. no root
	 * should be extracted.
	 * @return {Number} The distance of this point to specified one.
	 * @since 1.6.17
	 */
	distanceToPoint(pt, squared) {
		const a = this.x - pt.x;
		const b = this.y - pt.y;
		const length = a * a + b * b;
		return squared ? length : Math.sqrt(length);
	}

	/**
	 * Returns the angle between this point as the x-Axis in radians.
	 * @method angle
	 * @return Angle in radians from the origin
	 */
	angle() {
		return Math.atan2(this.y, this.x);
		// TODO think: should we check for angle < 0?
	}

	/**
	 * Translates this point by adding given x and y values.
	 * @method translate
	 * @param {Number} dx The value to add to x.
	 * @param {Number} dy The value to add to y.
	 * @return {Point} This point to support method concatenation.
	 */
	translate(dx, dy) {
		this.x += dx;
		this.y += dy;
		return this;
	}

	/**
	 * Swaps the x and y values of this point.
	 *
	 * @method swap
	 * @return {Point} This point to support method concatenation.
	 */
	swap() {
		const tmp = this.x;
		this.x = this.y;
		this.y = tmp;
		return this;
	}

	/**
	 * Creates a copy of this point.
	 * @method copy
	 * @return {Point} A copy of this point.
	 */
	copy() {
		const point = new Point(0, 0);
		point.setTo(this);
		return point;
	}

	/**
	 * Checks if given object is equal to this point. If an accuracy is given, there equality
	 * is also true, if the other values are within the interval of the tolerance.
	 * @method isEqualTo
	 * @param {Point} other Object to compare with.
	 * @param {Number} [accuracy] Tolerance for comparison.
	 * @return <code>true</code> if other is a point with same x and y value,
	 *          <code>false </code> otherwise.
	 */
	isEqualTo(other, accuracy) {
		if (other !== undefined) {
			if (accuracy === undefined) {
				return this.x === other.x && this.y === other.y;
			}
			return (
				Math.abs(this.x - other.x) < accuracy &&
				Math.abs(this.y - other.y) < accuracy
			);
		}
		return false;
	}

	/**
	 * Checks if given Point is orthogonal to this Point relative to same origin, i.e. (0, 0).
	 * @method isOrthogonalTo
	 * @param {Point} point The Point to check orthogonality with.
	 * @return <code>true</code> if other is Point is orthogonal to this one, <code>false </code> otherwise.
	 */
	isOrthogonalTo(point) {
		const dotproduct = this.dotProduct(point);
		return dotproduct === 0 || Math.abs(dotproduct) < 0.01;
		// TODO accuracy...
	}

	/**
	 * Checks if given Point is parallel to this Point relative to same origin, i.e. (0, 0).
	 * @method isParallelTo
	 * @param {Point} point The Point to check parallelism with.
	 * @return <code>true</code> if other is Point is parallel to this one, <code>false </code> otherwise.
	 */
	isParallelTo(point) {
		const denominator = point.y * this.x - point.x * this.y;
		return denominator === 0 || Math.abs(denominator) < 0.01;
		// TODO accuracy...
	}

	/**
	 * Returns a string representation of this point: (x,y)
	 * @method toString
	 * @return {String}
	 */
	toString() {
		return `(${this.x.toFixed(2)},${this.y.toFixed(2)})`;
	}

	/**
	 * Save the point.
	 * @method save
	 * @param {String} name Name of created object.
	 * @param {Writer} writer Writer object to save to.
	 */
	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeAttributeNumber('x', this.x, 2);
		writer.writeAttributeNumber('y', this.y, 2);
		writer.writeEndElement();
	}

	/**
	 * Read the point.
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 */
	read(reader, object) {
		this.x = Number(reader.getAttribute(object, 'x'));
		this.y = Number(reader.getAttribute(object, 'y'));
	}
}

class PointCache {
	constructor(size, maxsize) {
		this.points = [];
		this.size = size;
		this.maxsize = maxsize;

		let i;

		for (i = 0; i < size; i += 1) {
			this.points.push(new Point(0, 0));
		}
	}

	get(x, y, bulk) {
		let i;
		let p;

		for (i = 0; i < this.size; i += 1) {
			p = this.points[i];
			if (!p.__used && !p.__usedBulk) {
				if (bulk) {
					p.__usedBulk = true;
				} else {
					p.__used = true;
				}
				if (x !== undefined && y !== undefined) {
					p.set(x, y);
				}
				return p;
			}
		}
		p = new Point(0, 0);
		if (this.size < this.maxsize) {
			// add to cache...
			if (bulk) {
				p.__usedBulk = true;
			} else {
				p.__used = true;
			}
			this.points.push(p);
			this.size = this.points.length;
		} else {
			JSG.debug.log(
				`exceed maxsize (${this.maxsize}) of point cache!!`,
				JSG.debug.LOG_CACHE_WARNINGS
			);
		}

		if (x !== undefined && y !== undefined) {
			p.set(x, y);
		}
		return p;
	}

	releaseBulk() {
		let i;
		let p;

		for (i = 0; i < this.size; i += 1) {
			p = this.points[i];
			if (p && p.__usedBulk) {
				p.__usedBulk = undefined;
			}
		}
	}

	// either pass point(s) to release or an array which contains the point(s) to release...
	release(...args) {
		let n = args.length;
		let i;
		let pt;

		if (n === 1 && Array.isArray(args[0])) {
			[args] = args;
			n = args.length;
		}

		for (i = 0; i < n; i += 1) {
			pt = args[i];
			if (pt) {
				if (pt.__used) {
					pt.__used = undefined;
				}
				if (pt.__usedBulk) {
					pt.__usedBulk = undefined;
				}
			}
		}
	}

	/**
	 * Returns the number of cached Points which are currently marked as used.<br/>
	 * For debugging purpose.
	 *
	 * @method inUse
	 * @return {Number} Number of cached Points which are currently marked as used.
	 */
	inUse() {
		let cnt = 0;
		let i;
		let p;

		for (i = 0; i < this.size; i += 1) {
			p = this.points[i];
			if (p.__used || p.__usedBulk) {
				cnt += 1;
			}
		}
		return cnt;
	}
}

JSG.ptCache = new PointCache(20, 50);

module.exports = Point;
