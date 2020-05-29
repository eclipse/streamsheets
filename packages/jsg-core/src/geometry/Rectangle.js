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
const Point = require('./Point');
const Arrays = require('../commons/Arrays');

/**
 * The Rectangle class describes a 2D rectangle. Rectangles are used to describe a rectangular area within the
 * coordinate space.
 *
 * @example
 *     var rect = new Rectangle(20, 20, 200, 200);
 *     var pt = new Point(50, 70);
 *
 *     if (rect.containsPoint(pt)) {
 *         // do something
 *     }
 *
 * @class Rectangle
 * @constructor
 * @param {Number} x X Coordinate of the rectangle.
 * @param {Number} y Y Coordinate of the rectangle.
 * @param {Number} width Width of the rectangle.
 * @param {Number} height Height of the rectangle.
 */
class Rectangle {
	constructor(x, y, width, height) {
		/**
		 * X-Coordinate of the rectangle.
		 * @property {Number} [x=0]
		 */
		this.x = x;
		/**
		 * Y-Coordinate of the rectangle.
		 * @property {Number} [y=0]
		 */
		this.y = y;
		/**
		 * Width of the rectangle.
		 * @property {Number} [width=0]
		 */
		this.width = width;
		/**
		 * Height of the rectangle.
		 * @property {Number} [height=0]
		 */
		this.height = height;
		// rcnt++;
		// console.log('rects: ' + rcnt);
	}

	static Factory() {
		return new Rectangle(0, 0, 0, 0);
	}

	/**
	 * Resets this Rectangle, i.e. sets all values to 0.
	 * Calling this method is equal to calling <code>set(0, 0, 0, 0)</code>.
	 *
	 * @method reset
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	reset() {
		this.set(0, 0, 0, 0);
		return this;
	}

	/**
	 * Set rectangle coordinates.
	 *
	 * @method set
	 * @param {Number} x X Coordinate of the rectangle.
	 * @param {Number} y Y Coordinate of the rectangle.
	 * @param {Number} width Width of the rectangle.
	 * @param {Number} height Height of the rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	set(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		return this;
	}

	/**
	 * Set rectangle coordinates using a {@link Rectangle} obect.
	 *
	 * @method setTo
	 * @param rect
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	setTo(rect) {
		return this.set(rect.x, rect.y, rect.width, rect.height);
	}

	/**
	 * Sets rectangle width and height.
	 *
	 * @method setSize
	 * @param {Number} width Width of the rectangle.
	 * @param {Number} height Height of the rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	setSize(width, height) {
		this.width = width;
		this.height = height;
		return this;
	}

	/**
	 * Returns the current location of this Rectangle as point.
	 *
	 * @method getLocation
	 * @param {Point} [reusepoint] An optional point to reuse.
	 * @return {Point} The location point.
	 */
	getLocation(reusepoint) {
		const location =
			reusepoint !== undefined ? reusepoint : new Point(0, 0);
		location.set(this.x, this.y);
		return location;
	}

	/**
	 * Sets the location of this Rectangle, i.e. its x and y values, to the specified point.
	 *
	 * @method setLocationTo
	 * @param {Point} point The new location point.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	setLocationTo(point) {
		return this.setLocation(point.x, point.y);
	}

	/**
	 * Sets the x and y values of this Rectangle to the specified values.
	 *
	 * @method setLocation
	 * @param {Number} x The new x coordinate of this Rectangle.
	 * @param {Number} y The new y coordinate of this Rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	setLocation(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	/**
	 * Compares the coordinates of the rectangle.
	 *
	 * @method isEqualTo
	 * @param rect Rectangle to compare coordinates with.
	 * @param {Number} [accuracy] Optional tolerance for comparison.
	 * @return {Boolean}True, if rectangle coordinates are equal, otherwise false.
	 */
	isEqualTo(rect, accuracy) {
		if (rect !== undefined) {
			if (accuracy === undefined) {
				return (
					this.x === rect.x &&
					this.y === rect.y &&
					this.width === rect.width &&
					this.height === rect.height
				);
			}
			return (
				Math.abs(this.x - rect.x) < accuracy &&
				Math.abs(this.y - rect.y) < accuracy &&
				Math.abs(this.width - rect.width) < accuracy &&
				Math.abs(this.height - rect.height) < accuracy
			);
			// return this.x == rect.x && this.y == rect.y && this.width == rect.width && this.height == rect.height;
		}
		return false;
	}

