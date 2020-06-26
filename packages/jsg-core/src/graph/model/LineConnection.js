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
const JSG = require('../../JSG');
const GraphItem = require('./GraphItem');
const TextNode = require('./TextNode');
const LineShape = require('./shapes/LineShape');
const BezierLineShape = require('./shapes/BezierLineShape');
const EdgeAttributes = require('../attr/EdgeAttributes');
const FormatAttributes = require('../attr/FormatAttributes');
const TextFormatAttributes = require('../attr/TextFormatAttributes');
const Event = require('./events/Event');
const ShapeEvent = require('./events/ShapeEvent');
const Coordinate = require('../Coordinate');
const BezierCoordinate = require('../BezierCoordinate');
const Point = require('../../geometry/Point');
const MathUtils = require('../../geometry/MathUtils');
const GraphUtils = require('../GraphUtils');
const Arrays = require('../../commons/Arrays');

/**
 * A LineConnection represents a link between a source and a target {{#crossLink "Node"}}{{/crossLink}}.
 * As the name suggests this connection uses a {{#crossLink "LineShape"}}{{/crossLink}}
 * for its visual representation.</br>
 * Since this connection class implements a simple line behavior some additional
 * methods to easily set and get line points are provided.</br>
 * Note: it is not required for a connection to have a source and a target node at all, so both
 * can be <code>undefined</code>.
 *
 * @class LineConnection
 * @extends GraphItem
 * @constructor
 * @param {LineShape} [shape] The shape to use for visual representation.
 */
class LineConnection extends GraphItem {
	constructor(shape) {
		super(shape || new LineShape());
		// this.setShapeTo((shape !== undefined) ? shape : new LineShape());

		// replace item attributes with special edge attributes:
		this.addAttribute(new EdgeAttributes());

		//= > local pin is not required for lines... => getOrigin always returns pin-point...
		this._pin.setLocalCoordinateTo(Coordinate.fromXY(0, 0));
		this._pin.lockLocalPin(true);

		this.sourceNode = undefined;
		this.targetNode = undefined;
	}

	newInstance() {
		return new LineConnection();
	}

	/**
	 * Checks if this connection is attached to a target node.
	 *
	 * @method hasTargetNode
	 * @return {Boolean} <code>true</code> if this connection is attached to a target node, <code>false</code>
	 *     otherwise.
	 */
	hasTargetNode() {
		return !!this.targetNode;
	}

	/**
	 * Checks if this connection is attached to a source node.
	 *
	 * @method hasSourceNode
	 * @return {Boolean} <code>true</code> if this connection is attached to a source node, <code>false</code>
	 *     otherwise.
	 */
	hasSourceNode() {
		return !!this.sourceNode;
	}

	/**
	 * Returns direct access to the attached source node.</br>
	 * If this LineConnection has no attached source node <code>undefined</code> is returned.
	 *
	 * @method getSourceNode
	 * @return {Node} The attached source node or <code>undefined</code>.
	 */
	getSourceNode() {
		return this.sourceNode;
	}

	/**
	 * Returns direct access to the attached target node.</br>
	 * If this LineConnection has no attached target node <code>undefined</code> is returned.
	 *
	 * @method getTargetNode
	 * @return {Node} The attached target node or <code>undefined</code>.
	 */
	getTargetNode() {
		return this.targetNode;
	}

	getRotationPoint() {
		// TODO testing purpose, we rotate pin around start point...
		return this.getStartPoint().copy();
	}

	setAngle(angle) {
		if (!this.getAngle().isEqualToExpressionOrValue(angle)) {
			const event = new Event(Event.ANGLE, angle);
			event.source = this;
			this.sendPreEvent(event);
			if (event.doIt === true) {
				this._setAngle(angle, this.getRotationPoint());
				this.sendPostEvent(event);
			}
		}
	}

