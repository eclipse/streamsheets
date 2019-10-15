import { default as JSG } from '@cedalo/jsg-core';
import DefaultShapeRenderer from './DefaultShapeRenderer';

/**
 * Class to render a BezierShape.
 *
 * @class BezierShapeRenderer
 * @constructor
 */
class BezierShapeRenderer extends DefaultShapeRenderer {
	drawShapeFill(shape, closed, graphics) {
		if (closed) {
			const points = shape.getPoints();
			if (points.length < 2) {
				return;
			}

			graphics.fillBezier(shape.getCpToPoints(points), points, shape.getCpFromPoints(points));
		}
	}

	drawShapeBorder(shape, closed, graphics) {
		const points = shape.getPoints();

		if (points.length < 2) {
			return;
		}

		graphics.antialias = true;
		graphics.drawBezier(shape.getCpToPoints(points), points, shape.getCpFromPoints(points), closed);
		graphics.antialias = false;
	}

	setClipArea(shape, graphics) {
		const points = shape.getPoints();

		graphics.setClipArea(shape.getCpToPoints(points), points, shape.getCpFromPoints(points));
	}
}

export default BezierShapeRenderer;
