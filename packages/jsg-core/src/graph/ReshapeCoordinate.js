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
const Coordinate = require('./Coordinate');
const ShapeBuilder = require('./model/ShapeBuilder');

/**
 * Reshape Type definitions.
 *
 * @private
 * @class ReshapeType
 */
const ReshapeType = {
	/**
	 * Change the X-coordinate relative to the width of the GraphItem.
	 * @property XRELATIVETOWIDTH
	 * @type {Number}
	 */
	XRELATIVETOWIDTH: 0,
	/**
	 * Change the X-coordinate relative to the height of the GraphItem.
	 * @property XRELATIVETOHEIGHT
	 * @type {Number}
	 */
	XRELATIVETOHEIGHT: 1,
	/**
	 * Change the Y-coordinate relative to the height of the GraphItem.
	 * @property YRELATIVETOHEIGHT
	 * @type {Number}
	 */
	YRELATIVETOHEIGHT: 2,
	/**
	 * Change the Y-coordinate relative to the width of the GraphItem.
	 * @property YRELATIVETOWIDTH
	 * @type {Number}
	 */
	YRELATIVETOWIDTH: 3,
	/**
	 * Change the X-coordinate relative to the width starting at the right side of the GraphItem.
	 * @property XRELATIVETOWIDTHFROMRIGHT
	 * @type {Number}
	 */
	XRELATIVETOWIDTHFROMRIGHT: 4,
	/**
	 * Change the X-coordinate relative to the height starting at the right side of the GraphItem.
	 * @property XRELATIVETOHEIGHTFROMRIGHT
	 * @type {Number}
	 */
	XRELATIVETOHEIGHTFROMRIGHT: 5,
	/**
	 * Change the Y-coordinate relative to the height starting at the bottom of the GraphItem.
	 * @property YRELATIVETOHEIGHTFROMBOTTOM
	 * @type {Number}
	 */
	YRELATIVETOHEIGHTFROMBOTTOM: 6,
	/**
	 * Change the Y-coordinate relative to the width starting at the bottom of the GraphItem.
	 * @property YRELATIVETOWIDTHFROMBOTTOM
	 * @type {Number}
	 */
	YRELATIVETOWIDTHFROMBOTTOM: 7,
	/**
	 * Change the X-coordinate using the width of the GraphItem.
	 * @property XABSOLUTEWIDTH
	 * @type {Number}
	 XABSOLUTEWIDTH : 8,
	 * Change the Y-coordinate using the height of the GraphItem.
	 * @property YABSOLUTEHEIGHT
	 * @type {Number}
	 YABSOLUTEHEIGHT : 9,
	 * Change the X-coordinate using the width starting at the right of the GraphItem.
	 * @property XABSOLUTEWIDTHFROMRIGHT
	 * @type {Number}
	 XABSOLUTEWIDTHFROMRIGHT : 10,
	 * Change the Y-coordinate using the height starting at the bottom of the GraphItem.
	 * @property YABSOLUTEHEIGHTFROMBOTTOM
	 * @type {Number}
	 YABSOLUTEHEIGHTFROMBOTTOM : 11,
	 * Change the coordinate along an ellipse formed by the extent of the item
	 * @property RADIAL
	 * @type {Number}
	 */
	RADIAL: 12,
	/**
	 * Change the X-coordinate relative to the minimum of height or width of the GraphItem.
	 * @property XRELATIVETOMIN
	 * @type {Number}
	 */
	XRELATIVETOMIN: 13,
	/**
	 * Change the X-coordinate relative to the minimum of height or width starting at the right of the GraphItem.
	 * @property XRELATIVETOMINFROMRIGHT
	 * @type {Number}
	 */
	XRELATIVETOMINFROMRIGHT: 14,
	/**
	 * Change the Y-coordinate relative to the minimum of height or width of the GraphItem.
	 * @property YRELATIVETOMIN
	 * @type {Number}
	 */
	YRELATIVETOMIN: 15,
	/**
	 * Change the Y-coordinate relative to the minimum of height or width starting at the bottom of the GraphItem.
	 * @property YRELATIVETOMINFROMBOTTOM
	 * @type {Number}
	 */
	YRELATIVETOMINFROMBOTTOM: 16,
	/**
	 * Change the coordinate using custom algorithm to be provided
	 * @property CUSTOM
	 * @type {Number}
	 */
	CUSTOM: 99,
	/**
	 * Do not change the coordinate
	 * @property NONE
	 * @type {Number}
	 */
	NONE: -1
};

