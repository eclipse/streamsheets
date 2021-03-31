
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
const JSG = require('../../../JSG');
const Shape = require('./Shape');
const Point = require('../../../geometry/Point');
const Coordinate = require('../../Coordinate');
const Expression = require('../../expr/Expression');
const SheetReference = require('../../expr/SheetReference');

/**
 * A polygon shape definition. {{#crossLink "Coordinate"}}{{/crossLink}}s are added
 * after creation.
 *
 * @class PolygonShape
 * @constructor
 * @extends Shape
 */
class PolygonShape extends Shape {
	constructor() {
		super();

		// reference to source of points on sheet
		this._source = new Expression('');
	}
	getType() {
		return PolygonShape.TYPE;
	}

	evaluate() {
		super.evaluate();
		this._source.evaluate(this._item);
	}

	getSource() {
		return this._source;
	}

	setSource(source) {
		this._source = source;
	}

	fromJSON(json) {
		const ret = super.fromJSON(json);

		if (json.points) {
			this._coordinates = [];
			json.points.forEach(point => {
				const coordinate = new Coordinate();
				coordinate.fromJSON(point);
				this._coordinates.push(coordinate);

			});
		}

		this._source.fromJSON(json.source);

		return ret;
	}

	toJSON() {
		const json = {
			type: this.getType(),
			points: [],
		};

		this._coordinates.forEach((coor) => {
			json.points.push(coor.toJSON());
		});

		json.source = this._source.toJSON(true);

		return json;
	}

	saveContent(writer) {
		super.saveContent(writer);

		this._source.save('source', writer);

		writer.writeStartElement('cs');
		writer.writeStartArray('c');

		this._coordinates.forEach((coor) => {
			coor.save('c', writer);
		});

		writer.writeEndArray('c');
		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);

		const source = reader.getObject(object, 'source');
		if (source !== undefined) {
			this._source.read(reader, source);
		}

		let coordinate;
		let coll = reader.getObject(object, 'cs');
		if (coll === undefined) {
			coll = reader.getObject(object, 'coordinates');
		}

		reader.iterateObjects(coll, (name, child) => {
			switch (name) {
				case 'c':
				case 'coordinate':
					coordinate = new Coordinate();
					coordinate.read(reader, child);
					this._coordinates.push(coordinate);
					break;
				default:
					break;
			}
		});
	}

	newInstance() {
		return new PolygonShape(this.isClosed);
	}

	// overwritten because we have to keep at least 2 points
	removeCoordinateAt(index) {
		if (this._coordinates.length > 2) {
			super.removeCoordinateAt(index);
		}
	}

	setCoordinates(coordinates) {
		if (coordinates.length >= 2) {
			super.setCoordinates(coordinates);
		}
	}


	refreshFromSource() {
		if (this._source.getTerm()) {
			let term;
			try {
				term = JSG.FormulaParser.parse(this._source.getValue(), this._item.getGraph(), this._item) || {};
			} catch (e) {
				return false;
			}

			const {operand} = term;
			if (operand instanceof SheetReference && operand._range) {
				const range = operand._range.copy();
				const sheet = operand._item;
				range.shiftFromSheet();
				const data = sheet.getDataProvider();
				if (range.getWidth() === 2) {
					this._coordinates = [];
					let coor;

					for (let i = range._y1; i <= range._y2; i += 1) {
						const pt = new Point(0, 0);
						let cell = data.getRC(range._x1, i);
						if (cell) {
							pt.x = Number(cell.getValue());
							pt.x = Number.isNaN(pt.x) ? 0 : pt.x;
						}
						cell = data.getRC(range._x1 + 1, i);
						if (cell) {
							pt.y = Number(cell.getValue());
							pt.y = Number.isNaN(pt.y) ? 0 : pt.y;
						}
						coor = new Coordinate(
							this._newExpression(0, `WIDTH * ${pt.x}`),
							this._newExpression(0, `HEIGHT * ${pt.y}`)
						);
						this._coordinates.push(coor);
					}
					this.evaluate();
					return true;
				}
			}
		}

		return false;
	}

	refresh() {
		if (this._refreshEnabled === true) {
			this.refreshFromSource();
			this._fillPointList(this._coordpointlist, this.getCoordinates());
		}
	}

	/**
	 * Type string for polygon shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'polygon';
	}
}

module.exports = PolygonShape;
