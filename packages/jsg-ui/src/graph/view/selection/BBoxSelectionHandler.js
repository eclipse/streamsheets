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
import {
	default as JSG,
	FormatAttributes,
	GraphItemProperties,
	NumberExpression,
	Coordinate,
	BoundingBox,
	Strings
} from '@cedalo/jsg-core';
import { Term } from '@cedalo/parser';
import SelectionHandler from './SelectionHandler';
import SelectionHandle from './SelectionHandle';
import Marker from './Marker';
import RotationMarker from './RotationMarker';
import Cursor from '../../../ui/Cursor';

/**
 * A SelectionHandler subclass to handle either a single or multiple selection. Its representation is based on the
 * BoundingBoxes of the involved views which build up current selection.
 * The BBoxSelectionHandler is created via {{#crossLink
 * "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class BBoxSelectionHandler
 * @extends SelectionHandler
 * @constructor
 * @param {GraphItemView|Array} [views]* The views which represent current selection. Either one or an
 *     array of multiple views can be passed.
 */
class BBoxSelectionHandler extends SelectionHandler {
	constructor(views) {
		super(views);
		this._markers = [];
		this._bbox = new BoundingBox(0, 0);

		this._views = Array.isArray(views) ? views : [views];
		const selItem = this._views.length === 1 ? this._views[0].getItem() : undefined;
		this._sizeable = selItem ? selItem.isSizeable() : true;
		this._rotatable = selItem ? selItem.isRotatable() : true;
		this._moveable = selItem ? selItem.isMoveable() : true;

		// add our markers around bbox, starting at topleft:
		const WIDTH = new JSG.GraphReference(this, GraphItemProperties.WIDTH, this);
		const HEIGHT = new JSG.GraphReference(this, GraphItemProperties.HEIGHT, this);
		this._markers.push(new Marker(0, this.coordinate(), !this._sizeable));
		this._markers.push(new Marker(1, this.coordinate(this.mulTerm(WIDTH, 0.5)), !this._sizeable));
		this._markers.push(new Marker(2, this.coordinate(this.mulTerm(WIDTH, 1)), !this._sizeable));
		this._markers.push(
			new Marker(3, this.coordinate(this.mulTerm(WIDTH, 1), this.mulTerm(HEIGHT, 0.5)), !this._sizeable)
		);
		this._markers.push(
			new Marker(4, this.coordinate(this.mulTerm(WIDTH, 1), this.mulTerm(HEIGHT, 1)), !this._sizeable)
		);
		this._markers.push(
			new Marker(5, this.coordinate(this.mulTerm(WIDTH, 0.5), this.mulTerm(HEIGHT, 1)), !this._sizeable)
		);
		this._markers.push(new Marker(6, this.coordinate(undefined, this.mulTerm(HEIGHT, 1)), !this._sizeable));
		this._markers.push(new Marker(7, this.coordinate(undefined, this.mulTerm(HEIGHT, 0.5)), !this._sizeable));
		this._markers.push(new RotationMarker(8, this.coordinate(), !this._rotatable));
	}

	/**
	 * Shortcut to create a multiply term with given reference and factor.
	 *
	 * @method mulTerm
	 * @param {GraphReference} refOperand The reference operand part of multiply term.
	 * @param {Number} fac The factor part of multiply term.
	 * @return {Term} The created multiply term.
	 * @private
	 */
	mulTerm(refOperand, fac) {
		return Term.withOperator('*', new Term(refOperand.copy()), Term.fromNumber(fac));
	}

	/**
	 * Shortcut to create a new coordinate from given x and y terms.
	 *
	 * @method coordinate
	 * @param {Term} xTerm The term to specify the x coordinate part.
	 * @param {Term} yTerm The term to specify the y coordinate part.
	 * @return {Coordinate} The created coordinate.
	 * @private
	 */
	coordinate(xTerm, yTerm) {
		const xCoord = new NumberExpression(0, undefined, xTerm);
		const yCoord = new NumberExpression(0, undefined, yTerm);
		return new Coordinate(xCoord, yCoord);
	}

	/**
	 * Implemented so this handler can be addressed by a {{#crossLink "Reference"}}{{/crossLink}} term.
	 *
	 * @method getPropertyValue
	 * @return {Object} The property value or <code>undefined</code>.
	 */
	getPropertyValue(...args) {
		const property = Array.prototype.shift.call(...args);
		if (property.getter) {
			const propFunc = Strings.isString(property.getter) ? this[property.getter] : property.getter;
			return propFunc.apply(this, ...args);
		}
		return undefined;
	}