/**
 * This class contains a 2D coordinate, defining a horizontal and a vertical coordinate to place an object in the
 * coordinate system. The coordinates are defined by Expressions, which allow the definition of formulas and
 * this way referencing properties of another GraphItem. ReshapeCoordinates extend the coordinate by defining value
 * ranges for the coordinate values and defining usage criteria. This class is only intended for internal use.
 *
 * @class ReshapeCoordinate
 * @extends Coordinate
 * @private
 * @constructor
 * @param {BooleanExpression} xExpression Horizontal coordinate.
 * @param {BooleanExpression} yExpression Vertical coordinate.
 * @param {Number} xMin Minimum values for x Expression.
 * @param {Number} xMax Maximum values for x Expression.
 * @param {Number} yMin Minimum values for y Expression.
 * @param {Number} yMax Maximum values for y Expression.
 * @param {String} name Name of related property.
 * @param {ReshapeCoordinate.ReshapeType} xtype Scaling type of x values.
 * @param {ReshapeCoordinate.ReshapeType} ytype Scaling type of y values.
 */
class ReshapeCoordinate extends Coordinate {
	constructor(
		xExpression,
		yExpression,
		xMin,
		xMax,
		yMin,
		yMax,
		name,
		xtype,
		ytype
	) {
		super(xExpression, yExpression);

		this._name = name;
		this._xtype = xtype;
		this._ytype = ytype;
		this._xMin = xMin;
		this._xMax = xMax;
		this._yMin = yMin;
		this._yMax = yMax;
	}

	/**
	 * Copy this ReshapeCoordinate.
	 *
	 * @method copy
	 * @return {ReshapeCoordinate} A copy of this class.
	 */
	copy() {
		const copy = new ReshapeCoordinate();
		copy.setTo(this);
		return copy;
	}

	static get ReshapeType() {
		return ReshapeType;
	}

	/**
	 * Save the ReshapeCoordinate.
	 *
	 * @method save
	 * @param {String} name Tag name to use.
	 * @param {Writer} writer Writer instance.
	 */
	save(name, writer) {
		writer.writeStartElement(name);

		writer.writeAttributeString('name', this._name);
		writer.writeAttributeString('xtype', this._xtype);
		writer.writeAttributeString('ytype', this._ytype);
		if (this._xMin) {
			writer.writeAttributeNumber('xMin', this._xMin, 2);
		}
		if (this._xMax) {
			writer.writeAttributeNumber('xMax', this._xMax, 2);
		}
		if (this._yMin) {
			writer.writeAttributeNumber('yMin', this._yMin, 2);
		}
		if (this._yMax) {
			writer.writeAttributeNumber('yMax', this._yMax, 2);
		}

		this._xExpression.save('x', writer, 2);
		this._yExpression.save('y', writer, 2);

		if (this._builder) {
			writer.writeAttributeString('builder', 'true');
		}

		if (this._builderName) {
			writer.writeAttributeString('buildername', this._builderName);
		}

		writer.writeEndElement();
	}

