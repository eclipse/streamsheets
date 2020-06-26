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
const Point = require('../../../geometry/Point');
const PolygonShape = require('./PolygonShape');
const Dictionary = require('../../../commons/Dictionary');

/**
 * A path-shape can be used to create shapes with an SVG like path. A path-shape can be created by using provided
 * methods like {{#crossLink "PathShape/addMoveTo:method"}}{{/crossLink}},
 * {{#crossLink "PathShape/addLineTo:method"}}{{/crossLink}} or
 * {{#crossLink "PathShape/addCubicBezier:method"}}{{/crossLink}}. Sub-paths are supported too.
 * To close a path or sub-path simply call {{#crossLink
 * "PathShape/addClose:method"}}{{/crossLink}}.<br/>
 * <b>Note:</b> unlike an SVG path a path-shape cannot handle {{#crossLink "Coordinate"}}{{/crossLink}}s
 * which
 * are relative to each other. Instead all  passed coordinates must be given relative to the origin of the
 * corresponding
 * shape {{#crossLink "GraphItem"}}{{/crossLink}}.
 *
 * @class PathShape
 * @constructor
 * @extends PolygonShape
 */
class PathShape extends PolygonShape {
	/**
	 * Checks if given command string is supported.
	 *
	 * @method isValidCmd
	 * @param {String} cmd The command string to check.
	 * @return {Boolean} <code>true</code> if command is supported, <code>false</code> otherwise.
	 * @static
	 */
	static isValidCmd(cmd) {
		const cmds = /^[MLQCZ]+?/;
		return !!cmd.match(cmds);
	}

	getType() {
		return PathShape.TYPE;
	}

	saveContent(writer) {
		writer.writeStartElement('cs');
		writer.writeStartArray('c');

		const attributes = new Dictionary();
		this._coordinates.forEach((cd) => {
			this._fillCoordAttributes(cd, attributes);
			cd.save('c', writer, attributes);
		});

		writer.writeEndArray('c');
		writer.writeEndElement();
	}

	_fillCoordAttributes(coord, attributes) {
		attributes.clear();
		if (coord.cmd) {
			attributes.put('cmd', coord.cmd);
		}
		if (coord.close) {
			attributes.put('close', coord.close);
		}
	}

	newInstance() {
		return new PathShape();
	}

	copy() {
		const copy = super.copy();
		// apply cmds...

		this._coordinates.forEach((cd, i) => {
			copy._coordinates[i].cmd = cd.cmd;
		});

		return copy;
	}

	/**
	 * Adds given coordinate to the list of coordinates which build up this shape.</br>
	 * Note: this overwrites the corresponding method of {{#crossLink "Shape"}}{{/crossLink}} in
	 * order to add an additional path-command parameter.<br/> Please refer to {{#crossLink
	 * "PathShape/addMoveTo:method"}}{{/crossLink}},
	 * {{#crossLink "PathShape/addLineTo:method"}}{{/crossLink}},
	 * {{#crossLink "PathShape/addCubicBezier:method"}}{{/crossLink}} and
	 * {{#crossLink "PathShape/addQuadraticBezier:method"}}{{/crossLink}} too.
	 *
	 * @method addCoordinate
	 * @param {Coordinate} coordinate The coordinate to add.
	 * @param {String} cmd The path-command string.
	 */
	addCoordinate(coordinate, cmd) {
		coordinate.cmd = cmd ? cmd.toUpperCase() : cmd;
		super.addCoordinate(coordinate);
	}

	/**
	 * Adds a close command. This will close current sub-path by drawing a straight line from last added coordinate to
	 * the last added move-to coordinate.
	 *
	 * @method addClose
	 */
	addClose() {
		const lastcoord = this._coordinates[this._coordinates.length - 1];
		if (lastcoord) {
			lastcoord.close = 'Z';
		}
	}

	/**
	 * Adds given coordinate as a move to command.
	 *
	 * @method addMoveTo
	 * @param {Coordinate} coord The coordinate to add.
	 */
	addMoveTo(coord) {
		this.addCoordinate(coord, 'M');
	}

	/**
	 * Adds given coordinate as a line to command.
	 *
	 * @method addLineTo
	 * @param {Coordinate} coord The coordinate to add.
	 */
	addLineTo(coord) {
		this.addCoordinate(coord, 'L');
	}

	/**
	 * Adds given coordinates as a cubic bezier command.
	 *
	 * @method addCubicBezier
	 * @param {Coordinate} control1coord The coordinate of first bezier control point.
	 * @param {Coordinate} control2coord The coordinate of second bezier control point.
	 * @param {Coordinate} coord The coordinate of the bezier curve end point.
	 */
	addCubicBezier(control1coord, control2coord, coord) {
		this.addCoordinate(control1coord, 'C');
		this.addCoordinate(control2coord);
		this.addCoordinate(coord);
	}

	/**
	 * Adds given coordinates as a quadratic bezier command.
	 *
	 * @method addQuadraticBezier
	 * @param {Coordinate} controlcoord The coordinate of bezier control point.
	 * @param {Coordinate} coord The coordinate of the bezier curve end point.
	 */
	addQuadraticBezier(controlcoord, coord) {
		this.addCoordinate(controlcoord, 'Q');
		this.addCoordinate(coord);
	}

	// overwritten to correctly apply bounding box, ports... what about close...???
	_fillPointList(list, coordinates) {
		let index = 0;
		const { Points } = PathShape;
		// at least we have one point for each coordinate:
		list.keepPoints(coordinates.length);

		coordinates.forEach((coor, i) => {
			const addToList = Points.addToList(coor.cmd);
			if (addToList) {
				index = addToList(i, coordinates, list, index);
			}
		});
	}

