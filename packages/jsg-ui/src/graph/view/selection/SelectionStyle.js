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
import { default as JSG, FormatAttributes } from '@cedalo/jsg-core';

let FILL = false;
let LINE_COLOR = '#777777';
let MARKER_FILL_COLOR = '#b6dbee';
let MARKER_FILL_COLOR_DISABLED = '#CCCCCC';
let MARKER_BORDER_COLOR = '#777777';
let MARKER_SIZE = 200;
let ROTATE_MARKER_DISTANCE = 800;

/**
 * A simple data class which provides default format styles used by the various
 * {{#crossLink "SelectionHandler"}}{{/crossLink}} to draw and mark current selection.
 *
 * @class SelectionStyle
 * @constructor
 */
class SelectionStyle {
	constructor() {
		// provide following style constants:
		/**
		 * The line color to use for drawing selection.
		 *
		 * @property lineColor
		 * @type {String}
		 */
		this.lineColor = SelectionStyle.LINE_COLOR;

		/**
		 * The line width to use for drawing selection.
		 *
		 * @property lineWidth
		 * @type {Number}
		 */
		this.lineWidth = FormatAttributes.LineStyle.HAIRLINE;

		/**
		 * The line style to use for drawing selection.
		 *
		 * @property lineStyle
		 * @type {FormatAttributes.LineStyle}
		 */
		this.lineStyle = FormatAttributes.LineStyle.DASH;

		/**
		 * Specifies if selection markers should be displayed.<br>
		 * See {{#crossLink "Marker"}}{{/crossLink}} too.
		 *
		 * @property areMarkersVisible
		 * @type {Boolean}
		 */
		this.areMarkersVisible = true;

		/**
		 * The marker fill color to use.<br>
		 * See {{#crossLink "Marker"}}{{/crossLink}} too.
		 *
		 * @property markerFillColor
		 * @type {String}
		 */
		this.markerFillColor = SelectionStyle.MARKER_FILL_COLOR;
		/**
		 * The marker fill color to use if the marker is disabled.<br>
		 * See {{#crossLink "Marker"}}{{/crossLink}} too.
		 *
		 * @property markerFillColorDisabled
		 * @type {String}
		 */
		this.markerFillColorDisabled = SelectionStyle.MARKER_FILL_COLOR_DISABLED;
		/**
		 * The marker border color to use .<br>
		 * See {{#crossLink "Marker"}}{{/crossLink}} too.
		 *
		 * @property markerBorderColor
		 * @type {String}
		 */
		this.markerBorderColor = SelectionStyle.MARKER_BORDER_COLOR;
		/**
		 * The marker size to use.<br>
		 * See {{#crossLink "Marker"}}{{/crossLink}} too.
		 *
		 * @property markerSize
		 * @type {Number}
		 */
		this.markerSize = SelectionStyle.MARKER_SIZE;
		/**
		 * The distance of a rotation marker to its corresponding {{#crossLink
		 * "GraphItem"}}{{/crossLink}}.<br> See {{#crossLink "RotationMarker"}}{{/crossLink}} too.
		 *
		 * @property rotateMarkerDistance
		 * @type {Number}
		 */
		this.rotateMarkerDistance = SelectionStyle.ROTATE_MARKER_DISTANCE;
		/**
		 * Specifies if a rotation marker should be displayed.<br>
		 * See {{#crossLink "RotationMarker"}}{{/crossLink}} too.
		 *
		 * @property isRotateMarkerVisible
		 * @type {Boolean}
		 */
		this.isRotateMarkerVisible = true;
	}

	/**
	 * Creates a new <code>SelectionStyle</code> based on this instance.
	 * @method copy
	 * @return {SelectionStyle} A copy of this instance.
	 * @since 2.0.20.5
	 */
	copy() {
		const cp = new SelectionStyle();

		Object.keys(this).forEach((prop) => {
			cp[prop] = this[prop];
		});

		return cp;
	}

	/**
	 * Called by framework to adjust values based on touch or mouse events.
	 * @method resize
	 */
	resize() {
		this.markerSize = SelectionStyle.MARKER_SIZE;
		this.rotateMarkerDistance = SelectionStyle.ROTATE_MARKER_DISTANCE;
	}

	/**
	 * Resets all style values to their defaults.
	 *
	 * @method reset
	 * @deprecated NOT USED ANYMORE! We wanted to keep changes of styles!
	 */
	reset() {}

	// We keep them as default style values AND BECAUSE THEY ARE USED ELSEWHERE :/
	static get FILL() {
		return FILL;
	}
	static set FILL(value) {
		FILL = value;
	}
	static get LINE_COLOR() {
		return LINE_COLOR;
	}
	static set LINE_COLOR(value) {
		LINE_COLOR = value;
	}
	static get MARKER_FILL_COLOR() {
		return MARKER_FILL_COLOR;
	}
	static set MARKER_FILL_COLOR(value) {
		MARKER_FILL_COLOR = value;
	}
	static get MARKER_FILL_COLOR_DISABLED() {
		return MARKER_FILL_COLOR_DISABLED;
	}
	static set MARKER_FILL_COLOR_DISABLED(value) {
		MARKER_FILL_COLOR_DISABLED = value;
	}
	static get MARKER_BORDER_COLOR() {
		return MARKER_BORDER_COLOR;
	}
	static set MARKER_BORDER_COLOR(value) {
		MARKER_BORDER_COLOR = value;
	}
	static get MARKER_SIZE() {
		return MARKER_SIZE;
	}
	static set MARKER_SIZE(value) {
		MARKER_SIZE = value;
	}
	static get ROTATE_MARKER_DISTANCE() {
		return ROTATE_MARKER_DISTANCE;
	}
	static set ROTATE_MARKER_DISTANCE(value) {
		ROTATE_MARKER_DISTANCE = value;
	}
}

export default SelectionStyle;