	/**
	 * Read the ReshapeCoordinate.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use.
	 * @param {Object} object Object to read from.
	 */
	read(reader, object) {
		this._xMin = 0;
		this._xMax = 0;
		this._yMin = 0;
		this._yMax = 0;

		reader.iterateAttributes(object, (name, value) => {
			switch (name) {
				case 'name':
					this._name = value;
					break;
				case 'type':
					// old format
					switch (Number(value)) {
						case ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH:
							this._xtype =
								ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH;
							this._ytype = ReshapeCoordinate.ReshapeType.NONE;
							break;
						case ReshapeCoordinate.ReshapeType
							.XRELATIVETOWIDTHFROMRIGHT:
							this._xtype =
								ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTHFROMRIGHT;
							this._ytype = ReshapeCoordinate.ReshapeType.NONE;
							break;
						case ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT:
							this._xtype =
								ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHT;
							this._ytype = ReshapeCoordinate.ReshapeType.NONE;
							break;
						case ReshapeCoordinate.ReshapeType
							.XRELATIVETOHEIGHTFROMRIGHT:
							this._xtype =
								ReshapeCoordinate.ReshapeType.XRELATIVETOHEIGHTFROMRIGHT;
							this._ytype = ReshapeCoordinate.ReshapeType.NONE;
							break;
						case ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT:
							this._xtype = ReshapeCoordinate.ReshapeType.NONE;
							this._ytype =
								ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT;
							break;
						case ReshapeCoordinate.ReshapeType
							.YRELATIVETOHEIGHTFROMBOTTOM:
							this._xtype = ReshapeCoordinate.ReshapeType.NONE;
							this._ytype =
								ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHTFROMBOTTOM;
							break;
						case ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH:
							this._xtype = ReshapeCoordinate.ReshapeType.NONE;
							this._ytype =
								ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTH;
							break;
						case ReshapeCoordinate.ReshapeType
							.YRELATIVETOWIDTHFROMBOTTOM:
							this._xtype = ReshapeCoordinate.ReshapeType.NONE;
							this._ytype =
								ReshapeCoordinate.ReshapeType.YRELATIVETOWIDTHFROMBOTTOM;
							break;
						case ReshapeCoordinate.ReshapeType.RADIAL:
							this._xtype = ReshapeCoordinate.ReshapeType.RADIAL;
							this._ytype = ReshapeCoordinate.ReshapeType.RADIAL;
							break;
						default:
							this._xtype =
								ReshapeCoordinate.ReshapeType.XRELATIVETOWIDTH;
							this._ytype =
								ReshapeCoordinate.ReshapeType.YRELATIVETOHEIGHT;
					}
					break;
				case 'xtype':
					this._xtype = Number(value);
					break;
				case 'ytype':
					this._ytype = Number(value);
					break;
				case 'xMin':
					this._xMin = Number(value);
					break;
				case 'xMax':
					this._xMax = Number(value);
					break;
				case 'yMin':
					this._yMin = Number(value);
					break;
				case 'yMax':
					this._yMax = Number(value);
					break;
				case 'builder':
					this._builder = value;
					break;
				case 'buildername':
					this._builderName = value;
					break;
				default:
					break;
			}
		});

		if (this._builder) {
			if (this._builderName === undefined) {
				// old file: info is missing -> try using name
				this._builder =
					ShapeBuilder[this._name];
			} else {
				this._builder =
					ShapeBuilder[
						this._builderName
					];
			}
		}

		reader.iterateObjects(object, (name, subnode) => {
			switch (name) {
				case 'x':
					this._xExpression.read(reader, subnode);
					break;
				case 'y':
					this._yExpression.read(reader, subnode);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Copy content from another ReshapeCoordinate.
	 *
	 * @method setTo
	 * @param {ReshapeCoordinate} coordinate ReshapeCoordinate to retrieve values from.
	 */
	setTo(coordinate) {
		if (coordinate !== undefined) {
			this.set(
				coordinate._xExpression.copy(),
				coordinate._yExpression.copy()
			);
			this._name = coordinate._name;
			this._xtype = coordinate._xtype;
			this._ytype = coordinate._ytype;
			this._xMin = coordinate._xMin;
			this._xMax = coordinate._xMax;
			this._yMin = coordinate._yMin;
			this._yMax = coordinate._yMax;
			this._builder = coordinate._builder;
			this._builderName = coordinate._builderName;
		}
	}

	/**
	 * Get X minimum value.
	 *
	 * @method getXMin
	 * @return {Number} X Minimum.
	 */
	getXMin() {
		return this._xMin;
	}

	/**
	 * Get X maximum value.
	 *
	 * @method getXMax
	 * @return {Number} X Maximum.
	 */
	getXMax() {
		return this._xMax;
	}

	/**
	 * Get Y minimum value.
	 *
	 * @method getYMin
	 * @return {Number} Y Minimum.
	 */
	getYMin() {
		return this._yMin;
	}

	/**
	 * Get Y maximum value.
	 *
	 * @method getYMax
	 * @return {Number} Y Maximum.
	 */
	getYMax() {
		return this._yMax;
	}

	/**
	 * Get name.
	 *
	 * @method getName
	 * @return {String} Name of related property.
	 */
	getName() {
		return this._name;
	}

	/**
	 * Get horizontal ReshapeCoordinate rule.
	 *
	 * @method getXType
	 * @return {ReshapeCoordinate.ReshapeType} ReshapeCoordinate rule.
	 */
	getXType() {
		return this._xtype;
	}

	/**
	 * Get vertical ReshapeCoordinate rule.
	 *
	 * @method getYType
	 * @return {ReshapeCoordinate.ReshapeType} ReshapeCoordinate rule.
	 */
	getYType() {
		return this._ytype;
	}

	getShapeBuilder() {
		return this._builder;
	}

	setShapeBuilder(func) {
		this._builder = func;
	}

	setShapeBuilderName(name) {
		this._builderName = name;
	}
}

module.exports = ReshapeCoordinate;