	_setAngle(angle, rotpoint) {
		const oldangle = this._angle.getValue();
		this._angle.setExpressionOrValue(angle);
		// rotate pin:
		const newangle = this._angle.getValue();
		const pin = this.getPinPoint();
		MathUtils.rotatePointAround(rotpoint, pin, newangle - oldangle);
		this.setPinPointTo(pin);
	}

	rotate(angle, rotpoint) {
		if (angle) {
			const newAngle = this.getAngle().getValue() + angle;
			rotpoint = rotpoint || this.getPinPoint();
			this._setAngle(newAngle, rotpoint);
		}
	}

	addLabel(textnode) {
		const label = super.addLabel(textnode);

		const vpos = label
			.getTextFormat()
			.getVerticalPosition()
			.getValue();

		if (vpos !== TextFormatAttributes.VerticalTextPosition.BELOWRIGHTSTART) {
			label.getFormat().setFillStyle(FormatAttributes.FillStyle.SOLID);
		}
		label.getTextFormat().setFontSize(8);
		label.evaluate();
		label.updateSize();

		return label;
	}

	getNewLabelPosition() {
		const positions = [];
		let i;

		for (i = 0; i < 25; i += 1) {
			positions.push(false);
		}

		// some horizontal positions are not available for connections
		for (i = 0; i < 25; i += 5) {
			positions[i] = true;
			positions[i + 4] = true;
		}

		let found = false;
		// mark used positions
		this._subItems.forEach((item) => {
			if (item instanceof TextNode && item.isAssociated()) {
				const vpos = item
					.getTextFormat()
					.getVerticalPosition()
					.getValue();
				const hpos = item
					.getTextFormat()
					.getHorizontalPosition()
					.getValue();
				if (hpos && vpos) {
					positions[(vpos - 1) * 5 + hpos - 1] = true;
				}
				found = true;
			}
		});

		if (found === false) {
			return undefined;
		}

		for (i = 0; i < 25; i += 1) {
			if (positions[i] === false) {
				return i;
			}
		}

		return undefined;
	}

	/**
	 * Returns the coordinate representing the end point.</br>
	 * <b>Note:</b> this provides direct access to the underlying shape coordinate!
	 *
	 * @method getEndCoordinate
	 * @return {Coordinate} The coordinate representing the end point.
	 */
	getEndCoordinate() {
		return this._shape.getEndCoordinate();
	}

	/**
	 * Returns the coordinate representing the start point.</br>
	 * <b>Note:</b> this is provides direct access to the underlying shape coordinate!
	 *
	 * @method getStartCoordinate
	 * @return {Coordinate} The coordinate representing the start point.
	 */
	getStartCoordinate() {
		// return this._startCoordinate;
		return this._shape.getStartCoordinate();
	}

	/**
	 * Returns the coordinate at specified index or <code>undefined</code> if index is out of range.</br>
	 * <b>Note:</b> this is provides direct access to the underlying shape coordinate!
	 *
	 * @method getCoordinateAt
	 * @param {Number} index The index to get the coordinate at.
	 * @return {Coordinate} The coordinate at given index or <code>undefined<code>.
	 */
	getCoordinateAt(index) {
		return this._shape.getCoordinateAt(index);
	}

	/**
	 * Returns the end point of the corresponding line shape.</br>
	 * <b>Note:</b> the point is defined relative to the item's parent origin.
	 *
	 * @method getEndPoint
	 * @param {Point} [reusepoint] A point instance to reuse. If not provided a new point will be created.
	 * @return {Point} The end point.
	 */
	getEndPoint(reusepoint) {
		const last = this._shape.getCoordinatesCount() - 1;
		return this.getPointAt(last, reusepoint);
	}

	/**
	 * Returns the start point of the corresponding line shape.</br>
	 * <b>Note:</b> the point is defined relative to the item's parent origin.
	 *
	 * @method getStartPoint
	 * @param {Point} [reusepoint] A point instance to reuse. If not provided a new point will be created.
	 * @return {Point} The start point.
	 */
	getStartPoint(reusepoint) {
		return this.getPointAt(0, reusepoint);
	}

