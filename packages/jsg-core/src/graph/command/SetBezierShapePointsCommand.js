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
const JSG = require('../../JSG');
const { readObject, writeJSON } = require('./utils');
const AbstractItemCommand = require('./AbstractItemCommand');
const BoundingBox = require('../../geometry/BoundingBox');
const Point = require('../../geometry/Point');
const PointList = require('../../geometry/PointList');
const Coordinate = require('../Coordinate');
const NumberExpression = require('../expr/NumberExpression');

/**
 * Command to set the definition points of an item with a bezier shape visualization.
 *
 * @example
 *     // interactionhandler and item given
 *     // set a bezier shape with one curve, the control points before the start point
 *     // and the control point behind the end point are equal to their context point
 *     // two context points (begin and start of the line
 *     var points = [];
 *     points.push(new Point(1000, 1000));
 *     points.push(new Point(5000, 1000));
 *
 *     // two control points (before context point)
 *     cpFrom = [];
 *     cpFrom.push(new Point(2000, 2000));
 *     cpFrom.push(new Point(5000, 1000));
 *
 *     // two control points (after context point)
 *     cpTo = [];
 *     cpTo.push(new Point(2000, 2000));
 *     cpTo.push(new Point(5000, 1000));
 *
 *     var cmd = new SetBezierShapePointsCommand(item, points, cpFrom, cpTo);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetBezierShapePointsCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item GraphItem to be formatted.
 * @param {Point[]} newpoints Array with the new context points.
 * @param {Point[]} newCpFromPoints Array with the new control points before the context point.
 * @param {Point[]} newCpToPoints Array with the new control points behind the context point.
 */
class SetBezierShapePointsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const line = graph.getItemById(data.itemId);
		if (line) {
			const points = data.points.map(
				(point) => new Point(point.x, point.y)
			);
			const cpFromPoints = data.cpFromPoints.map(
				(point) => new Point(point.x, point.y)
			);
			const cpToPoints = data.cpToPoints.map(
				(point) => new Point(point.x, point.y)
			);
			cmd = new SetBezierShapePointsCommand(
				line,
				points,
				cpFromPoints,
				cpToPoints
			).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, newpoints, newCpFromPoints, newCpToPoints) {
		super(item);

		function toList(points) {
			const list = new PointList();
			points.forEach((point) => {
				list.addPoint(point.copy());
			});
			return list;
		}

		this._points = toList(newpoints);
		this._cpFromPoints = toList(newCpFromPoints);
		this._cpToPoints = toList(newCpToPoints);

		this._oldbbox = item.getBoundingBox();
		this._newbbox = this._resizeBBox(
			item.getBoundingBox(),
			newpoints,
			newCpFromPoints,
			newCpToPoints
		);
		this._translate(
			newpoints,
			newCpFromPoints,
			newCpToPoints,
			this._oldbbox,
			this._newbbox
		);

		this._newpointlist = toList(newpoints);
		this._newCpFrompointlist = toList(newCpFromPoints);
		this._newCpTopointlist = toList(newCpToPoints);

		this._oldpointlist = toList(item._shape.getPoints());
		this._oldCpFrompointlist = toList(item._shape.getCpFromPoints());
		this._oldCpTopointlist = toList(item._shape.getCpToPoints());
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldbbox = readObject('oldbbox', data.oldbbox, new BoundingBox());
		cmd._oldCpTopointlist = readObject(
			'oldcptopoints',
			data.oldCpToPointList,
			new PointList()
		);
		cmd._oldCpFrompointlist = readObject(
			'oldcpfrompoints',
			data.oldCpFromPointList,
			new PointList()
		);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.points = this._points.getPoints();
		data.cpFromPoints = this._cpFromPoints.getPoints();
		data.cpToPoints = this._cpToPoints.getPoints();
		// save undo data:
		data.oldbbox = writeJSON('oldbbox', this._oldbbox);
		data.oldCpToPointList = writeJSON(
			'oldcptopoints',
			this._oldCpTopointlist
		);
		data.oldCpFromPointList = writeJSON(
			'oldcpfrompoints',
			this._oldCpFrompointlist
		);
		return data;
	}

	/**
	 * Undo the change of the bezier points.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setBoundingBoxTo(this._oldbbox, true);
		this._setCoordinates(
			this._oldbbox,
			this._oldpointlist,
			this._oldCpFrompointlist,
			this._oldCpTopointlist
		);
	}

	/**
	 * Redo the change of the bezier points.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.setBoundingBoxTo(this._newbbox, true);
		this._setCoordinates(
			this._newbbox,
			this._newpointlist,
			this._newCpFrompointlist,
			this._newCpTopointlist
		);
	}

	/**
	 * Create coordinates relative to the bounding box of the item from the given coordinate points. This is
	 * necessary to scale the bezier shape automatically with the bounding box.
	 *
	 * @method _setCoordinates
	 * @param {BoundingBox} bbox BoundingBox of the item.
	 * @param {PointList} pointlist PointList with the new context points.
	 * @param {PointList} cpFromPointList PointList with the new control points before the context point.
	 * @param {PointList} cpToPointList PointList with the new control points behind the context point.
	 * @private
	 */
	_setCoordinates(bbox, pointlist, cpFromPointList, cpToPointList) {
		const width = bbox.getWidth();
		const height = bbox.getHeight();
		let newcoordinates = [];
		let x;
		let y;
		let xFac;
		let yFac;
		let points = pointlist.getPoints();

		points.forEach((point) => {
			xFac = width !== 0 ? point.x / width : 1;
			yFac = height !== 0 ? point.y / height : 1;
			x = new NumberExpression(
				xFac,
				`width * ${xFac.toFixed(5)}`
			);
			y = new NumberExpression(
				yFac,
				`height * ${yFac.toFixed(5)}`
			);
			newcoordinates.push(new Coordinate(x, y));
		});
		this._graphItem._shape.setCoordinates(newcoordinates);

		newcoordinates = [];
		points = cpFromPointList.getPoints();
		points.forEach((point) => {
			xFac = width !== 0 ? point.x / width : 1;
			yFac = height !== 0 ? point.y / height : 1;
			x = new NumberExpression(
				xFac,
				`width * ${xFac.toFixed(5)}`
			);
			y = new NumberExpression(
				yFac,
				`height * ${yFac.toFixed(5)}`
			);
			newcoordinates.push(new Coordinate(x, y));
		});
		this._graphItem._shape.setCpFromCoordinates(newcoordinates);

		newcoordinates = [];
		points = cpToPointList.getPoints();
		points.forEach((point) => {
			xFac = width !== 0 ? point.x / width : 1;
			yFac = height !== 0 ? point.y / height : 1;
			x = new NumberExpression(
				xFac,
				`width * ${xFac.toFixed(5)}`
			);
			y = new NumberExpression(
				yFac,
				`height * ${yFac.toFixed(5)}`
			);
			newcoordinates.push(new Coordinate(x, y));
		});
		this._graphItem._shape.setCpToCoordinates(newcoordinates);

		this._graphItem._reshapeCoordinates = [];
		this._graphItem._reshapeProperties.clear();
	}

	/**
	 * Resize bounding box to fit it to the new points.
	 *
	 * @method _setCoordinates
	 * @param {BoundingBox} bbox BoundingBox of the item.
	 * @param {PointList} pointlist PointList with the new context points.
	 * @param {PointList} cpFromPointList PointList with the new control points before the context point.
	 * @param {PointList} cpToPointList PointList with the new control points behind the context point.
	 * @return {BoundingBox} New BoundingBox.
	 * @private
	 */
	_resizeBBox(bbox, points, cpFromPoints, cpToPoints) {
		bbox.setSize(0, 0);
		let minX;
		let minY;
		let maxX;
		let maxY;
		const tmppoint = new Point(0, 0);

		const min = (a, b) => {
			if (a === undefined) {
				return b;
			}
			if (b === undefined) {
				return a;
			}
			return a < b ? a : b;
		};

		const max = (a, b) => {
			if (a === undefined) {
				return b;
			}
			if (b === undefined) {
				return a;
			}
			return a > b ? a : b;
		};

		points.forEach((point) => {
			tmppoint.setTo(point).translate(bbox._topleft.x, bbox._topleft.y);
			minX = min(tmppoint.x, minX);
			maxX = max(tmppoint.x, maxX);
			minY = min(tmppoint.y, minY);
			maxY = max(tmppoint.y, maxY);
		});

		cpFromPoints.forEach((point) => {
			tmppoint.setTo(point).translate(bbox._topleft.x, bbox._topleft.y);
			minX = min(tmppoint.x, minX);
			maxX = max(tmppoint.x, maxX);
			minY = min(tmppoint.y, minY);
			maxY = max(tmppoint.y, maxY);
		});

		cpToPoints.forEach((point) => {
			tmppoint.setTo(point).translate(bbox._topleft.x, bbox._topleft.y);
			minX = min(tmppoint.x, minX);
			maxX = max(tmppoint.x, maxX);
			minY = min(tmppoint.y, minY);
			maxY = max(tmppoint.y, maxY);
		});

		tmppoint.set(minX, minY);
		bbox.rotatePoint(tmppoint);
		bbox.setTopLeftTo(tmppoint);
		bbox.setSize(maxX - minX, maxY - minY);

		return bbox;
	}

	/**
	 * Translate points, if bounding box position has changed.
	 *
	 * @method _translate
	 * @param {PointList} pointlist PointList with the new context points.
	 * @param {PointList} cpFromPointList PointList with the new control points before the context point.
	 * @param {PointList} cpToPointList PointList with the new control points behind the context point.
	 * @param {BoundingBox} oldbbox Current BoundingBox of the item.
	 * @param {BoundingBox} newbbox New BoundingBox of the item.
	 * @private
	 */
	_translate(points, cpFromPoints, cpToPoints, oldbbox, newbbox) {
		const delta = newbbox.getTopLeft().subtract(oldbbox.getTopLeft());
		oldbbox.rotateLocalPointInverse(delta);

		points.forEach((point) => {
			point.subtract(delta);
		});
		cpFromPoints.forEach((point) => {
			point.subtract(delta);
		});
		cpToPoints.forEach((point) => {
			point.subtract(delta);
		});
	}
}

module.exports = SetBezierShapePointsCommand;
