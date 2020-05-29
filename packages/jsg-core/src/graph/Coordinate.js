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
const Expression = require('./expr/Expression');
const NumberExpression = require('./expr/NumberExpression');
const Point = require('../geometry/Point');

/**
 * This class contains a 2D coordinate, defining a horizontal and a vertical coordinate to place an object in the
 * coordinate system. The coordinates are defined by Expressions, which allow the definition of formulas and
 * this way referencing properties of another GraphItem.
 *
 * @class Coordinate
 * @constructor
 * @param {Expression} [xExpression] Horizontal coordinate.
 * @param {Expression} [yExpression] Vertical coordinate.
 */
class Coordinate {
	constructor(xExpression, yExpression) {
		this._xExpression = xExpression || new NumberExpression(0);
		this._yExpression = yExpression || new NumberExpression(0);
	}

	/**
	 * Create a coordinate from an absolute x and an y value given as a point. This function creates static expressions
	 * for the coordinate.
	 *
	 * @method fromPoint
	 * @param {Point} point Point with coordinate values to use.
	 * @return {Coordinate} New allocated coordinate.
	 * @static
	 */
	static fromPoint(point) {
		return Coordinate.fromXY(point.x, point.y);
	}

	/**
	 * Create a coordinate from an absolute x and an y value. This function create statics expressions for the
	 * coordinate.
	 *
	 * @method fromXY
	 * @param {Number} x X Coordinate to use.
	 * @param {Number} y Y Coordinate to use.
	 * @return {Coordinate} New allocated coordinate.
	 * @static
	 */
	static fromXY(x, y) {
		return new Coordinate(new NumberExpression(x), new NumberExpression(y));
	}

	/**
	 * Description
	 *
	 * @method fromRelativeXY
	 * @param {Number} x A factor for a coordinate expression to use. The coordinate will be created by defining a
	 *     formula : factor + " * WIDTH". This way the coordinate is calculated using the height of the object
	 * @param {Number} y A factor for a coordinate expression to use. The coordinate will be created by defining a
	 *     formula : factor + " * HEIGHT". This way the coordinate is calculated using the height of the object
	 * @return {Coordinate} New allocated coordinate.
	 * @static
	 */
	static fromRelativeXY(x, y) {
		return new Coordinate(
			new Expression(0, `${x} * WIDTH`),
			new Expression(0, `${y} * HEIGHT`)
		);
	}

	/**
	 * Create a default coordinate with the coordinates set to 0.
	 *
	 * @method Factory
	 * @ {Coordinate} New allocated coordinate.
	 * @static
	 */
	static Factory() {
		return Coordinate.fromXY(0, 0);
	}

	/**
	 * Saves a coordinate.<br/>
	 * Note: the last parameter is optional and defines a map of additional attributes to be saved too. These
	 * attributes
	 * are <code>String</code>-<code>String</code> pairs and set to the coordinate again on {{#crossLink
	 * "Coordinate/read:method"}}{{/crossLink}}.
	 *
	 * @method save
	 * @param {String} name Tag to create for the coordinate.
	 * @param {Writer} writer Writer to use.
	 * @param {Dictionary} [attributes] An optional Map of name-value pairs to save as coordinate attributes.
	 */
	save(name, writer, attributes) {
		writer.writeStartElement(name);
		this._saveAttributes(attributes, writer);
		this._xExpression.save('x', writer);
		this._yExpression.save('y', writer);
		writer.writeEndElement();
	}

	/**
	 * Saves given attributes.<br/>
	 *
	 * @method _saveAttributes
	 * @param {Dictionary} [attributes] An optional Map of name-value pairs to save as coordinate attributes.
	 * @param {Writer} writer Writer to use.
	 * @private
	 * @since 1.6.0
	 */
	_saveAttributes(attributes, writer) {
		if (attributes) {
			attributes.iterate((key, value) => {
				writer.writeAttributeString(key, value);
			});
		}
	}

