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
const { serialnumber: { dateLocal2serial, serial2date } } = require('@cedalo/commons');

const JSG = require('../JSG');
const Point = require('./Point');

const distanceSquared = (v, w) => ((v.x - w.x) * (v.x - w.x)) + ((v.y - w.y) * (v.y - w.y));
const distanceToSegmentSquared = (p, v, w) => {
	const dist = distanceSquared(v, w);
	if (dist === 0) {
		return distanceSquared(p, v);
	}
	const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / dist;
	if (t < 0) return distanceSquared(p, v);
	if (t > 1) return distanceSquared(p, w);
	return distanceSquared(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};
const offset = (pt1, pt2, reusepoint) => {
	const pt = reusepoint || new JSG.geometry.Point(0, 0);
	pt.set(pt1.x - pt2.x, pt1.y - pt2.y);
	return pt;
};
const offsetToSegment = (p, v, w) => {
	const dist = distanceSquared(v, w);
	if (dist === 0) {
		return offset(p, v);
	}
	const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / dist;
	if (t < 0) return offset(p, v);
	if (t > 1) return offset(p, w);
	return offset(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
};


/**
 * This class provides geometric math helper functions.
 * Each function should be called in a static way, e.g. MathUtils.toRadians(180);
 *
 * @class MathUtils
 * @constructor
 * @private
 */
class MathUtils {
	/**
	 * Convert degrees to radians
	 *
	 * @method toRadians
	 * @param {Number}degrees Degrees to convert.
	 * @return {Number}Result in radians.
	 * @static
	 */
	static toRadians(degrees) {
		return (degrees / 180) * Math.PI;
	}

	/**
	 * Convert radians to degrees.
	 *
	 * @static
	 * @method toDegrees
	 * @param {Number}radians Radians to convert.
	 * @return {Number}Result in degrees.
	 */
	static toDegrees(radians, rounded) {
		const degrees = (radians / Math.PI) * 180;
		return rounded !== undefined ? Math.round(degrees) : degrees;
	}

	/**
	 * Round a number to the next integer
	 *
	 * @method round
	 * @param {Number} number Number to be rounded.
	 * @return {Number} Rounded number.
	 */
	static round(number) {
		/* eslint-disable no-bitwise */
		return ~~(number + (number > 0 ? 0.5 : -0.5));
		/* eslint-enable no-bitwise */
	}

	static roundUp(number) {
		return Math.ceil(number - 0.5);
	}

	static roundTo(number, decimals) {
		const factor = 10 ** decimals;
		return Math.round(number * factor) / factor;
	}

	/**
	 * Calculates the vertical distance between a point and a line.
	 *
	 * @method getLinePointDistance
	 * @param {Point} pointLine1 Start point of the line.
	 * @param {Point} pointLine2 End point of the line.
	 * @param {Point} point Point to calculate distance for.
	 * @return {Number} Distance of the point from the line.
	 * @static
	 */
	static getLinePointDistance(pointLine1, pointLine2, point) {
		return Math.sqrt(distanceToSegmentSquared(point, pointLine1, pointLine2));
	}

	/**
	 * Evaluates the offset between a point and a line.
	 *
	 * @method getLinePointOffset
	 * @param {Point} pointLine1 Start point of line.
	 * @param {Point} pointLine2 End point of line.
	 * @param {Point} point Point to evaluate.
	 * @param {Point} [reusepoint] A point to reuse for returned offset. If not provided a new one is
	 * created.
	 * @return {Point} Offset with x and y values from the Point to the Line.
	 */
	static getLinePointOffset(pointLine1, pointLine2, point, reusepoint) {
		return offsetToSegment(point, pointLine1, pointLine2);
	}

	/**
	 * Calculates the orthogonal projection point of given point on the line defined by linepoint1 and linepoint2.
	 * Note: no new point is created, the projection point is stored in specified point.
	 *
	 * @method getOrthogonalProjectionOfPoint
	 * @param {Point}point The point to calculate the projection of.
	 * @param {Point}linepoint1 The first line point.
	 * @param {Point}linepoint2 The second line point.
	 * @return {Point}The passed point representing the orthogonal projection.
	 * @static
	 */
	static getOrthogonalProjectionOfPoint(point, linepoint1, linepoint2) {
		let factor;

		const pivot = JSG.ptCache
			.get()
			.setTo(point)
			.subtract(linepoint1);
		const dirVector = JSG.ptCache
			.get()
			.setTo(linepoint2)
			.subtract(linepoint1);
		factor = pivot.x * dirVector.x + pivot.y * dirVector.y;

		if (factor !== 0) {
			// to ensure that factor is never NaN!!!
			factor /= dirVector.x * dirVector.x + dirVector.y * dirVector.y;
		}
		const projection = JSG.ptCache.get();
		projection
			.set(factor * dirVector.x, factor * dirVector.y)
			.add(linepoint1);
		point.setTo(projection);

		JSG.ptCache.release(pivot, dirVector, projection);
		return point;
	}

	/**
	 * Checks if the two lines, specified by given points, are orthogonal to each other. </br>
	 *
	 * @method areLinesOrthogonal
	 * @param {Point} line1p1 The start point of first line.
	 * @param {Point} line1p2 The end point of first line.
	 * @param {Point} line2p1 The start point of second line.
	 * @param {Point} line2p2 The end point of second line.
	 * @return {Boolean} Returns <code>true</code> if both lines are orthogonal to each other or <code>false</code>
	 * otherwise.
	 * @static
	 * @deprecated Unused method!! Subject to be removed!
	 */
	static areLinesOrthogonal(line1p1, line1p2, line2p1, line2p2) {
		const u1 = line1p2.copy().subtract(line1p1);
		const u2 = line2p2.copy().subtract(line2p1);
		const dotproduct = u1.x * u2.x + u1.y * u2.y;

		// TODO accuracy...
		return dotproduct === 0 || Math.abs(dotproduct) < 0.01;
	}

	/**
	 * Checks if the two lines, specified by given points, are parallel. </br>
	 *
	 * @method areLinesParallel
	 * @param {Point} l1start The start point of first line.
	 * @param {Point} l1end The end point of first line.
	 * @param {Point} l2start The start point of second line.
	 * @param {Point} l2end The end point of second line.
	 * @return {Boolean} Returns <code>true</code> if both lines are parallel otherwise <code>false</code>.
	 * @static
	 */
	static areLinesParallel(l1start, l1end, l2start, l2end) {
		const denominator =
			(l2end.y - l2start.y) * (l1end.x - l1start.x) -
			(l2end.x - l2start.x) * (l1end.y - l1start.y);
		return denominator === 0 || Math.abs(denominator) < 0.01;
		// TODO accuracy...
	}

	/**
	 * Checks if the two lines, specified by given points, are on top of each other. </br>
	 * Note: lines which are on top of each other are of course parallel.
	 *
	 * @method areLinesOnTop
	 * @param {Point} l1start The start point of first line.
	 * @param {Point} l1end The end point of first line.
	 * @param {Point} l2start The start point of second line.
	 * @param {Point} l2end The end point of second line.
	 * @return {Boolean} Returns <code>true</code> if both lines are on top of each other or <code>false</code> if not.
	 * @static
	 */
	static areLinesOnTop(l1start, l1end, l2start, l2end) {
		// taken from MathUtils.getIntersectionOfLines
		const na =
			(l2end.x - l2start.x) * (l1start.y - l2start.y) -
			(l2end.y - l2start.y) * (l1start.x - l2start.x);
		const nb =
			(l1end.x - l1start.x) * (l1start.y - l2start.y) -
			(l1end.y - l1start.y) * (l1start.x - l2start.x);

		return (
			(na === 0 || Math.abs(na) < 0.0001) &&
			(nb === 0 || Math.abs(nb) < 0.0001)
		);
	}

	/**
	 * Checks if the two lines, specified by given points, are parallel. </br>
	 * This is actually same as calling ({{#crossLink "MathUtils/areLinesParallel:method"}}{{/crossLink}})
	 * with (0,0) as start point of each line.
	 *
	 * @method arePointsParallel
	 * @param {Point} p1 The end point of first line.
	 * @param {Point} p2 The end point of second line.
	 * @return {Boolean} Returns <code>true</code> if both lines are parallel otherwise <code>false</code>.
	 * @static
	 */
	static arePointsParallel(p1, p2) {
		// TODO accuracy...
		const denominator = p2.y * p1.x - p2.x * p1.y;

		return denominator === 0 || Math.abs(denominator) < 0.01;
	}

	/**
	 * Determines point which is orthogonal to the line specified by given points.
	 *
	 * @method getOrthogonalPointTo
	 * @param {Point} linepoint1 The start point of the line.
	 * @param {Point} linepoint1 The end point of the line.
	 * @param {Point} [reusepoint] A point to reuse for returned orthogonal point. If not provided a new
	 * one is created.
	 * @return {Point} A point which is orthogonal to specified line.
	 * @static
	 * @deprecated Unused method! Subject to remove!! Use If required use
	 * {{#crossLink "MathUtils/getOrthoPointToLine:method"}}{{/crossLink}} instead.
	 */
	static getOrthogonalPointTo(linepoint1, linepoint2, reusepoint) {
		const point = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		const dirVector = point.setTo(linepoint2).subtract(linepoint1);
		const newX = -dirVector.y;

		dirVector.y = dirVector.x;
		dirVector.x = newX;

		return point;
	}

	/**
	 * Determines a point which is orthogonal to the line specified by given points.<br/>
	 * Note: usually a line has two orthogonal points, one on the <q>left</q> side and one on its <q>right</q> side.
	 * This method returns the orthogonal point on the <q>right</q> side in direction of <cod>p0-p1</code>. To get the
	 * other one simply switch start and end points.
	 *
	 * @method getOrthoPointToLine
	 * @param {Point} p0 The start point of the line.
	 * @param {Point} p1 The end point of the line.
	 * @param {Point} [reusepoint] A point to reuse for returned orthogonal point. If not provided a new
	 * one is created.
	 * @return {Point} A point which is orthogonal to specified line.
	 * @static
	 * @since 1.6.17
	 */
	static getOrthoPointToLine(p0, p1, reusepoint) {
		const point = reusepoint || new Point(0, 0);

		point.setTo(p1).subtract(p0);
		const newX = -point.y;
		point.y = point.x;
		point.x = newX;
		return point;
	}

	/**
	 *
	 * @method getOrthogonalPointToPoint
	 * @static
	 * @deprecated Unused method! Subject to remove!! Use If required use
	 * {{#crossLink "MathUtils/getOrthogonalPointToLine:method"}}{{/crossLink}} instead.
	 */
	static getOrthogonalPointToPoint(linepoint, reusepoint) {
		const point = reusepoint !== undefined ? reusepoint : new Point(0, 0);
		point.x = -linepoint.y;
		point.y = linepoint.x;
		return point;
	}

	/**
	 * Calculates the square of the distance between two points.
	 *
	 * @method getSquaredDistance
	 * @param {Point}point1 First point.
	 * @param {Point}point2 Second point.
	 * @return {Number}Calculated square of the distance.
	 * @static
	 * @deprecated Unused method! Subject to remove!! If required use
	 * {{#crossLink "Point/distanceToPoint:method"}}{{/crossLink}} instead.
	 */
	static getSquaredDistance(point1, point2) {
		const tmppoint = point2.copy().subtract(point1);

		return tmppoint.x * tmppoint.x + tmppoint.y * tmppoint.y;
	}

	/**
	 * Calculates the length of a line defined by two points.
	 *
	 * @method getLineLength
	 * @param {Point}pointLine1 Start point of the line.
	 * @param {Point}pointLine2 End point of the line.
	 * @return {Number}Length of the line.
	 * @static
	 */
	static getLineLength(pointLine1, pointLine2) {
		// pythagoras
		return Math.sqrt(
			(pointLine2.x - pointLine1.x) * (pointLine2.x - pointLine1.x) +
				(pointLine2.y - pointLine1.y) * (pointLine2.y - pointLine1.y)
		);
	}

	/**
	 * Calculates the angle between to crossing lines in radians.
	 *
	 * @method getAngleBetweenLines
	 * @param {Point}p1 Point to define one line.
	 * @param {Point}p2 Point to define the second line.
	 * @param {Point} [pCross] Cross point of the two lines. If not specified (0, 0) is taken.
	 * @return {Number}Angle between the lines in radians.
	 * @static
	 */
	static getAngleBetweenLines(p1, p2, pCross) {
		const pcX = pCross !== undefined ? pCross.x : 0;
		const pcY = pCross !== undefined ? pCross.y : 0;
		const angle1 = Math.atan2(pcY - p1.y, pcX - p1.x);
		const angle2 = Math.atan2(pcY - p2.y, pcX - p2.x);

		return angle2 - angle1;
	}

	/**
	 * Calculates the angle of a line in relation to a horizontal line in radians.
	 *
	 * @method getAngleBetweenPoints
	 * @param {Point}p1 Point to define one line.
	 * @param {Point}p2 Point to define the second line.
	 * @return {Number}Angle between the lines in radians.
	 * @static
	 * @deprecated Subject to be removed without replacement!!
	 * Use {{#crossLink "MathUtils/getAngleBetweenLines:method"}}{{/crossLink}}
	 * without <code>pCross</code> parameter.
	 */
	static getAngleBetweenPoints(p1, p2) {
		// THIS seems to be WRONG:
		return Math.atan2(p2.y - p1.y, p2.x - p1.x);
		// THIS seems to be CORRECT:
		//  angle between points which have same origin (0,0)
		//    var angle = Math.atan2(-p2.y, -p2.x) - Math.atan2(-p1.y, -p1.x);
	}

	/**
	 * Rotate a point around a center using the given angle.
	 *
	 * @method getRotatedPoint
	 * @param {Point}rotate To be rotated point.
	 * @param {Point}center Rotation center.
	 * @param {Number}angle Angle in radians to rotate by.
	 * @return {Point}The rotated point.
	 * @static
	 */
	static getRotatedPoint(point, center, angle) {
		angle += Math.atan2(point.y - center.y, point.x - center.x);
		const radius = this.getLineLength(point, center);

		return new Point(
			center.x + Math.cos(angle) * radius,
			center.y + Math.sin(angle) * radius
		);
	}

	/**
	 * Rotates the given point by specified angle around its origin.</br>
	 * Note: no rotation is done if specified angle is 0.
	 *
	 * @method rotatePoint
	 * @param {Point} point
	 * @param {Number} angle The angle. It must be given in radians.
	 * @return {Point} Passed in and now rotated point.
	 * @static
	 */
	static rotatePoint(point, angle) {
		if (angle !== 0) {
			const sin = Math.sin(angle);
			const cos = Math.cos(angle);
			const x = point.x * cos - point.y * sin;
			const y = point.x * sin + point.y * cos;
			point.set(x, y);
		}

		return point;
	}

	/**
	 * Rotates given point around specified center using the given angle. The difference to
	 * getRotatedPoint() is that this function works on given point directly without creating a new one.
	 *
	 * @method rotatePointAround
	 * @param {Point}center Rotation center.
	 * @param {Point}rotate To be rotated point.
	 * @param {Number}angle Angle in radians to rotate by.
	 * @return {Point}The passed in and now rotated point.
	 * @static
	 */
	static rotatePointAround(center, point, angle) {
		if (angle !== 0) {
			const sin = Math.sin(angle);
			const cos = Math.cos(angle);
			const x =
				center.x +
				cos * (point.x - center.x) -
				sin * (point.y - center.y);
			const y =
				center.y +
				sin * (point.x - center.x) +
				cos * (point.y - center.y);
			point.set(x, y);
		}

		return point;
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
				inside = true;
				break;
			}
			if ((p1.y < p.y && p2.y >= p.y) || (p2.y < p.y && p1.y >= p.y)) {
				if (
					p1.x + ((p.y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x) <
					p.x
				) {
					inside = !inside;
				}
			}
			p1 = p2;
		}
		return inside;
	}

	/**
	 * Checks if given point is on specified line segment. The segment is defined by given start and end points.
	 *
	 * @method isPointOnLineSegment
	 * @param {Point} point Point to check for.
	 * @param {Point} linestart Start point of line segment.
	 * @param {Point} lineend End point of line segment.
	 * @return {Boolean} Returns <code>true</code> if point is on specified line segment, <code>false</code> otherwise.
	 */
	static isPointOnLineSegment(point, linestart, lineend) {
		return distanceToSegmentSquared(point, linestart, lineend) < 0.1;
	}

	/**
	 * Checks if given point instance points into same direction as defined by specified line.</br>
	 * <b>Note:</b> this does not mean that the point is on the line! Rather it means that it points
	 * in line direction +/- 90 degrees (exclusively) in respect to linestart.
	 *
	 * @method isPointInDirectionOfLine
	 * @param {Point} point The point to check.
	 * @param {Point} linestart The line start point.
	 * @param {Point} lineend The line end point.
	 * @return {Boolean} <code>true</code> if given point points into the same direction as specified
	 * line, <code>false</code> otherwise
	 * @static
	 */
	static isPointInDirectionOfLine(point, linestart, lineend) {
		// accuracy
		let isInDir = true;
		const linedir = JSG.ptCache
			.get()
			.setTo(lineend)
			.subtract(linestart);
		const pointdir = JSG.ptCache
			.get()
			.setTo(point)
			.subtract(linestart);
		// edge case: point is on start...
		if (Math.abs(pointdir.lengthSquared()) > 0.00001) {
			isInDir = linedir.dotProduct(pointdir) > 0.1;
		}
		JSG.ptCache.release(linedir, pointdir);
		return isInDir;
	}

	/**
	 * Checks if given point is behind given <code>end</code> point. To determine what behind means a direction must be
	 * specified by <code>start</code> and <code>end</code> points.
	 * @method isPointBehind
	 * @param {Point} pt The point to check.
	 * @param {Point} start The segment start point.
	 * @param {Point} end The segment end point.
	 * @return {Boolean} <code>true</code> if given point is behind <code>end</code> in direction of <code>start</code>
	 * to <code>end</code>, <code>false</code> otherwise
	 * @since 2.0.7
	 */
	static isPointBehind(pt, start, end) {
		const x = Math.floor(end.x - start.x);
		const y = Math.floor(end.y - start.y);
		let diff;

		if (x !== 0) {
			diff = Math.round(pt.x - start.x);
			return x < 0 ? diff > x : diff < x;
		}
		diff = Math.round(pt.y - start.y);
		return y < 0 ? diff > y : diff < y;
	}

	/**
	 * Evaluates whether two lines intersect and if so, fill the intersection point with the coordinates of the
	 * intersection.
	 *
	 * @method getIntersectionOfLines
	 * @param {Point} l1start Start point of first line.
	 * @param {Point} l1end End point of first line.
	 * @param {Point} l2start Start point of second line.
	 * @param {Point} l2end End point of second line.
	 * @param {Point} intersectionPoint Point, where the lines intersect, if available.
	 * @param {Boolean} True, if the two lines are treated as endless lines by extending them or false, if lines are
	 * completely defined using the start and end point.
	 * @return {Boolean} True, if lines intersect, otherwise false.
	 */
	static getIntersectionOfLines(
		l1start,
		l1end,
		l2start,
		l2end,
		intersectionPoint,
		endless
	) {
		// Denominator for ua and ub are the same, so store this calculation
		const d =
			(l2end.y - l2start.y) * (l1end.x - l1start.x) -
			(l2end.x - l2start.x) * (l1end.y - l1start.y);

		// Make sure there is not a division by zero - this also indicates that the lines are parallel.
		// If n_a and n_b were both equal to zero the lines would be on top of each
		// other (coincidental).  This check is not done because it is not
		// necessary for this implementation (the parallel check accounts for this).
		if (d === 0) {
			return false;
		}

		// n_a and n_b are calculated as seperate values for readability
		const na =
			(l2end.x - l2start.x) * (l1start.y - l2start.y) -
			(l2end.y - l2start.y) * (l1start.x - l2start.x);
		const nb =
			(l1end.x - l1start.x) * (l1start.y - l2start.y) -
			(l1end.y - l1start.y) * (l1start.x - l2start.x);

		// Calculate the intermediate fractional point that the lines potentially intersect.
		const ua = na / d;
		const ub = nb / d;

		// The fractional point will be between 0 and 1 inclusive if the lines
		// intersect.  If the fractional calculation is larger than 1 or smaller
		// than 0 the lines would need to be longer to intersect.
		if (endless || (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)) {
			intersectionPoint.x = l1start.x + ua * (l1end.x - l1start.x);
			intersectionPoint.y = l1start.y + ua * (l1end.y - l1start.y);
			return true;
		}

		return false;
	}

	static doLinesIntersect(
		line1start,
		line1end,
		line2start,
		line2end,
		intersectionPoint
	) {
		// TODO (ah) this function seems to be a bit slower than getIntersectionOfLines()
		//= > !! not only slower but wronger too :( !!! => was noticed in BoundingBox#doesIntersectWith...
		//= > remove this one!!
		// see http://en.wikipedia.org/wiki/Line-line_intersection
		const x1 = line1start.x;
		const y1 = line1start.y;
		const x2 = line1end.x;
		const y2 = line1end.y;
		const x3 = line2start.x;
		const y3 = line2start.y;
		const x4 = line2end.x;
		const y4 = line2end.y;

		// denominator
		const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (d === 0) {
			return false;
			//= > lines are parallel
		}

		// calculate intersection point (for endless lines)
		const nx =
			(x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
		const ny =
			(x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
		// coordinates of intersection point:
		intersectionPoint.set(nx / d, ny / d);

		return true;
	}

	static JSDateToExcelDate(inDate) {
		return dateLocal2serial(inDate);
	}

	static excelDateToJSDate(serial) {
		return serial2date(serial);
	}
}

module.exports = MathUtils;
