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
const JSG = require('../JSG');
const Numbers = require('../commons/Numbers');
const MathUtils = require('../geometry/MathUtils');
const GraphUtils = require('../graph/GraphUtils');
const PortCoordinateProxy = require('../graph/PortCoordinateProxy');
const ItemAttributes = require('../graph/attr/ItemAttributes');
const OrthoLineShape = require('../graph/model/shapes/OrthoLineShape');
const OrthogonalLayout = require('./OrthogonalLayout');

/**
 * A layout helper object which represents an edge.<br/>
 * <b>Note:</b> this is an API internal object and should not be used!
 * @class Line
 */
const Line = (() => {
	let isOrthogonal = false;

	function getPortLocation(port, reusepoint, edge) {
		const graph = port.getGraph();
		let portloc = port.getPinPoint(reusepoint);
		GraphUtils.translatePointUp(portloc, port.getParent(), graph);
		if (edge) {
			// translate down to edge CS:
			portloc = edge._isFeedback
				? edge.translateFromParent(portloc)
				: GraphUtils.translatePointDown(portloc, graph, edge);
		}
		return portloc;
	}

	function rotatePointUp(point, item) {
		GraphUtils.traverseItemUp(item, item.getGraph(), (itm) => {
			point.rotate(itm.getAngle().getValue());
		});
		return point;
	}

	function rotatePointDown(point, item) {
		GraphUtils.traverseItemDown(item.getGraph(), item, (itm) => {
			point.rotate(-itm.getAngle().getValue());
		});
		return point;
	}

	// nodedir is direction vector of attached node given in edge CS
	function getDirectionFromNodeDirection(nodedir, reusepoint) {
		const candidate = JSG.ptCache.get().set(1, 0);
		let angle = MathUtils.getAngleBetweenLines(nodedir, candidate);
		angle = MathUtils.toDegrees(angle);
		if (angle > 315 || angle <= 45) {
			reusepoint.set(1, 0);
		} else if (angle > 45 && angle <= 135) {
			reusepoint.set(0, -1);
		} else if (angle > 135 && angle <= 225) {
			reusepoint.set(-1, 0);
		} else {
			reusepoint.set(0, 1);
		}
		JSG.ptCache.release(candidate);
		return reusepoint;
	}

	function getNodeDirection(segindex, reusepoint) {
		switch (segindex) {
			case 1:
				reusepoint.set(1, 0);
				break;
			case 2:
				reusepoint.set(0, 1);
				break;
			case 3:
				reusepoint.set(-1, 0);
				break;
			default:
				reusepoint.set(0, -1);
		}
		return reusepoint;
	}

	function getNodeSegment(nodebox, point) {
		let index = -1;
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();

		for (let i = 0; i < 4; i += 1) {
			nodebox.getCornerAt(i, corner1);
			nodebox.getCornerAt((i + 1) % 4, corner2);
			if (MathUtils.isPointOnLineSegment(point, corner1, corner2)) {
				index = i;
				break;
			}
		}
		JSG.ptCache.release(corner1, corner2);
		return index;
	}

	function directionFromNodeSegment(segindex, node, edge, direction) {
		const nodedir = JSG.ptCache.get();
		getNodeDirection(segindex, nodedir);
		rotatePointUp(nodedir, node);
		rotatePointDown(nodedir, edge);
		getDirectionFromNodeDirection(nodedir, direction);
		JSG.ptCache.release(nodedir);
		return direction;
	}

	function getPointAt(index, line, reusepoint) {
		const { edge } = line;
		const port =
			(index === 0 && edge.getSourcePort()) || (index === line.coordinates.length - 1 && edge.getTargetPort());
		if (port) {
			getPortLocation(port, reusepoint);
		} else {
			edge.getPointAt(index, reusepoint);
			GraphUtils.translatePointUp(reusepoint, edge.getParent(), edge.getGraph());
		}
		return reusepoint;
	}

	function getNodeSegmentFrom(nodebox, startpt, endpt) {
		const Utils = MathUtils;
		let index = -1;
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		const candidate = JSG.ptCache.get();
		let lastLength = -1;

		for (let i = 0; i < 4; i += 1) {
			nodebox.getCornerAt(i, corner1);
			nodebox.getCornerAt((i + 1) % 4, corner2);
			if (Utils.getIntersectionOfLines(startpt, endpt, corner1, corner2, candidate, false)) {
				// we can have several intersection points, so use the one which is closer to end of line...
				candidate.subtract(startpt);
				if (candidate.lengthSquared() > lastLength) {
					index = i;
					lastLength = candidate.lengthSquared();
				}
			}
		}
		JSG.ptCache.release(corner1, corner2, candidate);
		return index;
	}

	function getHorVerDirection(startpt, nextpt, isVertical, direction) {
		const x = nextpt.x - startpt.x;
		const y = nextpt.y - startpt.y;
		direction.x = isVertical ? 0 : x < 0 ? -1 : 1;
		direction.y = isVertical ? (y < 0 ? -1 : 1) : 0;
		return direction;
	}

	function isDirectionDefinedBySegment(pt1, pt2, reusepoint) {
		let defined = false;
		reusepoint.setTo(pt2).subtract(pt1);
		if (reusepoint.lengthSquared() > 0.0001) {
			defined = true;
			reusepoint.x = Math.abs(reusepoint.x) > Math.abs(reusepoint.y) ? (reusepoint.x < 0 ? -1 : 1) : 0;
			reusepoint.y = reusepoint.x === 0 ? (reusepoint.y < 0 ? -1 : 1) : 0;
		}
		return defined;
	}

	function isDirectionDefinedByLine(line, fromStart, direction) {
		let defined = false;
		const pt1 = JSG.ptCache.get();
		const pt2 = JSG.ptCache.get();
		const { coordinates } = line;
		let i;
		const last = coordinates.length - 1;

		if (fromStart) {
			for (i = 0; i < last; i += 1) {
				if (isDirectionDefinedBySegment(getPointAt(i, line, pt1), getPointAt(i + 1, line, pt2), direction)) {
					defined = true;
					break;
				}
			}
		} else {
			for (i = last; i > 0; i -= 1) {
				if (isDirectionDefinedBySegment(getPointAt(i, line, pt1), getPointAt(i - 1, line, pt2), direction)) {
					defined = true;
					break;
				}
			}
		}
		if (defined) {
			const doSwap = fromStart ? !Numbers.isEven(i) : Numbers.isEven(last) !== Numbers.isEven(i);
			if (doSwap) {
				direction.swap();
			}
		}
		JSG.ptCache.release(pt1, pt2);
		return defined;
	}

	function isDirectionDefinedByPort(port, line, direction) {
		let defined = false;
		if (port) {
			const node = port.getParent();
			const nodebox = node.getBoundingBox(JSG.boxCache.get());
			const portloc = getPortLocation(port, JSG.ptCache.get());
			GraphUtils.translateBoundingBoxUp(nodebox, node.getParent(), node.getGraph());
			// check if portloc is on node segment...
			let segindex = getNodeSegment(nodebox, portloc);
			if (segindex < 0) {
				// by default we assume that port location is inside node...
				// check if we have autolayout, otherwise manual layout does not depend on node...
				const behaviour = line.settings.get(OrthogonalLayout.BEHAVIOR);
				if (behaviour === ItemAttributes.LineBehavior.AUTO) {
					const nextpt = JSG.ptCache.get();
					const index = port === line.edge.getSourcePort() ? line.coordinates.length - 1 : 0;
					getPointAt(index, line, nextpt);
					// direction is defined by intersection
					segindex = getNodeSegmentFrom(nodebox, portloc, nextpt);
					JSG.ptCache.release(nextpt);
				}
			}
			if (segindex >= 0) {
				defined = true;
				// direction is defined by node segment:
				directionFromNodeSegment(segindex, node, line.edge, direction);
			}
			JSG.ptCache.release(portloc);
			JSG.boxCache.release(nodebox);
		}
		return defined;
	}

	function getPreferredDirection(fromStart, line) {
		const coord = fromStart ? line.coordinates[0] : line.coordinates[line.coordinates.length - 1];
		return coord instanceof PortCoordinateProxy ? coord._prefdir : undefined;
	}

	function setPreferredDirection(dir, fromStart, line) {
		// add to coordinate because we do not have to reset it on detach and similar scenarios!
		const coord = fromStart ? line.coordinates[0] : line.coordinates[line.coordinates.length - 1];
		if (coord instanceof PortCoordinateProxy) {
			coord._prefdir = dir;
		}
	}

	function getDirection(fromStart, line, direction) {
		const port = fromStart ? line.edge.getSourcePort() : line.edge.getTargetPort();
		if (!isDirectionDefinedByPort(port, line, direction)) {
			const BEHAVIOUR = ItemAttributes.LineBehavior;
			const pt1 = JSG.ptCache.get();
			const pt2 = JSG.ptCache.get();
			const last = line.coordinates.length - 1;
			const behaviour = line.settings.get(OrthogonalLayout.BEHAVIOR);
			let defined = false;
			switch (behaviour) {
				case BEHAVIOUR.VERTICAL:
				case BEHAVIOUR.HORIZONTAL:
					defined = true;
					getPointAt(0, line, pt1);
					getPointAt(last, line, pt2);
					getHorVerDirection(pt1, pt2, behaviour === BEHAVIOUR.VERTICAL, direction);
					break;
				case BEHAVIOUR.AUTO:
					defined = isDirectionDefinedBySegment(
						getPointAt(0, line, pt1),
						getPointAt(last, line, pt2),
						direction
					);
					break;
				case BEHAVIOUR.MANUAL: {
					// TODO do we have a preferred direction? -> when to clear -> on AUTO/VER/HOR!
					const prefdir = getPreferredDirection(fromStart, line);
					defined = !!prefdir && !!direction.setTo(prefdir);
					if (!defined) {
						getPointAt(fromStart ? 0 : last, line, pt1);
						getPointAt(fromStart ? 1 : last - 1, line, pt2);
						defined = isDirectionDefinedBySegment(pt1, pt2, direction);
						if (defined) {
							setPreferredDirection(direction.copy(), fromStart, line);
						}
					}
					break;
				}
				default:
					break;
			}
			if (
				!defined &&
				!isDirectionDefinedBySegment(getPointAt(0, line, pt1), getPointAt(last, line, pt2), direction) &&
				!isDirectionDefinedByLine(line, fromStart, direction)
			) {
				direction.set(1, 0);
			}
			JSG.ptCache.release(pt1, pt2);
		}
		return direction;
	}

	function intersectsBBox(bbox, start, end, intersection) {
		const Utils = MathUtils;
		const tmppt = JSG.ptCache.get();
		const corner1 = JSG.ptCache.get();
		const corner2 = JSG.ptCache.get();
		const candidate = JSG.ptCache.get();
		let lastLength = -1;
		let intersects = false;

		for (let i = 0; i < 4; i += 1) {
			bbox.getCornerAt(i, corner1);
			bbox.getCornerAt((i + 1) % 4, corner2);
			// edge case for orthogonal lines: start point is on line segment:
			if (isOrthogonal && Utils.isPointOnLineSegment(start, corner1, corner2)) {
				intersects = true;
				intersection.setTo(start);
				break;
			} else if (Utils.getIntersectionOfLines(start, end, corner1, corner2, tmppt, true)) {
				if (
					Utils.isPointInDirectionOfLine(tmppt, start, end) &&
					Utils.isPointOnLineSegment(tmppt, corner1, corner2)
				) {
					intersects = true;
					// we can have several intersection points, so use the one which is further away from start...
					candidate.setTo(tmppt).subtract(start);
					if (candidate.lengthSquared() > lastLength) {
						intersection.setTo(tmppt);
						lastLength = candidate.lengthSquared();
					}
				}
			}
		}
		JSG.ptCache.release(tmppt, corner1, corner2, candidate);
		return intersects;
	}

	function intersectsText(node, linestart, lineend, intersection) {
		let intersects = false;
		const textnode = node.getTextSubItem();
		if (textnode && textnode.isVisible()) {
			const nodebox = textnode.getBoundingBox(JSG.boxCache.get());
			GraphUtils.translateBoundingBoxUp(nodebox, node, node.getGraph());
			intersects = intersectsBBox(nodebox, linestart, lineend, intersection);
			JSG.boxCache.release(nodebox);
		}
		return intersects;
	}

	function intersectsNode(node, linestart, lineend, intersection) {
		const nodebox = node.getBoundingBox(JSG.boxCache.get());
		GraphUtils.translateBoundingBoxUp(nodebox, node.getParent(), node.getGraph());
		const intersects = intersectsBBox(nodebox, linestart, lineend, intersection);
		if (intersects) {
			const candidate = JSG.ptCache
				.get()
				.setTo(intersection)
				.subtract(linestart);
			const currDistance = candidate.lengthSquared();
			// check further, i.e. text & item-bar
			if (intersectsText(node, linestart, lineend, candidate)) {
				candidate.subtract(linestart);
				if (candidate.lengthSquared() > currDistance) {
					intersection.setTo(candidate.add(linestart));
				}
			}
			JSG.ptCache.release(candidate);
		}
		JSG.boxCache.release(nodebox);
		return intersects;
	}

	function getNextPoint(port, line, reusepoint) {
		const { edge, coordinates: coords } = line;
		const last = coords.length - 1;
		const next = edge.getSourcePort() === port ? 1 : last - 1;
		const nextport = (next === 0 && edge.getSourcePort()) || (next === last && edge.getTargetPort());
		if (nextport) {
			getPortLocation(nextport, reusepoint);
		} else {
			coords[next].toPoint(reusepoint);
			GraphUtils.translatePointUp(reusepoint, edge, edge.getGraph());
		}
		return reusepoint;
	}

	function applyPortDistance(port, location, distancept, line) {
		// apply distance...
		const { edge, coordinates } = line;
		let applied = false;
		const index = port === edge.getSourcePort() ? 0 : coordinates.length - 1;
		const point = JSG.ptCache.get().setTo(location);
		const coordpt = JSG.ptCache.get().setTo(location);
		GraphUtils.translatePointDown(point, edge.getGraph(), edge);
		point.add(distancept);
		if (!point.isEqualTo(coordinates[index].toPoint(coordpt), 0.001)) {
			coordinates[index].setToPoint(point);
			applied = true;
		}
		JSG.ptCache.release(point, coordpt);
		return applied;
	}

	function checkDistanceToPort(port, distance, line) {
		let aligned = false;
		const node = port.getParent();
		const portloc = getPortLocation(port, JSG.ptCache.get());
		const nextpt = getNextPoint(port, line, JSG.ptCache.get());
		const intersection = JSG.ptCache.get();
		if (intersectsNode(node, portloc, nextpt, intersection)) {
			nextpt.subtract(portloc).setLength(distance);
			aligned = applyPortDistance(port, intersection, nextpt, line);
		}
		JSG.ptCache.release(portloc, nextpt, intersection);
		return aligned;
	}

	function checkDistanceToPortOrthogonal(port, distance, line) {
		let aligned = false;
		const node = port.getParent();
		const fromStart = port === line.edge.getSourcePort();
		const portloc = getPortLocation(port, JSG.ptCache.get());
		const edgedir = getDirection(fromStart, line, JSG.ptCache.get());
		let linedir = JSG.ptCache.get().setTo(edgedir);
		const intersection = JSG.ptCache.get();
		linedir = rotatePointUp(linedir, line.edge).add(portloc);
		if (intersectsNode(node, portloc, linedir, intersection)) {
			edgedir.setLength(distance);
			aligned = applyPortDistance(port, intersection, edgedir, line);
		}
		JSG.ptCache.release(portloc, edgedir, linedir, intersection);
		return aligned;
	}

	// =================================================================================================================
	// PUBLIC API
	return {
		edge: undefined,
		settings: undefined,
		coordinates: undefined,

		initWithEdge(edge, settings) {
			this.edge = edge;
			this.coordinates = edge.getShape()._coordinates;
			this.settings = settings;
			isOrthogonal = this.edge.getShape() instanceof OrthoLineShape;
			return this;
		},
		checkPortDistance(port, distance) {
			return isOrthogonal
				? checkDistanceToPortOrthogonal(port, distance, this)
				: checkDistanceToPort(port, distance, this);
		},
		// gets the orthogonal start/end direction of this line
		getDirection(fromStart, reusepoint) {
			return getDirection(fromStart, this, reusepoint);
		}
	};
})();

module.exports = Line;
