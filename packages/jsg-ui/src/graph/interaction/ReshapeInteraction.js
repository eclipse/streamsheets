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
	Point,
	GraphItemProperties,
	Expression,
	ReshapeItemCommand,
	ReshapeCoordinate
} from '@cedalo/jsg-core';
import { Term } from '@cedalo/parser';
import AbstractInteraction from './AbstractInteraction';
import SelectionFeedbackView from '../view/SelectionFeedbackView';

/**
 * Interaction to do a reshape of a selected {{#crossLink "GraphItem"}}{{/crossLink}}.</br>
 * A reshape does not change the fundamental shape of a GraphItem, instead the shape is only changed proportional by
 * altering special, so called reshape coordinates. See {{#crossLink
 * "GraphItem/setReshapeCoordinates:method"}}{{/crossLink}} and {{#crossLink
 * "GraphItem/getReshapeCoordinates:method"}}{{/crossLink}} too.
 *
 * @class ReshapeInteraction
 * @constructor
 * @param {SelectionHandle} activeHandle A handle of type {{#crossLink
 *     "SelectionHandle.TYPE/RESHAPE:property"}}{{/crossLink}}
 */
class ReshapeInteraction extends AbstractInteraction {
	constructor(activeHandle) {
		super();
		this._activeHandle = activeHandle;
	}

	deactivate(viewer) {
		const selectionView = viewer.getSelectionView();
		selectionView.refresh();
		selectionView.setVisible(true);
		this._activeHandle = undefined;
		super.deactivate(viewer);
	}

	onMouseDown(event, viewer) {
		const selectionView = viewer.getSelectionView();
		selectionView.setVisible(false);

		super.onMouseDown(event, viewer);
	}

