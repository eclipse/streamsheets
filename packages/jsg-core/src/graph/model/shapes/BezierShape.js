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
const PolygonShape = require('./PolygonShape');
const PointList = require('../../../geometry/PointList');
const Point = require('../../../geometry/Point');
const Shape = require('./Shape');
const Coordinate = require('../../Coordinate');
const ItemAttributes = require('../../attr/ItemAttributes');
const FormatAttributes = require('../../attr/FormatAttributes');
const ShapeEvent = require('../events/ShapeEvent');

/**
 * A shape to use for bezier curves. A bezier shape has three sets of coordinates. One set defines the
 * bezier points, which are the points which are connected via curves. The shape of the curves are
 * defined by the two control points. Each bezier points has two corresponding control points. One to define
 * the curve coming from the previous bezier point and another one to influence the curve to the next
 * bezier point.
 *
 * @class BezierShape
 * @constructor
 * @extends Shape
 */
class BezierShape extends PolygonShape {
	constructor() {
		super();

		this._cpFromCoordinates = [];
		this._cpToCoordinates = [];

		// control point 1after/post last point)
		this._cpFromPoints = new PointList();
		// control point before this point)
		this._cpToPoints = new PointList();

		this._pie = false;
	}

	/**
	 * Interpolates the cubic bezier curve described by given {{#crossLink
	 * "BezierShape"}}{{/crossLink}} or {{#crossLink
	 * "BezierLineShape"}}{{/crossLink}}.<br/>
	 *
	 * @method interpolateCurve
	 * @param  {BezierShape|BezierLineShape} shape A
	 *     <code>BezierShape</code> object which provides curve points and
	 * @param  {PointList} [reuselist] An optional <code>PointList</code> to reuse. If not provided a new
	 *     one will be created.
	 * @return {PointList} A <code>PointList</code> which represents the interpolated bezier curve.
	 * @static
	 */
	static interpolateCurve(shape, reuselist) {
		function computeCubicBaseValue(t, a, b, c, d) {
			const mt = 1 - t;
			return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
		}

		function addXY(x, y, toPoints, index) {
			const newpt = toPoints[index] || new Point();
			newpt.set(x, y);
			toPoints[index] = newpt;
		}

		function addPoint(pt, toPoints, index) {
			addXY(pt.x, pt.y, toPoints, index);
		}

		const pointList = reuselist || new PointList();
		const points = shape.getPoints();
		const toPoints = shape.getCpToPoints();
		const fromPoints = shape.getCpFromPoints();

		// if (!toPoints || !fromPoints || toPoints.length === 0 || fromPoints.length === 0) {
		//     shape.initControlPoints(points);
		//     toPoints = shape.getCpToPoints();
		//     fromPoints = shape.getCpFromPoints();
		// }
		const closed = shape._item ? shape._item.isClosed() : false;
		let x;
		let y;
		const n = closed ? points.length : points.length - 1;
		let p2;
		let cp2To;
		let cp2From;
		let i;
		let t;
		let index = 0;
		const listpoints = pointList.getPoints();

		listpoints.length = 0;
		for (i = 0; i < n; i += 1) {
			if (i === points.length - 1) {
				[p2] = points;
				[cp2To] = toPoints;
				[cp2From] = fromPoints;
			} else {
				p2 = points[i + 1];
				cp2To = toPoints[i + 1];
				cp2From = fromPoints[i + 1];
			}

			// if bezier is a horizontal/vertical line
			if (
				Math.abs(points[i].x - toPoints[i].x) < 1 &&
				Math.abs(toPoints[i].x - cp2From.x) < 1 &&
				Math.abs(p2.x - cp2From.x) < 1
			) {
				addPoint(points[i], listpoints, index);
				index += 1;
				if (i === 0) {
					addPoint(p2, listpoints, index);
					index += 1;
				}
			} else if (
				Math.abs(points[i].y - toPoints[i].y) < 1 &&
				Math.abs(toPoints[i].y - cp2From.y) < 1 &&
				Math.abs(points[i].y - fromPoints[i].y) < 1
			) {
				addPoint(points[i], listpoints, index);
				index += 1;
				if (i === 0) {
					addPoint(p2, listpoints, index);
					index += 1;
				}
			} else {
				for (t = 0; t < 1.0; t += 1.0 / 10.0) {
					x = computeCubicBaseValue(t, points[i].x, toPoints[i].x, cp2From.x, p2.x);
					y = computeCubicBaseValue(t, points[i].y, toPoints[i].y, cp2From.y, p2.y);
					addXY(x, y, listpoints, index);
					index += 1;
				}
			}
		}
		pointList.setPoints(listpoints);
		return pointList;
	}

