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
const { readObject } = require('./utils');
const SetLineShapePointsCommand = require('./SetLineShapePointsCommand');
const BoundingBox = require('../../geometry/BoundingBox');

/**
 * Command to resize an edge.<br/>
 * This command simply rearranges all edge points relative to given BoundingBox. That means that
 * not the Edge BoundingBox itself is changed, but their points which in turn define the edge BoundingBox again.
 *
 * @example
 *     // interactionhandler and item given
 *     // simple resize of an edge by setting new BoundingBox
 *     var box = new BoundingBox(2000, 2000);
 *     var origin = item.getOrigin();
 *     box.setTopLeft(origin);
 *     var cmd = new ResizeEdgeCommand(item, box);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ResizeEdgeCommand
 * @extends SetLineShapePointsCommand
 * @constructor
 * @param {GraphItem} edge The edge to resize.
 * @param {BoundingBox} newbox The BoundingBox to use for rearranging edge points.
 */
class ResizeEdgeCommand extends SetLineShapePointsCommand {
	static createFromObject(data = {}, { graph }) {
		const edge = graph.getItemById(data.itemId);
		const newbox = readObject('newbox', data.newbox, new BoundingBox());
		return edge
			? new ResizeEdgeCommand(edge, newbox).initWithObject(data)
			: undefined;
	}

	constructor(edge, newbox) {
		const newpoints = [];
		const points = edge.getPoints();
		const oldbox = edge.getBoundingBox(JSG.boxCache.get());
		const oldsize = oldbox.getSize(JSG.ptCache.get());
		const oldorigin = oldbox.getTopLeft(JSG.ptCache.get());
		const newsize = newbox.getSize(JSG.ptCache.get());
		const neworigin = newbox.getTopLeft(JSG.ptCache.get());
		const tmppoint = JSG.ptCache.get();
		let factor;

		function factorOf(point) {
			point.subtract(oldorigin);
			oldbox.rotateLocalPointInverse(point);
			point.x = oldsize.x === 0 ? 0 : point.x / oldsize.x;
			point.y = oldsize.y === 0 ? 0 : point.y / oldsize.y;
			return point;
		}

		function applyFactor(lfactor) {
			const newpoint = tmppoint.setTo(lfactor);
			newpoint.set(newpoint.x * newsize.x, newpoint.y * newsize.y);
			newbox.rotateLocalPoint(newpoint);
			newpoint.add(neworigin);
			return newpoint;
		}

		points.forEach((point) => {
			factor = factorOf(point);
			newpoints.push(applyFactor(factor).copy());
		});

		JSG.boxCache.release(oldbox);
		JSG.ptCache.release(oldsize, oldorigin, newsize, neworigin, tmppoint);

		super(edge, newpoints);

		// TODO: pin & angle...
		// this.setOriginTo(newbbox.getTopLeft()):
		// var localpin = this._pin.getLocalPoint(new Point(0, 0));
		// localpin = MathUtils.rotatePoint(localpin, this._angle.getValue());
		// localpin.translate(x, y);
		// this.setPinPoint(localpin.x, localpin.y);

		// this._angle.setExpressionOrValue(newbbox.getAngle());
	}
}

module.exports = ResizeEdgeCommand;
