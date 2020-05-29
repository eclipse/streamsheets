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
const Point = require('./Point');
/**
 * This module contains the GraphicSystem class that interacts with the canvas DOM element. This class
 * registers event handlers to enable user interface interactions and generates output to the canvas element.
 * It also contains classes that convert logical internal coordinates to device coordinates and classes
 * that generate visible output on a output medium like the canvas or an SVG file.
 */

/**
 * Default CoordinateSystem. Coordinate systems define the transformation between pixel or device coordinates and
 * coordinates used in a graph. The system provides scaling or zooming within the coordinate system.
 * This coordinate system simply uses pixel coordinates and uses no transformation.
 *
 * @class CoordinateSystem
 * @constructor
 */
class CoordinateSystem {
	constructor() {
		this._majorUnit = 100;
		this._minorUnit = 10;
		this._zoom = 1.0;
		this._dpiX = JSG.dpi.x;
		this._dpiY = JSG.dpi.y;
	}

	/**
	 * Returns the current zoom factor.
	 *
	 * @method getZoom
	 * @return {Number} The current zoom factor.
	 */
	getZoom() {
		return this._zoom;
	}

	/**
	 * Set the current zoom factor.
	 *
	 * @method setZoom
	 * @param {Number} factor New zoom factor between 0.1 and 4
	 */
	setZoom(factor) {
		this._zoom = factor;
	}

	/**
	 * Transforms horizontal logical coordinates to device coordinates.
	 *
	 * @method logToDeviceX
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	logToDeviceX(x) {
		return x * this._zoom;
	}

	/**
	 * Transforms vertical logical coordinates to device coordinates.
	 *
	 * @method logToDeviceY
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	logToDeviceY(y) {
		return y * this._zoom;
	}

	/**
	 * Transforms horizontal device coordinates to logical coordinates.
	 *
	 * @method deviceToLogX
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	deviceToLogX(x) {
		return x / this._zoom;
	}

	/**
	 * Transforms vertical device coordinates to logical coordinates.
	 *
	 * @method deviceToLogY
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	deviceToLogY(y) {
		return y / this._zoom;
	}

	/**
	 * Transforms horizontal device coordinates to logical coordinates not regarding the zoom factor.
	 *
	 * @method deviceToLogXNoZoom
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	deviceToLogXNoZoom(x) {
		return x;
	}

	/**
	 * Transforms vertical device coordinates to logical coordinates not regarding the zoom factor.
	 *
	 * @method deviceToLogPoint
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	deviceToLogYNoZoom(y) {
		return y;
	}

	/**
	 * Transforms device point to logical point.
	 *
	 * @method deviceToLogPoint
	 * @param {Point} pt Point to be transformed
	 * @return {Point}Transformed point.
	 */
	deviceToLogPoint(pt, reusepoint) {
		const ptDev = reusepoint || new Point(0, 0);
		ptDev.x = this.deviceToLogX(pt.x);
		ptDev.y = this.deviceToLogY(pt.y);

		return ptDev;
	}

	/**
	 * Transforms a metrical coordinate to a logical coordinate. Metrical coordinates are given in 1/100 mm.
	 *
	 * @method metricToLogX
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToLogX(x) {
		return x / 2540 * this._dpiX;
	}

	/**
	 * Transforms a metrical coordinate to a logical coordinate not regarding the current zoom.
	 * Metrical coordinates are given in 1/100 mm.
	 *
	 * @method metricToLogXNoZoom
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToLogXNoZoom(x) {
		return x / 2540 * this._dpiX / this._zoom;
	}

	/**
	 * Transforms a metrical coordinate to a logical coordinate. Metrical coordinates are given in 1/100 mm.
	 *
	 * @method metricToLogY
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToLogY(y) {
		return y / 2540 * this._dpiY;
	}

	/**
	 * Transforms a metric coordinate to a logical coordinate not regarding the current zoom.
	 * Metric coordinates are given in 1/100 mm.
	 *
	 * @method metricToLogYNoZoom
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToLogYNoZoom(y) {
		return y / 2540 * this._dpiY / this._zoom;
	}

	/**
	 * Returns the major unit for the scale and grid.
	 *
	 * @method getMajorUnit
	 * @return {Number}Major unit.
	 */
	getMajorUnit() {
		return this._majorUnit;
	}

	/**
	 * Returns the minor unit for the scale and grid.
	 *
	 * @method getMinorUnit
	 * @return {Number}Minor Unit
	 */
	getMinorUnit() {
		return this._minorUnit;
	}

	/**
	 * Returns the major unit display string for the scale and grid.
	 *
	 * @method getMajorUnitString
	 * @return {String}Major unit string.
	 */
	getMajorUnitString(pos) {
		return pos;
	}

	/**
	 * Returns the minor unit display string for the scale and grid.
	 *
	 * @method getMinorUnitString
	 * @return {String}Minor unit string.
	 */
	getMinorUnitString(pos) {
		return pos;
	}

	/**
	 * Converts given value in units of coordinate system to a value in units of SVG.
	 *
	 * @method toSVGUnit
	 * @param {Number} unit The value to convert.
	 * @return {Number} Converted value.
	 */
	toSVGUnit(unit) {
		return unit;
	}

	/**
	 * @method round
	 * @param {Number} number The number to round
	 * @return {Number} Rounded number.
	 * @deprecated Don't use! Subject to be removed!
	 */
	round(number) {
		return number;// ~~ (number + (number > 0 ? .5 : -.5));
	}

	/**
	 * @method roundToMiddle
	 * @param {Number} number The number to round
	 * @return {Number} Rounded number.
	 * @deprecated Don't use! Subject to be removed!
	 */
	roundToMiddle(number) {
		return number;// ~~ (number + (number > 0 ? .5 : -.5)) + 0.5;
	}

}

module.exports = CoordinateSystem;