	/**
	 * Read a coordinate.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 * @since 3.0
	 */
	read(reader, object) {
		this._readAttributes(reader, object);

		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'x':
					this._xExpression.read(reader, child);
					break;
				case 'y':
					this._yExpression.read(reader, child);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Reads attributes from given object and adds them to this coordinate.<br/>
	 *
	 * @method _readAttributes
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 * @private
	 * @since 3.0
	 */
	_readAttributes(reader, object) {
		reader.iterateAttributes(object, (name, value) => {
			this[name] = value;
		});
	}

	/**
	 * Checks if this coordinate is equal to the given one. Equal means that both coordinates have the
	 * same x and y expressions.</br>
	 * <b>Note:</b> instead of passing a coordinate instance it is also possible to call this method with
	 * x and y expressions as well or with its corresponding values!</br>
	 * See {{#crossLink "BooleanExpression"}}{{/crossLink}} to get information about equality
	 * of expressions.
	 *
	 * @method isEqualTo
	 * @param {Coordinate} coordinate The other coordinate to check against.
	 * @return {Boolean} <code>true</code> if both coordinates are equal, <code>false</code> otherwise.
	 */
	isEqualTo(...args) {
		const equals = (xExpression, yExpression) =>
			this._xExpression.isEqualTo(xExpression) &&
			this._yExpression.isEqualTo(yExpression);

		const equalsToValueOrExpression = (xValue, yValue) =>
			this._xExpression.isEqualToExpressionOrValue(xValue) &&
			this._yExpression.isEqualToExpressionOrValue(yValue);

		const coordinate = args[0];

		return args.length === 2
			? equalsToValueOrExpression(coordinate, args[1])
			: coordinate !== undefined &&
					equals(coordinate._xExpression, coordinate._yExpression);
	}

	/**
	 * Copy a coordinate
	 *
	 * @method copy
	 * @return {Coordinate} Copy of this coordinate.
	 */
	copy() {
		const copy = new Coordinate();
		copy.set(this._xExpression.copy(), this._yExpression.copy());
		return copy;
	}

	/**
	 * Evaluate all formulas in this coordinate. The parser will parse, evaluate the formula strings and create
	 * precompiled terms.
	 *
	 * @method evaluate
	 * @param {GraphItem} item Item, this coordinate belongs to.
	 */
	evaluate(item) {
		this._xExpression.evaluate(item);
		this._yExpression.evaluate(item);
	}

	/**
	 * Invalidate all terms of the pin. This will have the effect that the formulas are parsed and calculated again.
	 *
	 * @method invalidateTerms
	 */
	invalidateTerms() {
		this._xExpression.invalidateTerm();
		this._yExpression.invalidateTerm();
	}

	/**
	 * Resolves parent references within inner Expression.</br>
	 * The passed GraphItem is used to resolve the parent item and the optional <code>doRemove</code>
	 * flag can be used to clear the complete formula of inner Expressions.
	 *
	 * @method resolveParentReference
	 * @param {GraphItem} item Used to resolve parent reference.
	 * @param {Boolean} [doRemove] Specify <code>true</code> to remove inner formula completely.
	 */
	resolveParentReference(item, doRemove) {
		this._xExpression.resolveParentReference(item, doRemove);
		this._yExpression.resolveParentReference(item, doRemove);
	}

	/**
	 * Lock the expressions in this coordinate. This way the formulas and and values of the coordinate can not be
	 * changed.
	 *
	 * @method lock
	 * @param {Boolean} lock Enable or disable lock.
	 */
	lock(doIt) {
		this.lockX(doIt);
		this.lockY(doIt);
	}

	/**
	 * Lock the X expression in this coordinate. This way the formulas and and values of the X-coordinate can not be
	 * changed.
	 *
	 * @method lock
	 * @param {Boolean} lock Enable or disable lock.
	 */
	lockX(doIt) {
		this._xExpression.setLocked(doIt !== undefined ? doIt : false);
	}

	/**
	 * Lock the Y expression in this coordinate. This way the formulas and and values of the Y-coordinate can not be
	 * changed.
	 *
	 * @method lock
	 * @param {Boolean} lock Enable or disable lock.
	 */
	lockY(doIt) {
		this._yExpression.setLocked(doIt !== undefined ? doIt : false);
	}

	/**
	 * Return the X Coordinate.
	 *
	 * @method getX
	 * @return {BooleanExpression} X Coordinate Expression.
	 */
	getX() {
		return this._xExpression;
	}

	/**
	 * Return the Y Coordinate.
	 *
	 * @method getY
	 * @return {BooleanExpression} Y Coordinate Expression.
	 */
	getY() {
		return this._yExpression;
	}

	/**
	 * Assign the coordinates properties of another coordinate to this coordinate.
	 *
	 * @method setTo
	 * @param {Coordinate} coordinate Coordinate to copy properties from.
	 * @return {Boolean} <code>true</code> if coordinate was changed, <code>false</code> otherwise.
	 */
	setTo(coordinate) {
		if (coordinate !== undefined) {
			return this.set(coordinate._xExpression, coordinate._yExpression);
		}
		return false;
	}

	/**
	 * Assign values to a coordinate using a point. The result will contain static coordinate values and overwrite any
	 * formula.
	 *
	 * @method setToPoint
	 * @param {Point} point Point with x and y coordinate.
	 * @return {Boolean} <code>true</code> if coordinate was changed, <code>false</code> otherwise.
	 */
	setToPoint(point) {
		return this.set(point.x, point.y);
	}

	/**
	 * Assign new expressions or values to the coordinate.
	 *
	 * @method set
	 * @param {BooleanExpression} xExpression X Expression to assign.
	 * @param {BooleanExpression} yExpression Y Expression to assign.
	 * @return {Boolean} <code>true</code> if at least one expression was set, <code>false</code> otherwise.
	 */
	set(xExpression, yExpression) {
		let changed = false;
		changed = this.setX(xExpression) || changed;
		changed = this.setY(yExpression) || changed;
		return changed;
	}

	/**
	 * Assign a new expression or value to the X coordinate.
	 *
	 * @method setX
	 * @param {BooleanExpression} xExpression X Expression to assign.
	 * @return {Boolean} <code>true</code> if new expression was set, <code>false</code> otherwise.
	 */
	setX(xExpression) {
		return this._xExpression.setExpressionOrValue(xExpression);
	}

	/**
	 * Assign a new expression or value to the Y coordinate.
	 *
	 * @method setY
	 * @param {BooleanExpression} yExpression Y Expression to assign.
	 * @return {Boolean} <code>true</code> if new expression was set, <code>false</code> otherwise.
	 */
	setY(yExpression) {
		return this._yExpression.setExpressionOrValue(yExpression);
	}

	/**
	 * Move the values of the coordinate by the given values. Any formula contained in the expressions will be
	 * overwritten.
	 *
	 * @method translate
	 * @param {Number} dx Units to move in the horizontal direction.
	 * @param {Number} dy Units to move in the vertical direction.
	 * @return {Boolean} <code>true</code> if coordinate was changed, <code>false</code> otherwise.
	 */
	translate(dx, dy) {
		// TODO (ah & mr) remove this method? better use setToPoint()????
		// TODO (ah): think, if we are relative, should we stay relative?
		// TODO this overwrites formulas which is not always intended
		let changed = false;
		changed =
			this._xExpression.set(this._xExpression.getValue() + dx) || changed; // clears formula and term!
		changed =
			this._yExpression.set(this._yExpression.getValue() + dy) || changed; // clears formula and term!
		return changed;
	}

	/**
	 * Retrieves the values of the coordinate as a Point.
	 *
	 * @method toPoint
	 * @param {type} [reusepoint] Point to use for return value.
	 * @return {Point} Point containing the x and y value of the coordinate.
	 */
	toPoint(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		point.set(this._xExpression.getValue(), this._yExpression.getValue());

		return point;
	}

	/**
	 * Returns a string representation of this Coordinate instance.
	 *
	 * @method toString
	 * @return {String} String with x and y expressions.
	 */
	toString() {
		return `(${this._xExpression.toString()}, ${this._yExpression.toString()})`;
	}
}

module.exports = Coordinate;