	/**
	 * Returns the width of internally used BoundingBox.
	 *
	 * @method getWidth
	 * @return {Number} The BoundingBox width.
	 */
	getWidth() {
		return this._bbox.getWidth();
	}

	/**
	 * Returns the height of internally used BoundingBox.
	 *
	 * @method getHeight
	 * @return {Number} The BoundingBox height.
	 */
	getHeight() {
		return this._bbox.getHeight();
	}

	getBoundingBox(reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);
		bbox.setTo(this._bbox);
		return bbox;
	}

	/**
	 * Sets the internally used BoundingBox to given one.
	 *
	 * @method setBoundingBox
	 * @param {BoundingBox} bbox The BoundingBox to set.
	 */
	setBoundingBox(bbox) {
		this._bbox.setTo(bbox);
	}

	containsPoint(point) {
		return this._bbox.containsPoint(point);
	}

	getPinPoint(reusepoint) {
		const pin = this._markers[8].getPinLocation(reusepoint);
		this._bbox.rotateLocalPoint(pin);
		const topleft = this._bbox.getTopLeft(JSG.ptCache.get());
		pin.add(topleft);
		JSG.ptCache.release(topleft);
		return pin;
	}

	getRotationMarker() {
		return this._markers[8];
	}

	refresh() {
		const pinPoint = JSG.ptCache.get();
		const graphView = this._views[0].getGraphView();
		const angle = this._selectionView.getRotationAngle();

		// init our bbox:
		this._views[0].getTranslatedBoundingBox(graphView, this._bbox);
		if (this._views.length > 1) {
			const bbox = this._bbox;
			const root = graphView.getItem();
			bbox.setSize(0, 0);
			bbox.setAngle(angle);
			if (angle) {
				this._views.forEach((view) => {
					const points = view.getItem().getTranslatedShapePoints(root);
					bbox.enclosePoints(points);
				});
			} else {
				const vbox = JSG.boxCache.get();
				this._views.forEach((view) => {
					view.getItem().getTranslatedBoundingBox(graphView, vbox);
					bbox.union(vbox);
					// bbox.enclosePoints(points);
				});
				JSG.boxCache.release(vbox);
			}
			pinPoint.set(bbox.getWidth() / 2, bbox.getHeight() / 2);
		} else {
			this._views[0].getPin().getLocalPoint(pinPoint);
		}
		// set rotation pin:
		this._markers[8].setPinLocation(pinPoint);
		JSG.ptCache.release(pinPoint);
	}

	drawSelection(graphics) {
		const style = this.getSelectionStyle();
		const bbox = JSG.boxCache.get().setTo(this._bbox);
		const topleft = bbox.getTopLeft(JSG.ptCache.get());

		const cs = graphics.getCoordinateSystem();
		const markersize = cs.metricToLogXNoZoom(style.markerSize);

		if (!style.areMarkersVisible) {
			bbox.expandBy(markersize);
		}

		graphics.save();

		if (this._views.length > 1 || style.areMarkersVisible === false) {
			graphics.setLineWidth(style.lineWidth);
			graphics.setLineColor(style.lineColor);
			graphics.setLineStyle(style.lineStyle);
			graphics.drawPolyline(bbox.getPoints(), true);
		}

		// draw markers:
		if (style.areMarkersVisible) {
			// translate and rotate graphics => marker views expected it...
			graphics.translate(topleft.x, topleft.y);
			graphics.rotate(bbox.getAngle());
			graphics.setFillStyle(FormatAttributes.FillStyle.SOLID);
			graphics.setFillColor(style.markerFillColor);
			graphics.setLineColor(style.markerBorderColor);
			graphics.setLineStyle(FormatAttributes.LineStyle.SOLID);

			this._markers.forEach((marker) => {
				marker.setSize(markersize);
				if (marker._disabled) {
					graphics.setFillColor(style.markerFillColorDisabled);
				} else {
					graphics.setFillColor(style.markerFillColor);
				}
				marker.draw(graphics, style);
			});
			this._drawAdditionalMarkers(graphics);
		}

		graphics.restore();
		JSG.ptCache.release(topleft);
		JSG.boxCache.release(bbox);
	}

	/**
	 * Called by {{#crossLink "BBoxSelectionHandler/drawMarkers:method"}}{{/crossLink}} to show
	 * additional markers if required.<br/>
	 * This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method _drawAdditionalMarkers
	 * @param {Graphics} graphics The Graphics instance to use for drawing.
	 */
	_drawAdditionalMarkers(graphics) {}

	getHandleAt(point, event, reusehandle) {
		let handle = reusehandle || new SelectionHandle();
		const bbox = JSG.boxCache.get().setTo(this._bbox);
		const localPoint = JSG.ptCache.get().setTo(point);
		const graph = this._views[0].getItem().getGraph();
		const threshold = graph.getFindRadius();
		let marker;

		handle.reset();
		this._bbox.transformPoint(localPoint);

		// expand bbox:
		bbox.expandBy(threshold);
		const inside = bbox.containsPoint(point);
		if (inside) {
			// allow move for small objects
			if (this._moveable) {
				if (this._bbox.getHeight() < threshold * 3 || this._bbox.getWidth() < threshold * 3) {
					if (this._bbox.containsPoint(point)) {
						handle.setType(SelectionHandle.TYPE.MOVE);
						// at least we are moving
						handle.setCursor(Cursor.Style.MOVE);
						JSG.ptCache.release(localPoint);
						JSG.boxCache.release(bbox);
						return handle;
					}
				}
			}
		}

		if (this._sizeable) {
			marker = this._getReshapeMarkerAt(localPoint, threshold);
			if (marker && !marker._disabled) {
				this._fillHandle(handle, marker);
				JSG.ptCache.release(localPoint);
				JSG.boxCache.release(bbox);
				return handle;
			}
			if (inside) {
				// check resize markers:
				marker = this._getMarkerAt(localPoint, threshold);
				if (marker && !marker._disabled) {
					this._fillHandle(handle, marker);
					JSG.ptCache.release(localPoint);
					JSG.boxCache.release(bbox);
					return handle;
				}
			}
		}

		bbox.reduceBy(threshold);
		if (bbox.containsPoint(point)) {
			if (this._moveable) {
				handle.setType(SelectionHandle.TYPE.MOVE);
				// at least we are moving
				handle.setCursor(Cursor.Style.MOVE);
				JSG.ptCache.release(localPoint);
				JSG.boxCache.release(bbox);
				return handle;
			}
		}
		// not in bbox => check rotation marker:
		if (this._rotatable) {
			if (!this._markers[8]._disabled && this._markers[8].containsPoint(localPoint, threshold)) {
				handle.setType(SelectionHandle.TYPE.ROTATE);
				handle.setCursor(Cursor.Style.ROTATE);
			} else {
				handle = undefined;
			}
		}
		JSG.ptCache.release(localPoint);
		JSG.boxCache.release(bbox);
		return handle;
	}

	/**
	 * Returns the Marker at specified location. The location point should be relative to global GraphView.
	 *
	 * @method _getMarkerAt
	 * @param {Point} point The location to look at.
	 * @return {Marker} The Marker at given location or <code>undefined</code>.
	 * @private
	 */
	_getMarkerAt(point, threshold) {
		let i;
		const markers = this._markers;

		for (i = 0; i < markers.length; i += 1) {
			if (markers[i].containsPoint(point, threshold)) {
				return markers[i];
			}
		}
		return undefined;
	}

	/**
	 * Returns the ReshapeMarker at specified location. The location point should be relative to global GraphView.
	 *
	 * @method _getReshapeMarkerAt
	 * @param {Point} point The location to look at.
	 * @param {Number} threshold Coordinate tolerance
	 * @return {Marker} The Marker at given location or <code>undefined</code>.
	 * @private
	 * @since 1.6.8
	 */
	_getReshapeMarkerAt(point, threshold) {}

	/**
	 * Set up given handle for specified marker.
	 *
	 * @method name
	 * @param {SelectionHandle} handle The SelectionHandle to set up.
	 * @param {Marker} marker The marker to set up the handle for.
	 * @private
	 */
	_fillHandle(handle, marker) {
		const cursorFromIndex = (index) => {
			// TODO in future version cursor depends on translated angle between touched point and origin!
			const cursor = Cursor.Style;
			switch (index) {
				case 0:
					return cursor.RESIZE_NW;
				case 1:
					return cursor.RESIZE_N;
				case 2:
					return cursor.RESIZE_NE;
				case 3:
					return cursor.RESIZE_E;
				case 4:
					return cursor.RESIZE_SE;
				case 5:
					return cursor.RESIZE_S;
				case 6:
					return cursor.RESIZE_SW;
				case 7:
					return cursor.RESIZE_W;
			}
			return undefined;
		};

		handle.setType(SelectionHandle.TYPE.RESIZE);
		handle.setCursor(cursorFromIndex(marker._index));
		handle.setPointIndex(marker._index);
	}
}

export default BBoxSelectionHandler;