	/**
	 * Returns the point at specified index or <code>undefined</code> if index is out of range.</br>
	 * <b>Note:</b> the point is defined relative to the item's parent origin.
	 *
	 * @method getPointAt
	 * @param {Number} index The index to get the point at.
	 * @param {Point} [reusepoint] A point instance to reuse. If not provided a new point will be created.
	 * @return {Point} The point at given index or <code>undefined</code>.
	 */
	getPointAt(index, reusepoint) {
		let point;
		const coordinate = this._shape.getCoordinateAt(index);

		if (coordinate) {
			point = coordinate.toPoint(reusepoint);
			return this.translateToParent(point);
		}
		return undefined;
	}

	/**
	 * Returns an array of points which currently represents this line connection.</br>
	 * <b>Note:</b> the points are defined relative to the item's parent origin.
	 *
	 * @method getPoints
	 * @param {Array} [reusearray] An array of points to reuse. If not provided a new one will be created.
	 * @return {Array} An array of points which represents this line connection.
	 */
	getPoints(reusearray) {
		let i;
		const shapepoints = this._shape.getPoints();

		const points = reusearray || [];
		const pt = JSG.ptCache.get(0, 0);
		const origin = this.getOrigin(pt);
		const angle = this._angle.getValue();
		// to parent coordinate system:
		Arrays.keep(points, shapepoints.length, Point.Factory);

		for (i = 0; i < shapepoints.length; i += 1) {
			points[i].setTo(shapepoints[i]);
			MathUtils.rotatePoint(points[i], angle);
			points[i].add(origin);
		}
		JSG.ptCache.release(pt);
		return points;
	}

	/**
	 * Returns the number of points the underlying shape defines.
	 *
	 * @method getPointsCount
	 * @return {Number} The number of points this line connection currently consists of.
	 */
	getPointsCount() {
		return this._shape.getCoordinatesCount();
	}

	/**
	 * Sets the coordinate representing the end point.</br>
	 * <b>Note:</b> this will replace the underlying shape coordinate!
	 *
	 * @method setEndCoordinateTo
	 * @param {Coordinate} coordinate The new end coordinate.
	 */
	setEndCoordinateTo(coordinate) {
		this._shape.setEndCoordinateTo(coordinate);
	}

	/**
	 * Sets the coordinate representing the end point.</br>
	 *
	 * @method setEndCoordinate
	 * @param {BooleanExpression} xExpr The new horizontal coordinate parameter.
	 * @param {BooleanExpression} yExpr The new vertical coordinate parameter.
	 */
	setEndCoordinate(xExpr, yExpr) {
		this._shape.setEndCoordinate(xExpr, yExpr);
	}

	/**
	 * Sets the coordinate representing the start point.</br>
	 * <b>Note:</b> this will replace the underlying shape coordinate!
	 *
	 * @method setStartCoordinateTo
	 * @param {Coordinate} coordinate The new start coordinate.
	 */
	setStartCoordinateTo(coordinate) {
		this._shape.setStartCoordinateTo(coordinate);
	}

	/**
	 * Sets the coordinate representing the start point.</br>
	 * <b>Note:</b> this will replace the underlying shape coordinate!
	 *
	 * @method setStartCoordinate
	 * @param {BooleanExpression} xExpr The new horizontal coordinate parameter.
	 * @param {BooleanExpression} yExpr The new vertical coordinate parameter.
	 */
	setStartCoordinate(xExpr, yExpr) {
		this._shape.setStartCoordinate(xExpr, yExpr);
	}

	/**
	 * Sets the end coordinate of corresponding line shape to given point.</br>
	 * <b>Note:</b> the new point must be defined relative to the item's parent origin. Furthermore note
	 * that this will not replace the end coordinate, but set its values to specified point.
	 *
	 * @method setEndPointTo
	 * @param {Point} point The new end point.
	 */
	setEndPointTo(point) {
		this.setPointAt(this._shape.getCoordinatesCount() - 1, point);
	}

