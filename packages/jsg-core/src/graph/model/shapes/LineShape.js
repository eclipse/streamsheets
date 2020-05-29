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
const Shape = require('./Shape');
const Point = require('../../../geometry/Point');
const MathUtils = require('../../../geometry/MathUtils');
const Coordinate = require('../../Coordinate');
const CoordinateProxy = require('../../CoordinateProxy');
const GraphUtils = require('../../GraphUtils');
const ItemAttributes = require('../../attr/ItemAttributes');
const ShapeEvent = require('../events/ShapeEvent');
const RectangleShape = require('./RectangleShape');
// const EdgeLayout = require('../../../layout/EdgeLayout');

// eslint-disable-next-line global-require
const getEdgeLayout = () => require('../../../layout/EdgeLayout');


/**
 * This shape is used to define lines. It automatically adds two
 * {{#crossLink "Coordinate"}}{{/crossLink}}s by default, one for the start
 * point and one for its end point. Furthermore the line shape provides some additional methods to
 * ease line point handling.
 *
 * @class LineShape
 * @constructor
 * @extends Shape
 */
class LineShape extends Shape {
	constructor() {
		super();

		this._coordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0)));
		this._coordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0)));

		this._sc = false;
		this._tc = false;
		this._vlPoints = undefined;
		this._vPoints = undefined;
	}

	getType() {
		return LineShape.TYPE;
	}

	saveContent(writer) {
		super.saveContent(writer);

		writer.writeStartElement('cs');
		writer.writeStartArray('c');

		this._coordinates.forEach((coor) => {
			coor.save('c', writer);
		});
		writer.writeEndArray('c');
		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);

		let coordinate;
		let coll = reader.getObject(object, 'cs');
		if (coll === undefined) {
			coll = reader.getObject(object, 'coordinates');
		}

		this._coordinates = [];

		reader.iterateObjects(coll, (name, child) => {
			switch (name) {
				case 'c':
				case 'coordinate':
					coordinate = this._readCoordinate(reader, child);
					this._coordinates.push(coordinate);
					break;
				default:
					break;
			}
		});

		// directly initialize point list after reading coordinates...
		// note: it is important that no layout is involved, take saved values!!
		this._fillPointList(this._coordpointlist, this._coordinates);
	}

	/**
	 * Reads and returns a new <code>Coordinate</code> instance from given <code>XML</code> node.</br>
	 * Note: subclasses may overwrite.
	 *
	 * @method _readCoordinate
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 * @return {Coordinate} A new <code>Coordinate</code> instance.
	 * @private
	 */
	_readCoordinate(reader, object) {
		const coordinate = new Coordinate();
		coordinate.read(reader, object);
		return coordinate;
	}

	newInstance() {
		return new LineShape();
	}

	setItem(item) {
		super.setItem(item);
		if (this._item) {
			const layout = this._item.getLayout();
			const layouttype = layout && layout.getType();
			if (layouttype !== getEdgeLayout().TYPE) {
				this._item.setLayout(getEdgeLayout().TYPE);
			}
		}
	}

	/**
	 * Returns the start coordinate of the underlying coordinates.</br>
	 * <b>Note:</b> it is not recommended to change coordinates directly.
	 *
	 * @method getStartCoordinate
	 * @return {Coordinate} Direct access to the start coordinate.
	 */
	getStartCoordinate() {
		return this._coordinates.length !== 0 ? this._coordinates[0] : undefined;
	}

	/**
	 * Returns the last coordinate of the underlying coordinates.</br>
	 * <b>Note:</b> it is not recommended to change coordinates directly.
	 *
	 * @method getEndCoordinate
	 * @return {Coordinate} Direct access to the end coordinate.
	 */
	getEndCoordinate() {
		const last = this._coordinates.length === 0 ? -1 : this._coordinates.length - 1;
		return last > -1 ? this._coordinates[last] : undefined;
	}

	/**
	 * Sets the first coordinate of the underlying shape coordinates to the given coordinate. Note: this
	 * will replace the underlying coordinate with the given one.</br>
	 * This method notifies registered graph item about shape change.
	 *
	 * @method setStartCoordinateTo
	 * @param {Coordinate} coordinate The coordinate to set the start coordinate to.
	 */
	setStartCoordinateTo(coordinate) {
		if (coordinate !== undefined) {
			this._replaceCoordinateAt(0, coordinate);
		}
	}

	/**
	 * Sets the last coordinate of the underlying shape coordinates to the given coordinate. Note: this
	 * will replace the underlying coordinate with the given one.</br>
	 * This method notifies registered graph item about shape change.
	 *
	 * @method setEndCoordinateTo
	 * @param {Coordinate} coordinate The coordinate to set the end coordinate to.
	 */
	setEndCoordinateTo(coordinate) {
		const last = this._coordinates.length === 0 ? -1 : this._coordinates.length - 1;
		if (coordinate !== undefined && last > -1) {
			this._replaceCoordinateAt(last, coordinate);
		}
	}

	_replaceCoordinateAt(index, coordinate) {
		function isEqual(coord1, coord2) {
			// equal <=> if both coordinates are no instances of CoordinateProxy and both have equal expression
			// components
			return (
				!(coord2 instanceof CoordinateProxy) && !(coord1 instanceof CoordinateProxy) && coord1.isEqualTo(coord2)
			);
		}

		// note: we work directly on coordinate array in case we are connected (we get a coordinate proxy...)
		if (!isEqual(this._coordinates[index], coordinate)) {
			const event = this._shapeWillChange(ShapeEvent.COORDS_REPLACE_AT, index, coordinate);
			if (event.doIt === true) {
				this._coordinates[index] = coordinate;
				if (this._item !== undefined && !this._item._reading && !JSG.idUpdater.isActive) {
					this._coordinates[index].evaluate(this._item);
				}
				this.refresh();
				this._shapeDidChange(event);
			}
		}
	}

	/**
	 * Sets the first coordinate of the underlying shape coordinates to the given expressions.</br>
	 * This method notifies registered graph item about shape change.
	 *
	 * @method setStartCoordinate
	 * @param {BooleanExpression} xExpr The new horizontal coordinate parameter.
	 * @param {BooleanExpression} yExpr The new vertical coordinate parameter.
	 */
	setStartCoordinate(xExpr, yExpr) {
		if (xExpr !== undefined && yExpr !== undefined) {
			this.setCoordinateAt(0, xExpr, yExpr);
		}
	}

	/**
	 * Sets the last coordinate of the underlying shape to the given expressions.</br>
	 * This method notifies registered graph item about shape change.
	 *
	 * @method setEndCoordinate
	 * @param {BooleanExpression} xExpr The new horizontal coordinate parameter.
	 * @param {BooleanExpression} yExpr The new vertical coordinate parameter.
	 */
	setEndCoordinate(xExpr, yExpr) {
		const last = this._coordinates.length === 0 ? -1 : this._coordinates.length - 1;
		if (xExpr !== undefined && yExpr !== undefined && last > -1) {
			this.setCoordinateAt(last, xExpr, yExpr);
		}
	}

	// overwritten because a line has at least 2 coordinates, namely start and end point...
	setCoordinates(coordinates) {
		if (this._coordinates.length > 1) {
			// we have keep at least 2 points!
			super.setCoordinates(coordinates);
		}
	}

	// overwritten to keep first & last coordinate, because line could be attached...
	keepCoordinates(count) {
		const last = this._coordinates.length - 1;
		const lastcoord = this._coordinates[last];

		for (let i = this._coordinates.length; i < count; i += 1) {
			this._coordinates.push(new Coordinate());
		}
		this._coordinates.length = count;

		if (last >= 0) {
			// swap end coordinate...
			if (last < count) {
				this._coordinates[last] = this._coordinates[count - 1];
			}
			this._coordinates[count - 1] = lastcoord;
		}
	}

	containsPoint(point, findFlag, threshold) {
		return this.getLineSegmentAtPoint(point, threshold) !== -1;
	}

	/**
	 * Checks if given point touches the line and returns the zero based line segment index.
	 * -1 is returned if the point is not on the line. Note: a line segment is defined by two points. A
	 * line has at least one segment, namely the segment defined by start and end point. If the point
	 * touches this segment 0 is returned. If the line has (e.g.) three points, i.e. two segments, and
	 * the point touches the segment defined by point 1 and end point, 1 is returned.
	 *
	 * @method getLineSegmentAtPoint
	 * @param {Point} point The point to test.
	 * @param {Number} threshold The maximum point distance to the line.
	 * @return {Number} The line segment index or -1 if the point does not touch the line.
	 */
	getLineSegmentAtPoint(point, threshold) {
		let index = -1;
		if (point !== undefined) {
			const points = this.getVisiblePoints();
			const last = points.length - 1;
			let lineBegin;
			let lineEnd;
			let distance;
			let i;

			// TODO default threshold...
			threshold = threshold !== undefined ? threshold : 1;

			for (i = 0; i < last; i += 1) {
				lineBegin = points[i];
				lineEnd = points[i + 1];
				distance = MathUtils.getLinePointDistance(lineBegin, lineEnd, point);
				if (distance < threshold) {
					index = i;
					break;
					// return true;
				}
			}
		}
		return index;
	}

	/**
	 * Calculates line points in such a way that no resulting line segment intersects any attached node.
	 * That means that using these points for drawing, the line will not be drawn on top of attached node.</br>
	 * By definition points of not attached lines are all visible.</br>
	 * See {{#crossLink "LineShape/getLineSegmentAtPoint:method"}}{{/crossLink}}
	 * for a definition of line segment.
	 *
	 * @method getVisiblePoints
	 * @return {Array} An array of visible line points.
	 */
	getVisiblePoints() {
		const getIntersectionWithLine = (points, start, end, intersection, closed) => {
			let cnt = 0;
			let is;
			let i;
			let n;

			if (Number.isNaN(start.x) || Number.isNaN(end.x)) {
				return undefined;
			}

			for (i = 0, n = points.length - 1; i < n; i += 1) {
				if (MathUtils.getIntersectionOfLines(points[i], points[i + 1], start, end, intersection, false)) {
					if (is === undefined) {
						is = intersection.copy();
					}
					if (cnt === 1) {
						// same intersection with neighbour segment
						if (Math.abs(is.x - intersection.x) < 2 && Math.abs(is.y - intersection.y) < 2) {
							cnt -= 1;
						}
					}
					cnt += 1;
					if (cnt > 1) {
						return cnt;
					}
					// more than one intersection
				}
			}

			if (closed) {
				if (MathUtils.getIntersectionOfLines(points[i], points[0], start, end, intersection, false)) {
					if (cnt === 1) {
						// same intersection with neighbour segment
						if (Math.abs(is.x - intersection.x) < 2 && Math.abs(is.y - intersection.y) < 2) {
							cnt -= 1;
						}
					}
					cnt += 1;
				}
			}

			return cnt;
		};

		const getIntersection = (port, edgePoints, graph, intersection, start) => {
			const node = port.getParent();
			let nodePoints;
			let closed = node.isClosed();

			if (
				node
					.getItemAttributes()
					.getPortMode()
					.getValue() & ItemAttributes.PortMode.CENTERSTARTATSIDE
			) {
				const box = node.getTranslatedBoundingBox(graph);
				nodePoints = box.getPoints();
				closed = true;
			} else {
				if (!node.isClosed()) {
					return undefined;
				}
				nodePoints = node.getTranslatedShapePoints(graph);
			}

			let cntIntersections = 0;
			let index = 0;
			const is = new Point(0, 0);
			let i;
			let n;

			// check, if first point within node (for sourceport), if outside return
			if (start) {
				if (!MathUtils.isPointInPolygon(nodePoints, edgePoints[0])) {
					return undefined;
				}
			}

			// check, if last point within node (for targetport)
			if (!start) {
				if (!MathUtils.isPointInPolygon(nodePoints, edgePoints[edgePoints.length - 1])) {
					return undefined;
				}
			}

			let distance;

			// now check all line segments
			for (i = 0, n = edgePoints.length - 1; i < n; i += 1) {
				const cnt = getIntersectionWithLine(nodePoints, edgePoints[i], edgePoints[i + 1], is, closed);
				if (cnt > 1) {
					return undefined;
				}
				cntIntersections += cnt;
				if (cnt === 1 && cntIntersections === 1) {
					intersection.setTo(is);
					index = i;
					if (
						start &&
						this.getType() === 'ortholine' &&
						port.getParent().getShape() instanceof RectangleShape
					) {
						break;
					}
				} else if (cntIntersections > 1) {
					distance = MathUtils.getLineLength(is, edgePoints[i]);
					// check if last point and intersection close to line, if yes drop last intersection and use this
					// one
					if (
						(distance !== undefined && distance < 50) ||
						(!start &&
							this.getType() === 'ortholine' &&
							port.getParent().getShape() instanceof RectangleShape)
					) {
						index = i;
						intersection.setTo(is);
						cntIntersections = 1;
					} else {
						break;
					}
				}
			}

			if (cntIntersections === 1) {
				GraphUtils.traverseItemDown(graph, this._item, (item) => {
					// angle -= item.getAngle().getValue();
					item.translateFromParent(intersection);
					return true;
				});
			}

			return cntIntersections !== 1 ? undefined : index;
		};

		const sourcePort = this._item.getSourcePort();
		const targetPort = this._item.getTargetPort();
		const points = this.getPoints();
		let i;
		let n;

		if ((!sourcePort && !targetPort) || points.length === 0) {
			return points;
		}

		if (sourcePort && targetPort) {
			if (sourcePort.getParent() === targetPort.getParent()) {
				return points;
			}
		}

		if (this._vPoints && this._vlPoints && this._vPoints.length === points.length) {
			for (i = 0, n = points.length; i < n; i += 1) {
				if (!points[i].isEqualTo(this._vPoints[i])) {
					break;
				}
			}
			if (!sourcePort || this._sc === sourcePort.getParent().isCollapsed()) {
				if (!targetPort || this._tc === targetPort.getParent().isCollapsed()) {
					if (i === n) {
						return this._vlPoints;
					}
				}
			}
		}

		const graph = this._item.getGraph();
		const edgePoints = this._item.getTranslatedShapePoints(graph);
		const intersection = new Point(0, 0);
		let indexStart = 0;
		let indexEnd = points.length - 1;
		let startpoint = points[0];
		let endpoint = points[indexEnd];
		let cnt;

		if (sourcePort) {
			cnt = getIntersection(sourcePort, edgePoints, graph, intersection, true);
			if (cnt !== undefined) {
				indexStart = cnt;
				startpoint = intersection.copy();
			}
		}

		if (targetPort) {
			cnt = getIntersection(targetPort, edgePoints, graph, intersection, false);
			if (cnt !== undefined) {
				indexEnd = cnt + 1;
				endpoint = intersection.copy();
			}
		}

		const linePoints = [];

		for (i = indexStart; i <= indexEnd; i += 1) {
			if (startpoint !== undefined && i === indexStart) {
				linePoints.push(startpoint);
			} else if (i === indexEnd && endpoint) {
				linePoints.push(endpoint);
			} else {
				linePoints.push(points[i]);
			}
		}

		// simple line with no extent
		if (linePoints.length === 2) {
			if (linePoints[0].isEqualTo(linePoints[1], 50)) {
				linePoints.length = 0;
			}
		}

		// save last calculated points
		this._vPoints = [];
		for (i = 0, n = points.length; i < n; i += 1) {
			this._vPoints.push(points[i].copy());
		}
		this._vlPoints = [];
		for (i = 0, n = linePoints.length; i < n; i += 1) {
			this._vlPoints.push(linePoints[i].copy());
		}

		this._sc = sourcePort ? sourcePort.getParent().isCollapsed() : false;
		this._tc = targetPort ? targetPort.getParent().isCollapsed() : false;

		return linePoints;
	}

	invalidateVisiblePoints() {
		this._sc = false;
		this._tc = false;
		this._vlPoints = undefined;
		this._vPoints = undefined;
	}

	// TODO (ah) !!! --- REVIEW --- !!!
	// (THOUGHTS) why inner coordinates are currently absolute:
	//	- because the actual angle is only known here! (e.g. if defined via expression!)
	//	-> so inner points must be adjusted to this angle, but they may contain an angle (from old start/end-point)
	// already -> example: attach startpoint to a port => this currently defines pin location to! i.e. startpoint is the
	// origin of a line... -> possible problems: what about lines crossing containers? -> _fillPointList(list, coordinates)
	// { LineShape._super._fillPointList.call(this, list, coordinates); var endpoint =
	// this._item.getEndPoint(new Point(0, 0)); var startpoint = this._item.getStartPoint(new
	// Point(0, 0)); this._item.setOriginTo(startpoint); //<- this adjusts pin!!  var angle =
	// this._item.getAngle().getValue(); var actualAngle = MathUtils.getAngleBetweenPoints(startpoint, endpoint) -
	// angle;  //adjustment due to angle formula: if(Math.abs(actualAngle) > 0.001) { var pin = this._item.getPinPoint(new
	// Point(0, 0)); this._item.setStartPointTo(MathUtils.getRotatedPoint(startpoint, pin,
	// -actualAngle)); this._item.setEndPointTo(MathUtils.getRotatedPoint(endpoint, pin, -actualAngle)); endpoint
	// = this._item.getEndPoint(endpoint); startpoint = this._item.getStartPoint(startpoint);
	// //this._item.setOriginTo(startpoint); //<- this adjusts pin!! <- called within setStartPoint()!!  }
	// this._prepareInnerPoints(startpoint, endpoint);  var point = new Point(0, 0); var origin =
	// this._item.getOrigin(new Point(0, 0)); adjustPoints(list.getPoints(), angle);   function
	// adjustPoints(points, angle) { var last = points.length - 1; //adjust start- and endpoint:
	// point.setTo(startpoint).subtract(origin); MathUtils.rotatePoint(point, -angle); points[0].setTo(point);
	// point.setTo(endpoint).subtract(origin); MathUtils.rotatePoint(point, -angle); points[last].setTo(point);
	// for (var i = 1; i < last; i++) { point.setTo(points[i]).subtract(origin); MathUtils.rotatePoint(point,
	// -angle); points[i].setTo(point); } } };

	// _prepareInnerPoints(startpoint, endpoint) {
	// };

	getValidPortLocations(closed, snap) {
		// not supported currently
		return undefined;
	}

	getValidPortLocation(point, pointGrid, closed, snap, tolerance) {
		// not supported currently
		return undefined;
	}
	/**
	 * Type string for a line shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'line';
	}
}

module.exports = LineShape;
