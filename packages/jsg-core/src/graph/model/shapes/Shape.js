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
const PointList = require('../../../geometry/PointList');
const NumberExpression = require('../../expr/NumberExpression');
const Arrays = require('../../../commons/Arrays');
const Point = require('../../../geometry/Point');
const MathUtils = require('../../../geometry/MathUtils');
const Coordinate = require('../../Coordinate');
const ItemAttributes = require('../../attr/ItemAttributes');
const FormatAttributes = require('../../attr/FormatAttributes');
const ShapeEvent = require('../events/ShapeEvent');

/**
 * Shapes are used to define the actual form or figure of a {{#crossLink "GraphItem"}}{{/crossLink}}.
 * For example: a general {{#crossLink "Node"}}{{/crossLink}} graph item can have
 * the shape of a rectangle, an ellipse, a star or any other figure.</br>
 * The form of a <code>Shape</code> is defined by their inner {{#crossLink "Coordinate"}}{{/crossLink}}s,
 * were each coordinate must be relative to the origin of shapes corresponding graph item. To register
 * a shape to a graph item use {{#crossLink "GraphItem/setShapeTo:method"}}{{/crossLink}}.
 * </br></br>
 * See {{#crossLink "ShapeRenderer"}}{{/crossLink}} to get information about
 * how shapes are drawn.
 *
 * @example
 *     var triangle = new Shape();
 *     triangle.addCoordinate(Coordinate.fromXY(0, 0));
 *     triangle.addCoordinate(Coordinate.fromXY(500, 1000));
 *     triangle.addCoordinate(Coordinate.fromXY(1000, 0));
 *     //set shape to an existing graph item:
 *     myNode.setShapeTo(triangle);
 *     //or create a new graph item with this shape:
 *     var customNode = new Node(triangle);
 *
 */

/**
 * Flags to influence look up or containment tasks.
 *
 * @class FindFlags
 * @constructor
 * @static
 */
const FindFlags = {
	AUTOMATIC: 0,
	AREA: 1,
	FRAME: 2,
	AREAWITHFRAME: 3,
	INNERAREA: 4,
	BOXWITHFRAME: 5
};

/**
 * Creates an empty, i.e. no added <code>Coordinate</code>s, shape instance.
 *
 * @class Shape
 * @constructor
 */
class Shape {
	constructor() {
		this._item = undefined;
		this._coordinates = [];
		this._coordpointlist = new PointList();
		this._notificationEnabled = true;
		// TODO review flag! hopefully have a better idea/method
		// TODO we might want to enable/disable refresh (e.g. during loading)!! => think about a good mechanism for
		// this...
		this._refreshEnabled = true;
	}

	static get FindFlags() {
		return FindFlags;
	}

	/**
	 * Returns the type of this shape. </br>
	 * Subclasses should overwrite to return a unique type identifier.
	 *
	 * @method getType
	 * @return {String} The type identifier of this shape.
	 */
	getType() {
		return Shape.TYPE;
	}

	/**
	 * Saves this shape.
	 *
	 * @method save
	 * @param {String} name Name of created xml tag.
	 * @param {Writer} writer Writer object to save to.
	 */
	save(name, writer) {
		writer.writeStartElement(name);

		writer.writeAttributeString('type', this.getType());
		this.saveContent(writer);

		writer.writeEndElement();
	}

	/**
	 * Saves the content of this shape.</br>
	 * Subclasses should overwrite, default implementation does nothing.
	 *
	 * @method saveContent
	 * @param {Writer} node Writer object to save to.
	 */
	saveContent(node) {}

	/**
	 * Reads a shape from an XML Node.</br>
	 * Intend to be overwritten but subclasses should call this super method.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {}

	/**
	 * Subject to be removed!!
	 *
	 * @method _newExpression
	 * @deprecated Simply use <code>new NumberExpression(value, formula, term)</code> instead
	 */
	_newExpression(value, formula, term) {
		return new NumberExpression(value, formula, term);
	}

