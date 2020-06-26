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
const Point = require('../geometry/Point');
const Rectangle = require('../geometry/Rectangle');
const NumberExpression = require('./expr/NumberExpression');

/**
 * Creates a new Size instance. A size objects contains the width and height of an item. These properties are
 * defined using Expressions, which can hold a static value or a formula.
 *
 * @example
 *    // set size of GraphItem to 2 by 2 cm with given GraphItem
 *    var size = new Size(2000, 2000);
 *
 *    item.setSizeTo(size);
 *
 * @class Size
 * @constructor
 * @param {NumberExpression} [wExpr] Initial width expression or value
 * @param {NumberExpression} [hExpr] Initial height expression or value
 */
class Size {
	constructor(wExpr, hExpr) {
		this._wExpr = new NumberExpression(0);
		this._hExpr = new NumberExpression(0);
		if (wExpr) {
			this._wExpr.setExpressionOrValue(wExpr);
		}
		if (hExpr) {
			this._hExpr.setExpressionOrValue(hExpr);
		}
	}

	/**
	 * Checks if this size instance is equal to the given one. Equal means that both sizes have the
	 * same width and height expressions.</br>
	 * <b>Note:</b> instead of passing a size instance it is also possible to call this method with
	 * width and height expressions as well or with its corresponding values!</br>
	 * See {{#crossLink "BooleanExpression"}}{{/crossLink}} to get information about equality
	 * of expressions.
	 *
	 * @method isEqualTo
	 * @param {Size|NumberExpression|Number} size Either a <code>Size</code> object to check
	 *     against or the width expression or value.
	 * @param {NumberExpression|Number} [height] A height expression or value. Should be specified if no
	 * <code>Size</code> object was passed as first parameter.
	 * @return {Boolean} <code>true</code> if both sizes are equal, <code>false</code> otherwise.
	 */
	isEqualTo(size, height) {
		function equals(self, wExpr, hExpr) {
			return (
				self._wExpr.isEqualTo(wExpr, 5) &&
				self._hExpr.isEqualTo(hExpr, 5)
			);
		}

		function equalsToValueOrExpression(self, xValue, yValue) {
			return (
				self._wExpr.isEqualToExpressionOrValue(xValue, 5) &&
				self._hExpr.isEqualToExpressionOrValue(yValue, 5)
			);
		}

		return arguments.length === 2
			? equalsToValueOrExpression(this, size, height)
			: size !== undefined && equals(this, size._wExpr, size._hExpr);
	}

	/**
	 * Copy this object.
	 *
	 * @method copy
	 * @return {Size} A copy of this object.
	 */
	copy() {
		return new Size(this._wExpr.copy(), this._hExpr.copy());
	}

	/**
	 * Recalculate the formulas in this object.
	 *
	 * @method evaluate
	 * @param {GraphItem} item Item the size object belongs to. This is necessary to resolve references.
	 */
	evaluate(item) {
		this._wExpr.evaluate(item);
		this._hExpr.evaluate(item);
	}

	/**
	 * Invalidate all terms of the pin. This will have the effect that the formulas are parsed and calculated again.
	 *
	 * @method invalidateTerms
	 */
	invalidateTerms() {
		this._hExpr.invalidateTerm();
		this._wExpr.invalidateTerm();
	}

	/**
	 * Resolves parent references within inner width and height formula expressions.</br>
	 * The passed GraphItem is used to resolve its parent and the optional <code>doRemove</code>
	 * flag can be used to clear the complete formula.
	 *
	 * @method resolveParentReference
	 * @param {GraphItem} item Used to resolve parent reference.
	 * @param {Boolean} [doRemove] Specify <code>true</code> to remove inner formula completely.
	 */
	resolveParentReference(item, doRemove) {
		this._wExpr.resolveParentReference(item, doRemove);
		this._hExpr.resolveParentReference(item, doRemove);
	}

	/**
	 * Retrieve the width expression.
	 *
	 * @method getWidth
	 * @return {NumberExpression} Width.
	 */
	getWidth() {
		return this._wExpr;
	}

	/**
	 * Retrieve the height expression.
	 *
	 * @method getHeight
	 * @return {NumberExpression} Height.
	 */
	getHeight() {
		return this._hExpr;
	}

	/**
	 * Assign the values of another Size object to this object.
	 *
	 * @method setTo
	 * @param {Size} size Size object to copy values from.
	 */
	setTo(size) {
		this.set(size._wExpr, size._hExpr);
	}

	/**
	 * Assign a new width and height.
	 *
	 * @method set
	 * @param {NumberExpression} wExpression New width expression.
	 * @param {NumberExpression} wExpression New height expression.
	 */
	set(wExpression, hExpression) {
		this.setWidth(wExpression);
		this.setHeight(hExpression);
	}

	/**
	 * Sets the expression or value to use for width. It can be a value of a formula.
	 *
	 * @method setWidth
	 * @param {NumberExpression} wExpression New width expression.
	 */
	setWidth(value) {
		this._wExpr.setExpressionOrValue(value);
	}

	/**
	 * Sets the expression or value to use for height. It can be a value of a formula.
	 *
	 * @method setHeight
	 * @param {NumberExpression} wExpression New height expression.
	 */
	setHeight(value) {
		this._hExpr.setExpressionOrValue(value);
	}

	/**
	 * Retrieve the width and height as a point object.
	 *
	 * @method toPoint
	 * @param {Point} [reusepoint] Point to use as a return value. If not specified, a new point will be
	 *     allocated.
	 * @return {Point} Point, containing the width and height, as x and y values.
	 */
	toPoint(reusepoint) {
		const point = reusepoint || new Point(0, 0);
		point.x = this.getWidth().getValue();
		point.y = this.getHeight().getValue();

		return point;
	}

	/**
	 * Retrieve the width and height as a Rectangle object. The x and y are set to 0.
	 *
	 * @method toRectangle
	 * @param {Rectangle} [reuserect] Rectangle to use as a return value. If not specified, a new
	 *     rectangle will be allocated.
	 * @return {Rectangle} Rectangle, containing the width and height.
	 */
	toRectangle(reuserect) {
		const rect = reuserect || new Rectangle(0, 0, 0, 0);
		rect.width = this.getWidth().getValue();
		rect.height = this.getHeight().getValue();
		return rect;
	}

	/**
	 * Retrieve the width and height as a String.
	 *
	 * @method toString
	 * @return {String} String representation of the size object.
	 */
	toString() {
		return `(${this.getWidth()
			.getValue()
			.toFixed(2)},${this.getHeight()
			.getValue()
			.toFixed(2)})`;
	}

	/**
	 * Save the object to an XML stream.
	 *
	 * @method save
	 * @param {String} name Tag name for the size object.
	 * @param {Writer} writer Writer to use for saving.
	 */
	save(name, writer) {
		writer.writeStartElement(name);
		this._wExpr.save('w', writer);
		this._hExpr.save('h', writer);
		writer.writeEndElement();
	}

	/**
	 * Read the object.
	 *
	 * @method save
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'w':
				case 'width':
					this._wExpr.read(reader, child);
					break;
				case 'h':
				case 'height':
					this._hExpr.read(reader, child);
					break;
				default:
					break;
			}
		});
	}
}

module.exports = Size;
