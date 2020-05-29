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
import {
	default as JSG,
	MathUtils,
	Edge,
	Point,
} from '@cedalo/jsg-core';

/**
 * A small helper class which provides useful methods for {{#crossLink
 * "Interaction"}}{{/crossLink}}s which deal with {{#crossLink
 * "BezierLineShape"}}{{/crossLink}}s. For example:
 * {{#crossLink "CreateBezierEdgeInteraction"}}{{/crossLink}} and
 * {{#crossLink "ResizeBezierEdgeInteraction"}}{{/crossLink}}.<br/>
 * Instances of this class are simply created by calling <code>BezierEdgeHelper(edge)</code>.
 *
 *
 * @class BezierEdgeHelper
 * @param {Edge} edge An edge with a <code>BezierLineShape</code>.
 * @constructor
 * @since 1.6.18
 * @deprecated Currently API internal only!
 */
class BezierEdgeHelper {
	constructor(edge) {
		const helper = Object.create(BezierEdgeHelper.prototype);
		helper.edge = edge;
		return helper;
	}

	/**
	 * Determines an orthogonal direction vector at given port location.
	 *
	 * @method getOrthoDirAtPort
	 * @param {Point} portLocation The port location relative to <code>Graph</code> coordinate system.
	 * @param {GraphItem} node The <code>GraphItem</code> which has a port a given location.
	 * @param {Boolean} isEnd Flag which indicates if the bezier-curve end should be attached.
	 * @param {Point} [reusepoint] An optional point to reuse for calculated direction vector. If not given
	 * a new one will be created.
	 * @return {Point} Calculated direction vector which is orthognal to given port location and relative
	 * to <code>Graph</code> coordinate system.
	 */
	getOrtholDirAtPort(portLocation, node, isEnd, reusepoint) {
		const orthodir = reusepoint || new Point();
		const nbox = node.getTranslatedBoundingBox(node.getGraph(), JSG.boxCache.get());
		const ncenter = nbox.getCenter(JSG.ptCache.get(), true);
		let portloc = JSG.ptCache.get().setTo(portLocation);
		const p0 = JSG.ptCache.get().setTo(ncenter);
		const p1 = JSG.ptCache.get();
		// are we attached to node center?
		if (ncenter.subtract(portloc).length() < 1) {
			// take another port location:
			portloc = isEnd
				? this.edge.getPointAt(this.edge.getPointsCount() - 2, portloc)
				: this.edge.getPointAt(1, portloc);
		}
		ncenter.setTo(p0);
		let i;
		const segpt = JSG.ptCache.get();
		// check each box segment p0-p1 if it intersects line ncenter-portloc...
		for (i = 0; i < 4; i += 1) {
			nbox.getCornerAt(i, p0);
			nbox.getCornerAt((i + 1) % 4, p1);
			if (MathUtils.getIntersectionOfLines(p0, p1, ncenter, portloc, segpt, true)) {
				// check if segpt is on box-segment and if it is in direction of ncenter-portloc:
				if (
					MathUtils.isPointOnLineSegment(segpt, p0, p1) &&
					MathUtils.isPointInDirectionOfLine(segpt, ncenter, portloc)
				) {
					MathUtils.getOrthoPointToLine(p1, p0, orthodir);
					break;
				}
			}
		}
		JSG.ptCache.release(ncenter, portloc, p0, p1, segpt);
		JSG.boxCache.release(nbox);
		return orthodir;
	}

	/**
	 * Determines a control point for a <code>BezierLineShape</code> at given port location so that the curve attaches
	 * a bit more orthogonal.
	 *
	 * @method getControlPointAtPort
	 * @param {Point} portLocation The port location relative to <code>Graph</code> coordinate system.
	 * @param {GraphItem} node The <code>GraphItem</code> which has a port a given location.
	 * @param {Boolean} isEnd Flag which indicates if the bezier-curve end should be attached.
	 * @param {Point} [reusepoint] An optional point to reuse for calculated control point. If not given a
	 * new one will be created.
	 * @return {Point} A point to use as control point.
	 */
	getControlPointAtPort(portLocation, node, isEnd, reusepoint) {
		const cppt = reusepoint || new Point();
		const coord = isEnd ? this.edge.getEndCoordinate() : this.edge.getStartCoordinate();
		const cpcoord = isEnd ? coord.cpFrom : coord.cpTo;
		const coordpt = coord.toPoint(JSG.ptCache.get());
		const portpt = JSG.ptCache.get().setTo(portLocation);
		const origin = this.edge.getOrigin(JSG.ptCache.get());

		this.getOrtholDirAtPort(portLocation, node, isEnd, cppt);

		cppt.normalize().setLength(3000);
		cppt.add(portpt.subtract(origin));
		// release
		JSG.ptCache.release(coordpt, portpt, origin);
		return cppt;
	}
}

export default BezierEdgeHelper;