	/**
	 * Calculates the right coordinate of the rectangle.
	 *
	 * @method getRight
	 * @return {Number} Coordinate of right side.
	 */
	getRight() {
		return this.x + this.width;
	}

	/**
	 * Calculates the bottom coordinate of the rectangle.
	 *
	 * @method getBottom
	 * @return {Number} Coordinate of bottom side.
	 */
	getBottom() {
		return this.y + this.height;
	}

	/**
	 * Calculates the center point of the rectangle.
	 *
	 * @method getCenter
	 * @param {Point} reusepoint The point to reuse
	 * @return {Point} Resulting center point.
	 */
	getCenter(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		point.set(this.x + this.width / 2, this.y + this.height / 2);
		return point;
	}

	/**
	 * Calculates the horizontal center of the rectangle.
	 *
	 * @method getCenterX
	 * @return {Number} X-Coordinate of the center of the rectangle.
	 */
	getCenterX() {
		return this.x + this.width / 2;
	}

	/**
	 * Calculates the vertical center of the rectangle.
	 *
	 * @method getCenterY
	 * @return {Number} Y-Coordinate of the center of the rectangle.
	 */
	getCenterY() {
		return this.y + this.height / 2;
	}

	/**
	 * Copies the rectangle and returns a new rectangle.
	 *
	 * @method copy
	 * @return {Rectangle} Copy of this rectangle.
	 */
	copy() {
		const rect = new Rectangle(0, 0, 0, 0);
		rect.set(this.x, this.y, this.width, this.height);
		return rect;
	}

	/**
	 * Checks whether the given coordinates lie within the rectangle.
	 *
	 * @method contains
	 * @param {Number} x X-Coordinate to check for.
	 * @param {Number} y Y-Coordinate to check for.
	 * @param {Number} [width="undefined"] Width of coordinate space.
	 * @param {Number} [height="undefined"] Height of coordinate space.
	 * @return {Boolean}true, if coordinates lie within the rectangle, else false
	 */
	contains(x, y, width, height) {
		let inside =
			x >= this.x &&
			x <= this.x + this.width &&
			y >= this.y &&
			y <= this.y + this.height;
		if (width) {
			inside = inside && x + width <= this.x + this.width;
		}
		if (height) {
			inside = inside && y + height <= this.y + this.height;
		}
		return inside;
	}

	/**
	 * Checks whether the given point lies within the rectangle.
	 *
	 * @method containsPoint
	 * @param {Point}p Point to check for.
	 * @return {Boolean}true, if point lies within the rectangle, else false
	 */
	containsPoint(p) {
		return this.contains(p.x, p.y);
	}

	/**
	 * Checks whether the given rectangle lies within this rectangle.
	 *
	 * @method containsRect
	 * @param {Rectangle}rect Rectangle to check for.
	 * @return {Boolean}true, if rectangle completely lies within the rectangle, else false
	 */
	containsRect(rect) {
		return this.contains(rect.x, rect.y, rect.width, rect.height);
	}

	/**
	 * Evaluates if another rectangle intersects with this rectangle.
	 *
	 * @method intersect
	 * @param {Rectangle} rect Rectangle to evaluate.
	 * @return {Boolean} True, if rectangles intersect, otherwise false.
	 */
	intersect(rect) {
		return (
			this.x <= rect.getRight() &&
			rect.x <= this.getRight() &&
			this.y <= rect.getBottom() &&
			rect.y <= this.getBottom()
		);
	}

	/**
	 * Evaluates if a BoundingBox is completely contained in this rectangle.
	 *
	 * @method containsBBox
	 * @param {BoundingBox} bbox BoundingBox to check.
	 * @return {Boolean} True, if rectangle contains BoundingBox, otherwise false.
	 */
	containsBBox(bbox) {
		let result = true;
		const points = bbox.getPoints();

		Arrays.every(points, (point) => {
			result = this.containsPoint(point);
			return result;
		});
		return result;
	}

	/**
	 * Checks if at least one corner point of given <code>BoundingBox</code> intersects with this rectangle.
	 *
	 * @method intersectedByBBox
	 * @param {BoundingBox} bbox BoundingBox to check.
	 * @return {Boolean} <code>true</code> if at least one corner point intersects, <code>false</code> otherwise.
	 */
	intersectedByBBox(bbox) {
		let i;
		const pt = JSG.ptCache.get();
		let intersects = false;

		for (i = 0; i < 4; i += 1) {
			bbox.getCornerAt(i, pt);
			intersects = this.containsPoint(pt);
			if (intersects) {
				break;
			}
		}
		JSG.ptCache.release(pt);
		return intersects;
	}

