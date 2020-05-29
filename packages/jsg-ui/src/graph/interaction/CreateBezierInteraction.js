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
import { BoundingBox, Coordinate, NumberExpression, Point, MathUtils, default as JSG } from '@cedalo/jsg-core';
import CreatePolyLineInteraction from './CreatePolyLineInteraction';

/**
 * An interaction to create a {{#crossLink "Node"}}{{/crossLink}} with a
 * {{#crossLink "BezierShape"}}{{/crossLink}}.
 *
 * @class CreateBezierInteraction
 * @extends CreatePolyLineInteraction
 * @constructor
 * @param {Node} graphItem A node item with a bezier shape.
 */
class CreateBezierInteraction extends CreatePolyLineInteraction {
	translate(shape, origin, size) {
		const tmppoint = new Point(0, 0);
		const exPoint = new Point(0, 0);
		const Expression = NumberExpression;
		const utils = MathUtils;

		shape.getCoordinates().forEach((coordinate) => {
			coordinate.toPoint(tmppoint);
			tmppoint.translate(-origin.x, -origin.y);
			exPoint.set(utils.roundTo(tmppoint.x / size.x, 2), utils.roundTo(tmppoint.y / size.y, 2));
			coordinate.set(
				new Expression(tmppoint.x, `WIDTH * ${exPoint.x}`),
				new Expression(tmppoint.x, `HEIGHT * ${exPoint.y}`)
			);
		});

		shape.getCpFromPoints().forEach((point) => {
			point.translate(-origin.x, -origin.y);
			exPoint.set(utils.roundTo(point.x / size.x, 2), utils.roundTo(point.y / size.y, 2));
			const coordinate = new Coordinate(
				new Expression(0, `WIDTH * ${exPoint.x}`),
				new Expression(0, `HEIGHT * ${exPoint.y}`)
			);
			shape.getCpFromCoordinates().push(coordinate);
		});

		shape.getCpToPoints().forEach((point) => {
			point.translate(-origin.x, -origin.y);
			exPoint.set(utils.roundTo(point.x / size.x, 2), utils.roundTo(point.y / size.y, 2));
			const coordinate = new Coordinate(
				new Expression(0, `WIDTH * ${exPoint.x}`),
				new Expression(0, `HEIGHT * ${exPoint.y}`)
			);
			shape.getCpToCoordinates().push(coordinate);
		});
	}

	getNewBoundingBox(shape, reusebbox) {
		const bbox = reusebbox || new BoundingBox(0, 0);

		shape.getBezierPoints(shape.getPoints());
		shape.getPointList().getBoundingBox(bbox);

		const cpFromBox = shape.getCpFromPointList().getBoundingBox(JSG.boxCache.get());
		const cpToBox = shape.getCpToPointList().getBoundingBox(JSG.boxCache.get());

		bbox.union(cpFromBox);
		bbox.union(cpToBox);

		JSG.boxCache.release(cpFromBox, cpToBox);
		return bbox;
	}
}

export default CreateBezierInteraction;