	/**
	 * Creates a new shape instance. </br>
	 * This method is part of our copy-pattern, in which the copy is initially created by
	 * <code>newInstance</code>. Therefore subclasses should overwrite.
	 *
	 * @method newInstance
	 * @return {Shape} A new shape instance.
	 */
	newInstance() {
		return new Shape();
	}

	/**
	 * Creates a copy of this shape.</br>
	 * <b>Note:</b> since coordinates are <code>Expression</code>s it might be useful to call <code>evaluate()</code>
	 * on returned copy before first usage.
	 *
	 * @method copy
	 * @return {Shape} A copy of this shape.
	 */
	copy() {
		const copy = this.newInstance();
		copy.setCoordinates(this._coordinates);
		return copy;
	}

	/**
	 * Initialize this shape.</br>
	 * This method is called by graph item on registration via {{#crossLink
	 * "GraphItem/setShapeTo:method"}}{{/crossLink}}. Subclassses should overwrite to perform
	 * initilization stuff. Default implementation does nothing.
	 *
	 * @method init
	 */
	init() {}

	/**
	 * Disabled shapes <code>CHANGED</code> notification.
	 *
	 * @method disableNotification
	 * @deprecated This method is currently under review!
	 */
	disableNotification() {
		this._notificationEnabled = false;
	}

	/**
	 * Enables shapes <code>CHANGED</code> notification.
	 *
	 * @method enableNotification
	 * @deprecated This method is currently under review!
	 */
	enableNotification() {
		this._notificationEnabled = true;
	}

	/**
	 * Disables execution of shapes <code>refresh</code> function.
	 *
	 * @method disableRefresh
	 * @return {Boolean} Old refresh state, i.e. <code>true</code> if refresh was enabled before,
	 * <code>false</code> otherwise.
	 * @deprecated This method is currently under review!
	 */
	disableRefresh() {
		const oldstate = this._refreshEnabled;
		this._refreshEnabled = false;
		return oldstate;
	}

	/**
	 * Enables execution of shapes <code>refresh</code> function.
	 *
	 * @method enableRefresh
	 * @param {Boolean} [execute] If set to <code>true</code> the refresh function is called immediately.
	 * @deprecated This method is currently under review!
	 */
	enableRefresh(execute) {
		this._refreshEnabled = true;
		if (execute === true) {
			this.refresh();
		}
	}

	/**
	 * Registers given graph item to this shape.
	 *
	 * @method setItem
	 * @param {GraphItem} item The graph item to register to this shape.
	 */
	setItem(item) {
		this._item = item;
	}

	/**
	 * Checks if given point is within the area defined by the shape coordinates. To influence the
	 * behavior use one of the predefined <code>FindFlags</code> as optional parameter.</br>
	 * See {{#crossLink "Shape.FindFlags"}}{{/crossLink}}.
	 *
	 * @method containsPoint
	 * @param {Point} point The point to check.
	 * @param {Shape.FindFlags} [findFlag] One of the predefined find flags.
	 * @return {Boolean} Returns <code>true</code> if passed point is within this shape, <code>false</code> otherwise.
	 */
	containsPoint(point, findFlag) {
		if (!point) {
			return false;
		}

		const closed = this._item.isClosed();
		let area = closed;
		const points = this.getPointList();

		if (findFlag === Shape.FindFlags.AREAWITHFRAME) {
			if (points.contains(point)) {
				return true;
			}
			return points.distance(point, closed) < JSG.scaledFindRadius;
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
			return points.contains(point);
		}

		return points.distance(point, closed) < JSG.scaledFindRadius;
	}

	/**
	 * Checks if this shape has any <code>Coordinate</code>s added.
	 *
	 * @method hasCoordinates
	 * @return {Boolean} Returns </code>true</code> if shape has coordinates, <code>false</code>otherwise.
	 */
	hasCoordinates() {
		return this._coordinates.length !== 0;
	}

	/**
	 * Gives direct access to the underlying coordinates array.</br>
	 * <b>Note:</b> it is not recommended to change the coordinates array directly! Better use the
	 * provided methods instead.
	 *
	 * @method getCoordinates
	 * @return {Array} Returns the coordinates of this shape.
	 */
	getCoordinates() {
		return this._coordinates;
	}