	/**
	 * Sets the start coordinate of corresponding line shape to given point.</br>
	 * <b>Note:</b> the new point must be defined relative to the item's parent origin. Furthermore note
	 * that this will not replace the start coordinate, but set its values to specified point.
	 *
	 * @method setStartPointTo
	 * @param {Point} point The new start point.
	 */
	setStartPointTo(point) {
		this.setPointAt(0, point);
	}

	/**
	 * Sets the line shape coordinate at specified index to the value of given point.<br/>
	 * The coordinate at specified index is not replaced, but set to the values of given point. If
	 * the index is out of range calling this method has no effect.</br>
	 * <b>Note:</b> the new point must be defined relative to the item's parent origin.
	 *
	 * @method setPointAt
	 * @param {index} index The coordinate index to set.
	 * @param {Point} point The new point at specified index.
	 */
	setPointAt(index, point) {
		this.translateFromParent(point);
		this._shape.setCoordinateAtToPoint(index, point);
	}

	/**
	 * Sets all line shape coordinates to the values of given points.</br>
	 * This will remove any superfluous coordinates or add them if required. If this LineConnection is
	 * attached the corresponding source and target coordinates are preserved. The preserved coordinates
	 * are not replaced, but their values are set to match specified points!</br>
	 * <b>Note:</b> the new points must be defined relative to the item's parent origin.
	 *
	 * @method setPoints
	 * @param {Array} points An array of points to replace the coordinates values.
	 */
	setPoints(points) {
		const event = new ShapeEvent(ShapeEvent.REPLACEPOINTS, points);

		event.source = this;
		this.sendPreEvent(event);

		if (event.doIt === true) {
			const shape = this._shape;
			const tmppoint = JSG.ptCache.get(0, 0);
			shape.keepCoordinates(points.length);
			const coordinates = shape._coordinates;
			points.forEach((point, i) => {
				tmppoint.setTo(point);
				this.translateFromParent(tmppoint);
				coordinates[i].set(tmppoint.x, tmppoint.y);
			});
			JSG.ptCache.release(tmppoint);
			shape.refresh();
			this.sendPostEvent(event);
		}
	}

	/**
	 * Inserts given point or points at specified index. This will create new coordinates within the
	 * underlying line shape.</br>
	 * <b>Note:</b> the new points must be defined relative to the item's parent origin.
	 *
	 * Example calls:
	 * <ul>
	 *    <li>line.insertPointsAt(2, newPoint);</li>
	 *    <li>line.insertPointsAt(2, newPoint1, newPoint2, newPoint3,...);</li>
	 *    <li>line.insertPointsAt(2, [newPoint1, newPoint2,...]);</li>
	 * </ul>
	 *
	 * @method insertPointsAt
	 * @param {index} index The index to insert new points at.
	 */
	insertPointsAt(...args) {
		// shift arguments to pop index of:
		const index = Array.prototype.shift.apply(args);
		const points = Array.isArray(args[0]) ? args[0] : args; // Array.prototype.slice.call(args);
		this._shape.insertCoordinatesAt(index, this._createCoordinatesFromPoints(points));
	}

	_createCoordinatesFromPoints(points) {
		const newcoords = [];
		const useBezier = this._shape instanceof BezierLineShape;

		points.forEach((pt) => {
			if (pt) {
				let coord = Coordinate.fromPoint(this.translateFromParent(pt.copy()));
				coord = useBezier ? BezierCoordinate.fromCoordinate(coord) : coord;
				newcoords.push(coord);
			}
		});

		return newcoords;
	}

	/**
	 * Removes the number of coordinates specified by count from the underlying line shape starting at
	 * given index.
	 *
	 * @method removePointsAt
	 * @param {Number} index The index to start the removal at.
	 * @param {Number} count The number of coordinates to remove.
	 */
	removePointsAt(index, count) {
		this._shape.removeCoordinatesAt(index, count);
	}

