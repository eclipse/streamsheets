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
import { Arrays, FormatAttributes, Point, PointList, default as JSG } from '@cedalo/jsg-core';
import EditShapeView from './EditShapeView';
import ShapeMarker from './ShapeMarker';
import SelectionStyle from './selection/SelectionStyle';

const MARKER_SIZE = 100;

class BezierShapeMarker extends ShapeMarker {
	draw(graphics) {
		graphics.setFillColor(SelectionStyle.MARKER_FILL_COLOR);

		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(MARKER_SIZE) / 2;
		const rect = JSG.rectCache.get();

		this._bounds.copy();
		rect.x = this._bounds.getCenterX() - markersize;
		rect.y = this._bounds.getCenterY() - markersize;
		rect.width = markersize * 2;
		rect.height = markersize * 2;
		graphics.drawMarker(rect, false);

		JSG.rectCache.release(rect);
	}
}

/**
 * This subclass of EditShapeView should be used to edit {{#crossLink
 * "BezierShape"}}{{/crossLink}} instances.
 *
 * @class EditBezierShapeView
 * @extends EditShapeView
 * @param {CoordinateSystem} cs The CoordinateSystem used to define the marker size.
 * @constructor
 */
class EditBezierShapeView extends EditShapeView {
	constructor(cs) {
		super(cs);

		this._cpMarkersize = cs.metricToLogXNoZoom(EditBezierShapeView.MARKER_SIZE);
	}

	setCpToPointList(pointlist, origin, angle) {
		const self = this;
		const halfMarkerSize = this._cpMarkersize / 2;

		this._origin.setTo(origin);
		this._rotmatrix.setAngle(angle);
		this._cpToMarkers = [];

		pointlist.forEach((point, index) => {
			const p = point.copy();
			p.x -= halfMarkerSize;
			p.y -= halfMarkerSize;
			self._cpToMarkers.push(new BezierShapeMarker(index, p, self._cpMarkersize));
		});
	}

	setCpFromPointList(pointlist, origin, angle) {
		const self = this;
		const halfMarkerSize = this._cpMarkersize / 2;

		this._origin.setTo(origin);
		this._rotmatrix.setAngle(angle);
		this._cpFromMarkers = [];

		pointlist.forEach((point, index) => {
			const p = point.copy();
			p.x -= halfMarkerSize;
			p.y -= halfMarkerSize;
			self._cpFromMarkers.push(new BezierShapeMarker(index, p, self._cpMarkersize));
		});
	}

	draw(graphics) {
		graphics.save();
		graphics.translate(this._origin.x, this._origin.y);
		graphics.rotate(this._rotmatrix.getAngle());

		graphics.setLineColor('#000000');
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

		graphics.beginPath();
		graphics.moveTo(this._markers[0].center.x, this._markers[0].center.y);

		let i;
		let n;

		for (i = 1, n = this._markers.length; i < n; i += 1) {
			graphics.bezierCurveTo(
				this._cpToMarkers[i - 1].center.x,
				this._cpToMarkers[i - 1].center.y,
				this._cpFromMarkers[i].center.x,
				this._cpFromMarkers[i].center.y,
				this._markers[i].center.x,
				this._markers[i].center.y
			);
		}

		if (this._isClosed) {
			graphics.bezierCurveTo(
				this._cpToMarkers[this._markers.length - 1].center.x,
				this._cpToMarkers[this._markers.length - 1].center.y,
				this._cpFromMarkers[0].center.x,
				this._cpFromMarkers[0].center.y,
				this._markers[0].center.x,
				this._markers[0].center.y
			);
			graphics.closePath();
		}

		graphics.stroke();

		this._markers.forEach((marker) => {
			marker.draw(graphics);
		});

		graphics.setLineColor('#AAAAAA');
		graphics.setFillColor('#FFFFFF');

		for (i = 0, n = this._markers.length; i < n; i += 1) {
			if (i < n - 1 || this._isClosed) {
				graphics.drawLine(this._markers[i].center, this._cpToMarkers[i].center);
			}
			if (i || this._isClosed) {
				graphics.drawLine(this._markers[i].center, this._cpFromMarkers[i].center);
			}
		}

		graphics.setLineColor('#000000');

		i = this._isClosed ? 0 : 1;
		for (i, n = this._cpFromMarkers.length; i < n; i += 1) {
			this._cpFromMarkers[i].draw(graphics);
		}

		n = this._isClosed ? this._cpToMarkers.length : this._cpToMarkers.length - 1;
		for (i = 0; i < n; i += 1) {
			this._cpToMarkers[i].draw(graphics);
		}

		graphics.restore();
	}

