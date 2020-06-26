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
import { BoundingBox, default as JSG } from '@cedalo/jsg-core';
import GraphItemView from "./GraphItemView";

/**
 * This view is for an {{#crossLink "Edge"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "ConnectionController/createView:method"}}{{/crossLink}} method.
 *
 * @class EdgeView
 * @extends GraphItemView
 * @param {Edge} item The corresponding Edge model.
 * @constructor
 */
class EdgeView extends GraphItemView {
	constructor(item) {
		super(item);

		this._arrowEndBox = new BoundingBox();
		this._arrowStartBox = new BoundingBox();
	}

	containsPoint(point, findFlag, threshold) {
		return this._item.containsPoint(point, findFlag, threshold);
	}

	/**
	 * Returns the 0 based index of line segment t given location or -1 if point does not touch this edge.</br>
	 * See {{#crossLink "LineConnection/getLineSegmentAtPoint:method"}}{{/crossLink}}
	 * for more information about line segments.
	 *
	 * @method getLineSegmentAtPoint
	 * @param {Point} point The location to test.
	 * @param {Number} threshold The maximum point distance to the line.
	 * @return {Number} The line segment index or -1 if the point does not touch the line.
	 */
	getLineSegmentAtPoint(point, threshold) {
		return this._item.getLineSegmentAtPoint(point, threshold);
	}

	/**
	 * Checks if given Point is over a possible line end arrow. Provided Point should be relative this
	 * origin.
	 *
	 * @method hitsLineArrowEnd
	 * @param {Point} point The point to test, relative to edge origin.
	 * @param {Number} [threshold] The maximum distance between the point to test to a possible arrow.
	 * @return {Boolean} <code>true</code> if given point hits line end arrow, <code>false</code> if line
	 * has no end arrow or given point is not near it.
	 */
	hitsLineArrowEnd(point, threshold) {
		return this._hitsLineArrow(point, threshold, this._arrowEndBox);
	}

	/**
	 * Checks if given Point is over a possible line start arrow. Provided Point should be relative this
	 * origin.
	 *
	 * @method hitsLineArrowStart
	 * @param {Point} point The point to test, relative to edge origin.
	 * @param {Number} [threshold] The maximum distance between the point to test to a possible arrow.
	 * @return {Boolean} <code>true</code> if given point hits line start arrow, <code>false</code> if line
	 * has no start arrow or given point is not near it.
	 */
	hitsLineArrowStart(point, threshold) {
		return this._hitsLineArrow(point, threshold, this._arrowStartBox);
	}

	_hitsLineArrow(point, threshold, bbox) {
		if (bbox !== undefined) {
			threshold = threshold !== undefined ? threshold : 250;
			bbox.expandBy(threshold);
			return bbox.containsPoint(point);
		}
		return false;
	}

	// draw border before subitems
	drawFill(graphics, format, rect) {
		super.drawBorder(graphics, format, rect);
	}

	drawBorder(graphics, format, rect) {}

	drawDecorations(graphics) {
		// set arrow bounding boxes...
		const context = this._shapeRenderer.getContext();

		this._setArrowBox(this._arrowEndBox, context !== undefined ? context.endArrow : undefined);
		this._setArrowBox(this._arrowStartBox, context !== undefined ? context.startArrow : undefined);

		// if(true) {
		// graphics.save();
		// var bbox = this._arrowEndBox;
		// // console.log("arrow box: "+bbox.toString());
		// //we are already rotated so rotate back:
		// graphics.rotate(-bbox.getAngle());
		// graphics.setLineColor("#FF0000");
		// //graphics.drawPolyline(bbox.getPoints(), true);
		// graphics.drawPolyline(bbox.getPointsUnrotated(), true);
		// graphics.restore();
		// }

		// if (JSG.debug.SHOW_LINE_BBOX) {
		// 	graphics.save();
		// 	// var bbox = this._item._shape.getPointList().getBoundingBox();
		// 	const bbox = this._item.getBoundingBox(JSG.boxCache.get());
		// 	// we are already rotated so rotate back:
		// 	graphics.rotate(-bbox.getAngle());
		// 	origin = this._item.getOrigin(JSG.ptCache.get());
		// 	const topleft = JSG.ptCache.get();
		// 	bbox.setTopLeftTo(bbox.getTopLeft(topleft).subtract(origin));
		// 	graphics.setLineColor('#FF0000');
		// 	graphics.drawPolyline(bbox.getPointsUnrotated(), true);
		// 	graphics.setLineColor('#00FF00');
		// 	graphics.drawPolyline(bbox.getPoints(), true);
		// 	graphics.restore();
		// 	JSG.boxCache.release(bbox);
		// 	JSG.ptCache.release(origin, topleft);
		// }
		//
		// function drawPin(line, origin) {
		// 	graphics.setLineColor('#ff0000');
		// 	let pin = line.getPinPoint(JSG.ptCache.get());
		// 	pin = (origin !== undefined) ? pin.subtract(origin) : pin;
		// 	const rect = JSG.rectCache.get();
		// 	rect.x = pin.x - 200;
		// 	rect.y = pin.y - 200;
		// 	rect.width = 400;
		// 	rect.height = 400;
		// 	graphics.drawEllipse(rect);
		// 	JSG.ptCache.release(pin);
		// 	JSG.rectCache.release(rect);
		// }
		//
		// function drawTestDecorations(line) {
		// 	if (line.decorationPoints !== undefined) {
		// 		graphics.setLineColor('#FF0000');
		// 		graphics.drawPolyline(line.decorationPoints, false);
		// 	}
		// }
		//
		// if (JSG.debug.SHOW_LINE_ORIGIN) {
		// 	const origin = this._item.getOrigin(JSG.ptCache.get());
		// 	drawPin(this._item, origin);
		// 	JSG.ptCache.release(origin);
		// }
	}

	_setArrowBox(arrowbox, contextbox) {
		if (contextbox !== undefined) {
			arrowbox.setTo(contextbox);
		} else {
			arrowbox.setSize(-1, -1);
		}
	}

	/**
	 * Convenience method to call <code>evaluate</code> on underlying Edge model.
	 *
	 * @method evaluate
	 */
	evaluate() {
		// evaluate is called via invalidate()
		this._item.evaluate();
	}
}

export default EdgeView;
