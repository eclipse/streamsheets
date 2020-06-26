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
import { Arrays, FormatAttributes, Matrix, MathUtils, Point, default as JSG } from '@cedalo/jsg-core';

import View from '../../ui/View';
import SelectionStyle from './selection/SelectionStyle';
import ShapeMarker from './ShapeMarker';

let _tmpmarker;

/**
 * A special view which is shown while editing {{#crossLink "Shape"}}{{/crossLink}} points.</br>
 * At each point location a so called {{#crossLink "ShapeMarker"}}{{/crossLink}}
 * is placed which can be moved to adjust corresponding shape point.
 *
 * @class EditShapeView
 * @extends View
 * @param {CoordinateSystem} cs The CoordinateSystem used to define the marker size.
 * @constructor
 */
class EditShapeView extends View {
	constructor(cs) {
		super();

		this._markers = undefined;
		this._isClosed = true;
		this._origin = new Point(0, 0);
		this._rotmatrix = new Matrix();
		this._markersize = cs.metricToLogXNoZoom(EditShapeView.MARKER_SIZE);
	}

	/**
	 * Returns the shared _tmpmarker instance. If currently <code>undefined</code> a new one will be created.
	 *
	 * @method _getTmpMarker
	 * @return {ShapeMarker} The shared _tmpmarker instance
	 * @private
	 */
	_getTmpMarker() {
		if (!_tmpmarker) {
			_tmpmarker = new ShapeMarker(-1, new Point(0, 0), this._markersize);
			_tmpmarker.isTemporary = true;
		}
		return _tmpmarker;
	}

	/**
	 * Specifies the points at which {{#crossLink "ShapeMarker"}}{{/crossLink}}s are shown.</br>
	 * That means that all currently used markers are removed and a new one is added for each point
	 * within provided PointList.
	 *
	 * @method setPointList
	 * @param {PointList} pointlist The list of points to show the markers at.
	 * @param {Point} origin The new origin of this edit view.
	 * @param {Number} angle The rotation angle to use for this edit view.
	 */
	setPointList(pointlist, origin, angle) {
		const self = this;
		const halfMarkerSize = this._markersize / 2;

		this._origin.setTo(origin);
		this._rotmatrix.setAngle(angle);
		this._markers = [];

		pointlist.forEach((point, index) => {
			const p = point.copy();
			p.x -= halfMarkerSize;
			p.y -= halfMarkerSize;
			self._markers.push(new ShapeMarker(index, p, self._markersize));
		});
	}

	/**
	 * Specifies if the edited {{#crossLink "Shape"}}{{/crossLink}} is closed.
	 *
	 * @method setIsClosed
	 * @param {Boolean} doIt Specify <code>true</code> to close edited Shape, <code>false</code> otherwise.
	 */
	setIsClosed(doIt) {
		this._isClosed = doIt;
	}

	/**
	 * Translates given Point to this view, i.e. the point should be defined relative to the parent of
	 * this view.
	 *
	 * @method translatePoint
	 * @param {Point} point The point to translate.
	 * @return {Point} The translated point.
	 */

	translatePoint(point) {
		point.subtract(this._origin);
		this._rotmatrix.rotatePointInverse(point);
		return point;
	}

	/**
	 * Draw the temporary markers and lines of the edited shape.
	 *
	 * @method draw
	 * @param {Graphics} graphics Graphics to draw to.
	 */
	draw(graphics) {
		graphics.save();
		graphics.translate(this._origin.x, this._origin.y);
		graphics.rotate(this._rotmatrix.getAngle());

		graphics.setLineColor('#000000');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		let lastPoint;
		let startPoint;

		function drawLine(start, end) {
			graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
			// DASH);
			graphics.drawLine(start, end);
		}

		this._markers.forEach((marker) => {
			if (!startPoint) {
				startPoint = marker.center;
			}
			if (lastPoint) {
				drawLine(lastPoint, marker.center);
			}
			lastPoint = marker.center;
		});

		if (this._isClosed) {
			drawLine(lastPoint, startPoint);
		}

		this._markers.forEach((marker) => {
			marker.draw(graphics);
		});

		graphics.restore();
	}

