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
const JSG = require('../../../JSG');
const LineShape = require('./LineShape');
const Arrays = require('../../../commons/Arrays');
const PointList = require('../../../geometry/PointList');
const BezierCoordinate = require('../../BezierCoordinate');
const CoordinateProxy = require('../../CoordinateProxy');
const ShapeEvent = require('../events/ShapeEvent');
const BezierShape = require('../shapes/BezierShape');

/**
 * A <code>LineShape</code> subclass to use for cubic-bezier-like {{#crossLink
 * "LineConnection"}}{{/crossLink}}s. The line points are given by {{#crossLink
 * "BezierCoordinate"}}{{/crossLink}}s to manage corresponding bezier control points.<br/> Refer to
 * {{#crossLink "CreateBezierEdgeInteraction"}}{{/crossLink}} as an example of how to create an
 * {{#crossLink "Edge"}}{{/crossLink}} with a <code>BezierLineShape</code>.
 *
 * @class BezierLineShape
 * @extends LineShape
 * @constructor
 * @since 1.6.15
 */
class BezierLineShape extends LineShape {
	constructor() {
		super();

		Arrays.removeAll(this._coordinates);
		this._coordinates.push(new BezierCoordinate());
		this._coordinates.push(new BezierCoordinate());

		this.reuselist = new PointList();
		this.cpToList = new PointList();
		this.cpFromList = new PointList();
	}

	// overwritten
	getType() {
		return BezierLineShape.TYPE;
	}

	// overwritten
	newInstance() {
		return new BezierLineShape();
	}

	// overwritten
	_readCoordinate(reader, object) {
		return BezierCoordinate.fromObject(reader, object);
	}

	getBoundingBox(reusebox) {
		const pointList = BezierShape.interpolateCurve(this, this.reuselist);
		return pointList.getBoundingBox(reusebox);
	}

	// overwritten
	containsPoint(point, findFlag, threshold) {
		if (point) {
			const closed = this._item.isClosed();
			const pointList = BezierShape.interpolateCurve(this, this.reuselist);
			return pointList.distance(point, closed) < threshold;
		}
		return false;
	}

	// overwritten
	addCoordinate(coordinate) {
		if (!(coordinate instanceof BezierCoordinate)) {
			coordinate = BezierCoordinate.fromCoordinate(coordinate);
		}
		super.addCoordinate(coordinate);
	}

	// overwritten
	_replaceCoordinateAt(index, coordinate) {
		// we wrap coordinate:
		if (!(coordinate instanceof BezierCoordinate)) {
			coordinate = this._toBezier(coordinate, this.getCoordinateAt(index));
		}
		return super._replaceCoordinateAt(index, coordinate);
	}

	/**
	 * Checks the type of given <code>Coordinate</code> and creates a new <code>BezierCoordinate</code> instance if
	 * required.
	 *
	 * @method _toBezier
	 * @param {Coordinate} coordinate    The <code>Coordinate</code> to check.
	 * @param {BezierCoordinate} oldbeziercoord A <code>BezierCoordinate</code> instance to use for
	 *     initialization.
	 * @return {BezierCoordinate} A new <code>BezierCoordinate</code> instance.
	 * @private
	 */
	_toBezier(coordinate, oldbeziercoord) {
		const beziercoord = BezierCoordinate.fromCoordinate(coordinate);
		beziercoord.cpTo.setTo(oldbeziercoord.cpTo);
		beziercoord.cpFrom.setTo(oldbeziercoord.cpFrom);
		if (coordinate instanceof CoordinateProxy) {
			const wrapped = coordinate.getCoordinate();
			beziercoord.cpTo.setTo(wrapped.cpTo || beziercoord.cpTo);
			beziercoord.cpFrom.setTo(wrapped.cpFrom || beziercoord.cpFrom);
		}
		return beziercoord;
	}

	// overwritten
	keepCoordinates(count) {
		super.keepCoordinates(count);
		// check if we have BezierCoordinates only...
		const coords = this._coordinates;
		coords.forEach((coord, i) => {
			if (!(coord instanceof BezierCoordinate)) {
				coords[i] = BezierCoordinate.fromCoordinate(coord);
			}
		});
	}

	// overwritten
	_fillPointList(list, coordinates) {
		super._fillPointList(list, coordinates);
		// fill control points lists:
		const tmppoint = JSG.ptCache.get();

		this.cpToList.keepPoints(this._coordinates.length);
		this.cpFromList.keepPoints(this._coordinates.length);

		this._coordinates.forEach((coord, i) => {
			this.cpToList.setPointAtTo(i, coord.cpTo.toPoint(tmppoint));
			this.cpFromList.setPointAtTo(i, coord.cpFrom.toPoint(tmppoint));
		});
		JSG.ptCache.release(tmppoint);
	}

	// overwritten
	_initShapeEvent(event, ...args) {
		// fill event info:
		switch (event.detailId) {
			case ShapeEvent.COORD_ADD_CPTO:
			case ShapeEvent.COORD_ADD_CPFROM:
			case ShapeEvent.COORDS_SET_CPTO:
			case ShapeEvent.COORDS_SET_CPFROM:
				event.value = args[0];
				break;
			default:
				super._initShapeEvent(event);
		}
	}

	/**
	 * Returns the internally used <code>PointList</code> which manages calculated first control points.
	 *
	 * @method getCpToPointList
	 * @return {PointList} The <code>PointList</code> which manages calculated first control points.
	 */
	getCpToPointList() {
		return this.cpToList;
	}

