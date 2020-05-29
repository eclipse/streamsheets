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
const Coordinate = require('./Coordinate');
const BezierCoordinate = require('./BezierCoordinate');
const CoordinateProxy = require('./CoordinateProxy');
const Point = require('../geometry/Point');
const Expression = require('./expr/Expression');

/**
 * A <code>BezierCoordinateProxy</code> is used as a replacement for a <code>CoordinateProxy</code> of a bezier
 * curve.<br/> Similar to a {{#crossLink "BezierCoordinate"}}{{/crossLink}} it manages a <code>cpTo</code>
 * and a
 * <code>cpFrom</code> property.
 *
 * @class BezierCoordinateProxy
 * @extends {CoordinateProxy}
 * @param {Coordinate} coordinate The coordinate to extend with control points coordinates.
 * @constructor
 * @since 1.6.15
 */
class BezierCoordinateProxy extends CoordinateProxy {
	constructor(coordinate) {
		super(coordinate);
		this.cpTo = new BezierCoordinateProxy.CpCoord(coordinate);
		this.cpFrom = new BezierCoordinateProxy.CpCoord(coordinate);
	}

	// overwritten
	copy() {
		const copy = new BezierCoordinateProxy(this._coordinate);
		copy.cpTo.offset.setTo(this.cpTo.offset);
		copy.cpFrom.offset.setTo(this.cpFrom.offset);
		return copy;
	}

	save(name, writer, attributes) {
		writer.writeStartElement(name);
		this._saveAttributes(attributes, writer);
		const point = this.toPoint(JSG.ptCache.get());
		// WE DON'T WANT TO CHANGE ORIGINAL COORDINATE...
		const coordinate = this.getCoordinate().copy();
		coordinate.setToPoint(point);
		coordinate.getX().save('x', writer);
		coordinate.getY().save('y', writer);
		this.cpTo.save('cpto', writer);
		this.cpFrom.save('cpfrom', writer);
		writer.writeEndElement();
		JSG.ptCache.release(point);
	}

	// overwritten
	createNewCoordinate() {
		const coord = new BezierCoordinate();
		const point = this.toPoint(JSG.ptCache.get());
		coord.setToPoint(point);
		coord.cpTo.setToPoint(this.cpTo.toPoint());
		coord.cpFrom.setToPoint(this.cpFrom.toPoint());
		JSG.ptCache.release(point);
		return coord;
	}
}

/**
 * An internal <code>Coordinate</code> subclass to use for control points. This class defines a <code>Coordinate</code>
 * with an offset relative to a given origin <code>Coordinate</code>.
 *
 * @class BezierCoordinateProxy.CpCoord
 * @extends Coordinate
 * @param {Coordinate} coordinate A coordinate to use as origin.
 * @constructor
 * @private
 */
BezierCoordinateProxy.CpCoord = class CpCoord extends Coordinate {
	constructor(coordinate) {
		super();
		this.coordinate = coordinate;
		this.offset = new Point();
	}

	// overwritten
	copy() {
		const copy = new BezierCoordinateProxy.CpCoord(this.coordinate);
		copy.offset.setTo(this.offset);
		return copy;
	}

	// overwritten
	save(name, writer, attributes) {
		const point = this.toPoint(JSG.ptCache.get());
		// WE DON'T WANT TO CHANGE ORIGINAL COORDINATE...
		const coordinate = new Coordinate();
		coordinate.setToPoint(point);
		coordinate.save(name, writer, attributes);
		JSG.ptCache.release(point);
	}

	// overwritten
	toPoint(reusepoint) {
		return this.coordinate.toPoint(reusepoint).add(this.offset);
	}

	// overwritten
	setTo(newcoord) {
		// set new offset...
		const origin = this.coordinate.toPoint(JSG.ptCache.get());
		const offset = newcoord.toPoint(JSG.ptCache.get()).subtract(origin);
		// this.set(offset.x, offset.y);
		this.offset.setTo(offset);
		JSG.ptCache.release(origin, offset);
	}

	// overwritten
	setX(xExp) {
		const origin = this.coordinate.toPoint(JSG.ptCache.get());
		let dX =
			xExp instanceof Expression ? xExp.getValue() : xExp;
		dX -= origin.x;
		this.offset.x = dX;
		JSG.ptCache.release(origin);
	}

	// overwritten
	setY(yExp) {
		const origin = this.coordinate.toPoint(JSG.ptCache.get());
		let dY =
			yExp instanceof Expression ? yExp.getValue() : yExp;
		dY -= origin.y;
		this.offset.y = dY;
		JSG.ptCache.release(origin);
	}

	// overwritten
	translate(dx, dy) {
		this.offset.x += dx;
		this.offset.y += dy;
	}
};

module.exports = BezierCoordinateProxy;