	/**
	 * Combines this rectangle with the given rectangle to form the union of both rectangles.
	 *
	 * @method union
	 * @param {Rectangle}rect Rectangle to union with this rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	union(rect) {
		const right = Math.max(this.getRight(), rect.getRight());
		const bottom = Math.max(this.getBottom(), rect.getBottom());

		this.x = Math.min(this.x, rect.x);
		this.y = Math.min(this.y, rect.y);
		this.width = right - this.x;
		this.height = bottom - this.y;

		return this;
	}

	/**
	 * Calculates the intersection or the common rectangle area of this and another rectangle, if there is
	 * one, otherwise undefined.
	 *
	 * @method intersection
	 * @param {Rectangle} rect Result Rectangle, if existing.
	 * @param {Rectangle} [reuserect] A rectangle to reuse, if not supplied a new one will be created.
	 * @return {Rectangle} The intersection rectangle.
	 */
	intersection(rect, reuserect) {
		if (!this.intersect(rect)) {
			return undefined;
		}

		const r = reuserect || new Rectangle(0, 0, 0, 0);
		r.x = Math.max(this.x, rect.x);
		r.y = Math.max(this.y, rect.y);
		r.width = Math.min(this.getRight(), rect.getRight()) - r.x;
		r.height = Math.min(this.getBottom(), rect.getBottom()) - r.y;

		return r;
	}

	/**
	 * Combines this rectangle with the given rectangle to form the union of both rectangles, but only in horizontal
	 * direction.
	 *
	 * @method unionX
	 * @param {Rectangle}rect Rectangle to union with this rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	unionX(rect) {
		const right = Math.max(this.x + this.width, rect.x + rect.width);
		this.x = Math.min(this.x, rect.x);
		this.width = right - this.x;
		return this;
	}

	/**
	 * Combines this rectangle with the given rectangle to form the union of both rectangles, but only in vertical
	 * direction.
	 *
	 * @method unionY
	 * @param {Rectangle}rect Rectangle to union with this rectangle.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	unionY(rect) {
		const bottom = Math.max(this.y + this.height, rect.y + rect.height);
		this.y = Math.min(this.y, rect.y);
		this.height = bottom - this.y;
		return this;
	}

	/**
	 * Reduce the size of this rectangle by the given amount.
	 *
	 * @method reduceBy
	 * @param amount Amount to subtract from the rectangle dimensions
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	reduceBy(amount) {
		return this.expandBy(-amount);
	}

	/**
	 * Expand the size of this rectangle by the given amount.
	 *
	 * @method expandBy
	 * @param amount Amount to add to the rectangle dimensions
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	expandBy(amount) {
		this.x -= amount;
		this.y -= amount;
		this.width += 2 * amount;
		this.height += 2 * amount;
		return this;
	}

	/**
	 * Move the rectangle by the given coordinates.
	 *
	 * @method translate
	 * @param {Number}dx X-Coordinate to move the rectangle by.
	 * @param {Number}dy Y-Coordinate to move the rectangle by.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	translate(dx, dy) {
		this.x += dx;
		this.y += dy;
		return this;
	}

	/**
	 * Move the rectangle by the given point.
	 *
	 * @method translate
	 * @param {Point} p Point to move the rectangle by.
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	translatePoint(p) {
		this.x += p.x;
		this.y += p.y;
		return this;
	}

	/**
	 * Swaps this rectangle, i.e. its x and y values as well as its width and height values are switched.
	 *
	 * @method swap
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	swap() {
		let tmp = this.x;
		this.x = this.y;
		this.y = tmp;
		tmp = this.width;
		this.width = this.height;
		this.height = tmp;
		return this;
	}

	/**
	 * Sort the given rectangle coordinates
	 *
	 * @method sort
	 * @param rect
	 * @return {Rectangle} This rectangle to support method concatenation.
	 */
	sort(rect) {
		// TODO I would expect that the rectangle sorts its own data or another name for the function
		if (rect.width < 0) {
			this.x = rect.x + rect.width;
			this.width = Math.abs(rect.width);
		} else {
			this.x = rect.x;
			this.width = rect.width;
		}
		if (rect.height < 0) {
			this.y = rect.y + rect.height;
			this.height = Math.abs(rect.height);
		} else {
			this.y = rect.y;
			this.height = rect.height;
		}
		return this;
	}

