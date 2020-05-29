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
const Dictionary = require('../../commons/Dictionary');
/**
 * A simple helper class to store and restore the positions of shape coordinates for a list of given {{#crossLink
 * "GraphItem"}}{{/crossLink}}s.<br/> This class is mainly used by commands like {{#crossLink
 * "MoveNodeCommand"}}{{/crossLink}} or {{#crossLink
 * "RotateNodeCommand"}}{{/crossLink}} which might change points of attached edges.
 *
 * @example
 *     //store:
 *     var map = new ShapePointsMap();
 *     map.store([edge1, edge2, edge3]);
 *
 *     //...change shape of edges...
 *
 *     //restore to previous positions...
 *     map.store([edge1, edge2, edge3]);
 *
 * @class ShapePointsMap
 * @param {Array} [items] An optional list of <code>GraphItem</code>s whose shape positions should be stored.
 * @constructor
 * @since 1.6.15
 */
class ShapePointsMap {
	constructor(items) {
		this.map = new Dictionary();
		if (items) {
			this.store(items);
		}
	}

	/**
	 * Stores the locations of shape coordinates for each given {{#crossLink
	 * "GraphItem"}}{{/crossLink}}s.
	 * @method store
	 * @param {Array} items A list of <code>GraphItem</code>s to store shape locations for.
	 */
	store(items) {
		let coords;
		let points;

		items.forEach((item) => {
			if (!this.map.get(item.getId())) {
				points = [];
				coords = item.getShape().getCoordinates();
				coords.forEach((coor) => {
					points.push(coor.toPoint());
				});
				this.map.put(item.getId(), points);
			}
		});
	}

	/**
	 * Restores the locations of shape coordinates for each given {{#crossLink
	 * "GraphItem"}}{{/crossLink}}s.
	 * @method restore
	 * @param {Array} items A list of <code>GraphItem</code>s to restore shape locations for.
	 */
	restore(items) {
		let j;
		let m;
		let points;
		let shape;
		let coords;

		items.forEach((item) => {
			shape = item.getShape();
			points = this.map.get(item.getId());
			if (points) {
				m = points.length;
				shape.keepCoordinates(m);
				coords = shape.getCoordinates();
				for (j = 0; j < m; j += 1) {
					coords[j].setToPoint(points[j]);
				}
				shape.refresh();
			}
		});
	}
}

module.exports = ShapePointsMap;