	createActionFeedback(event, viewer) {
		const handle = this._activeHandle;
		if (handle) {
			const feedback = new SelectionFeedbackView(9);
			const selectionView = viewer.getSelectionView();

			feedback.setBoundingBox(selectionView.getBoundingBox());

			const pointIndex = handle.getPointIndex();
			if (pointIndex >= 0) {
				// index of reshape coordinate
				const item = viewer.getSelection()[0].getModel();
				const point = new Point(0, 0);
				selectionView._selectionHandler._reshapeMarkers[pointIndex]._coordinate.toPoint(point);
				feedback.setPoint(point);
			}

			return feedback;
		}

		return undefined;
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback) {
			const handle = this._activeHandle;
			const pointIndex = handle.getPointIndex();
			if (pointIndex >= 0) {
				// index of reshape coordinate
				const selectionView = viewer.getSelectionView();
				const item = viewer.getSelection()[0].getModel();
				const coordinate = selectionView._selectionHandler._reshapeMarkers[pointIndex]._coordinate;
				const widthref = new JSG.GraphReference(this, GraphItemProperties.WIDTH, item);
				const heightref = new JSG.GraphReference(this, GraphItemProperties.HEIGHT, item);
				let xExpr;
				let yExprS;
				let xExprS;
				let yExpr;

				const absoffset = new Point(0, 0);
				absoffset.setTo(this.currentLocation);
				absoffset.subtract(this.startLocation);
				const point = this.getReshapeValues(absoffset, item);

				const x = point.x;
				const y = point.y;

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
						if (item.getHeight().getValue() > item.getWidth().getValue()) {
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
						if (item.getHeight().getValue() > item.getWidth().getValue()) {
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
						break;
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
						yExpr = new Expression(
							0,
							undefined,
							Term.withOperator('-', new Term(heightref.copy()), yExprS)
						);
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
						yExpr = new Expression(
							0,
							undefined,
							Term.withOperator('-', new Term(heightref.copy()), yExprS)
						);
						break;
					case ReshapeCoordinate.ReshapeType.YRELATIVETOMIN:
						if (item.getHeight().getValue() > item.getWidth().getValue()) {
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
						if (item.getHeight().getValue() > item.getWidth().getValue()) {
							yExprS = Term.withOperator('*', new Term(widthref.copy()), Term.fromNumber(y));
						} else {
							yExprS = Term.withOperator('*', new Term(heightref.copy()), Term.fromNumber(y));
						}
						yExpr = new Expression(
							0,
							undefined,
							Term.withOperator('-', new Term(heightref.copy()), yExprS)
						);
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
						break;
				}

				selectionView._selectionHandler._reshapeMarkers[pointIndex]._coordinate.set(xExpr, yExpr);
				selectionView._selectionHandler._reshapeMarkers[pointIndex]._coordinate.toPoint(point);

				this.actionFeedback.setPoint(point);
			}
		}
	}

	updateFeedback(event, viewer, offset) {
		const handle = this._activeHandle;
		// index of reshape coordinate
		const pointIndex = handle.getPointIndex();

		if (pointIndex >= 0 && this.feedback[0]) {
			const item = viewer.getSelection()[0].getModel();
			const coordinate = item.getReshapeCoordinateAt(pointIndex);
			const absoffset = new Point(0, 0);

			absoffset.setTo(this.currentLocation);
			absoffset.subtract(this.startLocation);

			const point = this.getReshapeValues(absoffset, item);

			this.feedback[0].updateReshapePoint(pointIndex, point);

			const shapeBuilder = coordinate.getShapeBuilder();
			if (shapeBuilder) {
				shapeBuilder.call(this.feedback[0].getItem());
			}
		}
	}

	willFinish(event, viewer, offset) {
		if (this.feedback[0]) {
			super.willFinish(event, viewer, offset);
		} else {
			this.cancelInteraction(event, viewer);
		}
	}

	/**
	 * Creates the reshape command to execute.
	 *
	 * @method createCommand
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {GraphItemController} selectedController The currently selected controller.
	 * @return {ReshapeItemCommand} An instance of a ReshapeItemCommand to be executed or
	 *     <code>undefined</code>.
	 */
	createCommand(offset, selectedController) {
		const item = selectedController.getModel();
		const point = this.getReshapeValues(offset, item);
		const handle = this._activeHandle;
		const pointIndex = handle.getPointIndex();

		// index of reshape coordinate
		if (pointIndex < 0) {
			return undefined;
		}

		return new ReshapeItemCommand(item, handle.getPointIndex(), point);
	}

	/**
	 * Determines the new value for the reshape coordinate as point.
	 *
	 * @method getReshapeValues
	 * @param {Point} offset The offset between start and current event. Usually the difference between
	 *     start and current location.
	 * @param {GraphItem} item The current GraphItem to determine the reshape value for.
	 * @return {Point} The new reshape coordinate value as point or <code>undefined</code>.
	 */
	getReshapeValues(offset, item) {
		const point = new Point(0, 0);
		const handle = this._activeHandle;

		if (handle.getPointIndex() < 0) {
			point.set(0, 0);
			return point;
		}

		const bbox = item.getBoundingBox(JSG.boxCache.get());
		const coordinate = item.getReshapeCoordinateAt(handle.getPointIndex());

		point.set(coordinate.getX().getValue(), coordinate.getY().getValue());

		if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.RADIAL) {
			const tbbox = item.getTranslatedBoundingBox(item.getGraph());
			const center = tbbox.getCenter(undefined, true);
			const dx = this.currentLocation.x - center.x;
			const dy = this.currentLocation.y - center.y;
			let angle = Math.atan2(-dy, dx);
			const q = bbox.getHeight() / 2 / (bbox.getWidth() / 2);

			if (this.feedback[0]) {
				angle += this.feedback[0].getAngle();
			}
			const cangle = Math.atan(Math.tan(angle) / q);

			if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
				point.x = (cangle + Math.PI) / (Math.PI * 2);
			} else {
				point.x = cangle / (Math.PI * 2);
			}
		} else {
			offset.rotate(-this.feedback[0].getAngle());

			if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH) {
				point.x += bbox.getWidth() !== 0 ? offset.x / bbox.getWidth() : 0;
			} else if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTHFROMRIGHT) {
				point.x -= bbox.getWidth() !== 0 ? offset.x / bbox.getWidth() : 0;
			} else if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT) {
				point.x += bbox.getHeight() !== 0 ? offset.x / bbox.getHeight() : 0;
			} else if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHTFROMRIGHT) {
				point.x -= bbox.getHeight() !== 0 ? offset.x / bbox.getHeight() : 0;
			} else if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOMIN) {
				if (bbox.getHeight() > bbox.getWidth()) {
					point.x += bbox.getWidth() !== 0 ? offset.x / bbox.getWidth() : 0;
				} else {
					point.x += bbox.getHeight() !== 0 ? offset.x / bbox.getHeight() : 0;
				}
			} else if (coordinate.getXType() === ReshapeCoordinate.ReshapeType.XRELATIVETOMINFROMRIGHT) {
				if (bbox.getHeight() > bbox.getWidth()) {
					point.x -= bbox.getWidth() !== 0 ? offset.x / bbox.getWidth() : 0;
				} else {
					point.x -= bbox.getHeight() !== 0 ? offset.x / bbox.getHeight() : 0;
				}
			} else {
				point.x += bbox.getWidth() !== 0 ? offset.x / bbox.getWidth() : 0;
			}

			point.x = Math.min(coordinate.getXMax(), point.x);
			point.x = Math.max(coordinate.getXMin(), point.x);

			if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT) {
				point.y += bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
			} else if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHTFROMBOTTOM) {
				point.y -= bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
			} else if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH) {
				point.y += bbox.getWidth() !== 0 ? offset.y / bbox.getWidth() : 0;
			} else if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTHFROMBOTTOM) {
				point.y -= bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
			} else if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOMIN) {
				if (bbox.getHeight() > bbox.getWidth()) {
					point.y += bbox.getWidth() !== 0 ? offset.y / bbox.getWidth() : 0;
				} else {
					point.y += bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
				}
			} else if (coordinate.getYType() === ReshapeCoordinate.ReshapeType.YRELATIVETOMINFROMBOTTOM) {
				if (bbox.getHeight() > bbox.getWidth()) {
					point.y -= bbox.getWidth() !== 0 ? offset.y / bbox.getWidth() : 0;
				} else {
					point.y -= bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
				}
			} else {
				point.y += bbox.getHeight() !== 0 ? offset.y / bbox.getHeight() : 0;
			}

			point.y = Math.min(coordinate.getYMax(), point.y);
			point.y = Math.max(coordinate.getYMin(), point.y);
		}

		JSG.boxCache.release(bbox);

		return point;
	}
}

export default ReshapeInteraction;