	getType() {
		return BezierShape.TYPE;
	}

	newInstance() {
		return new BezierShape();
	}

	copy() {
		const copy = this.newInstance();
		copy.setCoordinates(this._coordinates);
		copy.setCpFromCoordinates(this._cpFromCoordinates);
		copy.setCpToCoordinates(this._cpToCoordinates);
		copy._pie = this._pie;

		return copy;
	}

	/**
	 * Set the coordinates, that define the control points before the bezier points. The number
	 * of the coordinates must be equal to the number of bezier points.
	 *
	 * @method setCpFromCoordinates
	 * @param {Coordinate[]} coordinates New coordinates.
	 */
	setCpFromCoordinates(coordinates) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPFROM, coordinates);
		if (event.doIt === true) {
			const doEval = this._item !== undefined && !this._item._reading && !JSG.idUpdater.isActive;
			let i;
			this._cpFromCoordinates = [];
			for (i = 0; i < coordinates.length; i += 1) {
				const coord = coordinates[i].copy();
				if (doEval) {
					coord.evaluate(this._item);
				}
				this._cpFromCoordinates.push(coord);
			}
			this.refresh();
			// update cache...
			this._shapeDidChange(event);
		}
	}

	/**
	 * Set the coordinates, that define the control points after the bezier points. The number
	 * of the coordinates must be equal to the number of bezier points.
	 *
	 * @method setCpToCoordinates
	 * @param {Coordinate[]} coordinates New coordinates.
	 */
	setCpToCoordinates(coordinates) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_SET_CPTO, coordinates);
		if (event.doIt === true) {
			const doEval = this._item !== undefined && !this._item._reading && !JSG.idUpdater.isActive;
			let i;
			this._cpToCoordinates = [];
			for (i = 0; i < coordinates.length; i += 1) {
				const coord = coordinates[i].copy();
				if (doEval) {
					coord.evaluate(this._item);
				}
				this._cpToCoordinates.push(coord);
			}
			this.refresh();
			// update cache...
			this._shapeDidChange(event);
		}
	}

	evaluate() {
		super.evaluate();

		if (!this._item || this._item._reading || JSG.idUpdater.isActive) {
			return;
		}

		this._cpFromCoordinates.forEach((coor) => {
			coor.evaluate(this._item);
		});

		this._cpToCoordinates.forEach((coor) => {
			coor.evaluate(this._item);
		});
	}

	invalidateTerms() {
		this._coordinates.forEach((coor) => {
			coor.invalidateTerms();
		});
		this._cpFromCoordinates.forEach((coor) => {
			coor.invalidateTerms();
		});
		this._cpToCoordinates.forEach((coor) => {
			coor.invalidateTerms();
		});
	}

	/**
	 * Get access to the coordinates array, that define the control points before the bezier points.
	 *
	 * @method getCpFromCoordinates
	 * @return {Coordinate[]} coordinates Coordinates array.
	 */
	getCpFromCoordinates() {
		return this._cpFromCoordinates;
	}

	/**
	 * Get access to the coordinates array, that define the control points after the bezier points.
	 *
	 * @method getCpToCoordinates
	 * @return {Coordinate[]} coordinates Coordinates array.
	 */
	getCpToCoordinates() {
		return this._cpToCoordinates;
	}

	/**
	 * Append a new control point that defines the bezier curve after the corresponding bezier point.
	 *
	 * @method addCpFromCoordinate
	 * @param {Coordinate} coordinate New coordinate.
	 */
	addCpFromCoordinate(coordinate) {
		const event = this._shapeWillChange(ShapeEvent.COORD_ADD_CPFROM, coordinate);
		if (event.doIt === true) {
			this._cpFromCoordinates.push(coordinate);
			this._shapeDidChange(event);
		}
	}

	/**
	 * Append a new control point that defines the bezier curve before the corresponding bezier point.
	 *
	 * @method addCpFromCoordinate
	 * @param {Coordinate} coordinate New coordinate.
	 */
	addCpToCoordinate(coordinate) {
		const event = this._shapeWillChange(ShapeEvent.COORD_ADD_CPTO, coordinate);
		if (event.doIt === true) {
			this._cpToCoordinates.push(coordinate);
			this._shapeDidChange(event);
		}
	}

	_initShapeEvent(event, ...args) {
		// fill event info:
		switch (event.detailId) {
			case ShapeEvent.COORD_ADD_CPTO:
			case ShapeEvent.COORD_ADD_CPFROM:
			case ShapeEvent.COORDS_SET_CPTO:
			case ShapeEvent.COORDS_SET_CPFROM:
				[event.value] = args;
				break;
			default:
				super._initShapeEvent(event);
		}
	}

	/**
	 * Get access to the array of calculated control points before the bezier points.
	 *
	 * @method getCpFromPoints
	 * @param {Points[]} [points] Optional point array, containing the bezier points. These
	 * are used to calculate automatically the control points of the bezier curve, if they were not provided and
	 * have not been calculated before.
	 * @return {Points[]} Point array with the control points before the bezier points.
	 * @private
	 */
	getCpFromPoints(points) {
		if (!this._cpFromCoordinates.length && points !== undefined) {
			this.getBezierPoints(points);
			return this._cpFromPoints.getPoints();
		}
		return this.getCpFromPointList().getPoints();
	}

	getCpFromPointList() {
		return this._cpFromPoints;
	}

	/**
	 * Get access to the array of calculated control points behind the bezier points.
	 *
	 * @method getCpToPoints
	 * @param {Points[]} [points] Optional point array, containing the bezier points. These
	 * are used to calculate automatically the control points of the bezier curve, if they were not provided and
	 * have not been calculated before.
	 * @return {Points[]} Point array with the control points behind the bezier points.
	 * @private
	 */
	getCpToPoints(points) {
		if (!this._cpToCoordinates.length && points !== undefined) {
			this.getBezierPoints(points);
			return this._cpToPoints.getPoints();
		}
		return this.getCpToPointList().getPoints();
	}

	getCpToPointList() {
		return this._cpToPoints;
	}

	/**
	 * Calculate the control points of the bezier curve based on the give bezier point array and assigns them
	 * to the coordinate arrays.
	 *
	 * @method getBezierPoints
	 * @param {Point[]} points Bezier points to use.
	 */
	getBezierPoints(points) {
		if (points.length > 1) {
			const closed = this._item.isClosed();
			this._cpFromPoints.clear();
			this._cpToPoints.clear();
			BezierShape.initControlPoints(points, this._cpToPoints, this._cpFromPoints, closed);
		}
	}

	saveContent(writer) {
		super.saveContent(writer);

		writer.writeStartElement('cpfrom');
		writer.writeStartArray('c');
		this._cpFromCoordinates.forEach((coor) => {
			coor.save('c', writer);
		});
		writer.writeEndArray('c');
		writer.writeEndElement();

		writer.writeStartElement('cpto');
		writer.writeStartArray('c');
		this._cpToCoordinates.forEach((coor) => {
			coor.save('c', writer);
		});

		writer.writeAttributeString('pie', this._pie ? 'true' : 'false');

		writer.writeEndArray('c');
		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);

		let coordinate;
		let coll = reader.getObject(object, 'cpfrom');

		reader.iterateObjects(coll, (name, child) => {
			switch (name) {
				case 'c':
				case 'coordinate':
					coordinate = new Coordinate();
					coordinate.read(reader, child);
					this._cpFromCoordinates.push(coordinate);
					break;
				default:
					break;
			}
		});

		coll = reader.getObject(object, 'cpto');

		reader.iterateObjects(coll, (name, child) => {
			switch (name) {
				case 'c':
				case 'coordinate':
					coordinate = new Coordinate();
					coordinate.read(reader, child);
					this._cpToCoordinates.push(coordinate);
					break;
				default:
					break;
			}
		});

		const pie = reader.getAttribute(object, 'pie');
		if (pie !== undefined) {
			this._pie = pie === 'true';
		}
	}

	/**
	 * Calculates a polyline point list resembling the layout of the bezier curve.
	 *
	 * @method getPolygonPointList
	 * @return {Points[]} Calculated point list.
	 */
	getPolygonPointList() {
		return BezierShape.interpolateCurve(this);
	}

	containsPoint(point, findFlag) {
		if (!point) {
			return false;
		}
		const pointList = this.getPolygonPointList();
		if (!pointList) {
			return false;
		}

		const closed = this._item.isClosed();
		let area = closed;
		const radius = this._item.getGraph().getFindRadius();

		if (findFlag === Shape.FindFlags.AREAWITHFRAME) {
			if (pointList.contains(point)) {
				return true;
			}
			return pointList.distance(point, closed) < radius;
		}

		if (findFlag !== Shape.FindFlags.AREA && findFlag !== Shape.FindFlags.INNERAREA) {
			const mode = this._item
				.getItemAttributes()
				.getSelectionMode()
				.getValue();
			if (mode & ItemAttributes.SelectionMode.DEFAULT) {
				area =
					this._item.getItemCount() ||
					(area &&
						this._item
							.getFormat()
							.getFillStyle()
							.getValue() !== FormatAttributes.FillStyle.NONE);
			} else if (mode & ItemAttributes.SelectionMode.BORDER) {
				area = false;
			} else if (mode & ItemAttributes.SelectionMode.AREA) {
				area = true;
			}
		}

		if (area) {
			return pointList.contains(point);
		}

		return pointList.distance(point, closed) < radius;
	}

	refresh() {
		super.refresh();

		if (this._cpFromCoordinates.length > 0) {
			this._fillPointList(this._cpFromPoints, this._cpFromCoordinates);
		}

		if (this._cpToCoordinates.length > 0) {
			this._fillPointList(this._cpToPoints, this._cpToCoordinates);
		}
	}

	setPie(pie) {
		this._pie = pie;
	}

	/**
	 * Type string for a bezier shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'bezier';
	}
}

/**
 * Initializes the control points of a bezier curve specified by given {{#crossLink
 * "BezierCoordinate"}}{{/crossLink}}s or {{#crossLink "Point"}}{{/crossLink}}s. If the curve is
 * described by a list of <code>Point</code>s two additional empty lists must be given too. One list takes the control
 * points <q>to</q> each curve point and the other one takes the control points <q>from</q> each curve point.
 *
 * @method initControlPoints
 * @param {Array} coordpts Either a list of <code>BezierCoordinate</code>s or <code>Point</code>s.
 * @param {Array} [cptsTo] An empty list which takes the control points <q>to</q> each curve point. Must be given if
 * bezier curve is described by <code>Point</code>s.
 * @param {Array} [cptsFrom] An empty list which takes the control points <q>from</q> each curve point. Must be given
 * if bezier curve is described by <code>Point</code>s.
 * @static
 * @since 1.6.18
 */