	/**
	 * Convenience method to initialize this line connection with a start and end point.</br>
	 * <b>Note:</b> the points must be defined relative to the item's parent origin.
	 *
	 * @method init
	 * @param {Point} startpoint The start point to use.
	 * @param {Point} endpoint The end point to use.
	 */
	init(startpoint, endpoint) {
		if (startpoint) {
			this.setStartPointTo(startpoint);
		}
		if (endpoint) {
			this.setEndPointTo(endpoint);
		}
		this._shape.init();
	}

	getBoundingBox(reusebox) {
		if (this._shape.getBoundingBox) {
			const box = this._shape.getBoundingBox(reusebox);
			return this.translateBoundingBoxToParent(box);
		}
		return super.getBoundingBox(reusebox);
	}

	setBoundingBoxTo(newbbox) {
		JSG.debug.log('LineConnection.setBoundingBoxTo called!');
	}

	// overwritten to return bounding rectangle based on an unrotated bbox...
	getTotalBoundingRect(target, reuserect) {
		const parent = this.getParent();
		const bbox = JSG.boxCache.get();
		const tmprect = JSG.rectCache.get();
		const points = this.getPoints();

		target = target || parent;
		bbox.setAngle(
			-this.getParent()
				.getAngle()
				.getValue()
		);
		bbox.setTopLeftTo(points[0]);
		bbox.enclosePoints(points);
		GraphUtils.translateBoundingBoxUp(bbox, parent, target);
		const totalrect = bbox.toRectangle(reuserect);
		// check for labels

		this._subItems.forEach((subitem) => {
			if (subitem instanceof TextNode) {
				totalrect.union(subitem.getTotalBoundingRect(target, tmprect));
			}
		});

		JSG.boxCache.release(bbox);
		JSG.rectCache.release(tmprect);
		return totalrect;
	}

	getMinSize(size) {
		return 0;
	}

	getSize() {
		const coordinates = this._shape.getCoordinates();

		if (coordinates.length === 2) {
			const endpoint = this.getEndPoint();
			const startpoint = this.getStartPoint();
			const length = MathUtils.getLineLength(startpoint, endpoint);
			this._size.set(length, length);
		} else {
			const bbox = JSG.boxCache.get();
			this.getBoundingBox(bbox);
			this._size.set(bbox.getWidth(), bbox.getHeight());
			JSG.boxCache.release(bbox);
		}
		return this._size;
	}

	/**
	 * Places the origin of this LineConnection to given point without moving it.<br/>
	 * Note: this will adjust each coordinate of this LineConnection! I.e. each not locked formula will be
	 * overwritten.
	 *
	 * @method placePinTo
	 * @param {Point} location The new origin location relative to line parent.
	 */
	placeOriginTo(location) {
		const tmppt = JSG.ptCache.get();
		const delta = this.getOrigin(JSG.ptCache.get()).subtract(location);
		const coordinates = this._shape.getCoordinates();

		coordinates.forEach((coord) => {
			coord.toPoint(tmppt);
			tmppt.add(delta);
			coord.setToPoint(tmppt);
		});
		this.setOriginTo(location);
		JSG.ptCache.release(tmppt, delta);
	}

	containsPoint(point, findFlag, threshold) {
		let contained = false;
		if (point) {
			const box = this.getBoundingBox(JSG.boxCache.get());
			box.expandBy(threshold || 0);
			if (box.containsPoint(point)) {
				const loc = JSG.ptCache.get().setTo(point);
				contained = this._shape.containsPoint(this.translateFromParent(loc), findFlag, threshold);
				JSG.ptCache.release(loc);
			}
			JSG.boxCache.release(box);
		}
		return contained;
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

		if (point) {
			const box = JSG.boxCache.get();
			const bbox = this.getBoundingBox(box);
			bbox.expandBy(threshold); // if threshold is undefined JS convert it to 0...
			if (bbox.containsPoint(point)) {
				const loc = point.copy();
				index = this._shape.getLineSegmentAtPoint(this.translateFromParent(loc), threshold);
			}
			JSG.boxCache.release(box);
		}
		return index;
	}