	/**
	 * Convert rectangle to a string representation.
	 *
	 * @method toString
	 * @return {String} A string with the properties of the Rectangle.
	 */
	toString() {
		return `(${this.x},${this.y},${this.width},${this.height})`;
	}

	/**
	 * Converts rectangle to a BoundingBox object.
	 *
	 * @method toBoundingBox
	 * @param {BoundingBox} box A bounding box to reuse.
	 * @return {BoundingBox} The newly created BoundingBox or the provided <code>reusebox</code>.
	 */
	toBoundingBox(box) {
		if (box) {
			box.reset();
			box.setSize(this.width, this.height);
			box.translate(this.x, this.y);
			return box;
		}
		return undefined;
		// return BoundingBox.fromRectangle(this);
	}

	/**
	 * Get a polygon representation of the rectangle consisting of 4 points.
	 *
	 * @method getPoints
	 * @param {Array} reusepoints] an optional array of 4 {{#crossLink "Point"}}{{/crossLink}}s to reuse.
	 * @return {Array} Array with {{#crossLink "Point"}}{{/crossLink}}s.
	 */
	getPoints(reusepoints) {
		const points =
			reusepoints !== undefined
				? reusepoints
				: [
						new Point(0, 0),
						new Point(0, 0),
						new Point(0, 0),
						new Point(0, 0)
				  ];

		points[0].set(this.x, this.y);
		points[1].set(this.x + this.width, this.y);
		points[2].set(this.x + this.width, this.y + this.height);
		points[3].set(this.x, this.y + this.height);
		// points.push(new Point(this.x, this.y));

		return points;
	}

	/**
	 * Save the rectangle.
	 * @method save
	 * @param {String} name Name of object.
	 * @param {Writer} writer Writer object to save to.
	 */
	save(name, writer) {
		writer.writeStartElement(name);
		writer.writeAttributeNumber('x', this.x, 2);
		writer.writeAttributeNumber('y', this.y, 2);
		writer.writeAttributeNumber('width', this.width, 2);
		writer.writeAttributeNumber('height', this.height, 2);
		writer.writeEndElement();
	}

	/**
	 * Read rectangle.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 */
	read(reader, object) {
		this.x = Number(reader.getAttribute(object, 'x'));
		this.y = Number(reader.getAttribute(object, 'y'));
		this.width = Number(reader.getAttribute(object, 'width'));
		this.height = Number(reader.getAttribute(object, 'height'));
	}
}

//= =================================================================================================
// Rectangle Cache
//
class RectangleCache {
	constructor(size, maxsize) {
		this.rects = [];
		this.size = size;
		this.maxsize = maxsize;

		let i;

		for (i = 0; i < size; i += 1) {
			this.rects.push(new Rectangle(0, 0, 0, 0));
		}
	}

	get() {
		let i;
		let r;

		for (i = 0; i < this.size; i += 1) {
			r = this.rects[i];
			if (!r.__used) {
				r.reset();
				r.__used = true;
				return r;
			}
		}

		// increase cache:
		r = new Rectangle(0, 0, 0, 0);
		if (this.size < this.maxsize) {
			r.__used = true;
			this.rects.push(r);
			this.size = this.rects.length;
		} else {
			JSG.debug.log(
				`exceed maxsize (${this.maxsize}) of rectangle cache!!`,
				JSG.debug.LOG_CACHE_WARNINGS
			);
		}
		return r;
	}

	release(...args) {
		const n = args.length;
		let i;
		let r;

		for (i = 0; i < n; i += 1) {
			r = args[i];
			if (r && r.__used) {
				r.__used = undefined;
			}
		}
	}

	/**
	 * Returns the number of cached Rectangles which are currently marked as used.</br>
	 * For debugging purpose.
	 *
	 * @method inUse
	 * @return {Number} Number of cached Rectangles which are currently marked as used.
	 */
	inUse() {
		let cnt = 0;
		let i;
		let r;

		for (i = 0; i < this.size; i += 1) {
			r = this.rects[i];
			if (r.__used) {
				cnt += 1;
			}
		}
		return cnt;
	}
}

JSG.rectCache = new RectangleCache(10, 30);

module.exports = Rectangle;