	insertMarker(marker) {
		if (marker.index === -1) {
			const newmarker = new ShapeMarker(
				marker._insertIndex,
				new Point(0, 0),
				this._markersize
			);
			Arrays.insertAt(this._markers, newmarker.index, newmarker);

			const newCpFromMarker = new BezierShapeMarker(marker._insertIndex, new Point(0, 0), this._cpMarkersize);
			Arrays.insertAt(this._cpFromMarkers, newmarker.index, newCpFromMarker);

			const newCpToMarker = new BezierShapeMarker(marker._insertIndex, new Point(0, 0), this._cpMarkersize);
			Arrays.insertAt(this._cpToMarkers, newmarker.index, newCpToMarker);

			return newmarker;
		}
		return marker;
	}

	deleteMarker(marker) {
		Arrays.remove(this._markers, marker);
	}

	deleteCpToMarker(marker) {
		Arrays.remove(this._cpToMarkers, marker);
	}

	deleteCpFromMarker(marker) {
		Arrays.remove(this._cpFromMarkers, marker);
	}

	getMarkerPoints(absolute) {
		return this._getMarkerPoints(absolute, this._markers);
	}

	getCpFromMarkerPoints(absolute) {
		return this._getMarkerPoints(absolute, this._cpFromMarkers);
	}

	getCpToMarkerPoints(absolute) {
		return this._getMarkerPoints(absolute, this._cpToMarkers);
	}

	_getMarkerPoints(absolute, markers) {
		const points = [];
		const self = this;
		markers.forEach((marker) => {
			const point = marker.center.copy();
			if (absolute === true) {
				self._rotmatrix.rotatePoint(point);
				point.add(self._origin);
			}
			points.push(point);
		});
		return points;
	}

	getMarkerCount() {
		return this._markers.length;
	}

	getMarkerAt(location, tolerance) {
		let _marker = this._getMarkerAt(location, this._markers, tolerance);
		const tmpmarker = this._getTmpMarker();

		const computeCubicBaseValue = (t, a, b, c, d) => {
			const mt = 1 - t;
			return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
		};

		const getBezierMarker = (linestart, lineend, cpTo, cpFrom) => {
			const pointList = new PointList();
			let t;
			let x;
			let y;

			for (t = 0; t < 1.0; t += 1.0 / 10.0) {
				x = computeCubicBaseValue(t, linestart.x, cpTo.x, cpFrom.x, lineend.x);
				y = computeCubicBaseValue(t, linestart.y, cpTo.y, cpFrom.y, lineend.y);

				pointList.addPoint(new Point(x, y));
			}

			return pointList.distance(location) < tolerance ? tmpmarker : undefined;
		};

		if (!_marker) {
			// check lines...
			const last = this._markers.length - 1;
			let i;
			for (i = 0; i < last; i += 1) {
				_marker = getBezierMarker(
					this._markers[i].center,
					this._markers[i + 1].center,
					this._cpToMarkers[i].center,
					this._cpFromMarkers[i + 1].center,
					tolerance
				);
				if (_marker) {
					_marker._insertIndex = i + 1;
					break;
				}
			}
			if (!_marker && this._isClosed) {
				_marker = getBezierMarker(
					this._markers[last].center,
					this._markers[0].center,
					this._cpToMarkers[last].center,
					this._cpFromMarkers[0].center,
					tolerance
				);
				if (_marker) {
					_marker._insertIndex = last + 1;
				}
			}
		}

		return _marker;
	}

	getCpFromMarkerAt(location, tolerance) {
		const marker = this._getMarkerAt(location, this._cpFromMarkers, tolerance);
		if (marker) {
			if (!this._isClosed & (marker.index === 0)) {
				return undefined;
			}
		}

		return marker;
	}

	getCpToMarkerAt(location, tolerance) {
		const marker = this._getMarkerAt(location, this._cpToMarkers, tolerance);
		if (marker) {
			if (!this._isClosed & (marker.index === this.getMarkerCount() - 1)) {
				return undefined;
			}
		}

		return marker;
	}

	_getMarkerAt(location, markers, tolerance) {
		let _marker;
		Arrays.every(markers, (marker) => {
			if (marker.contains(location, tolerance)) {
				_marker = marker;
				return false;
			}
			return true;
		});

		return _marker;
	}

	getCpFromMarker(index) {
		return this._cpFromMarkers[index];
	}

	getCpToMarker(index) {
		return this._cpToMarkers[index];
	}

	/**
	 * The default used marker size.
	 *
	 * @property MARKER_SIZE
	 * @type Numeric
	 * @static
	 */
	static get MARKER_SIZE() {
		return MARKER_SIZE;
	}
}

export default EditBezierShapeView;