	isRefreshNeeded() {
		return (
			this._refreshNeeded ||
			(this.sourceNode && this.sourceNode._refreshNeeded) ||
			(this.targetNode && this.targetNode._refreshNeeded)
		);
	}

	// overwritten because for lines we have to refresh shape first in because shape points define BoundingBox
	_doRefresh(force) {
		if (this.isRefreshNeeded()) {
			this._shape.refresh();
			const changed = this._update();

			if (changed || force === true) {
				const event = new Event(Event.ALL);
				event.source = this;
				event.isForced = !changed;
				this.sendPostEvent(event);
			}
		}
		// simply run through subitems...
		this._subItems.forEach((subItem) => {
			subItem.refresh(force);
		});
	}

	// overwritten because for lines the BoundingBox is determined by shape points...
	_updateBoundingBox() {
		const pt = JSG.ptCache.get();
		const oldbbox = JSG.boxCache.get().setTo(this._bboxcache);
		const pointlist = this._shape.getPointList();

		pointlist.getBoundingBox(this._bboxcache);
		this._bboxcache.setTopLeftTo(this.translateToParent(this._bboxcache.getTopLeft(pt)));
		this._bboxcache.setAngle(this._angle.getValue());
		JSG.ptCache.release(pt);
		JSG.boxCache.release(oldbbox);
		return !oldbbox.isEqualTo(this._bboxcache, 0.1);
	}

	updateLabelPositions() {
		if (this._shape.getCoordinatesCount() > 1) {
			let textBox = JSG.boxCache.get();
			let textRect = JSG.rectCache.get();
			let vp;
			let hp;
			let pos = JSG.ptCache.get();

			this._subItems.forEach((item) => {
				if (item instanceof TextNode) {
					textBox = item.getBoundingBox(textBox);
					textRect = textBox.getBoundingRectangle(textRect);
					vp = item
						.getTextFormat()
						.getVerticalPosition()
						.getValue();
					hp = item
						.getTextFormat()
						.getHorizontalPosition()
						.getValue();
					pos.set(item.getPin().getX(), item.getPin().getY());
					pos = this.getLabelPositionAt(hp, vp, textRect, 0, pos);
					if (pos) {
						item.setPinPointTo(pos);
					}
				}
			});

			JSG.ptCache.release(pos);
			JSG.boxCache.release(textBox);
			JSG.rectCache.release(textRect);
		}
	}

	getCenterSizeAtVerticalPosition(vp) {
		if (this._shape.getCoordinatesCount() < 2) {
			return undefined;
		}

		let i;
		let n;
		let item;
		const size = new Point(100, 100);
		let textBox = JSG.boxCache.get();
		let textRect = JSG.rectCache.get();

		for (i = 0, n = this._subItems.length; i < n; i += 1) {
			item = this._subItems[i];
			if (item instanceof TextNode) {
				if (
					vp ===
					item
						.getTextFormat()
						.getVerticalPosition()
						.getValue()
				) {
					if (
						item
							.getTextFormat()
							.getHorizontalPosition()
							.getValue() === TextFormatAttributes.HorizontalTextPosition.CENTER
					) {
						textBox = item.getBoundingBox(textBox);
						textRect = textBox.getBoundingRectangle(textRect);
						size.set(textRect.width + 100, textRect.height + 100);
						break;
					}
				}
			}
		}

		JSG.boxCache.release(textBox);
		JSG.rectCache.release(textRect);

		return size;
	}

