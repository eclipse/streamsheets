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
import { default as JSG } from '@cedalo/jsg-core';

/**
 * This class is the default renderer for a shape. It simply renders the points of the
 * shape as a polygon or polyline.
 *
 * @class DefaultShapeRenderer
 * @constructor
 */
class DefaultShapeRenderer {
	/**
	 * Initializes this renderer before any draw will be done.<br/>
	 * This method is can be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method init
	 * @param {Shape} shape The shape to be drawn.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 */
	init(shape, graphics) {}

	/**
	 * This function draws the given shape by filling its interior area.
	 *
	 * @method drawShapeFill
	 * @param {Shape} shape Shape to fill.
	 * @param {boolean} closed True, if shape should be closed. This is primarily used for polygons and bezier curves to
	 * connect the last with the first point.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 */
	drawShapeFill(shape, closed, graphics) {
		graphics.fillPolyline(shape.getPoints());
	}

	/**
	 * This function draws the given shape border.
	 *
	 * @method drawShapeBorder
	 * @param {Shape} shape Shape to draw border for.
	 * @param {boolean} closed True, if shape should be closed. This is primarily used for polygons and bezier curves to
	 * connect the last with the first point.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 */
	drawShapeBorder(shape, closed, graphics) {
		graphics.drawPolyline(shape.getPoints(), true);
	}

	/**
	 * This function clips output to the Graphics at the given shape border.
	 *
	 * @method setClipArea
	 * @param {Shape} shape Shape to clip to.
	 * @param {Graphics} graphics Graphics to use for clipping.
	 */
	setClipArea(shape, graphics) {
		graphics.setClipArea(undefined, shape.getPoints(), undefined);
	}
}

export default DefaultShapeRenderer;