	/**
	 * Type string for path shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'path';
	}
}

/**
 * Private helper class to convert {{#crossLink "Coordinate"}}{{/crossLink}}s into
 * {{#crossLink "Point"}}{{/crossLink}}s and to add them to a given {{#crossLink
 * "PointList"}}{{/crossLink}}.
 *
 * @class PathShape.Points
 * @constructor
 * @private
 */
PathShape.Points = (() => {
	const toQuadraticBezier = (t, p0, p1, p2) => {
		const mt = 1 - t;
		return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
	};
	const toCubicBezier = (t, p0, p1, p2, p3) => {
		const mt = 1 - t;
		return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
	};

	const toList = {
		M(idx, coordinates, list, index) {
			const pt = coordinates[idx].toPoint(JSG.ptCache.get());
			list.setPointAtTo(index, pt);
			JSG.ptCache.release(pt);
			return index + 1;
		},
		L(idx, coordinates, list, index) {
			const pt = coordinates[idx].toPoint(JSG.ptCache.get());
			list.setPointAtTo(index, pt);
			JSG.ptCache.release(pt);
			return index + 1;
		},
		C(idx, coordinates, list, index) {
			const len = coordinates.length;
			const startpt = coordinates[idx - 1].toPoint(JSG.ptCache.get());
			const cpt1 = coordinates[idx].toPoint(JSG.ptCache.get());
			const cpt2 = coordinates[(idx + 1) % len].toPoint(JSG.ptCache.get());
			const cpt3 = coordinates[(idx + 2) % len].toPoint(JSG.ptCache.get());
			// special case if points are on horizontal/vertical line...
			if (
				(Math.abs(startpt.x - cpt1.x) < 1 && Math.abs(cpt1.x - cpt2.x) < 1 && Math.abs(cpt2.x - cpt3.x) < 1) ||
				(Math.abs(startpt.y - cpt1.y) < 1 && Math.abs(cpt1.y - cpt2.y) < 1 && Math.abs(cpt2.y - cpt3.y) < 1)
			) {
				list.setPointAtTo((index += 1), cpt1);
				list.setPointAtTo((index += 1), cpt2);
				list.setPointAtTo(index, cpt3);
			} else {
				let t = 0;
				let x;
				let y;
				x = toCubicBezier(t, startpt.x, cpt1.x, cpt2.x, cpt3.x);
				y = toCubicBezier(t, startpt.y, cpt1.y, cpt2.y, cpt3.y);
				list.setPointAt((index += 1), x, y);
				x = toCubicBezier(t + 0.1, startpt.x, cpt1.x, cpt2.x, cpt3.x);
				y = toCubicBezier(t + 0.1, startpt.y, cpt1.y, cpt2.y, cpt3.y);
				list.setPointAt((index += 1), x, y);
				for (t = 0.2; t < 1.0; t += 0.1) {
					list.addPoint(new Point());
					x = toCubicBezier(t, startpt.x, cpt1.x, cpt2.x, cpt3.x);
					y = toCubicBezier(t, startpt.y, cpt1.y, cpt2.y, cpt3.y);
					list.setPointAt((index += 1), x, y);
				}
				list.setPointAtTo(index, cpt3);
			}
			JSG.ptCache.release(startpt, cpt1, cpt2, cpt3);
			return index + 1;
		},
		Q(idx, coordinates, list, index) {
			const startpt = coordinates[idx - 1].toPoint(JSG.ptCache.get());
			const cpt1 = coordinates[idx].toPoint(JSG.ptCache.get());
			const cpt2 = coordinates[(idx + 1) % coordinates.length].toPoint(JSG.ptCache.get());
			// special case if points are on horizontal/vertical line...
			if (
				(Math.abs(startpt.x - cpt1.x) < 1 && Math.abs(cpt1.x - cpt2.x) < 1) ||
				(Math.abs(startpt.y - cpt1.y) < 1 && Math.abs(cpt1.y - cpt2.y) < 1)
			) {
				list.setPointAtTo((index += 1), cpt1);
				list.setPointAtTo(index, cpt2);
			} else {
				let t = 0;
				let x;
				let y;
				x = toQuadraticBezier(t, startpt.x, cpt1.x, cpt2.x);
				y = toQuadraticBezier(t, startpt.y, cpt1.y, cpt2.y);
				list.setPointAt((index += 1), x, y);
				for (t = 0.1; t < 1.0; t += 0.1) {
					list.addPoint(new Point());
					x = toQuadraticBezier(t, startpt.x, cpt1.x, cpt2.x);
					y = toQuadraticBezier(t, startpt.y, cpt1.y, cpt2.y);
					list.setPointAt((index += 1), x, y);
				}
				list.setPointAtTo(index, cpt2);
			}
			JSG.ptCache.release(startpt, cpt1, cpt2);
			return index + 1;
		}
	};

	return {
		/**
		 * Returns a suitable converter function for given coordinate command id. If none could be found
		 * <code>undefined</code> is returned.<br/> The returned function must be called with following parameters (in
		 * that order):
		 * <ul>
		 * <li>coordindex - The current index in shapes coordinates list.</li>
		 * <li>coordinates - The shapes coordinates list.</li>
		 * <li>list - The point list to add points to.</li>
		 * <li>listindex - The current index in given point-list.</li>
		 * </ul>
		 * As a result the function returns the new current index in provided point-list.
		 *
		 * @method addToList
		 * @param {String} cmdid The command id to get the converter function for.
		 * @return {Function} The converter function to use or <code>undefined</code>.
		 */
		addToList(cmdid) {
			return toList[cmdid];
		}
	};
})();

module.exports = PathShape;