	/**
	 * Returns the Marker instance at specified index.</br>
	 * <b>Note:</b> the index must be within the markers range!! It is not checked!
	 *
	 * @method getMarker
	 * @param {Number} index The index of the Marker to get.
	 * @return {ShapeMarker} the Marker at specified index.
	 */
	getMarker(index) {
		return this._markers[index];
	}

	/**
	 * Insert given Marker into the list of all displayed Markers.</br>
	 * The insert position is defined by {{#crossLink
	 * "ShapeMarker/index:property"}}{{/crossLink}}. If it is <code>-1</code> a new marker
	 * instance will be added at the end of this list.
	 *
	 * @method insertMarker.
	 * @param {ShapeMarker} marker The Marker to insert.
	 * @return {ShapeMarker} The inserted Marker.
	 */
	insertMarker(marker) {
		if (marker.index === -1) {
			const newmarker = new ShapeMarker(marker._insertIndex, new Point(0, 0), this._markersize);
			Arrays.insertAt(this._markers, newmarker.index, newmarker);
			return newmarker;
		}
		return marker;
	}

	/**
	 * Removes given Marker from the list of all displayed markers.
	 *
	 * @method deleteMarker
	 * @param {ShapeMarker} marker The marker to remove.
	 */
	deleteMarker(marker) {
		Arrays.remove(this._markers, marker);
	}

	/**
	 * Returns an Array of Points defined by the center points of all markers.
	 *
	 * @method getMarkerPoints
	 * @return {Array} A list of all markers center points.
	 */
	getMarkerPoints() {
		const points = [];
		const self = this;
		this._markers.forEach((marker) => {
			const point = marker.center.copy();
			points.push(point);
		});
		return points;
	}

	/**
	 * Returns the number of markers currently displayed.
	 *
	 * @method getMarkerCount
	 * @return {Number} The number of displayed markers
	 */
	getMarkerCount() {
		return this._markers.length;
	}

	/**
	 * returns the Marker for specified location or <code>undefined</code> if no marker could be found.
	 *
	 * @method getMarkerAt
	 * @param {Point} location The marker location.
	 * @return {ShapeMarker} The Marker or <code>undefined</code>.
	 */
	getMarkerAt(location, tolerance) {
		let _marker;
		const tmpmarker = this._getTmpMarker();
		const halfMarkerSize = this._markersize / 2;

		const getLineMarker = (linestart, lineend) => {
			const isInBounds = () => {
				const minX = Math.min(linestart.x, lineend.x) - halfMarkerSize;
				const maxX = Math.max(linestart.x, lineend.x) + halfMarkerSize;
				const minY = Math.min(linestart.y, lineend.y) - halfMarkerSize;
				const maxY = Math.max(linestart.y, lineend.y) + halfMarkerSize;
				return minX < location.x && location.x < maxX && minY < location.y && location.y < maxY;
			};

			if (isInBounds()) {
				const distance = MathUtils.getLinePointDistance(linestart, lineend, location);
				return distance <= tolerance ? tmpmarker : undefined;
			}

			return undefined;
		};

		Arrays.every(this._markers, (marker) => {
			if (marker.contains(location, tolerance)) {
				_marker = marker;
				return false;
			}
			return true;
		});

		if (!_marker) {
			// check lines...
			const last = this._markers.length - 1;
			let i;

			for (i = 0; i < last; i += 1) {
				_marker = getLineMarker(this._markers[i].center, this._markers[i + 1].center, tolerance);
				if (_marker) {
					_marker._insertIndex = i + 1;
					break;
				}
			}
			if (!_marker && this._isClosed) {
				_marker = getLineMarker(this._markers[0].center, this._markers[last].center, tolerance);
				if (_marker) {
					_marker._insertIndex = last + 1;
				}
			}
		}

		return _marker;
	}

	/**
	 * The default used marker size.
	 *
	 * @property MARKER_SIZE
	 * @type Numeric
	 * @static
	 */
	static get MARKER_SIZE() {
		return SelectionStyle.MARKER_SIZE;
	}
}

export default EditShapeView;