	getLabelPositionAt(hp, vp, labelRect, margin, reusepoint) {
		const pos = reusepoint || new Point(0, 0);
		const hasArrowEnd =
			this.getFormat()
				.getLineArrowEnd()
				.getValue() !== FormatAttributes.ArrowStyle.NONE;
		const hasArrowStart =
			this.getFormat()
				.getLineArrowStart()
				.getValue() !== FormatAttributes.ArrowStyle.NONE;
		const vlpoints = this._shape.getVisiblePoints();
		const VP = TextFormatAttributes.VerticalTextPosition;
		const HP = TextFormatAttributes.HorizontalTextPosition;
		let start;
		let end;
		let result;
		let lengths;
		let length;
		let currentLength;
		let j;

		const applyHorizontalAlignment = (lstart, lend, lpos, lRect) => {
			let { width, height } = lRect;
			let offset = JSG.ptCache.get(0, 0);
			const labelPos = JSG.ptCache.get(0, 0);
			let size;
			let angle;

			switch (hp) {
				case HP.LEFT:
					angle = MathUtils.getAngleBetweenPoints(lstart, lend);
					size = this.getCenterSizeAtVerticalPosition(vp);
					width += Math.abs(size.x * Math.sin(angle));
					height += Math.abs(size.y * Math.cos(angle));
					// height += size.y;
					if (lstart.y <= lend.y && !(lstart.y === lend.y && lstart.x < lend.x)) {
						if (lstart.x <= lend.x) {
							// bottom right
							labelPos.set(lpos.x - width / 2, lpos.y + height / 2);
						} else {
							// bottom left
							labelPos.set(lpos.x - width / 2, lpos.y - height / 2);
						}
					} else if (lstart.x < lend.x) {
						// top right
						labelPos.set(lpos.x + width / 2, lpos.y + height / 2);
					} else {
						// top left
						labelPos.set(lpos.x + width / 2, lpos.y - height / 2);
					}
					offset = MathUtils.getLinePointOffset(lstart, lend, labelPos);
					break;
				case HP.RIGHT:
					angle = MathUtils.getAngleBetweenPoints(lstart, lend);
					size = this.getCenterSizeAtVerticalPosition(vp);
					width += Math.abs(size.x * Math.sin(angle));
					height += Math.abs(size.y * Math.cos(angle));
					// height += size.y;
					if (lstart.y <= lend.y && !(lstart.y === lend.y && lstart.x < lend.x)) {
						if (lstart.x <= lend.x) {
							// bottom right
							labelPos.set(lpos.x + width / 2, lpos.y - height / 2);
						} else {
							// bottom left
							labelPos.set(lpos.x + width / 2, lpos.y + height / 2);
						}
					} else if (lstart.x < lend.x) {
						// top right
						labelPos.set(lpos.x - width / 2, lpos.y - height / 2);
					} else {
						// top left
						labelPos.set(lpos.x - width / 2, lpos.y + height / 2);
					}
					offset = MathUtils.getLinePointOffset(lstart, lend, labelPos);
					break;
				default:
					break;
			}

			lpos.x -= offset.x;
			lpos.y -= offset.y;

			JSG.ptCache.release(offset, labelPos);

			return lpos;
		};

		if (vlpoints.length === 0) {
			return undefined;
		}

		const posXT = JSG.ptCache.get(0, 0);

		switch (vp) {
			case VP.BEFORESTART:
				[start, end] = vlpoints;
				result = this._getTextLineIntersection(start, end, start, false, labelRect);
				pos.set(start.x - result.x, start.y - result.y);
				posXT.set(start.x - result.x * 5, start.y - result.y * 5);
				if (hp !== HP.CENTER) {
					applyHorizontalAlignment(posXT, end, pos, labelRect);
				}
				break;
			case VP.START:
				[start, end] = vlpoints;
				result = this._getTextLineIntersection(start, end, start, hasArrowStart, labelRect);
				pos.set(start.x + result.x, start.y + result.y);
				if (hp !== HP.CENTER) {
					applyHorizontalAlignment(start, end, pos, labelRect);
				}
				break;
			case VP.CENTER:
				lengths = [];
				length = 0;
				currentLength = 0;
				// calc line length
				for (j = 0; j < vlpoints.length - 1; j += 1) {
					lengths.push(MathUtils.getLineLength(vlpoints[j], vlpoints[j + 1]));
					length += lengths[j];
				}
				// find center segment
				for (j = 0; j < lengths.length - 1; j += 1) {
					currentLength += lengths[j];
					if (currentLength >= length / 2 && lengths[j + 1] !== 0) {
						break;
					}
				}
				if (j >= vlpoints.length - 1) {
					break;
				}
				start = vlpoints[j];
				end = vlpoints[j + 1];
				pos.set((end.x + start.x) / 2, (end.y + start.y) / 2);

				if (hp !== HP.CENTER) {
					applyHorizontalAlignment(start, end, pos, labelRect);
				}
				break;
			case VP.END:
				start = vlpoints[vlpoints.length - 2];
				end = vlpoints[vlpoints.length - 1];
				result = this._getTextLineIntersection(start, end, end, hasArrowEnd, labelRect);
				pos.set(end.x + result.x, end.y + result.y);
				if (hp !== HP.CENTER) {
					applyHorizontalAlignment(start, end, pos, labelRect);
				}
				break;
			case VP.BEHINDEND:
				start = vlpoints[vlpoints.length - 2];
				end = vlpoints[vlpoints.length - 1];
				result = this._getTextLineIntersection(start, end, end, false, labelRect);
				pos.set(end.x - result.x, end.y - result.y);
				posXT.set(end.x - result.x * 5, end.y - result.y * 5);
				if (hp !== HP.CENTER) {
					applyHorizontalAlignment(start, posXT, pos, labelRect);
				}
				break;
			case VP.BELOWRIGHTSTART:
				[start, end] = vlpoints;
				result = this._getTextLineIntersection(start, end, start, hasArrowStart, labelRect);
				if (start.y === end.y) {
					if (start.x < end.x) {
						pos.set(start.x + labelRect.width / 2 + 150, start.y + labelRect.height / 2);
					} else {
						pos.set(start.x - labelRect.width / 2 - 150, start.y + labelRect.height / 2);
					}
				} else if (start.y < end.y) {
					pos.set(start.x + labelRect.width / 2 + 150, start.y + labelRect.height / 2 + 50);
				} else {
					pos.set(start.x + labelRect.width / 2 + 150, start.y - labelRect.height / 2 - 50);
				}
				break;
			default:
				break;
		}

		JSG.ptCache.release(posXT);

		return pos;
	}

