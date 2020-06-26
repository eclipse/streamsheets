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
import { Arrays, FormatAttributes, GraphUtils, Point, Coordinate, BoundingBox, default as JSG } from '@cedalo/jsg-core';
import SelectionHandler from './SelectionHandler';
import SelectionHandle from './SelectionHandle';
import Marker from './Marker';
import Cursor from '../../../ui/Cursor';

/**
 * A SelectionHandler subclass to handle a single selection of a {{#crossLink
 * "LineNode"}}{{/crossLink}}.<br/> Since a LineNode behaves like a {{#crossLink
 * "LineConnection"}}{{/crossLink}} its selection representation is similar to the selection
 * representation of LineConnection. However it is still a {{#crossLink "Node"}}{{/crossLink}}. A
 * LineSelectionHandler is created via {{#crossLink "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class LineNodeSelectionHandler
 * @constructor
 */
class LineNodeSelectionHandler extends SelectionHandler {
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
		const loc = GraphUtils.translatePointDown(point, graph, item.getParent());
		const radius = graph.getFindRadius();
		return item.containsPoint(loc, 0, radius);
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
		const node = this._lineview.getItem();
		const style = this.getSelectionStyle();

		graphics.save();

		if (!style.areMarkersVisible) {
			graphics.setLineWidth(style.lineWidth);
			graphics.setLineColor(style.lineColor);
			graphics.setLineStyle(FormatAttributes.LineStyle.DASH);
			this._drawLine(node, graphics);
		} else {
			// apply styles:
			graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
			graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);
			graphics.setLineColor(style.markerBorderColor);

			if (node.isSizeable()) {
				graphics.setFillColor(style.markerFillColor);
			} else {
				graphics.setFillColor(style.markerFillColorDisabled);
			}

			this._drawMarkersFor(node, graphics);
		}

		graphics.restore();
	}

	_drawLine(node, graphics) {
		const coordinates = node.getShape().getCoordinates();
		const points = [];

		coordinates.forEach((coordinate) => {
			points.push(node.translateToParent(coordinate.toPoint()));
		});
		graphics.drawPolyline(points, false);
	}

	_drawMarkersFor(node, graphics) {
		const tmppt = JSG.ptCache.get();
		const coordinates = node.getShape().getCoordinates();

		const style = this.getSelectionStyle();
		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(style.markerSize);
		Arrays.keep(this._linemarkers, coordinates.length, this._markerFactory);

		coordinates.forEach((coordinate, i) => {
			coordinate.toPoint(tmppt);
			node.translateToParent(tmppt);
			this._drawMarkerAt(i, tmppt, this._linemarkers[i], markersize, graphics);
		});
		JSG.ptCache.release(tmppt);
	}

	_drawMarkerAt(index, point, marker, markersize, graphics) {
		const parent = this._lineview.getItem().getParent();
		const graph = parent.getGraph();
		const loc = JSG.ptCache.get().setTo(point);
		const style = this.getSelectionStyle();

		GraphUtils.translatePointUp(loc, parent, graph);
		marker._coordinate.set(loc.x, loc.y);
		marker.setSize(markersize);
		marker.draw(graphics, style);
		JSG.ptCache.release(loc);
	}

	getHandleAt(point, event, reusehandle) {
		let i;
		let n;
		let handleFound = false;
		const item = this._lineview._item;
		const loc = JSG.ptCache.get();
		const graph = item.getGraph();
		const handle = reusehandle || new SelectionHandle();

		handle.reset();

		// check, if point over label
		loc.setTo(point);
		for (i = 0, n = item.getItemCount(); i < n; i += 1) {
			const label = item.getItemAt(i);
			const box = label.getTranslatedBoundingBox(graph);
			if (box.containsPoint(loc)) {
				handleFound = true;
				break;
			}
		}
		if (!handleFound) {
			loc.setTo(point);
			const radius = graph.getFindRadius();
			const marker = this._getMarkerAt(loc, radius);
			if (marker) {
				if (item.isSizeable()) {
					handle.setType(SelectionHandle.TYPE.RESIZE);
					handle.setCursor(marker._cursor);
					handle.setPointIndex(marker._index);
				}
				// handle._isCenter = marker._isCenter;
			} else if (item.isMoveable()) {
				// check if we touched line:
				loc.setTo(point);
				GraphUtils.translatePointDown(loc, graph, item.getParent());
				if (item.containsPoint(loc, 0, radius)) {
					handle.setType(SelectionHandle.TYPE.MOVE);
					handle.setCursor(Cursor.Style.MOVE);
				}
			}
		}
		JSG.ptCache.release(loc);
		return handle;
	}

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
				marker = this._linemarkers[i];
				break;
			}
		}
		return marker;
	}
}

export default LineNodeSelectionHandler;
