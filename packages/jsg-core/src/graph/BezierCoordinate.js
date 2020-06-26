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
const BezierCoordinateProxy = require('./BezierCoordinateProxy');
const CoordinateProxy = require('./CoordinateProxy');

/**
 * A <code>Coordinate</code> subclass to use for points of a bezier curve.<br/>
 * A <code>BezierCoordinate</code> manages two additional coordinates namely a first control point which describes the
 * curve from a previous <code>BezierCoordinate</code> to this coordinate and a second control point which describes the
 * curve from this <code>BezierCoordinate</code> to the next one. These coordinates are available via
 * {{#crossLink "BezierCoordinate/cpTo:property"}}{{/crossLink}} and
 * {{#crossLink "BezierCoordinate/cpFrom:property"}}{{/crossLink}} respectively. Like the main coordinate its
 * control points are relative to the origin of the shape too.<br/>
 * Instances of this class are used by {{#crossLink "BezierLineShape"}}{{/crossLink}}.
 *
 * @class BezierCoordinate
 * @extends {Coordinate}
 * @param {BooleanExpression} [xExpression] An optional expression for horizontal coordinate.
 * @param {BooleanExpression} [yExpression] An optional expression for vertical coordinate.
 * @constructor
 * @since 1.6.15
 */
class BezierCoordinate extends Coordinate {
	constructor(xExpression, yExpression) {
		super(xExpression, yExpression);
		const point = this.toPoint(JSG.ptCache.get());
		/**
		 * The control coordinate to describe the curve to this <code>BezierCoordinate</code>. Often named as first
		 * control point. It is relative to the origin of the shape.
		 *
		 * @property cpTo
		 * @type {Coordinate}
		 */
		this.cpTo = Coordinate.fromPoint(point);
		/**
		 * The control coordinate to describe the curve from this <code>BezierCoordinate</code>. Often named as second
		 * control point. It is relative to the origin of the shape.
		 *
		 * @property cpFrom
		 * @type {Coordinate}
		 */
		this.cpFrom = Coordinate.fromPoint(point);
		JSG.ptCache.release(point);
	}

	/**
	 * Convenience method to create a new <code>BezierCoordinate</code> instance based on given coordinate.
	 *
	 * @method fromCoordinate
	 * @param  {Coordinate} coordinate A coordinate to use as base for new bezier-coordinate.
	 * @return {BezierCoordinate} A new <code>BezierCoordinate</code> instance.
	 */
	static fromCoordinate(coordinate) {
		if (coordinate instanceof BezierCoordinateProxy) {
			return coordinate;
		}
		if (coordinate instanceof CoordinateProxy) {
			return new BezierCoordinateProxy(coordinate);
		}
		return new BezierCoordinate(
			coordinate.getX().copy(),
			coordinate.getY().copy()
		);
	}

	/**
	 * Convenience method to create a new <code>BezierCoordinate</code> instance based on given <code>XML</code>.
	 *
	 * @method fromObject
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 * @return {BezierCoordinate} A new <code>BezierCoordinate</code> instance.
	 */
	static fromObject(reader, object) {
		const coord = new BezierCoordinate();
		coord.read(reader, object);
		return coord;
	}

	// overwritten
	copy() {
		const copy = new BezierCoordinate(
			this.getX().copy(),
			this.getY().copy()
		);
		copy.cpTo.setTo(this.cpTo);
		copy.cpFrom.setTo(this.cpFrom);
		return copy;
	}

	// overwritten
	save(name, writer, attributes) {
		writer.writeStartElement(name);
		this._saveAttributes(attributes, writer);
		this._xExpression.save('x', writer);
		this._yExpression.save('y', writer);
		this.cpTo.save('cpto', writer);
		this.cpFrom.save('cpfrom', writer);
		writer.writeEndElement();
	}

	// overwritten
	read(reader, object) {
		super.read(reader, object);
		let cpnode = reader.getObject(object, 'cpto');
		if (cpnode) {
			this.cpTo.read(reader, cpnode);
		}
		cpnode = reader.getObject(object, 'cpfrom');
		if (cpnode) {
			this.cpFrom.read(reader, cpnode);
		}
	}

	// overwritten
	evaluate(item) {
		super.evaluate(item);
		this.cpTo.evaluate(item);
		this.cpFrom.evaluate(item);
	}

	// overwritten
	invalidateTerms() {
		super.invalidateTerms();
		this.cpTo.invalidateTerms();
		this.cpFrom.invalidateTerms();
	}

	// overwritten
	setX(value) {
		const oldX = this.getX().getValue();
		const setX = super.setX(value);
		if (setX) {
			const dX = this.getX().getValue() - oldX;
			this.cpTo.setX(this.cpTo.getX().getValue() + dX);
			this.cpFrom.setX(this.cpFrom.getX().getValue() + dX);
		}
		return setX;
	}

	// overwritten
	setY(value) {
		const oldY = this.getY().getValue();
		const setY = super.setY(value);
		if (setY) {
			const dY = this.getY().getValue() - oldY;
			this.cpTo.setY(this.cpTo.getY().getValue() + dY);
			this.cpFrom.setY(this.cpFrom.getY().getValue() + dY);
		}
		return setY;
	}

	// overwritten
	translate(dx, dy) {
		super.translate(dx, dy);
		this.cpTo.translate(dx, dy);
		this.cpFrom.translate(dx, dy);
	}
}

module.exports = BezierCoordinate;
