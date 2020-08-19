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
const CoordinateSystem = require('./CoordinateSystem');

/**
 * MetricCoordinateSystem. A coordinate systems defines the transformation between pixel or device coordinates and
 * coordinates used in a graph. This coordinate system uses metric coordinates. One logical unit corresponds
 * to 1/100 mm. The system provides scaling or zooming within the coordinate system.
 *
 * @example:
 *      var cs = new MetricCoordinateSystem();
 *      // convert 1cm to pixel on the screen
 *      var xDevPos = cs.logToDeviceX(1000);
 *      // convert 100 pixel to 1/100th mm
 *      var xMMPos = cs.deviceToLogX(100);
 *
 * @class MetricCoordinateSystem
 * @extends CoordinateSystem
 * @constructor
 */
class MetricCoordinateSystem extends CoordinateSystem {
	constructor() {
		super();

		this._majorUnit = 1000;
		this._minorUnit = 500;
		this._deviceRatio = 1;
	}

	getZoom(ratio = false) {
		return ratio ? this._zoom * this._deviceRatio : this._zoom;
	}

	setDeviceRatio(ratio) {
		this._deviceRatio = ratio;
	}

	getDeviceRatio() {
		return this._deviceRatio;
	}

	logToDeviceX(x, ratio = true) {
		return x / 2540 * this._dpiX * this.getZoom(ratio);
	}

	/**
	 * Transforms a logical coordinate to a device coordinate not regarding the current zoom.
	 *
	 * @method logToDeviceXNoZoom
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	logToDeviceXNoZoom(x, ratio = true) {
		return x / 2540 * this._dpiX * (ratio ? this._deviceRatio : 1);
	}

	logToDeviceY(y, ratio = true) {
		return y / 2540 * this._dpiY * this.getZoom(ratio);
	}

	/**
	 * Transforms a logical coordinate to a device coordinate not regarding the current zoom.
	 *
	 * @method logToDeviceYNoZoom
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	logToDeviceYNoZoom(y, ratio = true) {
		return y / 2540 * this._dpiY * (ratio ? this._deviceRatio : 1);
	}

	deviceToLogX(x, ratio = false) {
		return x * 2540 / this._dpiX / this.getZoom(ratio);
	}

	deviceToLogY(y, ratio = false) {
		return y * 2540 / this._dpiY / this.getZoom(ratio);
	}

	deviceToLogXNoZoom(x, ratio = false) {
		return x * 2540 / this._dpiX / (ratio ? this._deviceRatio : 1);
	}

	deviceToLogYNoZoom(y, ratio = false) {
		return y * 2540 / this._dpiY / (ratio ? this._deviceRatio : 1);
	}

	metricToLogX(x) {
		return x;
	}

	/**
	 * Transforms a metrical coordinate to a device coordinate.
	 *
	 * @method metricToDeviceX
	 * @param {Number} x Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToDeviceX(x) {
		return x / 2540 * this._dpiX;
	}

	/**
	 * Transforms a metrical coordinate to a device coordinate.
	 *
	 * @method metricToDeviceY
	 * @param {Number} y Coordinate to be transformed
	 * @return {Number}Transformed coordinate.
	 */
	metricToDeviceY(y) {
		return y / 2540 * this._dpiY;
	}

	metricToLogY(y) {
		return y;
	}

	metricToLogXNoZoom(x) {
		return x / this._zoom;
	}

	metricToLogYNoZoom(y) {
		return y / this._zoom;
	}

	getMajorUnitString(pos) {
		return pos / this._majorUnit;
	}

	getMinorUnitString(pos) {
		return pos / this._minorUnit;
	}

	toSVGUnit(unit) {
		return Math.round(this.logToDeviceX(unit) * 100) / 100;
	}

};

module.exports = MetricCoordinateSystem;
