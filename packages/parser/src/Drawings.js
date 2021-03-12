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
/* eslint-disable no-mixed-operators */


const { ERROR } = require('./ReturnCodes');

/**
 * Container to collect data from draw functions.
 * @type {module.Drawings}
 */
module.exports = class Drawings {
	static isPointOnLineSegment(point, linestart, lineend) {
		// taken from getLinePointDistance which returns a Math.sqrt() value, which is not needed here...
		const dist = (v, wx, wy) => ((v.x - wx) * (v.x - wx)) + ((v.y - wy) * (v.y - wy));

		const getSquaredPointLineSegmentDistance = (p, v, w) => {
			let d;

			d = dist(v, w.x, w.y);
			if (d === 0) {
				d = dist(p, v.x, v.y);
			} else {
				const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / d;
				if (t < 0) {
					d = dist(p, v.x, v.y);
				} else if (t > 1) {
					d = dist(p, w.x, w.y);
				} else {
					d = dist(p, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
				}
			}
			return d;
		};

		return getSquaredPointLineSegmentDistance(point, linestart, lineend) < 0.1;
	}

	/**
	 * Checks whether a point lies within a polygon.
	 *
	 * @method isPointInPolygon
	 * @param {Point}points Array of points that describe the polygon.
	 * @param {Point}p Point to check for.
	 * @return {Boolean}Returns true, if point lies within the polygon, else false.
	 * @static
	 */
	static isPointInPolygon(points, p) {
		let p1 = points[0];
		let inside = false;
		let i;

		for (i = 1; i <= points.length; i += 1) {
			const p2 = points[i % points.length];
			// bail out early if point is on current line segment...
			if (this.isPointOnLineSegment(p, p1, p2)) {
				return 0;
			}
			if ((p1.y < p.y && p2.y >= p.y) || (p2.y < p.y && p1.y >= p.y)) {
				if (p1.x + (((p.y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x)) < p.x) {
					inside = !inside;
				}
			}
			p1 = p2;
		}
		return inside ? 1 : -1;
	}

	ptInPolygon(sheet, terms) {
		const value = (cell) => {
			const val = cell && cell.value;
			return (val != null && (typeof val === 'number')) ? val : 0;
		};

		if (terms.length < 3) {
			return ERROR.ARGS;
		}

		const p = {
			x: Number(terms[0].value),
			y: Number(terms[1].value)
		};
		const pts = [];

		const range = terms[2].value;
		// must be a range...
		if (range && range.start && range.end) {
			if (range.width !== 2) {
				return ERROR.ARGS;
			}

			let pt;

			// sheet of cellsref might differ from function sheet
			// ({ sheet } = cellsref.sheet);
			range.iterate((cell) => {
				if (pt === undefined) {
					pt = {};
				}
				if (pt.x !== undefined) {
					pt.y = value(cell);
					pts.push(pt);
					pt = undefined;
				} else {
					pt.x = value(cell);
				}
			});
		} else {
			return ERROR.ARGS;
		}

		return Drawings.isPointInPolygon(pts, p);
	}
};
