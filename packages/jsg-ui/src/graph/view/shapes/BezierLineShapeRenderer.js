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
import LineShapeRenderer from './LineShapeRenderer';

/**
 * A <code>LineShapeRenderer</code> subclass to draw {{#crossLink
 * "BezierLineShape"}}{{/crossLink}}s.
 *
 * @class BezierLineShapeRenderer
 * @extends LineShapeRenderer
 * @constructor
 * @since 1.6.15
 */
class BezierLineShapeRenderer extends LineShapeRenderer {
	// overwritten
	drawShapeBorder(shape, closed, graphics) {
		this._context.endArrow = undefined;
		this._context.startArrow = undefined;
		// TODO  var points = shape.getVisiblePoints();
		//
		const points = shape.getPoints();

		if (points.length > 1) {
			graphics.drawBezier(shape.getCpToPoints(), points, shape.getCpFromPoints(), closed);
		}
	}
}

export default BezierLineShapeRenderer;