	/**
	 * Returns the number of coordinates this shape currently has.
	 *
	 * @method getCoordinatesCount
	 * @return {Number} The number of currently added coordinates.
	 */
	getCoordinatesCount() {
		return this._coordinates.length;
	}

	/**
	 * Returns direct access the coordinate at specified index. If the index is out of array range
	 * <code>undefined</code> is returned. </br>
	 * Note: this method does not notify registered item about coordinate change! If notification is
	 * required better use
	 * {{#crossLink "Shape/setCoordinateAt:method"}}{{/crossLink}} or
	 * {{#crossLink "Shape/setCoordinateTo:method"}}{{/crossLink}}.
	 *
	 * @method getCoordinateAt
	 * @param {Number} index The array index of the coordinate to get.
	 * @return {Coordinate} The coordinate at given index or <code>undefined</code> if index is invalid.
	 */
	getCoordinateAt(index) {
		return index >= 0 && index < this._coordinates.length ? this._coordinates[index] : undefined;
	}

	/**
	 * Keeps the number of coordinates specified by given count parameter.</br>
	 * After calling this method the length of the underlying coordinates array is equal to count. Note
	 * that any additional or superfluous coordinates are pushed to or taken from the end of coordinates array.
	 *
	 * @method keepCoordinates
	 * @param {Number} count The number of coordinates to keep.
	 */
	keepCoordinates(count) {
		let i;

		for (i = this._coordinates.length; i < count; i += 1) {
			this._coordinates.push(new Coordinate());
		}
		this._coordinates.length = count;
	}

	/**
	 * Adds given coordinate to this shape.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method addCoordinate
	 * @param {Coordinate} coordinate The coordinate to add.
	 */
	addCoordinate(coordinate) {
		const event = this._shapeWillChange(ShapeEvent.ADDCOORDINATE, coordinate);
		if (event.doIt === true) {
			coordinate.evaluate(this._item);
			this._coordinates.push(coordinate);
			this.refresh();
			this._shapeDidChange(event);
		}
	}

