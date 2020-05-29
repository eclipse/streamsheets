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
import { Arrays, BoundingBox, FormatAttributes, GraphUtils, Coordinate, Point, default as JSG } from '@cedalo/jsg-core';

import SelectionHandler from './SelectionHandler';
import SelectionHandle from './SelectionHandle';
import SelectionStyle from './SelectionStyle';
import Marker from './Marker';
import Styles from './Styles';
import Cursor from '../../../ui/Cursor';

/**
 * A SelectionHandler subclass to handle the single selection of a {{#crossLink
 * "LineConnection"}}{{/crossLink}}. It is created via {{#crossLink
 * "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class LineSelectionHandler
 * @extends SelectionHandler
 * @constructor
 * @param {GraphItemView} view The view which represent current selected LineConnection.
 */
class LineSelectionHandler extends SelectionHandler {
	constructor(view) {
		super(view);
		this._lineview = view;
		this._bbox = new BoundingBox(0, 0);
		this._linepoints = [];
		this._linemarkers = [];
		this._markerFactory = () => new Marker(0, Coordinate.fromXY(0, 0));
	}

	getBoundingBox(reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);
		bbox.setTo(this._bbox);
		return bbox;
	}

	containsPoint(point) {
		const item = this._lineview.getItem();
		const graph = item.getGraph();
		const radius = graph.getFindRadius();
		GraphUtils.translatePointDown(point, graph, item.getParent());
		return item.containsPoint(point, 0, radius);
	}

	getPinPoint(reusepoint) {
		return reusepoint || new Point(0, 0);
	}

	getRotationMarker() {
		return undefined;
	}

	refresh() {
		this._lineview.getTranslatedBoundingBox(this._lineview.getGraphView(), this._bbox);
	}

	drawSelection(graphics) {
		const line = this._lineview.getItem();
		const style = this.getSelectionStyle();
		const points = line.getPoints(this._linepoints);

		Arrays.keep(this._linemarkers, points.length, this._markerFactory);

		graphics.save();

		// apply styles:
		graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
		graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
		graphics.setLineColor(style.markerBorderColor);

		if (JSG.debug.SHOW_LINE_ORIGIN) {
			graphics.setFillColor('#FF0000');
			const pin = line.getPinPoint();
			const marker = this._linemarkers[0];
			marker._coordinate.set(pin.x, pin.y);
			marker.setSize(graphics.getCoordinateSystem().metricToLogXNoZoom(style.markerSize));
			marker.draw(graphics, style);
		}

		if (!style.areMarkersVisible) {
			graphics.setLineWidth(style.lineWidth);
			graphics.setLineColor(style.lineColor);
			graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
			this._drawPolyline(points, graphics);
		} else {
			if (line.isSizeable()) {
				graphics.setFillColor(style.markerFillColor);
			} else {
				graphics.setFillColor(style.markerFillColorDisabled);
			}
			this._drawMarkerPoints(points, graphics);
			const portstyle = LineSelectionHandler.PORT_MARKER_STYLE;
			if (portstyle.areMarkersVisible) {
				graphics.setFillColor(portstyle.markerFillColor);
				this._drawPortsMarker(line, graphics);
			}
		}

		graphics.restore();
	}

	_drawPortsMarker(line, graphics) {
		let port = line.getSourcePort && line.getSourcePort();
		this._drawPortMarker(port, line, graphics);

		port = line.getTargetPort && line.getTargetPort();
		this._drawPortMarker(port, line, graphics);
	}

	_drawPortMarker(port, line, graphics) {
		if (port) {
			const bounds = JSG.rectCache.get();
			const center = port.getCenter(JSG.ptCache.get());
			const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(SelectionStyle.MARKER_SIZE);
			const halfsize = markersize / 2;
			GraphUtils.translatePointUp(center, port, line.getGraph());
			bounds.x = center.x - halfsize;
			bounds.y = center.y - halfsize;
			bounds.width = markersize;
			bounds.height = markersize;
			graphics.drawMarker(bounds, true);
			JSG.ptCache.release(center);
			JSG.rectCache.release(bounds);
		}
	}

	/**
	 * Draws the line specified by given points.<br/>
	 * Note: given points are translated to Graph coordinate system.
	 *
	 * @method _drawPolyline
	 * @param {Array} points A list of points which specifies the line to draw.
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @private
	 */
	_drawPolyline(points, graphics) {
		const parent = this._lineview.getItem().getParent();
		const graph = parent.getGraph();

		points.forEach((point) => {
			GraphUtils.translatePointUp(point, parent, graph);
		});
		graphics.drawPolyline(points, false);
	}

	/**
	 * Draws a Marker for each given point.<br/>
	 * Note: given points are translated to Graph coordinate system.
	 *
	 * @method _drawMarkerPoints
	 * @param {Array} points A list of points to draw a Marker at.
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @private
	 */
	_drawMarkerPoints(points, graphics) {
		let marker;
		const style = this.getSelectionStyle();
		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(style.markerSize);

		points.forEach((point, i) => {
			marker = this._linemarkers[i];
			marker.setSize(markersize);
			this._drawMarkerAt(i, points[i], marker, style, graphics);
		});
	}

	/**
	 * Draws a Marker for given point and index.
	 *
	 * @method _drawMarkerAt
	 * @param {Number} index The point index of the drawn marker.
	 * @param {Point} point The location to draw the marker at.
	 * @param {Marker} marker The marker instance to draw.
	 * @param {SelectionHandlerFactory} style The current styles to use for drawing.
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 * @private
	 */
	_drawMarkerAt(index, point, marker, style, graphics) {
		const parent = this._lineview.getItem().getParent();
		const graph = parent.getGraph();
		const loc = JSG.ptCache.get().setTo(point);
		GraphUtils.translatePointUp(loc, parent, graph);
		marker._coordinate.set(loc.x, loc.y);
		marker.draw(graphics, style);
		JSG.ptCache.release(loc);
	}

	getHandleAt(point, event, reusehandle) {
		let i;
		let n;
		let handleFound = false;
		const item = this._lineview._item;
		let loc = JSG.ptCache.get().setTo(point);
		const graph = item.getGraph();
		const handle = reusehandle || new SelectionHandle();

		handle.reset();

		// check, if point over label
		for (i = 0, n = item.getItemCount(); i < n; i += 1) {
			const label = item.getItemAt(i);
			const box = label.getTranslatedBoundingBox(graph);
			if (box.containsPoint(loc)) {
				handleFound = true;
				break;
			}
		}
		if (!handleFound) {
			const self = this;
			const radius = graph.getFindRadius();
			const marker = this._getMarkerAt(loc, radius);
			if (marker) {
				if (this._lineview._item.isSizeable()) {
					handle.setType(SelectionHandle.TYPE.RESIZE);
					handle.setCursor(marker._cursor);
					handle.setPointIndex(marker._index);
				}
				// handle._isCenter = marker._isCenter;
			} else if (this._lineview._item.isMoveable()) {
				// check if we touched line:
				loc = GraphUtils.translatePointDown(loc, graph, this._lineview.getParent().getItem());
				if (this._lineview.containsPoint(loc, 0, radius)) {
					handle.setType(SelectionHandle.TYPE.MOVE);
					handle.setCursor(Cursor.Style.MOVE);
				}
			}
		}
		JSG.ptCache.release(loc);
		return handle;
	}

	/**
	 * Returns the Marker at specified location. The location point should be relative to global GraphView.
	 *
	 * @method _getMarkerAt
	 * @param {Point} point The location to look at.
	 * @param {Number} threshold Amount of hit tolerance.
	 * @return {Marker} The Marker at given location or <code>undefined</code>.
	 * @private
	 */
	_getMarkerAt(point, threshold) {
		let i;
		let marker;

		const cursorFromIndex = (index, markers) => {
			let cursor;
			if (index === 0) {
				cursor = Cursor.Style.RESIZE_NW;
			} else if (index === markers.length - 1) {
				cursor = Cursor.Style.RESIZE_SE;
			} else {
				cursor = Cursor.Style.RESIZE_NE;
			}
			return cursor;
		};

		for (i = 0; i < this._linemarkers.length; i += 1) {
			const linemarker = this._linemarkers[i];
			if (linemarker.containsPoint(point, threshold)) {
				linemarker._index = i;
				linemarker._isCenter = false;
				linemarker._cursor = cursorFromIndex(i, this._linemarkers);
				marker = linemarker;
				break;
			}
		}
		return marker;
	}
	static get PORT_MARKER_STYLE() {
		return Styles.PORT_MARKER;
	}
}

export default LineSelectionHandler;
