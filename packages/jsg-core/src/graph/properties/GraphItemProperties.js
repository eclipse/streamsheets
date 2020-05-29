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
const Properties = require('./Properties');

/**
 * Class to provide a property set related to the GraphItem. The properties
 * can be used to enumerate and change core GraphItem settings. The properties are also used
 * to provide references to the GraphItem settings for Expressions.
 * The following properties are available and can be used by Expressions:
 *
 * * WIDTH
 * * HEIGHT
 *
 * @class GraphItemProperties
 * @extends Properties
 * @constructor
 */
class GraphItemProperties extends Properties {
	constructor() {
		super();

		GraphItemProperties.WIDTH = this.addProperty('WIDTH', 'getWidth', 'setWidth');
		GraphItemProperties.HEIGHT = this.addProperty('HEIGHT', 'getHeight', 'setHeight');
	}

	/**
	 * Helper function to get X Coordinate of Pin.
	 *
	 * @method getPinX
	 * @return {Number} X Coordinate of Pin.
	 * @private
	 */
	static getPinX() {
		return this._pin.getX();
	}

	/**
	 * Helper function to get X Coordinate of Pin.
	 *
	 * @method setPinX
	 * @param {Number} x X Coordinate of Pin.
	 * @private
	 */
	static setPinX(x) {
		this._pin.setX(x);
	}

	/**
	 * Helper function to get Y Coordinate of Pin.
	 *
	 * @method getPinY
	 * @return {Number} Y Coordinate of Pin.
	 * @private
	 */
	static getPinY() {
		return this._pin.getY();
	}

	/**
	 * Helper function to get Y Coordinate of Pin.
	 *
	 * @method setPinY
	 * @param {Number} y Y Coordinate of Pin.
	 * @private
	 */
	static setPinY(yExpr) {
		this._pin.setY(yExpr);
	}

	/**
	 * Helper function to get X Coordinate of LocalPin.
	 *
	 * @method getLocalPinX
	 * @return {Number} X Coordinate of LocalPin.
	 * @private
	 */
	static getLocalPinX() {
		return this._pin.getLocalX();
	}

	/**
	 * Helper function to get X Coordinate of LocalPin.
	 *
	 * @method setLocalPinX
	 * @param {Number} x X Coordinate of Local Pin.
	 * @private
	 */
	static setLocalPinX(xExpr) {
		this._pin.setLocalX(xExpr);
	}

	/**
	 * Helper function to get Y Coordinate of LocalPin.
	 *
	 * @method getPinY
	 * @return {Number} Y Coordinate of LocalPin.
	 * @private
	 */
	static getLocalPinY() {
		return this._pin.getLocalY();
	}

	/**
	 * Helper function to get Y Coordinate of LocalPin.
	 *
	 * @method setLocalPinY
	 * @param {Number} y Y Coordinate of Local Pin.
	 * @private
	 */
	static setLocalPinY(yExpr) {
		this._pin.setLocalY(yExpr);
	}

	/**
	 * Helper function to get X Coordinate of Origin.
	 *
	 * @method getOriginX
	 * @return {Number} X Coordinate of Origin.
	 * @private
	 */
	static getOriginX() {
		const origin = this.getOrigin(JSG.ptCache.get());
		const x = origin.x;
		JSG.ptCache.release(origin);
		return x;
	}

	/**
	 * Helper function to get X Coordinate of origin.
	 *
	 * @method setLocalPinX
	 * @param {Number} x X Coordinate of origin.
	 * @private
	 */
	static setOriginX(x) {
		const origin = this.getOrigin(JSG.ptCache.get());
		origin.x = x;
		this.setOriginTo(origin);
		JSG.ptCache.release(origin);
	}

	/**
	 * Helper function to get Y Coordinate of Origin.
	 *
	 * @method getOriginY
	 * @return {Number} Y Coordinate of Origin.
	 * @private
	 */
	static getOriginY() {
		const origin = this.getOrigin(JSG.ptCache.get());
		const y = origin.y;
		JSG.ptCache.release(origin);
		return y;
	}

	/**
	 * Helper function to get Y Coordinate of origin.
	 *
	 * @method setLocalPinY
	 * @param {Number} y Y Coordinate of origin.
	 * @private
	 */
	static setOriginY(y) {
		const origin = this.getOrigin(JSG.ptCache.get());
		origin.y = y;
		this.setOriginTo(origin);
		JSG.ptCache.release(origin);
	}

	/**
	 * Helper function to get the X coordinate of top-left point of corresponding <code>BoundingBox</code> relative to
	 * parent coordinate-system.
	 *
	 * @method getTopLeftX
	 * @return {Number} The X coordinate of <code>BoundingBox</code> top-left point.
	 * @private
	 */
	static getTopLeftX() {
		const bbox = this.getBoundingBox(JSG.boxCache.get());
		const tl = bbox.getTopLeft(JSG.ptCache.get());
		const tlX = tl.x;
		JSG.ptCache.release(tl);
		JSG.boxCache.release(bbox);
		return tlX;
	}

	/**
	 * Helper function to get the Y coordinate of top-left point of corresponding <code>BoundingBox</code> relative to
	 * parent coordinate-system.
	 *
	 * @method getTopLeftY
	 * @return {Number} The Y coordinate of <code>BoundingBox</code> top-left point.
	 * @private
	 */
	static getTopLeftY() {
		const bbox = this.getBoundingBox(JSG.boxCache.get());
		const tl = bbox.getTopLeft(JSG.ptCache.get());
		const tlY = tl.y;
		JSG.ptCache.release(tl);
		JSG.boxCache.release(bbox);
		return tlY;
	}

	/**
	 *
	 * @method setTopLeftX
	 * @param {Number} x X coordinate of <code>BoundingBox</code> top-left point.
	 * @private
	 */
	static setTopLeftX(x) {
		const bbox = this.getBoundingBox(JSG.boxCache.get());
		bbox.setLeft(x);
		this.setBoundingBoxTo(bbox);
		JSG.boxCache.release(bbox);
	}

	/**
	 *
	 * @method setTopLeftY
	 * @param {Number} y Y coordinate of <code>BoundingBox</code> top-left point.
	 * @private
	 */
	static setTopLeftY(y) {
		const bbox = this.getBoundingBox(JSG.boxCache.get());
		bbox.setTop(y);
		this.setBoundingBoxTo(bbox);
		JSG.boxCache.release(bbox);
	}

	static getReshapePointX(index) {
		index = index !== undefined ? index : 0;
		if (index < this._reshapeCoordinates.length) {
			return this._reshapeCoordinates[index].getX();
		}
		return undefined;
	}

	static setReshapePointX(index, value) {
		index = index !== undefined ? index : 0;
		if (index < this._reshapeCoordinates.length) {
			this.setReshapeCoordinateAt(index, value, undefined);
		}
	}

	static getReshapePointY(index) {
		index = index !== undefined ? index : 0;
		if (index < this._reshapeCoordinates.length) {
			return this._reshapeCoordinates[index].getY();
		}

		return undefined;
	}

	static setReshapePointY(index, value) {
		index = index !== undefined ? index : 0;
		if (index < this._reshapeCoordinates.length) {
			this.setReshapeCoordinateAt(index, undefined, value);
		}
	}
}

module.exports = GraphItemProperties;
