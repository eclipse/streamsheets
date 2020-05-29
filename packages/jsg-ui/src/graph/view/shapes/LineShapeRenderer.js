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
import DefaultShapeRenderer from './DefaultShapeRenderer';

/**
 * Class to render a LineShape. The given points are simply connected
 * by drawing a polyline.
 *
 * @class LineShapeRenderer
 * @extends DefaultShapeRenderer
 * @constructor
 */
class LineShapeRenderer extends DefaultShapeRenderer {
	constructor() {
		super();

		this._context = {};
	}

	getContext() {
		return this._context;
	}

	drawShapeFill(shape, closed, graphics) {}

	drawShapeBorder(shape, closed, graphics) {
		const points = shape.getVisiblePoints();
		const context = this.getContext();
		context.endArrow = undefined;
		context.startArrow = undefined;

		graphics.drawPolyline(points, false, context);
	}

	_getLayoutSettings(shape) {}

	_compareSeg(pt1, pt2) {
		if (pt1._seg < pt2._seg) {
			return -1;
		}
		if (pt1._seg > pt2._seg) {
			return 1;
		}
		// both same segment => check x position:
		return pt1._isForward
			? pt1.x < pt2.x
				? -1
				: pt1.x > pt2.x
				? 1
				: 0
			: pt1.x > pt2.x
			? -1
			: pt1.x < pt2.x
			? 1
			: 0;
	}
}

export default LineShapeRenderer;