	/**
	 * Returns direct access to calculated first control points.
	 *
	 * @method getCpToPoints
	 * @return {Points[]} The <code>Point</code> list of calculated first control points.
	 */
	getCpToPoints() {
		return this.cpToList.getPoints();
	}

	/**
	 * Returns direct access to the coordinate of first control point at specified index.
	 *
	 * @method getCpToCoordAt
	 * @param {Number} index Index of the control point to get the coordinate for.
	 * @return {BezierCoordinate} The control point coordinate for specified index.
	 */
	getCpToCoordAt(index) {
		return this._coordinates[index].cpTo;
	}

	/**
	 * Returns direct access to the coordinates of all first control points.
	 *
	 * @method getCpToCoordinates
	 * @return {Array} A list of {{#crossLink "BezierCoordinate"}}{{/crossLink}}s which represents first
	 *     control points.
	 */
	getCpToCoordinates() {
		const toCoords = [];

		this._coordinates.forEach((coord, i) => {
			toCoords[i] = coord.cpTo;
		});
		return toCoords;
	}

	/**
	 * Sets the coordinate of first control point at specified index.
	 *
	 * @method setCpToCoordAtTo
	 * @param {Number} index Index of the control point to set the coordinate of.
	 * @param {BezierCoordinate} coord The new coordinate to use for specified control point.
	 */
	setCpToCoordAtTo(index, coord) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPTO);
		if (event.doIt) {
			const pt = coord.toPoint(JSG.ptCache.get());
			this._coordinates[index].cpTo.setTo(coord);
			this.cpToList.setPointAtTo(index, pt);
			JSG.ptCache.release(pt);
			this._shapeDidChange(event);
		}
	}

	/**
	 * Sets the coordinates of all first control points.
	 *
	 * @method setCpToCoordinates
	 * @param {Array} cpcoords A list of {{#crossLink "BezierCoordinate"}}{{/crossLink}}s to use for first
	 *     control points.
	 */
	setCpToCoordinates(cpcoords) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPTO);
		if (event.doIt) {
			let cpcoord;
			const pt = JSG.ptCache.get();

			this._coordinates.forEach((coord, i) => {
				cpcoord = cpcoords[i];
				coord.cpTo.setTo(cpcoord);
				this.cpToList.setPointAtTo(i, cpcoord.toPoint(pt));
			});
			JSG.ptCache.release(pt);
			this._shapeDidChange(event);
		}
	}

	/**
	 * Returns the internally used <code>PointList</code> which manages calculated second control points.
	 *
	 * @method getCpFromPointList
	 * @return {PointList} The <code>PointList</code> which manages calculated second control points.
	 */
	getCpFromPointList() {
		return this.cpFromList;
	}

	/**
	 * Returns direct access to calculated second control points.
	 *
	 * @method getCpFromPoints
	 * @return {Points[]} The <code>Point</code> list of calculated second control points.
	 */
	getCpFromPoints() {
		return this.cpFromList.getPoints();
	}

	/**
	 * Returns direct access to the coordinate of second control point at specified index.
	 *
	 * @method getCpSecondCoordAt
	 * @param {Number} index Index of the control point to get the coordinate for.
	 * @return {BezierCoordinate} The control point coordinate for specified index.
	 */
	getCpFromCoordAt(index) {
		return this._coordinates[index].cpFrom;
	}

	/**
	 * Returns direct access to the coordinates of all second control points.
	 *
	 * @method getCpFromCoordinates
	 * @return {Array} A list of {{#crossLink "BezierCoordinate"}}{{/crossLink}}s which represents second
	 *     control points.
	 */
	getCpFromCoordinates() {
		const fromCoords = [];

		this._coordinates.forEach((coord, i) => {
			fromCoords[i] = coord.cpFrom;
		});

		return fromCoords;
	}

	/**
	 * Sets the coordinate of second control point at specified index.
	 *
	 * @method setCpFromCoordAtTo
	 * @param {Number} index Index of the control point to set the coordinate of.
	 * @param {BezierCoordinate} coord The new coordinate to use for specified control point.
	 */
	setCpFromCoordAtTo(index, coord) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPFROM);
		if (event.doIt) {
			const pt = coord.toPoint(JSG.ptCache.get());
			this._coordinates[index].cpFrom.setTo(coord);
			this.cpFromList.setPointAtTo(index, pt);
			JSG.ptCache.release(pt);
			this._shapeDidChange(event);
		}
	}

	/**
	 * Sets the coordinates of all second control points.
	 *
	 * @method setCpFromCoordinates
	 * @param {Array} cpcoords A list of {{#crossLink "BezierCoordinate"}}{{/crossLink}}s to use for second
	 *     control points.
	 */
	setCpFromCoordinates(cpcoords) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPFROM);
		if (event.doIt) {
			let cpcoord;
			const pt = JSG.ptCache.get();

			this._coordinates.forEach((coord, i) => {
				cpcoord = cpcoords[i];
				coord.cpFrom.setTo(cpcoord);
				this.cpFromList.setPointAtTo(i, cpcoord.toPoint(pt));
			});

			JSG.ptCache.release(pt);
			this._shapeDidChange(event);
		}
	}

	/**
	 * Type string for a bezier line shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'bezierline';
	}
}

module.exports = BezierLineShape;