	_getTextLineIntersection(start, end, textPosition, arrow, textRect) {
		let i;
		let n;
		const { height, width } = textRect;
		const result = new Point(0, 0);
		const frame = arrow ? 400 : 200;
		const rect = JSG.rectCache
			.get()
			.set(
				textPosition.x - width / 2 - frame,
				textPosition.y - height / 2 - frame,
				width + frame * 2,
				height + frame * 2
			);
		const points = rect.getPoints();

		for (i = 0, n = points.length; i < n; i += 1) {
			if (i === n - 1) {
				if (MathUtils.getIntersectionOfLines(points[i], points[0], start, end, result, false)) {
					result.translate(-rect.getCenterX(), -rect.getCenterY());
					break;
				}
			} else if (MathUtils.getIntersectionOfLines(points[i], points[i + 1], start, end, result, false)) {
				result.translate(-rect.getCenterX(), -rect.getCenterY());
				break;
			}
		}
		JSG.rectCache.release(rect);
		return result;
	}

	/**
	 * Returns the length of this line.<br/>
	 * The length is defined as the sum of each line segment length.
	 * @method getLength
	 * @return {Number} The length of this line.
	 * @since 2.0.22.4
	 */
	getLength() {
		const pt1 = JSG.ptCache.get();
		const pt2 = JSG.ptCache.get();
		let length = 0;
		for (let i = 0, n = this.getPointsCount() - 1; i < n; i += 1) {
			this.getPointAt(i, pt1);
			this.getPointAt(i + 1, pt2);
			length += pt2.subtract(pt1).length();
		}
		JSG.ptCache.release(pt1, pt2);
		return length;
	}
}

module.exports = LineConnection;
