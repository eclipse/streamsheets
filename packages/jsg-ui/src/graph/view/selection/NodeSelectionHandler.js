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
import { default as JSG, Expression, GraphItemProperties, ReshapeCoordinate } from '@cedalo/jsg-core';
import { Term } from '@cedalo/parser';
import BBoxSelectionHandler from './BBoxSelectionHandler';
import SelectionHandle from './SelectionHandle';
import Marker from './Marker';
import Cursor from '../../../ui/Cursor';

/**
 * A special BBoxSelectionHandler subclass to handle a single selection of a {{#crossLink
 * "Node"}}{{/crossLink}}.<br/> This handler supports visual {{#crossLink
 * "Marker"}}{{/crossLink}}s for so called reshape-coordinates which are defined by certain
 * Nodes. See {{#crossLink "GraphItem/getReshapeCoordinates:method"}}{{/crossLink}}.<br/> It is created
 * via {{#crossLink "SelectionHandlerFactory"}}{{/crossLink}}.
 *
 * @class NodeSelectionHandler
 * @extends BBoxSelectionHandler
 * @constructor
 * @param {GraphItemView} view The view which represent current selected Node.
 */
class NodeSelectionHandler extends BBoxSelectionHandler {
	constructor(view) {
		super(view);
		// we have additional reshape markers:
		this._reshapeMarkers = undefined;
		this._addReshapeMarkers(view);
	}

	/**
	 * Adds a {{#crossLink "Marker"}}{{/crossLink}} for each reshape-coordinate of given view.
	 *
	 * @method _addReshapeMarkers
	 * @param {GraphItemView} view The view which represent current selected Node.
	 * @private
	 */
	_addReshapeMarkers(view) {
		this._reshapeMarkers = [];
		let i;
		let n;
		const coordinates = view.getItem().getReshapeCoordinates();
		const widthref = new JSG.GraphReference(view.getItem(), GraphItemProperties.WIDTH, this);
		const heightref = new JSG.GraphReference(view.getItem(), GraphItemProperties.HEIGHT, this);
		let xExpr;
		let yExpr;
		let xExprS;
		let yExprS;
		let x;
		let y;

		for (i = 0, n = coordinates.length; i < n; i += 1) {
			const coordinate = coordinates[i];
			x = Math.max(Math.min(coordinate.getX().getValue(), coordinate.getXMax()), coordinate.getXMin());
			y = Math.max(Math.min(coordinate.getY().getValue(), coordinate.getYMax()), coordinate.getYMin());

			switch (coordinate.getXType()) {
				case ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH:
					xExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(x))
					);
					break;
				case ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTHFROMRIGHT:
					xExprS = Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(x));
					xExpr = new Expression(0, undefined, Term.withOperator('-', new Term(widthref.copy()), xExprS));
					break;
				case ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT:
					xExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(x))
					);
					break;
				case ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHTFROMRIGHT:
					xExprS = Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(x));
					xExpr = new Expression(0, undefined, Term.withOperator('-', new Term(widthref.copy()), xExprS));
					break;
				case ReshapeCoordinate.ReshapeType.XRELATIVETOMIN:
					if (this.getHeight() > this.getWidth()) {
						xExpr = new Expression(
							0,
							undefined,
							Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(x))
						);
					} else {
						xExpr = new Expression(
							0,
							undefined,
							Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(x))
						);
					}
					break;
				case ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT:
					if (this.getHeight() > this.getWidth()) {
						xExprS = Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(x));
					} else {
						xExprS = Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(x));
					}
					xExpr = new Expression(0, undefined, Term.withOperator('-', new Term(widthref.copy()), xExprS));
					break;
				case ReshapeCoordinate.ReshapeType.RADIAL:
					xExpr = new Expression(
						0,
						undefined,
						Term.withOperator(
							'*',
							new Term(widthref.copy()),
							Term.fromNumber(Math.cos(Math.PI * 2 * x) / 2 + 0.5)
						)
					);
					break;
				default:
					xExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(x))
					);
			}

			switch (coordinate.getYType()) {
				case ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT:
					yExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y))
					);
					break;
				case ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHTFROMBOTTOM:
					yExprS = Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y));
					yExpr = new Expression(0, undefined, Term.withOperator('-', new Term(heightref.copy()), yExprS));
					break;
				case ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH:
					yExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(y))
					);
					break;
				case ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTHFROMBOTTOM:
					yExprS = Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(y));
					yExpr = new Expression(0, undefined, Term.withOperator('-', new Term(heightref.copy()), yExprS));
					break;
				case ReshapeCoordinate.ReshapeType.YRELATIVETOMIN:
					if (this.getHeight() > this.getWidth()) {
						yExpr = new Expression(
							0,
							undefined,
							Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(y))
						);
					} else {
						yExpr = new Expression(
							0,
							undefined,
							Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y))
						);
					}
					break;
				case ReshapeCoordinate.ReshapeType.YRELATIVETOMINFROMBOTTOM:
					if (this.getHeight() > this.getWidth()) {
						yExprS = Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(y));
					} else {
						yExprS = Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y));
					}
					yExpr = new Expression(0, undefined, Term.withOperator('-', new Term(heightref.copy()), yExprS));
					break;
				case ReshapeCoordinate.ReshapeType.RADIAL:
					yExpr = new Expression(
						0,
						undefined,
						Term.withOperator(
							'*',
							new Term(heightref.copy()),
							Term.fromNumber(-Math.sin(Math.PI * 2 * x) / 2 + 0.5)
						)
					);
					break;
				default:
					yExpr = new Expression(
						0,
						undefined,
						Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y))
					);
			}

			const coor = new ReshapeCoordinate(
				xExpr,
				yExpr,
				coordinate._xMin,
				coordinate._xMax,
				coordinate._yMin,
				coordinate._yMax,
				coordinate._name,
				coordinate._xtype,
				coordinate._ytype,
				coordinate._vertical
			);
			const marker = new Marker(i, coor, false);
			marker._type = SelectionHandle.TYPE.RESHAPE;
			this._reshapeMarkers.push(marker);
		}
	}

	_drawAdditionalMarkers(graphics) {
		const style = this.getSelectionStyle();
		const markersize = graphics.getCoordinateSystem().metricToLogXNoZoom(style.markerSize);
		graphics.setFillColor(NodeSelectionHandler.RESHAPEMARKER_FILL_COLOR);
		this._reshapeMarkers.forEach((marker) => {
			marker.setSize(markersize);
			marker.draw(graphics, style);
		});
	}

	_getReshapeMarkerAt(point, threshold) {
		// first check our reshape markers
		let i;
		const markers = this._reshapeMarkers;

		for (i = 0; i < markers.length; i += 1) {
			if (markers[i].containsPoint(point, threshold)) {
				return markers[i];
			}
		}
		return super._getReshapeMarkerAt(point, threshold);
	}

	_fillHandle(handle, marker) {
		if (marker._type) {
			handle.setType(marker._type);
			handle.setCursor(Cursor.Style.CROSS);
			handle.setPointIndex(marker._index);
		} else {
			super._fillHandle(handle, marker);
		}
	}

	refresh() {
		this._reshapeMarkers = [];
		this._addReshapeMarkers(this._views[0]);

		super.refresh();
	}

	static get RESHAPEMARKER_FILL_COLOR() {
		return '#00C00D';
	}
}

export default NodeSelectionHandler;