BezierShape.initControlPoints = (() => {
	const toPoint = (obj, point) => {
		return obj.toPoint ? obj.toPoint(point) : point.setTo(obj);
	};

	const calcBezierPoints = (pt, prevpt, nextpt, cpTo, cpFrom) => {
		const fact = 0.2;
		const xDiff = (nextpt.x - prevpt.x) * fact;
		const yDiff = (nextpt.y - prevpt.y) * fact;

		cpTo.set(pt.x + xDiff, pt.y + yDiff);
		cpFrom.set(pt.x - xDiff, pt.y - yDiff);
	};

	const applyBezierPoints = (obj, cpTo, cpFrom, cptsTo, cptsFrom) => {
		if (obj.cpTo && obj.cpFrom) {
			obj.cpTo.setToPoint(cpTo);
			obj.cpFrom.setToPoint(cpFrom);
		} else if (cptsTo && cptsFrom) {
			cptsTo.addPoint(cpTo.copy());
			cptsFrom.addPoint(cpFrom.copy());
		}
	};

	return (coordpts, cptsTo, cptsFrom, closed) => {
		// Evaluate control point from points
		// 1. subtract points p.x(+1) - p.x(-1) and p.y(+1) - p.y(-1)
		// 2. Ergibt addiert auf Polygonpunkt einen Punkt auf Linie des Lots auf die Winkelhalbierende der umgebenden
		// Linien 3. Auf diesen Punkt mit Faktor aufaddieren/subtrahieren (ergibt sich aus Laenge mal x %)
		if (coordpts.length > 1) {
			let i;
			const n = coordpts.length;
			const last = n - 1;
			let pt = JSG.ptCache.get();
			let prevpt = JSG.ptCache.get();
			let nextpt = JSG.ptCache.get();
			const cpTo = JSG.ptCache.get();
			const cpFrom = JSG.ptCache.get();

			for (i = 0; i < n; i += 1) {
				pt = toPoint(coordpts[i], pt);
				if (closed) {
					prevpt = i === 0 ? toPoint(coordpts[coordpts.length - 1], prevpt) : toPoint(coordpts[i - 1], prevpt);
					nextpt = i === last ? toPoint(coordpts[0], nextpt) : toPoint(coordpts[i + 1], nextpt);
				} else {
					prevpt = i === 0 ? toPoint(pt, prevpt) : toPoint(coordpts[i - 1], prevpt);
					nextpt = i === last ? toPoint(pt, nextpt) : toPoint(coordpts[i + 1], nextpt);
				}
				calcBezierPoints(pt, prevpt, nextpt, cpTo, cpFrom);
				applyBezierPoints(coordpts[i], cpTo, cpFrom, cptsTo, cptsFrom);
			}
			JSG.ptCache.release(pt, prevpt, nextpt, cpTo, cpFrom);
		}
	};
})();

module.exports = BezierShape;
