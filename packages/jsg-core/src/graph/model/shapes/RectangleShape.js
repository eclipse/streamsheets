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
const Shape = require('./Shape');

/**
 * A rectangle shape definition consisting of 4 {{#crossLink "Coordinate"}}{{/crossLink}}s.
 *
 * @class RectangleShape
 * @constructor
 * @extends Shape
 */
class RectangleShape extends Shape {
	constructor() {
		super();

		this._coordpointlist.keepPoints(4);
		const pts = this._coordpointlist.getPoints();
		pts[0].x = 0;
		pts[0].y = 0;

		pts[1].y = 0;

		pts[3].y = 0;
	}

	getType() {
		return RectangleShape.TYPE;
	}

	newInstance() {
		return new RectangleShape();
	}

	/**
	 * Intentionally does nothing as rectangle must have exactly 4 coordinates.
	 *
	 * @method addCoordinate
	 * @param {Coordinate} coordinate New coordinate.
	 */
	addCoordinate(coordinate) {
		// overwritten because a rectangle always has only 4 points
	}

	/**
	 * Intentionally does nothing as rectangle must have exactly 4 coordinates.
	 *
	 * @method insertCoordinatesAt
	 * @param {Number} index Index of coordinate to insert before.
	 * @param {Coordinate} coordinate New coordinate.
	 */
	insertCoordinatesAt(index, coordinates) {
		// overwritten because a rectangle always has only 4 points
	}

	/**
	 * Intentionally does nothing as rectangle must have exactly 4 coordinates.
	 *
	 * @method removeCoordinateAt
	 * @param {Number} index Index of coordinate to remove.
	 */
	removeCoordinateAt(index) {
		// overwritten because a rectangle always has only 4 points
	}

	/**
	 * Set rectangle coordinates.
	 *
	 * @method setCoordinates
	 * @param {Coordinate[]} coordinates New coordinates of the rectangle. The array must contain exactly 4
	 *     coordinates.
	 */
	setCoordinates(coordinates) {
		if (coordinates.length === 4) {
			super.setCoordinates(coordinates);
		}
	}

	refresh() {
		if (this._item === undefined) {
			return;
		}
		const pts = this._coordpointlist.getPoints();
		pts[1].x = this._item.getWidth().getValue();
		pts[2].x = pts[1].x;
		pts[2].y = this._item.getHeight().getValue();
		pts[3].y = pts[2].y;
	}

	/**
	 * Type string for rectangle shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'rectangle';
	}
}

module.exports = RectangleShape;
