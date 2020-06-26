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
const AbstractItemCommand = require('./AbstractItemCommand');
const Coordinate = require('../Coordinate');
const NumberExpression = require('../expr/NumberExpression');
const PointList = require('../../geometry/PointList');
const Point = require('../../geometry/Point');
const { readObject, writeJSON } = require('./utils');
const BoundingBox = require('../../geometry/BoundingBox');

const toPointList = (points) => {
	const list = new PointList();
	points.forEach((point) => {
		list.addPoint(point.copy());
	});
	return list;
};

/**
 * Command to replace the points of a line. The BoundingBox is automatically
 * recalculated and the points are converted to formulas with relative coordinates to achieve,
 * that the inner points scale with the bounding box of the GraphItem.
 *
 * @example
 *     // interactionhandler and item given
 *     // Set 4 new points for an item
 *     var points = [];
 *     points.push(new Point(0, 0));
 *     points.push(new Point(3000, 0));
 *     points.push(new Point(3000, 2000));
 *     points.push(new Point(0, 2000));
 *     var cmd = new SetShapePointsCommand(item, points);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class SetShapePointsCommand
 * @extends AbstractGroupUngroupCommand
 * @constructor
 * @param {GraphItem} item Line to replace points in.
 * @param {Point[]} newpoints Array of new points specified in parent coordinate system
 */
class SetShapePointsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		const points = data.newpoints.map((pt) => new Point(pt.x, pt.y));
		return item
			? new SetShapePointsCommand(item, points).initWithObject(data)
			: undefined;
	}

	constructor(item, newpoints) {
		super(item);

		this._oldbbox = item.getBoundingBox();
		this._newbbox = this._resizeBBox(item.getBoundingBox(), newpoints);
		this._translate(newpoints, this._oldbbox, this._newbbox);

		function copy(coordinates) {
			const pts = [];
			coordinates.forEach((coordinate) => {
				pts.push(coordinate.copy());
			});
			return pts;
		}

		this._newpointlist = toPointList(newpoints);
		this._oldpointlist = toPointList(item._shape.getPoints());

		// reshape handling:
		this._oldCoordinates = copy(item.getShape().getCoordinates());
		this._oldReshapeProperties = item._reshapeProperties.copy();
		this._oldReshapeCoordinates = copy(item._reshapeCoordinates);
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldbbox = readObject('oldbbox', data.oldbbox, new BoundingBox());
		cmd._oldpointlist = toPointList(
			data.oldpoints.map((pt) => new Point(pt.x, pt.y))
		);
		cmd._oldCoordinates = data.oldCoordinates.map((coord) =>
			readObject('coord', coord, new Coordinate())
		);
		cmd._oldReshapeCoordinates = data.oldReshapeCoordinates.map((coord) =>
			readObject('coord', coord, new Coordinate())
		);
		cmd._oldReshapeProperties
			.getPropertiesMap()
			.setMap(data.oldReshapeProperties);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.newpoints = this._newpointlist.getPoints();
		data.oldpoints = this._oldpointlist.getPoints();
		data.oldbbox = writeJSON('oldbbox', this._oldbbox);
		data.oldCoordinates = this._oldCoordinates.map((coord) =>
			writeJSON('coord', coord)
		);
		data.oldReshapeCoordinates = this._oldReshapeCoordinates.map((coord) =>
			writeJSON('coord', coord)
		);
		data.oldReshapeProperties = this._oldReshapeProperties
			.getPropertiesMap()
			.getMap();
		return data;
	}

	/**
	 * Undo the point replacement.
	 *
	 * @method undo
	 */
	undo() {
		this._graphItem.setBoundingBoxTo(this._oldbbox, true);
		// this._setCoordinates(this._oldbbox, this._oldpointlist);
		this._graphItem.getShape().setCoordinates(this._oldCoordinates);
		this._graphItem.setReshapeProperties(this._oldReshapeProperties);
		this._graphItem.setReshapeCoordinates(this._oldReshapeCoordinates);
		this._graphItem.evaluate(); // we changed shape coordinates => have to evaluate item with new coords...
	}

	/**
	 * Redo the point replacement.
	 *
	 * @method redo
	 */
	redo() {
		this._graphItem.setBoundingBoxTo(this._newbbox, true);
		this._setCoordinates(this._newbbox, this._newpointlist);
	}

	/**
	 * Create coordinates with formulas relative to the bounding box of the item from the given coordinate points. This
	 * is necessary to scale the shape automatically with the bounding box.
	 *
	 * @method _setCoordinates
	 * @param {BoundingBox} bbox BoundingBox of the item.
	 * @param {PointList} pointlist PointList with the new  points.
	 * @private
	 */
	_setCoordinates(bbox, pointlist) {
		const width = bbox.getWidth();
		const height = bbox.getHeight();
		const newcoordinates = [];

		const points = pointlist.getPoints();
		let x;
		let y;
		let xFac;
		let yFac;

		points.forEach((point) => {
			xFac = width !== 0 ? point.x / width : 0;
			yFac = height !== 0 ? point.y / height : 0;
			x = new NumberExpression(xFac, `width * ${xFac.toFixed(5)}`);
			y = new NumberExpression(yFac, `height * ${yFac.toFixed(5)}`);
			newcoordinates.push(new Coordinate(x, y));
		});
		this._graphItem._shape.setCoordinates(newcoordinates);

		// clear any reshape coordinates...
		// var keepCoordinates = this._graphItem.getDataForKey("keepreshapecoordinates");
		const keepCoordinates = this._graphItem.getAttributeAtPath(
			'keepreshapecoordinates'
		);
		if (
			keepCoordinates === undefined ||
			keepCoordinates.getValue() !== true
		) {
			this._graphItem._reshapeCoordinates = [];
			this._graphItem._reshapeProperties.clear();
		}
	}

	/**
	 * Resize bounding box to fit it to the new points.
	 *
	 * @method _setCoordinates
	 * @param {BoundingBox} bbox BoundingBox of the item.
	 * @param {PointList} points PointList with the new points.
	 * @return {BoundingBox} New BoundingBox.
	 * @private
	 */
	_resizeBBox(bbox, points) {
		let minX;
		let minY;
		let maxX;
		let maxY;
		const tmppoint = new Point(0, 0);

		bbox.setSize(0, 0);

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
	 * @param {PointList} points PointList with the new context points.
	 * @param {BoundingBox} oldbbox Current BoundingBox of the item.
	 * @param {BoundingBox} newbbox New BoundingBox of the item.
	 * @private
	 */
	_translate(points, oldbbox, newbbox) {
		const delta = newbbox.getTopLeft().subtract(oldbbox.getTopLeft());
		oldbbox.rotateLocalPointInverse(delta);
		points.forEach((point) => {
			point.subtract(delta);
		});
	}
}

module.exports = SetShapePointsCommand;
