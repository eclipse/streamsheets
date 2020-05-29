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
 * Class to provide a renderer for polygon and polyline Shapes. It renders
 * the points of the polygon or polyline to the given graphics.
 *
 * @class PolygonShapeRenderer
 * @extends DefaultShapeRenderer
 * @constructor
 */
class PolygonShapeRenderer extends DefaultShapeRenderer {
	drawShapeFill(shape, closed, graphics) {
		if (closed) {
			graphics.fillPolyline(shape.getPoints());
		}
	}

	drawShapeBorder(shape, closed, graphics) {
		graphics.drawPolyline(shape.getPoints(), closed);
	}
}

export default PolygonShapeRenderer;
