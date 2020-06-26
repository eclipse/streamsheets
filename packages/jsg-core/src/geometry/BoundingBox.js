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
const Rectangle = require('./Rectangle');
const Matrix = require('./Matrix');
const MathUtils = require('./MathUtils');
const Arrays = require('../commons/Arrays');
const Numbers = require('../commons/Numbers');

/**
 * Internal usage only! Shared between all instances, use with care!
 * @property tmppoints
 * @type {Array}
 * @private
 */
const tmppoints = [
	new Point(0, 0),
	new Point(0, 0),
	new Point(0, 0),
	new Point(0, 0)
];

/**
 * Describes the bounding rect of an item consisting of the top left corner and the bottom right corner. It
 * also includes a rotation matrix. If a rotation is set, the corner or points defined by the BoundingBox are
 * rotated upon retrieval.
 *
 * @example
 *     // create a rotated bounding rect
 *     var box = new BoundingBox(1000, 1000);
 *     box.setTopLeft(5000, 5000);
 *     box.rotate(Math.PI);
 *
 * @class BoundingBox
 * @constructor
 * Create a BoundingBox
 * @param {Number}width  Initial width of the BoundingBox.
 * @param {Number}height Initial height of the BoundingBox.
 */
class BoundingBox {
	constructor(width, height) {
		// our rotation matrix:
		this._rotmatrix = new Matrix();
		this._topleft = new Point(0, 0);
		this._bottomright = new Point(0, 0);
		// set given size
		this.setSize(width, height);
	}

	/**
	 * Save the bounding box.
	 *
	 * @method save
	 * @param {name} name Tag name to be used.
	 * @param {Writer} name Writer to use.
	 */
	save(name, writer) {
		writer.writeStartElement(name);

		writer.writeAttributeString('rotation', this._rotmatrix.toString());
		this._topleft.save('tl', writer);
		this._bottomright.save('rb', writer);

		writer.writeEndElement();
	}

