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
