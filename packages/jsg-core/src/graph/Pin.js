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
const Point = require('../geometry/Point');
const MathUtils = require('../geometry/MathUtils');
const Coordinate = require('./Coordinate');
const Event = require('./model/events/Event');

const tmppoint = new Point(0, 0);
// predefined event details:
const EventID = {
	PIN: 'pin',
	PINX: 'pinx',
	PINY: 'piny',
	LOCAL: 'local',
	LOCALX: 'localx',
	LOCALY: 'localy'
};

/**
 * The pin describes the location of a GraphItem. It consists of two coordinates, the Pin and the LocalPin. The Pin
 * defines the location of the object in the coordinates space relative to its container, which can be the drawing area
 * or another container. The LocalPin places the Pin within the GraphItem. The LocalPin also serves as the rotation
 * center for the item. Pins are coordinates, which consist of Expressions. Therefore a Pin can be defined by formulas.
 * By default the LocalPin for a GraphItem is defined by two formulas placing it in the middle of the GraphItem (x =
 * WIDTH * 0.5, y = HEIGHT * 0.5).
 *
 * @class Pin
 * @constructor
 * @param {GraphItem} item GraphItem the pin belongs to.
 */
class Pin {
	constructor(item) {
		this._item = item;
		this._pin = new Coordinate();
		this._localpin = new Coordinate();
	}

	/**
	 * Copy the pin.
	 *
	 * @method copy
	 * @return {Pin} A copy of this pin.
	 */
	copy() {
		const copy = new Pin();
		copy.setTo(this);
		return copy;
	}

	static get EventId() {
		return EventID;
	}
	/**
	 * Save the pin.
	 *
	 * @method save
	 * @param {String} name Tag name to use.
	 * @param {Writer} writer Writer instance.
	 * @param {boolean} absolute Convert the coordinate to graph coordinates before saving, if true.
	 */
	save(name, writer, absolute) {
		writer.writeStartElement(name);
		if (absolute === true) {
			const absPin = this._pin.copy();
			let absPoint = this._pin.toPoint(JSG.ptCache.get());
			absPoint = this._item.getTranslatedPoint(
				absPoint,
				this._item.getGraph()
			);
			// set value directly to preserve Expression formula:
			absPin.getX().setValue(absPoint.x);
			absPin.getY().setValue(absPoint.y);
			absPin.save('p', writer);
			JSG.ptCache.release(absPoint);
		} else {
			this._pin.save('p', writer);
		}
		this._localpin.save('lp', writer);
		writer.writeEndElement();
	}

	/**
	 * Read the Pin.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		if (!object) {
			return;
		}

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'p':
					this._pin.read(reader, child);
					break;
				case 'lp':
					this._localpin.read(reader, child);
					break;
				// port only save pin directly
				case 'x':
					this._pin._xExpression.read(reader, child);
					break;
				case 'y':
					this._pin._yExpression.read(reader, child);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Evaluate the expressions in the Pin.
	 *
	 * @method evaluate
	 */
	evaluate() {
		this._pin.evaluate(this._item);
		this._localpin.evaluate(this._item);
	}

	/**
	 * Invalidate all terms of the pin. This will have the effect that the formulas are parsed and calculated again.
	 *
	 * @method invalidateTerms
	 */
	invalidateTerms() {
		this._pin.invalidateTerms();
		this._localpin.invalidateTerms();
	}

	/**
	 * Resolves parent references within inner pin and local pin Expressions.</br>
	 * The optional <code>clearFormula</code> flag can be used to clear the complete Expression formula.
	 *
	 * @method resolveParentReference
	 * @param {Boolean} [clearFormula] Specify <code>true</code> to remove inner Expression formula completely.
	 */
	resolveParentReference(clearFormula) {
		this._pin.resolveParentReference(this._item, clearFormula);
		this._localpin.resolveParentReference(this._item, clearFormula);
	}

	/**
	 * Lock the formulas in the Pin coordinate expressions. This way the formulas will not be
	 * overwritten by values.
	 *
	 * @method lockPin
	 * @param {Boolean} doIt Set or remove lock..
	 */
	lockPin(doIt) {
		this._pin.lock(doIt);
	}

	/**
	 * Lock the formulas in the LocalPin coordinate expressions. This way the formulas will not be
	 * overwritten by values.
	 *
	 * @method lockLocalPin
	 * @param {Boolean} doIt Set or remove lock..
	 */
	lockLocalPin(doIt) {
		this._localpin.lock(doIt);
	}

	/**
	 * Get the x expression of the Pin coordinate.
	 *
	 * @method getX
	 * @return {BooleanExpression} X Expression of the Pin coordinate.
	 */
	getX() {
		return this._pin.getX();
	}

	/**
	 * Get the y expression of the Pin coordinate.
	 *
	 * @method getY
	 * @return {BooleanExpression} Y Expression of the Pin coordinate.
	 */
	getY() {
		return this._pin.getY();
	}

