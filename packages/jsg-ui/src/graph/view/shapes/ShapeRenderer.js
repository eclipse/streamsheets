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
import {
	Dictionary,
	RectangleShape,
	BezierLineShape,
	OrthoLineShape,
	BezierShape,
	EllipseShape,
	LineShape,
	PathShape,
	PolygonShape,
	default as JSG
} from '@cedalo/jsg-core';
import BezierShapeRenderer from './BezierShapeRenderer';
import BezierLineShapeRenderer from './BezierLineShapeRenderer';
import EllipseShapeRenderer from './EllipseShapeRenderer';
import LineShapeRenderer from './LineShapeRenderer';
import PolygonShapeRenderer from './PolygonShapeRenderer';
import RectangleShapeRenderer from './RectangleShapeRenderer';
import PathShapeRenderer from './PathShapeRenderer';
import DefaultShapeRenderer from './DefaultShapeRenderer';

/**
 * This package provides different renderers for the different shape types. The renderer
 * to be used for a shape depends on the shape type. E.g. a BezierShape uses a BezierShapeRenderer. The
 * appropriate renderer can be retrieved using the static ShapeRenderer class.
 */

/**
 * Static class to provide a shape renderer for a shape type. A shape renderer
 * provides functions to render a shape in a specific way.
 *
 * @class ShapeRenderer
 * @constructor
 */
const ShapeRenderer = (() => {
	const allRenderer = new Dictionary();
	allRenderer.put(BezierShape.TYPE, new BezierShapeRenderer());
	allRenderer.put(BezierLineShape.TYPE, new BezierLineShapeRenderer());
	allRenderer.put(EllipseShape.TYPE, new EllipseShapeRenderer());
	allRenderer.put(LineShape.TYPE, new LineShapeRenderer());
	allRenderer.put(OrthoLineShape.TYPE, new LineShapeRenderer());
	allRenderer.put(PolygonShape.TYPE, new PolygonShapeRenderer());
	allRenderer.put(RectangleShape.TYPE, new RectangleShapeRenderer());
	allRenderer.put(PathShape.TYPE, new PathShapeRenderer());

	return {
		/**
		 * Get an appropriate Renderer for the given shape.
		 *
		 * @method fromShape
		 * @param {Shape} shape Shape to get renderer for.
		 * @return {DefaultShapeRenderer} ShapeRender to use for shape.
		 * @static
		 */
		fromShape(shape) {
			let renderer = allRenderer.get(shape.getType());
			if (!renderer) {
				renderer = new DefaultShapeRenderer();
			}
			return renderer;
		},
		/**
		 * Registers given renderer for given shape type. This replaces any previously registered renderer for the same
		 * type.
		 *
		 * @method addRenderer
		 * @param {String} type The shape type to register a renderer for.
		 * @param {DefaultShapeRenderer} renderer The shape renderer to register.
		 */
		addRenderer(type, renderer) {
			allRenderer.put(type, renderer);
		},
		/**
		 * Checks if a renderer is registered for given shape type.
		 *
		 * @method hasRenderer
		 * @param {String} type The shape type to check.
		 * @return {Boolean} <code>true</code> if a renderer is registered for given type, <code>false</code> otherwise.
		 */
		hasRenderer(type) {
			return !!allRenderer.get(type);
		}
	};
})();

export default ShapeRenderer;