	/**
	 * Read Bounding Box
	 *
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 */
	read(reader, object) {
		const rot = reader.getAttribute(object, 'rotation');
		if (rot !== undefined) {
			this._rotmatrix.setTo(Matrix.fromString(rot));
		}

		reader.iterateObjects(object, (name, subnode) => {
			switch (name) {
				case 'tl':
					this._topleft.read(reader, subnode);
					break;
				case 'rb':
					this._bottomright.read(reader, subnode);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Copy the bounding box.
	 *
	 * @method copy
	 * @return {BoundingBox} A copy of this BoundingBox.
	 */
	copy() {
		const copy = new BoundingBox(0, 0);
		copy.setTo(this);
		return copy;
	}

	/**
	 * Checks whether a BoundingBox contains a given point.
	 *
	 * @method containsPoint
	 * @param {Point} point Point to check.
	 * @return {Boolean} <code>true</code> if point is within this BoundingBox, otherwise <code>false</code>.
	 */
	containsPoint(point) {
		if (this._rotmatrix.hasRotation()) {
			const points = this.getPoints(tmppoints);
			return MathUtils.isPointInPolygon(points, point);
		}

		return (
			point.x >= this._topleft.x &&
			point.x <= this._bottomright.x &&
			point.y >= this._topleft.y &&
			point.y <= this._bottomright.y
		);
	}

	/**
	 * Checks if given BoundingBox is completely contained within this BoundingBox.
	 *
	 * @method containsBBox
	 * @param {BoundingBox} bbox BoundingBox to check.
	 * @return {Boolean} <code>true</code> if this BoundingBox contains given BoundingBox, otherwise <code>false</code>.
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
	 * Checks if this BoundingBox is equal to the given one. If an accuracy is given, there equality
	 * is only true, if the other values are within the interval of the tolerance.
	 *
	 * @method isEqualTo
	 * @param {BoundingBox} otherBox BoundingBox to check.
	 * @param {Number} [accuracy] Tolerance value for comparison.
	 * @return {Boolean} <code>true</code> if this BoundingBox is equal to given BoundingBox, otherwise
	 * <code>false</code>.
	 */
	isEqualTo(otherBox, accuracy) {
		if (!this._topleft.isEqualTo(otherBox._topleft, accuracy)) {
			return false;
		}

		if (!this._bottomright.isEqualTo(otherBox._bottomright, accuracy)) {
			return false;
		}

		if (!this._rotmatrix.isEqualTo(otherBox._rotmatrix)) {
			return false;
		}

		return true;
	}

	/**
	 * Expand the size of the BoundingBox.
	 *
	 * @method expandBy
	 * @param {Number} width Value to expand the width of the box by.
	 * @param {Number} [height] Value to expand the height of the box by. Optional, if height is not given,
	 * width and height are both expanded by the width
	 */
	expandBy(width, height) {
		height = height || width;

		if (this._rotmatrix.hasRotation()) {
			const newWidth = this.getWidth() + 2 * width;
			const newHeight = this.getHeight() + 2 * height;
			// move topleft:
			const delta = JSG.ptCache.get(-width, -height);
			this.rotateLocalPoint(delta);
			this._topleft.add(delta);
			JSG.ptCache.release(delta);
			// set new size:
			this.setSize(newWidth, newHeight);
		} else {
			this._topleft.x -= width;
			this._topleft.y -= height;
			this._bottomright.x += width * 2;
			this._bottomright.y += height * 2;
		}
	}

	/**
	 * Reduce the size of the BoundingBox
	 *
	 * @method reduceBy
	 * @param {Number} amount Value to reduce the size by.
	 */
	reduceBy(amount) {
		this.expandBy(-amount);
	}

	/**
	 * Retrieve the center of this BoundingBox, relative to its top left point and rotated by inner angle.
	 *
	 * @method getCenter
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @param {Boolean} [toParent] Set to <code>true</code> if center point should be relative to parent, i.e.
	 * top-left point is added.
	 * @return {Point} Center of the BoundingBox.
	 */
	getCenter(reusepoint, toParent) {
		const center = reusepoint || new Point(0, 0);
		center.set(this.getWidth() / 2, this.getHeight() / 2);
		this.rotateLocalPoint(center);
		return toParent === true ? center.add(this._topleft) : center;
	}

	/**
	 * Retrieve the top left corner of the BoundingBox.
	 *
	 * @method getTopLeft
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} Top left of the BoundingBox.
	 */
	getTopLeft(reusepoint) {
		const topleft = reusepoint || new Point(0, 0);
		topleft.setTo(this._topleft);
		return topleft;
	}

	/**
	 * Retrieve the unrotated left position of the BoundingBox.
	 *
	 * @method getLeft
	 * @return {Number} Left position of the BoundingBox.
	 */
	getLeft() {
		return this._topleft.x;
	}

	/**
	 * Retrieves the unrotated right position of the BoundingBox.
	 *
	 * @method getRight
	 * @return {Number} Right position of the BoundingBox.
	 */
	getRight() {
		return this._bottomright.x;
	}

	/**
	 * Retrieve the unrotated top position of the BoundingBox.
	 *
	 * @method getTop
	 * @return {Number} Top position of the BoundingBox.
	 */
	getTop() {
		return this._topleft.y;
	}

	/**
	 * Retrieves the unrotated bottom position of the BoundingBox.
	 *
	 * @method getBottom
	 * @return {Number} Top position of the BoundingBox.
	 */
	getBottom() {
		return this._bottomright.y;
	}

	/**
	 * Retrieve the bottom right corner of the BoundingBox.
	 *
	 * @method getBottomRight
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} Bottom right corner of the BoundingBox.
	 */
	getBottomRight(reusepoint) {
		const bottomright = reusepoint || new Point(0, 0);
		bottomright.setTo(this._bottomright);
		return this.rotatePoint(bottomright);
	}

	/**
	 * Retrieves the top right corner of this BoundingBox.
	 *
	 * @method getTopRight
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} Top right corner of this BoundingBox.
	 */
	getTopRight(reusepoint) {
		const topright = reusepoint || new Point(0, 0);
		topright.set(this._bottomright.x, this._topleft.y);
		return this.rotatePoint(topright);
	}

	/**
	 * Retrieves the bottom left corner of this BoundingBox.
	 *
	 * @method getBottomLeft
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} Bottom left corner of this BoundingBox.
	 */
	getBottomLeft(reusepoint) {
		const bottomleft = reusepoint || new Point(0, 0);
		bottomleft.set(this._topleft.x, this._bottomright.y);
		return this.rotatePoint(bottomleft);
	}

	getCornerAt(index, reusepoint) {
		// currently testing purpose => TODO REVIEW: usage & makes sense?
		// returns corner point at specified index, starting with 0 representing topleft
		// the returned point is given in parent coordinate system, i.e. it is already rotated...
		const point = reusepoint || new Point(0, 0);

		switch (index) {
			case 0:
				point.setTo(this._topleft);
				break;
			case 1:
				point.set(this._bottomright.x, this._topleft.y);
				break;
			case 2:
				point.setTo(this._bottomright);
				break;
			case 3:
				point.set(this._topleft.x, this._bottomright.y);
				break;
			default:
				break;
		}
		return this.rotatePoint(point);
	}

	/**
	 * Get width of the BoundingBox.</br>
	 * <b>Note:</b> the returned width might be negative!
	 *
	 * @method getWidth
	 * @return {Number} Width value.
	 */
	getWidth() {
		return this._bottomright.x - this._topleft.x;
	}

	/**
	 * Get height of the BoundingBox.
	 * <b>Note:</b> the returned height might be negative!
	 *
	 * @method getHeight
	 * @return {Number} Height value.
	 */
	getHeight() {
		return this._bottomright.y - this._topleft.y;
	}

	/**
	 * Get size of the BoundingBox.
	 *
	 * @method getSize
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} Size of the BoundingBox.
	 */
	getSize(reusepoint) {
		const size = reusepoint || new Point(0, 0);
		size.set(this.getWidth(), this.getHeight());
		return size;
	}

	/**
	 * Reset all values to 0.
	 *
	 * @method reset
	 */
	reset() {
		this._topleft.set(0, 0);
		this._bottomright.set(0, 0);
		this._rotmatrix.setAngle(0);
	}

	/**
	 * Define top left corner.
	 *
	 * @method setTopLeftTo
	 * @param {Point} point New top left corner of the BoundingBox.
	 */
	setTopLeftTo(point) {
		this.setTopLeft(point.x, point.y);
	}

	/**
	 * Set top left corner.
	 *
	 * @method setTopLeft
	 * @param {Number} x X Position of the top left corner.
	 * @param {Number} y Y Position of the top left corner.
	 */
	setTopLeft(x, y) {
		const width = this.getWidth();
		const height = this.getHeight();

		this._topleft.x = x;
		this._topleft.y = y;
		this._bottomright.x = x + width;
		this._bottomright.y = y + height;
	}

	/**
	 * Sets the bottom right corner of this bounding box to the given point.
	 *
	 * @method setBottomRightTo
	 * @param {Point} point The new bottom right location.
	 */
	setBottomRightTo(point) {
		this.setBottomRight(point.x, point.y);
	}

	/**
	 * Sets the bottom right corner of this bounding box to the location defined by given x and y values.
	 *
	 * @method setBottomRight
	 * @param {Number} x The x coordinate of new bottom right location.
	 * @param {Number} y The y coordinate of new bottom right location.
	 */
	setBottomRight(x, y) {
		this._bottomright.x = x;
		this._bottomright.y = y;
		this.rotatePointInverse(this._bottomright);
	}

	/**
	 * Set the size of the BoundingBox.
	 *
	 * @method setSizeTo
	 * @param {Point} point New size of the BoundingBox.
	 */
	setSizeTo(point) {
		this.setSize(point.x, point.y);
	}

	/**
	 * Set the size of the BoundingBox.
	 *
	 * @method setSize
	 * @param {Number} width New width.
	 * @param {Number} height New height.
	 */
	setSize(width, height) {
		this.setWidth(width);
		this.setHeight(height);
	}

	/**
	 * Set width.
	 *
	 * @method setWidth
	 * @param {Number} width New width of the BoundingBox.
	 */
	setWidth(width) {
		width = width || 0;
		this._bottomright.x = this._topleft.x + width;
	}

	/**
	 * Set top.
	 *
	 * @method setTop
	 * @param {Number} y New top or y position of the BoundingBox.
	 */
	setTop(y) {
		const height = this.getHeight();
		this._topleft.y = y;
		this.setHeight(height);
	}

	/**
	 * Set left position.
	 *
	 * @method setLeft
	 * @param {Number} x New left or x position of the BoundingBox.
	 */
	setLeft(x) {
		const width = this.getWidth();
		this._topleft.x = x;
		this.setWidth(width);
	}

	/**
	 * Set height.
	 *
	 * @method setHeight
	 * @param {Number} height New height of the BoundingBox.
	 */
	setHeight(height) {
		height = height || 0;
		this._bottomright.y = this._topleft.y + height;
	}

	/**
	 * Assign the values of another BoundingBox to this BoundingBox.
	 *
	 * @method setTo
	 * @param {BoundingBox} bbox Bounding box to retrieve values from.
	 * @return {BoundingBox} This box.
	 */
	setTo(bbox) {
		this._topleft.setTo(bbox._topleft);
		this._bottomright.setTo(bbox._bottomright);
		this._rotmatrix.setTo(bbox._rotmatrix);
		return this;
	}

	/**
	 * Rotates BoundingBox around its origin, i.e. its top left coordinate.
	 *
	 * @method rotate
	 * @param {Number} angle Angle in radians.
	 */
	rotate(angle) {
		this._rotmatrix.rotate(angle);
	}

	/**
	 * Rotate Bounding Box around given point.
	 *
	 * @method rotateAroundPoint
	 * @param {Point} point Point to rotate around.
	 * @param {Number} angle Angle to rotate by in radians.
	 */
	rotateAroundPoint(point, angle) {
		if (!this._rotmatrix.hasRotation()) {
			return;
		}

		// first rotate location
		this.setTopLeftTo(
			MathUtils.getRotatedPoint(this._topleft, point, angle)
		);
		this.rotate(angle);
	}

	/**
	 * Retrieve current BoundingBox angle in Radians
	 *
	 * @method getAngle
	 * @return {Number} Angle in radiant
	 */
	getAngle() {
		return this._rotmatrix.getAngle();
	}

	/**
	 * Set the angle of the BoundingBox.
	 *
	 * @method setAngle
	 * @param {Number} angle Angle in radians.
	 */
	setAngle(angle) {
		this._rotmatrix.setAngle(angle);
	}

	/**
	 * Retrieves the current rotation matrix.
	 *
	 * @method getRotationMatrix
	 * @return {Matrix} Current matrix.
	 */
	getRotationMatrix() {
		return this._rotmatrix;
	}

	/**
	 * Define new rotation matrix.
	 *
	 * @method setRotationMatrixTo
	 * @param {Matrix} matrix New rotation matrix.
	 */
	setRotationMatrixTo(matrix) {
		this._rotmatrix.setTo(matrix);
	}

	/**
	 * Move BoundingBox to a new position.
	 *
	 * @method translateTo
	 * @param {Point} point Offset to move the BoundingBox by.
	 */
	translateTo(point) {
		this.translate(point.x, point.y);
	}

	/**
	 * Move BoundingBox to a new position.
	 *
	 * @method translate
	 * @param {Number} x X value to move.
	 * @param {Number} y Y value to move.
	 */
	translate(dX, dY) {
		this._topleft.translate(dX, dY);
		this._bottomright.translate(dX, dY);
	}

	toRectangle(reuserect) {
		// TODO (ah) remove it! - review usage!! since we can be rotated this seems not very useful
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		rect.set(
			this._topleft.x,
			this._topleft.y,
			this.getWidth(),
			this.getHeight()
		);
		return rect;
	}

	/**
	 * Get the bounding rectangle of the rotated BoundingBox.
	 *
	 * @method getBoundingRectangle
	 * @param {Rectangle} reuserect Rectangle, that can be used as the return value to avoid new
	 * allocation.
	 * @return {Rectangle} Bounding rectangle of the rotated bounding box.
	 */
	getBoundingRectangle(reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);

		if (this._rotmatrix.hasRotation()) {
			const points = this.getPoints(tmppoints);

			if (points.length === 0) {
				return rect;
			}

			let xMax = points[0].x;
			let yMax = points[0].y;
			rect.x = xMax;
			rect.y = yMax;

			points.forEach((point) => {
				rect.x = Math.min(rect.x, point.x);
				rect.y = Math.min(rect.y, point.y);
				xMax = Math.max(xMax, point.x);
				yMax = Math.max(yMax, point.y);
			});

			rect.width = xMax - rect.x;
			rect.height = yMax - rect.y;
		} else {
			rect.x = this._topleft.x;
			rect.y = this._topleft.y;
			rect.width = this.getWidth();
			rect.height = this.getHeight();
		}

		return rect;
	}

	/**
	 * Sets the bounding rectangle of this <code>BoundingBox</code>.<br/>
	 * This is the opposite of the {{#crossLink "BoundingBox/getBoundingRectangle:method"}}{{/crossLink}}
	 * function and will arrange the <code>BoundingBox</code> points so that a call to <code>getBoundingRectangle</code>
	 * will return specified rectangle.<br/>
	 * <b>Note:</b> this may lead to an unexpected <code>BoundingBox</code> of different size, position and angle.
	 * Use carefully.
	 *
	 * @method setBoundingRectangle
	 * @param {Rectangle} rect A <code>Rectangle</code> which determines the location of internal points of
	 * this <code>BoundingBox</code>.
	 * @since 1.6.44
	 */
	setBoundingRectangle(rect) {
		// relative to newrect.x,y
		function newPos(pt, oldrect, newrect) {
			const facX = (pt.x - oldrect.x) / oldrect.width;
			const facY = (pt.y - oldrect.y) / oldrect.height;
			pt.x = facX * newrect.width;
			pt.y = facY * newrect.height;
			return pt;
		}

		function getIndexOfTopPoint(points) {
			let minY = points[0].y;
			let index = 0;

			for (let i = 1; i < 4; i += 1) {
				if (points[i].y < minY) {
					minY = points[i].y;
					index = i;
				}
			}
			return index;
		}

		// first we check special cases
		const accuracy = 0.00001;
		const rotangle = this.getAngle();
		// rotangle is from -180 - 180!!
		if (Numbers.areEqual(rotangle, 0, accuracy)) {
			this.setAngle(0);
			this._topleft.set(rect.x, rect.y);
			this.setWidth(rect.width);
			this.setHeight(rect.height);
		} else if (Numbers.areEqual(Math.abs(rotangle), Math.PI, accuracy)) {
			this.setAngle(Math.PI); // +/-180
			this._topleft.set(rect.x + rect.width, rect.y + rect.height);
			this.setWidth(rect.width);
			this.setHeight(rect.height);
		} else if (Numbers.areEqual(rotangle, Math.PI_2, accuracy)) {
			this.setAngle(Math.PI_2); // 90
			this._topleft.set(rect.x + rect.width, rect.y);
			this.setWidth(rect.height);
			this.setHeight(rect.width);
		} else if (Numbers.areEqual(rotangle, -Math.PI_2, accuracy)) {
			this.setAngle(-Math.PI_2); // -90
			this._topleft.set(rect.x, rect.y + rect.height);
			this.setWidth(rect.height);
			this.setHeight(rect.width);
		} else {
			const points = this.getPoints(tmppoints);
			const oldrect = this.getBoundingRectangle(JSG.rectCache.get());
			const topIndex = getIndexOfTopPoint(points);
			// new top point:
			const p1 = newPos(points[topIndex], oldrect, rect);
			// point on opposite site:
			const p3 = points[(topIndex + 2) % 4];
			p3.set(rect.width - p1.x, rect.height);
			// p2&p4 are determined by a circle around the center of inner bbox...
			const center = JSG.ptCache
				.get()
				.setTo(p3)
				.subtract(p1)
				.multiply(0.5);
			const radius = Math.sqrt(center.x * center.x + center.y * center.y);
			// intersection of circle with right side:
			const rightX = rect.width / 2;
			let y = Math.sqrt(radius * radius - rightX * rightX);
			const p2 = points[(topIndex + 1) % 4];
			p2.set(rect.width, rect.height / 2 - y);
			// intersection of circle width left side:
			const leftX = -rightX;
			y = Math.sqrt(radius * radius - leftX * leftX);
			const p4 = points[(topIndex + 3) % 4];
			p4.set(rightX + leftX, rect.height / 2 + y);
			// all new points are relative to rect.x, rect.y!!!

			// rotate points around p1
			p2.subtract(p1);
			p3.subtract(p1);
			p4.subtract(p1);
			// angle between p1 & p2:
			const angle = Math.atan2(-p2.y, -p2.x) - Math.atan2(-p1.y, -p1.x);
			p2.rotate(-angle);
			p3.rotate(-angle);
			p4.rotate(-angle);

			this._topleft.set(rect.x + p1.x, rect.y + p1.y);
			this.setWidth(p2.x);
			this.setHeight(p3.y);
			this.setAngle(angle);

			JSG.ptCache.release(center);
			JSG.rectCache.release(oldrect);
			// TODO try to preserve original rotation/bias
			// which point defines new top-left?
			// var index = Math.abs((topIndex - 4) % 4);
			// switch(index) {
			//     case 0: //p1
			//         this._topleft.set();
			//         this.setWidth(p2.x);
			//         this.setHeight(p3.y);
			//         this.setAngle(angle);
			//         break;
			//     case 1: //p2
			//         this._topleft.set();
			//         this.setWidth(p2.x);
			//         this.setHeight(p3.y);
			//         this.setAngle(Math.PI_2 - angle);
			//         break;
			//     case 2: //p3
			//         this._topleft.set();
			//         this.setWidth(p2.x);
			//         this.setHeight(p3.y);
			//         this.setAngle(Math.PI - angle);
			//         break;
			//     case 3: //p4 -> 0 -  -90
			//         this._topleft.set();
			//         this.setWidth(p2.x);
			//         this.setHeight(p3.y);
			//         this.setAngle((3 * Math.PI_2) - angle);
			//         break;
			// }
		}
	}

	/**
	 * Retrieve a string representation of the BoundingBox
	 *
	 * @method toString
	 * @return {String} String with the location and dimensions of the box.
	 */
	toString() {
		const points = this.getPoints(tmppoints);
		return `{(${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}), 
			(${points[2].x.toFixed(2)},${points[2].y.toFixed(2)})}
			(${this.getWidth().toFixed(2)},
			${this.getHeight().toFixed(2)})`;
	}

	/**
	 * Retrieve a string representation of the BoundingBox
	 *
	 * @method toString
	 * @return {String} String with the corner if the BoundingBox.
	 */
	toPointsString() {
		const points = this.getPoints(tmppoints);
		return `(${points[0].toString()},${points[1].toString()},${points[2].toString()},${points[3].toString()})`;
	}

	/**
	 * Calculate the union of this BoundingBox and a given BoundingBox. The result will be saved in this BoundingBox
	 *
	 * @method union
	 * @param {BoundingBox} bbox BoundingBox to union this box with.
	 */
	union(bbox) {
		let minX = this._topleft.x;
		let minY = this._topleft.y;
		let maxX = this._bottomright.x;
		let maxY = this._bottomright.y;

		function adjustMinMax(point) {
			if (point.x < minX) {
				minX = point.x;
			} else if (point.x > maxX) {
				maxX = point.x;
			}
			if (point.y < minY) {
				minY = point.y;
			} else if (point.y > maxY) {
				maxY = point.y;
			}
		}

		bbox.rotateAroundPoint(this._topleft, -this.getAngle());
		bbox.getPoints(tmppoints).forEach(adjustMinMax);
		bbox.rotateAroundPoint(this._topleft, this.getAngle());

		const newtopleft = JSG.ptCache.get(minX, minY);
		this.rotatePoint(newtopleft);
		this._topleft.setTo(newtopleft);
		this.setSize(maxX - minX, maxY - minY);
		JSG.ptCache.release(newtopleft);
	}

	/**
	 * Extends this BoundingBox, if required, to enclose given list of
	 * {{#crossLink "Point"}}{{/crossLink}}s.<br/>
	 * The points must be given either as an array or simply as an enumeration of points.
	 *
	 * @method enclosePoints
	 * @param {Array|Point} points An array or enumeration of points to enclose.
	 */
	enclosePoints(...args) {
		let minX = this._topleft.x;
		let minY = this._topleft.y;
		let maxX = this._bottomright.x;
		let maxY = this._bottomright.y;

		const adjustMinMax = (point) => {
			if (point.x < minX) {
				minX = point.x;
			} else if (point.x > maxX) {
				maxX = point.x;
			}
			if (point.y < minY) {
				minY = point.y;
			} else if (point.y > maxY) {
				maxY = point.y;
			}
		};

		const extend = (x, y, w, h) => {
			const newtopleft = JSG.ptCache.get(x, y);
			this.rotatePoint(newtopleft);
			this._topleft.setTo(newtopleft);
			this.setSize(w, h);
			JSG.ptCache.release(newtopleft);
		};

		const tmppoint = JSG.ptCache.get();

		args = Array.isArray(args[0]) ? args[0] : args;

		args.forEach((point) => {
			tmppoint.setTo(point);
			this.rotatePointInverse(tmppoint);
			adjustMinMax(tmppoint);
		});

		JSG.ptCache.release(tmppoint);
		// finally:
		extend(minX, minY, maxX - minX, maxY - minY);
	}

	rotatePoint(point) {
		// TODO (ah) review usage of following rotatePoint functions, want to have only rotatePoint/rotatePointInverse
		if (!this._rotmatrix.hasRotation()) {
			return point;
		}

		point.subtract(this._topleft);
		point = this._rotmatrix.rotatePoint(point);

		return point.add(this._topleft);
	}

	rotatePointInverse(point) {
		if (!this._rotmatrix.hasRotation()) {
			return point;
		}

		point.subtract(this._topleft);
		point = this._rotmatrix.rotatePointInverse(point);
		return point.add(this._topleft);
	}

	rotateLocalPoint(point) {
		// rotates point relative to topleft point of this bbox:
		return this._rotmatrix.rotatePoint(point);
	}

	rotateLocalPointInverse(point) {
		return this._rotmatrix.rotatePointInverse(point);
	}

	getPoints(reusepointsarray) {
		// passed points array should consist of minimum 4 points...
		const points = this.getPointsUnrotated(reusepointsarray);

		if (this._rotmatrix.hasRotation()) {
			points.forEach((point) => {
				this.rotatePoint(point);
			});
		}

		return points;
	}

	getPointsUnrotated(reusepointsarray) {
		// passed points array should either be empty or consist of points...
		const points = reusepointsarray || [];

		function point(index) {
			if (index >= points.length) {
				points.push(new Point(0, 0));
			}
			return points[index];
		}

		point(0).setTo(this._topleft);
		point(1).set(this._bottomright.x, this._topleft.y);
		point(2).setTo(this._bottomright);
		point(3).set(this._topleft.x, this._bottomright.y);

		return points;
	}

	// TODO (ah) review usage and remove...
	transformPoint(point) {
		// translate & rotate...
		point.subtract(this._topleft);
		this.rotateLocalPointInverse(point);
	}

	/**
	 * @method determineSiblingCornersToPoint
	 * @param point
	 * @param corner1
	 * @param corner2
	 * @deprecated Subject to be removed without replacement!!
	 */
	determineSiblingCornersToPoint(point, corner1, corner2) {
		// TODO (ah) review usage...
		// after call passed corner points contain the left and right corner points...
		// TODO (ah) remove!! => can be replaced by getInteractionIndex and getCornerAt()!!
		let cornerIndex = 0;
		let minangle = -1;
		let maxangle = -1;

		const angleToCenter = (lpoint, lcenter) => {
			const angle = MathUtils.toDegrees(
				MathUtils.getAngleBetweenPoints(lcenter, lpoint)
			);
			return angle < 0 ? 360 + angle : angle;
		};

		const testCornerAt = (index, lpointangle) => {
			const angle = angleToCenter(this.getCornerAt(index, corner1));
			if (angle < lpointangle && angle > minangle) {
				minangle = angle;
				cornerIndex = index;
			}
			if (minangle === -1 && angle > maxangle) {
				cornerIndex = index;
				maxangle = angle;
			}
		};

		const topleft = this.getTopLeft();
		const center = this.getCenter().add(topleft);
		const pointangle = angleToCenter(point, center);

		testCornerAt(0, pointangle);
		testCornerAt(1, pointangle);
		testCornerAt(2, pointangle);
		testCornerAt(3, pointangle);

		this.getCornerAt(cornerIndex, corner1);
		this.getCornerAt((cornerIndex + 1) % 4, corner2);
	}

	/**
	 * Returns the intersection index of a line with this BoundingBox. The line is defined by given points.
	 * The index is clockwise and zero based, i.e. 0 refers to the site between top-left and top-right points.
	 * If no intersection can be determined -1 is returned. The intersection point itself can be retrieved by
	 * specifying the optional parameter <code>interpt</code>.</br>
	 * <b>Note.</b> the line direction is important, because the intersection point is only valid if
	 * it is in the same direction!
	 *
	 *
	 * @method getIntersectionIndex
	 * @param {Point} linepoint0 The line start point, relative to BoundingBox parent.
	 * @param {Point} linepoint1 The line end point, relative to BoundingBox parent.
	 * @param {Point} [interpt] An optional point which will be set to the intersection point.
	 * @return {Number} Zero based intersection index or -1 of line has no intersection with this BoundingBox.
	 */
	getIntersectionIndex(linepoint0, linepoint1, interpt) {
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		const intersection = JSG.ptCache.get();
		let index = -1;
		let i;

		for (i = 0; i < 4; i += 1) {
			this.getCornerAt(i, corner1);
			this.getCornerAt((i + 1) % 4, corner2);
			if (
				MathUtils.doLinesIntersect(
					linepoint0,
					linepoint1,
					corner1,
					corner2,
					intersection
				) &&
				MathUtils.isPointInDirectionOfLine(
					intersection,
					linepoint0,
					linepoint1
				) &&
				MathUtils.isPointOnLineSegment(intersection, corner1, corner2)
			) {
				index = i;
				break;
			}
		}
		if (interpt !== undefined) {
			interpt.setTo(intersection);
		}
		JSG.ptCache.release(corner1, corner2, intersection);

		return index;
	}

	/**
	 * Returns the intersection point of BoundingBox center to the segment specified by index.
	 *
	 * @method getOrthoFromCenterToIndex
	 * @param {Number} index The segment index as defined by
	 * {{#crossLink "BoundingBox/getIntersectionIndex:method"}}{{/crossLink}}.
	 * @param {Point} [reusepoint] Point allowed to be used as a return value. If provided no new Point
	 * needs to be allocated.
	 * @return {Point} The intersection point.
	 */
	getOrthoFromCenterToIndex(index, reusepoint) {
		let center = reusepoint || new Point();
		if (index > -1) {
			const corner1 = this.getCornerAt(index % 4, JSG.ptCache.get());
			const corner2 = this.getCornerAt(
				(index + 1) % 4,
				JSG.ptCache.get()
			);
			center = this.getCenter(center, true);
			MathUtils.getOrthogonalProjectionOfPoint(center, corner1, corner2);
			JSG.ptCache.release(corner1, corner2);
		}
		return center;
	}

	/**
	 * Checks if given line, specified by <code>linepoint0</code> and <code>linepoint1</code>, intersects
	 * this BoundingBox.
	 *
	 * @method isIntersectedByLine
	 * @param {Point} linepoint0 The line start point, relative to BoundingBox parent.
	 * @param {Point} linepoint1 The line end point, relative to BoundingBox parent.
	 * @return {Boolean} <code>true</code> if given line intersects this BoundingBox, <code>false</code> otherwise.
	 */
	isIntersectedByLine(linepoint0, linepoint1) {
		let intersected = false;
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		const interPt = JSG.ptCache.get();
		let i;

		for (i = 0; i < 4; i += 1) {
			this.getCornerAt(i, corner1);
			this.getCornerAt((i + 1) % 4, corner2);
			if (
				MathUtils.getIntersectionOfLines(
					linepoint0,
					linepoint1,
					corner1,
					corner2,
					interPt,
					true
				) &&
				MathUtils.isPointOnLineSegment(interPt, corner1, corner2)
			) {
				intersected = true;
				break;
			}
		}
		JSG.ptCache.release(corner1, corner2, interPt);
		return intersected;
	}

	/**
	 * Checks if this BoundingBox intersects with given one.
	 *
	 * @method doesIntersectWith
	 * @param {BoundingBox} bbox The BoundingBox to check intersection with.
	 * @return {Boolean} <code>true</code> if BoundingBoxes intersect, <code>false</code> otherwise.
	 */
	doesIntersectWith(bbox) {
		let doIntersect = false;

		if (bbox !== undefined) {
			const p0 = JSG.ptCache.get();
			const p1 = JSG.ptCache.get();
			const p2 = JSG.ptCache.get();
			const p3 = JSG.ptCache.get();
			// -1- line between each center points:
			const linestart = this.getCenter(p2).add(this._topleft);
			const lineend = bbox.getCenter(p3).add(bbox._topleft);
			const centerDistance = lineend
				.copy()
				.subtract(linestart)
				.length();
			// -2- intersection between center and bbox segment:
			if (
				this._getIntersectionPoint(linestart, lineend, p0) &&
				bbox._getIntersectionPoint(lineend, linestart, p1)
			) {
				// -3- sum of both length must be >= center distance...
				doIntersect =
					p0.subtract(linestart).length() +
						p1.subtract(lineend).length() >
					centerDistance;
			} else {
				doIntersect = true;
				// either center is within bounds of other the bbox...
			}
			JSG.ptCache.release(p0, p1, p2, p3);
		}
		return doIntersect;
	}

	// TODO merge with getIntersectionIndex!
	_getIntersectionPoint(linepoint0, linepoint1, reusepoint) {
		let interpt;
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		const intersection = reusepoint || new Point(0, 0);
		let i;

		for (i = 0; i < 4; i += 1) {
			this.getCornerAt(i, corner1);
			this.getCornerAt((i + 1) % 4, corner2);
			if (
				MathUtils.getIntersectionOfLines(
					linepoint0,
					linepoint1,
					corner1,
					corner2,
					intersection,
					false
				) &&
				MathUtils.isPointInDirectionOfLine(
					intersection,
					linepoint0,
					linepoint1
				)
			) {
				interpt = intersection;
				break;
			}
		}
		JSG.ptCache.release(corner1, corner2);
		return interpt;
	}

	/**
	 * Create a Bounding Box.
	 *
	 * @method Factory
	 * @return {BoundingBox} New BoundingBox
	 * @static
	 */
	static Factory() {
		return new BoundingBox(0, 0);
	}

	/**
	 * Create a bounding box from a given Rectangle.
	 *
	 * @method fromRectangle
	 * @param {Rectangle} rect Rectangle to use.
	 * @return {BoundingBox} New BoundingBox
	 * @static
	 */
	static fromRectangle(rect) {
		rect = rect || new Rectangle(0, 0, 0, 0);
		const bbox = new BoundingBox(rect.width, rect.height);
		bbox.translate(rect.x, rect.y);
		// JSG.debug.log(
		// 	`bbox#fromRectangle: ${rect.x},${rect.y},${rect.width},${
		// 		rect.height
		// 	}`
		// );
		// +x+","+y+","+width+","+height)
		return bbox;
	}
}

class BoundingBoxCache {
	constructor(size, maxsize) {
		let i;

		this.boxes = [];
		this.size = size;
		this.maxsize = maxsize;

		for (i = 0; i < size; i += 1) {
			this.boxes.push(new BoundingBox(0, 0));
		}
	}

	get() {
		let i;
		let b;

		for (i = 0; i < this.size; i += 1) {
			b = this.boxes[i];
			if (!b.__used) {
				b.reset();
				b.__used = true;
				return b;
			}
		}

		// increase cache:
		/* eslint-disable global-require */
		// const BoundingBox = require('./BoundingBox');
		/* eslint-ensable global-require */
		b = new BoundingBox(0, 0);
		if (this.size < this.maxsize) {
			b.__used = true;
			this.boxes.push(b);
			this.size = this.boxes.length;
		} else {
			JSG.debug.log(
				`exceed maxsize (${this.maxsize}) of bbox cache!!`,
				JSG.debug.LOG_CACHE_WARNINGS
			);
		}
		return b;
	}

	release(...args) {
		args.forEach((arg) => {
			if (arg && arg.__used) {
				arg.__used = undefined;
			}
		});
	}

	/**
	 * Returns the number of cached BoundingBoxes which are currently marked as used.</br>
	 * For debugging purpose.
	 *
	 * @method inUse
	 * @return {Number} Number of cached BoundingBoxes which are currently marked as used.
	 */
	inUse() {
		let cnt = 0;
		let i;
		let b;

		for (i = 0; i < this.size; i += 1) {
			b = this.boxes[i];
			if (b.__used) {
				cnt += 1;
			}
		}
		return cnt;
	}
}

JSG.boxCache = new BoundingBoxCache(10, 30);

module.exports = BoundingBox;
