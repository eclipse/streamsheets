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

/**
 * Creates a 2D coordinate based on {NumberExpression}s
 *
 * @class CoordinateProxy
 * @constructor
 */
class CoordinateProxy extends Coordinate {
	constructor(coordinate) {
		super();
		// this._tag = tag;
		// this._observer = observer;
		this._coordinate = coordinate;
	}

	/**
	 * Returns the original coordinate of this CoordinateProxy.</br>
	 * <b>Note:</b> this provides direct access to the underlying coordinate!
	 *
	 * @method getCoordinate
	 * @return {Coordinate} The original coordinate of this CoordinateProxy.
	 */
	getCoordinate() {
		return this._coordinate;
	}

	/**
	 * Creates and returns a new <code>Coordinate</code> instance based on current internal state of this
	 * <code>CoordinateProxy</code>.<br/>
	 * Subclasses might overwrite to return a customized <code>Coordinate</code>.
	 *
	 * @method createNewCoordinate
	 * @return {Coordinate} A new <code>Coordinate</code> based on internal state.
	 * @since 1.6.15
	 */
	createNewCoordinate() {
		const point = this.toPoint(JSG.ptCache.get());
		const coord = Coordinate.fromPoint(point);
		JSG.ptCache.release(point);
		return coord;
	}

	save(name, writer) {
		// have to save last value! because we use it if we cannot restore this proxy! (e.g. edge/port)
		const point = this.toPoint(JSG.ptCache.get());
		this._coordinate.getX().setValue(point.x);
		this._coordinate.getY().setValue(point.y);
		this._coordinate.save(name, writer);
		JSG.ptCache.release(point);
	}

	read(reader, object) {
		this._coordinate.read(reader, object);
	}

	copy() {
		return new CoordinateProxy(this._coordinate);
		// , this._observer, this._tag);
	}

	evaluate(item) {
		this._coordinate.evaluate(item);
	}

	lockX(doIt) {
		this._coordinate.lockX(doIt);
	}

	lockY(doIt) {
		this._coordinate.lockY(doIt);
	}

	getX() {
		return this._coordinate.getX();
	}

	getY() {
		return this._coordinate.getY();
	}

	setX(value) {
		return this._coordinate.setX(value);
	}

	setY(value) {
		return this._coordinate.setY(value);
	}

	translate(dx, dy) {
		return this._coordinate.translate(dx, dy);
	}

	toPoint(reusepoint) {
		return this._coordinate.toPoint(reusepoint);
	}
}

module.exports = CoordinateProxy;
