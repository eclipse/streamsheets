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
const BBoxShape = require('./BBoxShape');
const Shape = require('./Shape');
const RectangleShape = require('./RectangleShape');
const BezierLineShape = require('./BezierLineShape');
const BezierShape = require('./BezierShape');
const EllipseShape = require('./EllipseShape');
const LineShape = require('./LineShape');
const OrthoLineShape = require('./OrthoLineShape');
const PathShape = require('./PathShape');
const PolygonShape = require('./PolygonShape');

const shapeConstructors = {};

/**
 * A singleton to create {{#crossLink "Shape"}}{{/crossLink}}s based on their
 * type string.</br>
 *
 * @example
 *     var typestr = oldshape.getType(); //usually it comes from a different source, e.g. an xml file
 *     var newShape = ShapeFactory.createShapeFromString(typestr);
 *
 * See {{#crossLink "Shape/getType:method"}}{{/crossLink}}.
 * @class ShapeFactory
 * @constructor
 */

class ShapeFactory {
	/**
	 * Registers given construction function to this factory for specified shape type. Any previously registered
	 * constructor function for the same type will be replaced.<br/>
	 * The constructor function is called with <code>new</code> and no parameter in
	 * {{#crossLink "ShapeFactory/createShapeFromString:method"}}{{/crossLink}}.
	 *
	 * @method addShapeConstructor
	 * @param {String} type The shape type to register given constructor function for.
	 * @param {Function} constrfunc The constructor function to register.
	 */
	static addShapeConstructor(shapetype, constrcutorfunc) {
		shapeConstructors[shapetype] = constrcutorfunc;
	}
	/**
	 * Creates a new <code>Shape</code> instance based on given type string.
	 *
	 * @method createShapeFromString
	 * @param {String} typeStr A valid shape type string. See {{#crossLink
	 *     "Shape/getType:method"}}{{/crossLink}}.
	 * @return {Shape} a new shape instance or <code>undefined</code> if given type string
	 *     is not valid.
	 */
	static createShapeFromString(typeStr) {
		const Constructor = shapeConstructors[typeStr] || Shape;
		return new Constructor();
	}
}

ShapeFactory.addShapeConstructor(EllipseShape.TYPE, EllipseShape);
ShapeFactory.addShapeConstructor(RectangleShape.TYPE, RectangleShape);
ShapeFactory.addShapeConstructor(BezierShape.TYPE, BezierShape);
ShapeFactory.addShapeConstructor(BezierLineShape.TYPE, BezierLineShape);
ShapeFactory.addShapeConstructor(PolygonShape.TYPE, PolygonShape);
ShapeFactory.addShapeConstructor(LineShape.TYPE, LineShape);
ShapeFactory.addShapeConstructor(OrthoLineShape.TYPE, OrthoLineShape);
ShapeFactory.addShapeConstructor(PathShape.TYPE, PathShape);
ShapeFactory.addShapeConstructor(BBoxShape.TYPE, BBoxShape);

module.exports = ShapeFactory;