	/**
	 * Inserts given coordinates at specified index.</br>
	 * The coordinates to insert can be given as an array or as a simple list.
	 *
	 * @example
	 *     var newCoords = [coord1, coord2];
	 *     shape.insertCoordinatesAt(1, newCoords); //this is equal to shape.insertCoordinatesAt(1, coord1, coord2);
	 *
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method insertCoordinatesAt
	 * @param {Number} index The index to insert at.
	 */
	insertCoordinatesAt(index, coordinates) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_INSERT_AT, index, coordinates);
		if (event.doIt === true) {
			this._evalCoords(coordinates);
			Arrays.insertAt(this._coordinates, index, coordinates);
			this.refresh();
			this._shapeDidChange(event);
		}
	}

	/**
	 * Removes the coordinate at given index. This method returns the removed coordinate or
	 * <code>undefined</code> if index is out of range.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method removeCoordinateAt
	 * @param {Number} index The index to remove coordinate at.
	 * @return {Coordinate} The removed coordinate or <code>undefined</code>.
	 */
	removeCoordinateAt(index) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_REMOVE_AT, index);
		if (event.doIt === true) {
			const coordinate = Arrays.removeAt(this._coordinates, index);
			this.refresh();
			this._shapeDidChange(event);
			return coordinate;
		}
		return undefined;
	}

	/**
	 * Removes the number of coordinates specified by count starting at given index.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method removeCoordinatesAt
	 * @param {Number} index The index to start removing coordinates at.
	 * @param {Number} count The number of coordinates to remove.
	 */
	removeCoordinatesAt(index, count) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_REMOVE_AT, index, count);
		if (event.doIt === true) {
			this._coordinates.splice(index, count);
			this.refresh();
			this._shapeDidChange(event);
		}
	}

	/**
	 * Sets x and y expressions of the coordinate at specified index.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method setCoordinateAt
	 * @param {Number} index The index of the coordinate to change.
	 * @param {BooleanExpression} xExpression The expression to use for the x coordinate.
	 * @param {BooleanExpression} yExpression The expression to use for the y coordinate.
	 */
	setCoordinateAt(index, xExpression, yExpression) {
		if (index >= 0 && index < this._coordinates.length) {
			if (!this._coordinates[index].isEqualTo(xExpression, yExpression)) {
				const event = this._shapeWillChange(JSG.ShapeEvent.COORDS_REPLACE_AT, index, xExpression, yExpression);
				if (event.doIt === true) {
					this._coordinates[index].set(xExpression, yExpression);
					// TODO: JSG.idUpdater is set by JSGGlobals
					if (
						this._item !== undefined &&
						!this._item._reading &&
						(JSG.idUpdater && !JSG.idUpdater.isActive)
					) {
						this._coordinates[index].evaluate(this._item);
					}
					this.refresh();
					this._shapeDidChange(event);
				}
			}
		}
	}

	/**
	 * Changes the coordinate at specified index to match the given coordinate.</br>
	 * Note: the given coordinate is only used to define the new x and y expression and does not replace
	 * the shapes coordinate.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method setCoordinateAtTo
	 * @param {Number} index The index of the coordinate to change.
	 * @param {Coordinate} coordinate The coordinate to use for setting.
	 */
	setCoordinateAtTo(index, coordinate) {
		this.setCoordinateAt(index, coordinate.getX(), coordinate.getY());
	}

	/**
	 * Sets x and y values of the coordinate at specified index to the given point values.</br>
	 * This method notifies registered graph item about shape change.
	 *
	 * @method setCoordinateAtToPoint
	 * @param {Number} index The index of the coordinate to change.
	 * @param {Point} point The point to use to set x, y expressions.
	 */
	setCoordinateAtToPoint(index, point) {
		if (index >= 0 && index < this._coordinates.length) {
			this.setCoordinateAt(index, point.x, point.y);
		}
	}

	/**
	 * Replaces the inner coordinates of this shape by the given ones.</br>
	 * This method notifies registered graph item about shape <code>CHANGED</code>.
	 *
	 * @method setCoordinates
	 * @param {Array} coordinates An array of coordinates which defines this shape.
	 */
	setCoordinates(coordinates) {
		const event = this._shapeWillChange(ShapeEvent.COORDS_REPLACE_ALL, coordinates);
		if (event.doIt === true) {
			let i;
			const doEval = this._item !== undefined && !this._item._reading && !JSG.idUpdater.isActive;

			this._coordinates.length = 0;

			for (i = 0; i < coordinates.length; i += 1) {
				const coord = coordinates[i].copy();
				if (doEval) {
					coord.evaluate(this._item);
				}
				this._coordinates.push(coord);
			}

			this.refresh();
			// update cache...
			this._shapeDidChange(event);
		}
	}

	/**
	 * Returns an array of {{#crossLink "Point"}}{{/crossLink}}s.</br>
	 * The points are defined by the internal coordinates.
	 * Use {{#crossLink "Shape/getCoordinates:method"}}{{/crossLink}} to access
	 * the coordinates directly.
	 *
	 * @method getPoints
	 * @return {Array} An array of shape points.
	 */
	getPoints() {
		return this.getPointList().getPoints();
	}

	/**
	 * Returns a {{#crossLink "PointList"}}{{/crossLink}} which describes this shape.</br>
	 *
	 * @method getPointList
	 * @return {PointList} The shapes points as a list.
	 */
	getPointList() {
		return this._coordpointlist;
	}

	getPolygonPointList() {
		return this._coordpointlist;
	}

	/**
	 * Refreshes the shapes {{#crossLink "PointList"}}{{/crossLink}}.</br>
	 * The points are calculated by calling {{#crossLink "Coordinate/toPoint:method"}}{{/crossLink}}
	 * on each shape coordinate.
	 *
	 * @method _fillPointList
	 * @param {PointList} list The point list to fill.
	 * @param {Array} coordinates The shapes coordinates.
	 * @private
	 */
	_fillPointList(list, coordinates) {
		list.keepPoints(coordinates.length);
		// reuse points
		const tmppoint = JSG.ptCache.get();
		let i;

		for (i = 0; i < coordinates.length; i += 1) {
			const coordinate = coordinates[i];
			list.setPointAtTo(i, coordinate.toPoint(tmppoint));
		}
		JSG.ptCache.release(tmppoint);
	}

	/**
	 * Returns the valid {{#crossLink "Port"}}{{/crossLink}} locations this shape can have.
	 * Each location is given as an instance of {{#crossLink "Point"}}{{/crossLink}}.</br>
	 *
	 * @method getValidPortLocations
	 * @param {Boolean} closed Flag which indicates if this shape is closed or not.
	 * @param {Boolean} snap Flag which indicates if a port location should be created for each shape coordinate.
	 * @return {Array} An array of valid port location points.
	 */
	getValidPortLocations(closed, snap) {
		if (!this._item || !(this._item._ports)) {
			// || this._item.isCollapsed()) {
			return undefined;
		}

		let portMode = this._item
			.getItemAttributes()
			.getPortMode()
			.getValue();
		portMode &= this._item
			.getGraph()
			.getSettings()
			.getSnapToPort();

		if (portMode === ItemAttributes.PortMode.NONE) {
			return undefined;
		}

		let points = this._coordpointlist;
		const result = [];
		// always add provided ports
		const ports = this._item.getPorts();

		ports.forEach((port) => {
			result.push(port.getPin().getPoint());
		});

		// add center
		if (closed && portMode & ItemAttributes.PortMode.CENTER) {
			const box = JSG.boxCache.get();
			const pt = this._item.getBoundingBox(box).getCenter();
			// center from box is already rotated, but pts are rotated later again -> remove center rotation...
			box.rotateLocalPointInverse(pt);
			result.push(pt);
			JSG.boxCache.release(box);
		}

		// add points
		if (!snap && (portMode & ItemAttributes.PortMode.POINTS || portMode & ItemAttributes.PortMode.LINESCENTER)) {
			points = points.getPoints();
			for (let i = 0, n = points.length; i < n; i += 1) {
				if (portMode & ItemAttributes.PortMode.POINTS) {
					result.push(points[i]);
				}

				if (!(this.getType() === 'bezier')) {
					if (portMode & ItemAttributes.PortMode.LINESCENTER) {
						if (i || closed) {
							if (i) {
								result.push(
									new Point((points[i].x + points[i - 1].x) / 2, (points[i].y + points[i - 1].y) / 2)
								);
							} else if (closed) {
								result.push(
									new Point((points[n - 1].x + points[0].x) / 2, (points[n - 1].y + points[0].y) / 2)
								);
							}
						}
					}
				}
			}
		}

		const size = JSG.ptCache.get();
		this._item.getSizeAsPoint(size);
		const cx = size.x;
		const cy = size.y;
		JSG.ptCache.release(size);

		if (!snap && portMode & ItemAttributes.PortMode.SIDESCENTER) {
			result.push(new Point(0, cy / 2));
			result.push(new Point(cx / 2, 0));
			result.push(new Point(cx, cy / 2));
			result.push(new Point(cx / 2, cy));
		}

		if (!snap && portMode & ItemAttributes.PortMode.SIDESQUARTER) {
			result.push(new Point(0, cy / 4));
			result.push(new Point(0, cy * 0.75));

			result.push(new Point(cx / 4, 0));
			result.push(new Point(cx * 0.75, 0));

			result.push(new Point(cx, cy / 4));
			result.push(new Point(cx, cy * 0.75));

			result.push(new Point(cx / 4, cy));
			result.push(new Point(cx * 0.75, cy));
		}

		if (!snap && portMode & ItemAttributes.PortMode.CORNERS) {
			result.push(new Point(0, 0));
			result.push(new Point(cx, 0));
			result.push(new Point(cx, cy));
			result.push(new Point(0, cy));
		}

		return result;
	}

	/**
	 * Returns a {{#crossLink "Port"}}{{/crossLink}} location at given point or
	 * <code>undefined</code> if no port can be created at given point.
	 *
	 * @method getValidPortLocation
	 * @param {Point} point The location to validate port creation at.
	 * @param {Point} pointGrid A nearby grid point.
	 * @param {Boolean} closed Flag which indicates if this shape is closed or not.
	 * @param {Boolean} snap Flag which indicates if the port location should snap to given grid point.
	 * @param {Number} tolerance The maximum distance a possible port location might have to given point or grid point.
	 * @return {Point} The valid port point or <code>undefined</code>.
	 */
	getValidPortLocation(point, pointGrid, closed, snap, tolerance) {
		function checkDistance(pointMouse, x, y, result) {
			const pointPort = JSG.ptCache.get(x, y);
			const distance = MathUtils.getLineLength(pointMouse, pointPort);
			JSG.ptCache.release(pointPort);
			if (!Number.isNaN(distance)) {
				if (distance < tolerance) {
					result.x -= result.x - x;
					result.y -= result.y - y;
					return result;
				}
			}
			return undefined;
		}

		if (!this._item || !(this._item_ports)) {
			// || this._item.isCollapsed()) {
			return undefined;
		}

		let portMode = this._item
			.getItemAttributes()
			.getPortMode()
			.getValue();
		portMode &= this._item
			.getGraph()
			.getSettings()
			.getSnapToPort();

		if (portMode === ItemAttributes.PortMode.NONE) {
			return undefined;
		}

		const points = this._coordpointlist;
		let result = point.copy();
		const ports = this._item.getPorts();
		let i;
		let n;
		let p;
		let port;

		const pt = JSG.ptCache.get();

		for (i = 0, n = ports.length; i < n; i += 1) {
			port = ports[i];
			port.getPin().getPoint(pt);
			if (Math.abs(point.x - pt.x) < tolerance && Math.abs(point.y - pt.y) < tolerance) {
				if (port.anyEdgeSelected()) {
					JSG.ptCache.release(pt);
					return undefined;
				}
				result.x -= point.x - pt.x;
				result.y -= point.y - pt.y;
				JSG.ptCache.release(pt);
				return result;
			}
		}

		JSG.ptCache.release(pt);

		// check for center
		if (closed && portMode & ItemAttributes.PortMode.CENTER) {
			const box = JSG.boxCache.get();
			const ptCenter = this._item.getBoundingBox(box).getCenter();
			// center from box is already rotated, but pts are rotated later again -> remove center rotation...
			box.rotateLocalPointInverse(ptCenter);
			JSG.boxCache.release(box);
			const dp = checkDistance(point, ptCenter.x, ptCenter.y, result);
			if (dp !== undefined) {
				return dp;
			}
		}

		// check points
		if (!snap && portMode & ItemAttributes.PortMode.POINTS) {
			p = points.getOffsetFromPoint(point, tolerance, closed, false);
			if (p !== undefined) {
				result.x -= p.x;
				result.y -= p.y;
				return result;
			}
		}

		if (!(this.getType() === 'bezier')) {
			if (!snap && portMode & ItemAttributes.PortMode.LINESCENTER) {
				p = points.getOffsetFromPoint(point, tolerance, closed, true);
				if (p !== undefined) {
					result.x -= p.x;
					result.y -= p.y;
					return result;
				}
			}
		}

		const size = JSG.ptCache.get();
		this._item.getSizeAsPoint(size);
		const cx = size.x;
		const cy = size.y;
		JSG.ptCache.release(size);

		// check side center
		if (!snap && portMode & ItemAttributes.PortMode.SIDESCENTER) {
			p = checkDistance(point, 0, cy / 2, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx / 2, 0, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx, cy / 2, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx / 2, cy, result);
			if (p !== undefined) {
				return p;
			}
		}

		// check side center
		if (!snap && portMode & ItemAttributes.PortMode.SIDESQUARTER) {
			p = checkDistance(point, 0, cy / 4, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, 0, cy * 0.75, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx / 4, 0, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx * 0.75, 0, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx, cy / 4, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx, cy * 0.75, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx / 4, cy, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx * 0.75, cy, result);
			if (p !== undefined) {
				return p;
			}
		}

		// check corners
		if (!snap && portMode & ItemAttributes.PortMode.CORNERS) {
			p = checkDistance(point, 0, 0, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx, 0, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, cx, cy, result);
			if (p !== undefined) {
				return p;
			}
			p = checkDistance(point, 0, cy, result);
			if (p !== undefined) {
				return p;
			}
		}

		if (p === undefined && portMode & ItemAttributes.PortMode.SHAPE) {
			const pointList = this.getPolygonPointList();
			// check border
			p = pointList.getOffsetFromSegment(point, pointGrid, tolerance, closed);
			if (p === undefined) {
				return undefined;
			}
			result = pointGrid.copy();
		}

		if (p === undefined) {
			return undefined;
		}

		result.x -= p.x;
		result.y -= p.y;

		return result;
	}

	// _notifyObserver(what) {
	// if (this._item && this._notificationEnabled) {
	// this._item.onShapeChanged(this, what);
	// }
	// };

	_shapeWillChange(detailId) {
		const event = new ShapeEvent(detailId);
		event.doIt = true;
		event.source = this._item;
		if (this._item !== undefined && this._notificationEnabled === true) {
			this._initShapeEvent(event);
			this._item.sendPreEvent(event);
		}
		return event;
	}

	_initShapeEvent(event, ...args) {
		// subclasses may overwrite:
		// fill event info:
		switch (event.detailId) {
			case ShapeEvent.COORD_ADD:
			case ShapeEvent.COORDS_REPLACE_ALL:
				[event.value] = args;
				break;
			case ShapeEvent.COORDS_INSERT_AT:
				[event.index, event.value] = args;
				break;
			case ShapeEvent.COORDS_REMOVE_AT:
				[event.index] = args;
				event.count = args.length > 1 ? args[1] : undefined;
				break;
			case ShapeEvent.COORDS_REPLACE_AT:
				[event.index] = args;
				if (args.length > 2) {
					[, event.coordX, event.coordY] = args;
				} else {
					[, event.coordinate] = args;
				}
				break;
			default:
				break;
		}
	}

	_shapeDidChange(event) {
		if (this._item !== undefined && this._notificationEnabled === true) {
			this._item.sendPostEvent(event);
		}
	}

	/**
	 * Evaluates this shape, i.e. all of its coordinates.
	 *
	 * @method evaluate
	 */
	evaluate() {
		this._evalCoords(this._coordinates);
	}

	_evalCoords(coords) {
		// TODO: JSG.idUpdater is set by JSGGlobals
		if (this._item !== undefined && !this._item._reading && (JSG.idUpdater && !JSG.idUpdater.isActive)) {
			let coordinate;
			for (let i = 0; i < coords.length; i += 1) {
				coordinate = coords[i];
				coordinate.evaluate(this._item);
			}
		}
	}

	invalidateTerms() {
		this._coordinates.forEach((coordinate) => {
			coordinate.invalidateTerms();
		});
	}

	/**
	 * Resolves parent references of all inner coordinates.</br>
	 * The optional <code>doRemove</code> flag can be used to clear the complete formula of each coordinate.
	 *
	 * @method resolveParentReference
	 * @param {Boolean} [doRemove] Specify <code>true</code> to completely remove formula of inner coordinates.
	 */
	resolveParentReference(doRemove) {
		const coords = this._coordinates;

		coords.forEach((coordinate) => {
			coordinate.resolveParentReference(this._item, doRemove);
		});
	}

	// TODO (ah) TESTING PURPOSE  - review -
	refresh() {
		if (this._refreshEnabled === true) {
			this._fillPointList(this._coordpointlist, this.getCoordinates());
		}
	}
	/**
	 * The default, generic shape type.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'graphitem';
	}
}

module.exports = Shape;
