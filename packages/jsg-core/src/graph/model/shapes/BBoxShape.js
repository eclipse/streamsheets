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
const RectangleShape = require('./RectangleShape');

/**
 * A simple shape definition consisting of 4 {{#crossLink "Coordinate"}}{{/crossLink}}s which represents the
 * {{#crossLink "BoundingBox"}}{{/crossLink}} of the corresponding shape item. In contrast to a
 * RectangleShape the origin not necessarily needs to be the top-left corner.
 *
 * @class BBoxShape
 * @constructor
 * @extends RectangleShape
 */
class BBoxShape extends RectangleShape {
	getType() {
		return BBoxShape.TYPE;
	}

	newInstance() {
		return new BBoxShape();
	}

	// overwritten to set coordinates to match internal items bounding-box:
	_fillPointList(list, coordinates) {
		// only usefull if we have an item:
		if (this._item) {
			// var origin = this._item.getOrigin(JSG.ptCache.get());
			const bbox = this._item.getBoundingBox(JSG.boxCache.get());
			list.keepPoints(coordinates.length);
			const tmpt = JSG.ptCache.get();
			coordinates.forEach((coordinate, i) => {
				const corner = bbox.getCornerAt(i, tmpt); // .subtract(origin);
				this._item.translateFromParent(corner);
				coordinate.set(corner.x, corner.y);
				list.setPointAtTo(i, corner);
			});
			// JSG.ptCache.release(origin, tmpt);
			JSG.ptCache.release(tmpt);
			JSG.boxCache.release(bbox);
		} else {
			super._fillPointList(list, coordinates);
		}
	}

	/**
	 * Type string for bounding-box shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'boundingbox';
	}
}

module.exports = BBoxShape;
