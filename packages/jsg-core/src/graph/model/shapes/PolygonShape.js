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
const Shape = require('./Shape');
const Coordinate = require('../../Coordinate');

/**
 * A polygon shape definition. {{#crossLink "Coordinate"}}{{/crossLink}}s are added
 * after creation.
 *
 * @class PolygonShape
 * @constructor
 * @extends Shape
 */
class PolygonShape extends Shape {
	getType() {
		return PolygonShape.TYPE;
	}

	saveContent(writer) {
		super.saveContent(writer);

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
