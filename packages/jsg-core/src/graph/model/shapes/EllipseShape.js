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
const BezierShape = require('./BezierShape');
const Coordinate = require('./../../Coordinate');

/**
 * This class is for ellipse based shapes. Internally it is based on a bezier shape.</br>
 * See {{#crossLink "BezierShape"}}{{/crossLink}}.
 *
 * @class EllipseShape
 * @constructor
 * @extends BezierShape
 */
class EllipseShape extends BezierShape {
	constructor() {
		super();

		this._cpFromCoordinates.push(new Coordinate(this._newExpression(0, 'WIDTH * 0.225'), this._newExpression(0)));
		this._coordinates.push(new Coordinate(this._newExpression(0, 'WIDTH * 0.5'), this._newExpression(0)));
		this._cpToCoordinates.push(new Coordinate(this._newExpression(0, 'WIDTH * 0.775'), this._newExpression(0)));

		this._cpFromCoordinates.push(
			new Coordinate(this._newExpression(0, 'WIDTH'), this._newExpression(0, 'HEIGHT * 0.225'))
		);
		this._coordinates.push(new Coordinate(this._newExpression(0, 'WIDTH'), this._newExpression(0, 'HEIGHT * 0.5')));
		this._cpToCoordinates.push(
			new Coordinate(this._newExpression(0, 'WIDTH'), this._newExpression(0, 'HEIGHT * 0.775'))
		);

		this._cpFromCoordinates.push(
			new Coordinate(this._newExpression(0, 'WIDTH * 0.775'), this._newExpression(0, 'HEIGHT'))
		);
		this._coordinates.push(new Coordinate(this._newExpression(0, 'WIDTH * 0.5'), this._newExpression(0, 'HEIGHT')));
		this._cpToCoordinates.push(
			new Coordinate(this._newExpression(0, 'WIDTH * 0.225'), this._newExpression(0, 'HEIGHT'))
		);

		this._cpFromCoordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0, 'HEIGHT * 0.775')));
		this._coordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0, 'HEIGHT * 0.5')));
		this._cpToCoordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0, 'HEIGHT * 0.225')));
	}

	getType() {
		return EllipseShape.TYPE;
	}

	newInstance() {
		return new EllipseShape();
	}

	read(reader, object) {}

	/**
	 * Type string for an ellipse shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'ellipse';
	}
}

module.exports = EllipseShape;