	/**
	 * Get the x expression of the LocalPin coordinate.
	 *
	 * @method getX
	 * @return {BooleanExpression} X Expression of the LocalPin coordinate.
	 */
	getLocalX() {
		return this._localpin.getX();
	}

	/**
	 * Get the y expression of the LocalPin coordinate.
	 *
	 * @method getY
	 * @return {BooleanExpression} Y Expression of the LocalPin coordinate.
	 */
	getLocalY() {
		return this._localpin.getY();
	}

	/**
	 * Get the Pin coordinate as a Point.
	 *
	 * @method getPoint
	 * @param {Point} [reusepoint] Point to use for return to avoid new allocation.
	 * @return {Point} Pin coordinate as Point.
	 */
	getPoint(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		return this._pin.toPoint(point);
	}

	/**
	 * Get the LocalPin coordinate as a Point.
	 *
	 * @method getPoint
	 * @param {Point} [reusepoint] Point to use for return to avoid new allocation.
	 * @return {Point} Pin coordinate as Point.
	 */
	getLocalPoint(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		return this._localpin.toPoint(point);
	}

	/**
	 * Get the Pin coordinate.
	 *
	 * @method getCoordinate
	 * @param {Coordinate} reusecoordinate Coordinate to use for return to avoid new allocation.
	 * @return {Coordinate} Pin coordinate.
	 */
	getCoordinate(reusecoordinate) {
		const coordinate = reusecoordinate || new Coordinate();
		coordinate.setTo(this._pin);
		return coordinate;
	}

	/**
	 * Get the LocalPin coordinate.
	 *
	 * @method getLocalCoordinate
	 * @param {Coordinate} [reusecoordinate] Coordinate to use for return to avoid new allocation.
	 * @return {Coordinate} LocalPin coordinate.
	 */
	getLocalCoordinate(reusecoordinate) {
		const coordinate = reusecoordinate || new Coordinate();
		coordinate.setTo(this._localpin);
		return coordinate;
	}

	/**
	 * Set the X Expression of the Pin coordinate.
	 *
	 * @method setX
	 * @param {BooleanExpression} xExpression New expression for the x part of the Pin coordinate.
	 */
	setX(xExpression) {
		if (!this._pin.getX().isEqualToExpressionOrValue(xExpression, 2)) {
			this._setInternal(
				EventID.PINX,
				this._pin,
				this._pin.setX,
				xExpression
			);
		}
	}

	/**
	 * Set the Y Expression of the Pin coordinate.
	 *
	 * @method setY
	 * @param {BooleanExpression} yExpression New expression for the y part of the Pin coordinate.
	 */
	setY(yExpression) {
		if (!this._pin.getY().isEqualToExpressionOrValue(yExpression, 2)) {
			this._setInternal(
				EventID.PINY,
				this._pin,
				this._pin.setY,
				yExpression
			);
		}
	}

	/**
	 * Set new coordinates values for the Pin. The values with replace the Pin coordinates with the static expression
	 * values in the point.
	 *
	 * @method setPointTo
	 * @param {Point} point Point to use for Pin.
	 */
	setPointTo(point) {
		if (
			!this._pin.getX().isEqualToExpressionOrValue(point.x, 2) ||
			!this._pin.getY().isEqualToExpressionOrValue(point.y, 2)
		) {
			this._setInternal(
				EventID.PIN,
				this._pin,
				this._pin.setToPoint,
				point
			);
		}
	}

	/**
	 * Set new coordinates values for the Pin. The values with replace the Pin coordinates with the static expression
	 * values given.
	 *
	 * @method setPoint
	 * @param {Number} x Value for x coordinate of the Pin.
	 * @param {Number} y Value for y coordinate of the Pin.
	 */
	setPoint(x, y) {
		tmppoint.x = x;
		tmppoint.y = y;
		this.setPointTo(tmppoint);
	}

	/**
	 * Set the X Expression of the LocalPin coordinate.
	 *
	 * @method setLocalX
	 * @param {BooleanExpression} xExpression New expression for the x part of the LocalPin coordinate.
	 */
	setLocalX(xExpression) {
		if (!this._localpin.getX().isEqualToExpressionOrValue(xExpression, 2)) {
			this._setInternal(
				EventID.LOCALX,
				this._localpin,
				this._localpin.setX,
				xExpression
			);
		}
	}

	/**
	 * Set the Y Expression of the LocalPin coordinate.
	 *
	 * @method setLocalY
	 * @param {BooleanExpression} yExpression New expression for the y part of the LocalPin coordinate.
	 */
	setLocalY(yExpression) {
		if (!this._localpin.getY().isEqualToExpressionOrValue(yExpression, 2)) {
			this._setInternal(
				EventID.LOCALY,
				this._localpin,
				this._localpin.setY,
				yExpression
			);
		}
	}

