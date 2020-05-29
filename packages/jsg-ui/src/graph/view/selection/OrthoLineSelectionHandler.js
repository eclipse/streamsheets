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
import { Arrays, Coordinate, GraphUtils, Point, default as JSG } from '@cedalo/jsg-core';
import LineSelectionHandler from './LineSelectionHandler';
import SelectionHandle from './SelectionHandle';
import Marker from './Marker';
import Cursor from '../../../ui/Cursor';

/**
 * A LineSelectionHandler subclass to handle the single selection of a {{#crossLink
 * "LineConnection"}}{{/crossLink}} with an orthogonal shape. This handler adds additional {{#crossLink
 * "Marker"}}{{/crossLink}}s at the center of each line segment.<br/> An instance is created
 * via {{#crossLink "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class OrthoLineSelectionHandler
 * @extends LineSelectionHandler
 * @constructor
 * @param {GraphItemView} view The view which represent current selected LineConnection.
 */
class OrthoLineSelectionHandler extends LineSelectionHandler {
	constructor(view) {
		super(view);

		// we draw additional center markers on each line segment...
		this._centermarkers = [];
		this._centerMarkerFactory = () => new Marker(0, Coordinate.fromXY(0, 0));
	}

	drawSelection(graphics) {
		const style = this.getSelectionStyle();
		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(style.markerSize);
		this._drawinfo = {};
		this._drawinfo.center = new Point(0, 0);
		this._drawinfo.prevPoint = new Point(0, 0);
		this._drawinfo.centersize = (markersize * 3) / 4;

		super.drawSelection(graphics);
		delete this._drawinfo;
	}

	_drawMarkerPoints(points, graphics) {
		// create our centermarkers array:
		Arrays.keep(this._centermarkers, points.length - 1, this._centerMarkerFactory);
		this._drawinfo.lastpoint = points.length - 1;
		this._drawinfo.prevPoint.setTo(points[0]);
		// remember prev. point because points[] is changed during draw!!

		super._drawMarkerPoints(points, graphics);
	}

	_drawMarkerAt(index, point, marker, style, graphics) {
		let centermarker;

		function getCenterPoint(p1, p2, reusepoint) {
			const center = reusepoint || new Point(0, 0);
			center.x = (p2.x - p1.x) / 2;
			center.y = (p2.y - p1.y) / 2;
			return center.add(p1);
		}

		if (this._lineview._item.isMoveable()) {
			if (index > 0) {
				centermarker = this._centermarkers[index - 1];
				centermarker.setSize(this._drawinfo.centersize);
				// draw inner marker rects smaller...
				this._drawinfo.center = getCenterPoint(this._drawinfo.prevPoint, point, this._drawinfo.center);
				this._drawinfo.prevPoint.setTo(point);
				super._drawMarkerAt(index, this._drawinfo.center, centermarker, style, graphics);
			}
		}
		super._drawMarkerAt(index, point, marker, style, graphics);
	}

	getHandleAt(point, event, reusehandle) {
		let i;
		let n;
		const item = this._lineview._item;
		let handleFound = false;
		const threshold = item.getGraph().getFindRadius();
		let loc = JSG.ptCache.get().setTo(point);

		const handle = reusehandle || new SelectionHandle();
		handle.reset();

		// check, if point over label
		for (i = 0, n = item.getItemCount(); i < n; i += 1) {
			const label = item.getItemAt(i);
			const box = label.getTranslatedBoundingBox(item.getGraph());
			if (box.containsPoint(loc)) {
				handleFound = true;
				break;
			}
		}

		if (!handleFound) {
			const marker = this._getMarkerAt(loc, threshold);
			if (marker) {
				if (marker._isCenter) {
					if (item.isMoveable()) {
						handle.setType(SelectionHandle.TYPE.MOVE);
						handle.setCursor(marker._cursor);
						handle.setPointIndex(marker._index);
					}
				} else if (item.isSizeable()) {
					handle.setType(SelectionHandle.TYPE.RESIZE);
					handle.setCursor(marker._cursor);
					handle.setPointIndex(marker._index);
				}
			} else if (item.isSizeable()) {
				// check if we touched line:
				loc = GraphUtils.translatePointDown(loc, item.getGraph(), item.getParent());
				const segmentIndex = this._lineview.getLineSegmentAtPoint(loc, threshold / 2);
				if (segmentIndex !== -1) {
					handle.setType(SelectionHandle.TYPE.RESIZE);
					handle.setCursor(Cursor.Style.CROSS);
					handle._segmentIndex = segmentIndex;
				}
			}
		}
		JSG.ptCache.release(loc);
		return handle;
	}

	_getMarkerAt(point, threshold) {
		let marker = super._getMarkerAt(point, threshold);

		if (!marker) {
			if (this._lineview._item.isMoveable()) {
				for (let i = 0; i < this._centermarkers.length; i += 1) {
					if (this._centermarkers[i].containsPoint(point, threshold)) {
						this._centermarkers[i]._index = i;
						this._centermarkers[i]._isCenter = true;
						this._centermarkers[i]._cursor = Cursor.Style.MOVE;
						marker = this._centermarkers[i];
						break;
					}
				}
			}
		}
		return marker;
	}
}

export default OrthoLineSelectionHandler;