	/**
	 * Set new coordinates values for the LocalPin. The values with replace the LocalPin coordinates with the static
	 * expression values in the point.
	 *
	 * @method setPointTo
	 * @param {Point} point Point to use for LocalPin.
	 */
	setLocalPointTo(point) {
		if (
			!this._localpin.getX().isEqualToExpressionOrValue(point.x, 2) ||
			!this._localpin.getY().isEqualToExpressionOrValue(point.y, 2)
		) {
			this._setInternal(
				EventID.LOCAL,
				this._localpin,
				this._localpin.setToPoint,
				point
			);
		}
	}

	/**
	 * Set new coordinates values for the LocalPin. The values with replace the pin coordinates with the static
	 * expression values given.
	 *
	 * @method setPoint
	 * @param {Number} x Value for x coordinate of the LocalPin.
	 * @param {Number} y Value for y coordinate of the LocalPin.
	 */
	setLocalPoint(x, y) {
		this.setLocalPointTo(new Point(x, y));
	}

	/**
	 * Assign a new coordinate to the Pin.
	 *
	 * @method setCoordinateTo
	 * @param {Coordinate} coordinate New coordinate to use for the Pin.
	 */
	setCoordinateTo(coordinate) {
		if (
			!this._pin.getX().isEqualTo(coordinate.getX(), 2) ||
			!this._pin.getY().isEqualTo(coordinate.getY(), 2)
		) {
			this._setInternal(
				EventID.PIN,
				this._pin,
				this._pin.setTo,
				coordinate
			);
		}
	}

	/**
	 * Define new coordinate expresssions for the Pin.
	 *
	 * @method setCoordinate
	 * @param {BooleanExpression} xExpression X Expression of the coordinate.
	 * @param {BooleanExpression} yExpression Y Expression of the coordinate.
	 */
	setCoordinate(xExpression, yExpression) {
		this.setCoordinateTo(new Coordinate(xExpression, yExpression));
	}

	/**
	 * Assign a new coordinate to the LocalPin.
	 *
	 * @method setLocalCoordinateTo
	 * @param {Coordinate} coo rdinate New coordinate to use for the LocalPin.
	 */
	setLocalCoordinateTo(coordinate) {
		if (
			!this._localpin.getX().isEqualTo(coordinate.getX(), 2) ||
			!this._localpin.getY().isEqualTo(coordinate.getY(), 2)
		) {
			this._setInternal(
				EventID.LOCAL,
				this._localpin,
				this._localpin.setTo,
				coordinate
			);
		}
	}

	/**
	 * Define new coordinate expresssions for the LocalPin.
	 *
	 * @method setLocalCoordinate
	 * @param {BooleanExpression} xExpression X Expression of the coordinate.
	 * @param {BooleanExpression} yExpression Y Expression of the coordinate.
	 */
	setLocalCoordinate(xExpression, yExpression) {
		this.setLocalCoordinateTo(new Coordinate(xExpression, yExpression));
	}

	/**
	 * Copy content from another pin.
	 *
	 * @method setTo
	 * @param {Pin} pin Pin to retrieve values from.
	 */
	setTo(pin) {
		// TODO this might raise 2 event sequences. one for pin and one for local pin...
		this.setCoordinateTo(pin._pin);
		this.setLocalCoordinateTo(pin._localpin);
	}

	/**
	 * Move the Pin by the given values.
	 *
	 * @method translate
	 * @param {Number} dX Value to move in the horizontal direction.
	 * @param {Number} dY Value to move in the vertical direction.
	 */
	translate(dX, dY) {
		const pin = this._pin.toPoint();
		pin.x += dX;
		pin.y += dY;
		this.setPoint(pin.x, pin.y);
	}

	/**
	 * Rotates this Pin around given point by specified angle.</br>
	 * The rotation point is optional and if not given the Pin will be rotated around its origin, i.e (0, 0).
	 *
	 * @method rotate
	 * @param {Number} angle Rotation angle in radians.
	 * @param {Point} [point] An optional rotation point.
	 */
	rotate(angle, point) {
		if (angle !== 0) {
			let pin = this._pin.toPoint();
			pin =
				point !== undefined
					? MathUtils.rotatePointAround(point, pin, angle)
					: MathUtils.rotatePoint(pin, angle);
			this.setPoint(pin.x, pin.y);
		}
	}

	_setInternal(detailId, scope, setter, value) {
		function sendPreEventTo(item, ldetailId, lvalue) {
			let event;
			if (item !== undefined) {
				event = new Event(
					Event.PIN,
					lvalue
				);
				event.detailId = ldetailId;
				event.source = item;
				item.sendPreEvent(event);
			}
			return event;
		}

		function sendPostEventTo(item, event) {
			if (item !== undefined && event !== undefined) {
				item.sendPostEvent(event);
			}
		}

		const event = sendPreEventTo(this._item, detailId, value);
		const doIt = event !== undefined ? event.doIt : true;
		if (doIt === true) {
			setter.call(scope, value);
			sendPostEventTo(this._item, event);
		}
	}
}

module.exports = Pin;
