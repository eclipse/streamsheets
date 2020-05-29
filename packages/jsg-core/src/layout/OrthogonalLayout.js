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
const Layout = require('./Layout');
const Arrays = require('../commons/Arrays');
const Numbers = require('../commons/Numbers');
const Point = require('../geometry/Point');
const MathUtils = require('../geometry/MathUtils');
const GraphUtils = require('../graph/GraphUtils');
const Coordinate = require('../graph/Coordinate');
const ItemAttributes = require('../graph/attr/ItemAttributes');
const EdgeLayout = require('./EdgeLayout');
const Line = require('./Line');

const TYPE = 'jsg.layout.edge.orthogonal';
const BEHAVIOR = 'ortholayout.behavior';
const MINPORTSEG = 'ortholayout.min.port.seg';

const settings = EdgeLayout.Settings.derive();
// values: auto, manual, horizontal, vertical => horizontal & vertical makes line manual!! => but applies only to
// center port attach...
settings.set(BEHAVIOR, ItemAttributes.LineBehavior.AUTO);
settings.set(MINPORTSEG, 500);

/**
 * A <code>Layout</code> subclass used by {{#crossLink "LineConnection"}}{{/crossLink}}s which have
 * an orthogonal shape like {{#crossLink "OrthoLineShape"}}{{/crossLink}}. This layout object
 * extends the general <code>Layout</code> interface with additional methods and provides a simple settings object.
 *
 * @class OrthogonalLayout
 * @extends Layout
 * @constructor
 * @since 1.6.18
 */
class OrthogonalLayout extends Layout {
	getType() {
		return OrthogonalLayout.TYPE;
	}

	getInitialSettings(graphitem) {
		return OrthogonalLayout.Settings.derive();
	}

	layout(graphitem) {
		if (this.isEnabled(graphitem)) {
			const shape = graphitem.getShape();
			const setting = this.getSettings(graphitem);
			if (this._doLayout(graphitem, setting)) {
				// refresh shape to set new shape points...
				shape.refresh();
				return true;
			}
		}
		return false;
	}

	//
	// ADDITIONAL METHODS:
	//
	//
	getStartDirection(edge, reusepoint) {
		const setting = this.getSettings(edge);
		const line = Line.initWithEdge(edge, setting);
		return line.getDirection(true, reusepoint);
	}

	/**
	 * Partly layouts line shape from given port. Useful when attaching lines with a manual layout behavior.</br>
	 * Partly means that at most 5 coordinates starting from given port (inclusively) will be arranged. <b>Note:</b>
	 * this will insert new coordinates if required! E.g. to ensure that line is orthogonal to node of given port.
	 *
	 * @method layoutFrom
	 * @param {Edge} edge The edge to layout.
	 * @param {Port} port The port to start layout at.
	 */
	layoutFrom(edge, port) {
		const setting = this.getSettings(edge);
		const line = Line.initWithEdge(edge, setting);
		this._checkDistanceToPort(line, setting);
		if (edge.getSourcePort() === port) {
			this._layoutFromSource(port, edge);
		} else {
			this._layoutFromTarget(port, edge);
		}
	}

	/**
	 * Returns the orthogonal direction vector based on the line specified by given points.
	 *
	 * @method getOrthoDirectionFromLine
	 * @param {Edge} edge The edge to layout.
	 * @param {Point} p0 First line point.
	 * @param {Point} p1 Last line point.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 */
	getOrthoDirectionFromLine(edge, p0, p1, reusepoint) {
		const line = p1.subtract(p0);
		return this._getOrthoDirectionByAngle(line.angle(), reusepoint);
	}

	/**
	 * Returns the orthogonal direction vector for given Port.</br>
	 * Note: the last parameter is used for center ports. I.e to determine the direction vector
	 * if given port is a center port a line is constructed from given first coordinate to specified last
	 * coordinate.
	 *
	 * @method getOrthoDirectionFromPort
	 * @param {Edge} edge The edge to layout.
	 * @param {Port} port The port to determine the direction vector for.
	 * @param {Number} first The coordinate index which represents given port .
	 * @param {Number} last The index of the coordinate to use if direction vector must be determined by a line.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 */
	getOrthoDirectionFromPort(edge, port, first, last, reusepoint) {
		const self = this;
		const node = port.getParent();
		const tmp = JSG.ptCache.get();
		const portPt = edge.getPointAt(first, JSG.ptCache.get());
		const lastPt = edge.getPointAt(last, JSG.ptCache.get());
		const nodebox = node.getTranslatedBoundingBox(edge.getParent(), JSG.boxCache.get());
		const center = nodebox.getCenter(JSG.ptCache.get()).add(nodebox.getTopLeft(tmp));
		let segmentpt;

		function directionFromBBox(pt1, pt2, lreusepoint) {
			const edir = lreusepoint;
			const ndir = JSG.ptCache.get();
			const tmpdir = JSG.ptCache.get();
			const index = nodebox.getIntersectionIndex(pt1, pt2);
			const twoPI = 2 * Math.PI;
			let angle = 0;
			let minAngle = Math.PI * 1000;
			let nodeangle = 0;
			let edgeangle = 0;

			function check(x, y) {
				tmpdir.set(x, y).rotate(edgeangle);
				angle = (twoPI + MathUtils.getAngleBetweenLines(ndir, tmpdir)) % twoPI;
				angle = angle < Math.PI ? angle : twoPI - angle;
				if (angle < minAngle) {
					edir.set(x, y);
					minAngle = angle;
				}
			}

			switch (index) {
				case 0:
					ndir.set(0, -1);
					break;
				case 1:
					ndir.set(1, 0);
					break;
				case 2:
					ndir.set(0, 1);
					break;
				case 3:
					ndir.set(-1, 0);
					break;
				default:
					ndir.setTo(self.getOrthoDirectionFromLine(edge, pt1, pt2, lreusepoint));
			}
			const nX = ndir.x;
			const nY = ndir.y;
			const graph = node.getGraph();
			GraphUtils.traverseItemUp(node, graph, (it) => {
				nodeangle += it.getAngle().getValue();
			});
			ndir.rotate(nodeangle);

			GraphUtils.traverseItemUp(edge, graph, (it) => {
				edgeangle += it.getAngle().getValue();
			});

			// start in orthogonal direction of node => good for special cases like 90°...
			check(nX, nY);
			check(nY, nX);
			check(-nX, -nY);
			check(-nY, -nX);

			// segment point:
			if (index > -1) {
				const corner1 = nodebox.getCornerAt(index % 4, JSG.ptCache.get());
				const corner2 = nodebox.getCornerAt((index + 1) % 4, JSG.ptCache.get());
				const lcenter = nodebox.getCenter(JSG.ptCache.get(), true);
				const centerdir = JSG.ptCache.get().setTo(edir);
				MathUtils.rotatePoint(centerdir, edge.getAngle().getValue());
				centerdir.add(lcenter);
				segmentpt = new Point();
				if (MathUtils.getIntersectionOfLines(corner1, corner2, lcenter, centerdir, segmentpt, true)) {
					edge.translateFromParent(segmentpt);
				} else {
					segmentpt = undefined;
				}
				JSG.ptCache.release(corner1, corner2, lcenter, centerdir);
			}
			JSG.ptCache.release(ndir, tmpdir);
			return edir;
		}

		function directionFromCenterPort(lreusepoint) {
			const behavior = self.getSettings(edge).get(OrthogonalLayout.BEHAVIOR);
			// check behavior...
			switch (behavior) {
				case ItemAttributes.LineBehavior.HORIZONTAL:
					return self._getOrthoDirectionFromPoint(1, 0, portPt, lastPt);
				case ItemAttributes.LineBehavior.VERTICAL:
					return self._getOrthoDirectionFromPoint(0, 1, portPt, lastPt);
				case ItemAttributes.LineBehavior.MANUAL: {
					const dir =
						last < 3
							? self.getOrthoDirectionFromLine(edge, portPt, lastPt, lreusepoint)
							: self._getOrthoDirectionFromLineSegment(
									edge.getShape()._coordinates,
									first === 0,
									lreusepoint
							  );
					return dir || directionFromBBox(portPt, lastPt);
				}
				default:
					// last resort:
					return directionFromBBox(portPt, lastPt, lreusepoint);
			}
		}

		if (portPt.isEqualTo(center, 10)) {
			reusepoint.setTo(directionFromCenterPort(reusepoint));
			// segmentpt correctly works for center point only!! => our other ports are currently on segment by
			// definition!! reusepoint.segmentpt = segmentpt; <- useful? for what? preferred direction? we do it
			// differently now...
		} else {
			directionFromBBox(center, portPt, reusepoint);
		}
		JSG.boxCache.release(nodebox);
		JSG.ptCache.release(portPt, lastPt, center, tmp);
		return reusepoint;
	}

	/**
	 * Adjust given point in given direction to specified point.</br>
	 * That means that only the component of given point is set to the corresponding component of given
	 * second point if the direction component is not 0.
	 *
	 * @method biasPoint
	 * @param {Point} point The point to bias.
	 * @param {Point} toPoint The point to take the component value from.
	 * @param {Point} inDirection The direction vector which specifies the point component to set.
	 */
	biasPoint(point, toPoint, inDirection) {
		if (inDirection.x !== 0) {
			point.x = toPoint.x;
		} else {
			point.y = toPoint.y;
		}
		return point;
	}

	//
	// PRIVATE METHODS:
	//
	/**
	 * @method _doLayout
	 * @private
	 */
	_doLayout(edge, setting) {
		let didLayout = false;
		const line = Line.initWithEdge(edge, setting);
		if (edge !== undefined && line.coordinates.length !== 0) {
			didLayout = true;
			this._checkDistanceToPort(line, setting);
			// TODO we have horizontal & vertical too!!
			if (settings.get(OrthogonalLayout.BEHAVIOR) === ItemAttributes.LineBehavior.MANUAL) {
				if (edge.hasSourceAttached()) {
					this._routeFromSourcePort(line, setting);
				}
				if (edge.hasTargetAttached()) {
					this._routeFromTargetPort(line, setting);
				}
			} else {
				this._autoLayout(line);
			}
		}
		return didLayout;
	}

	// almost same as routeFromTargetPort => combine!
	_routeFromSourcePort(line, setting) {
		const { edge, coordinates } = line;
		const last = coordinates.length - 1;
		let doAutoLayout = last < 2;
		if (!doAutoLayout) {
			const MIN_PORT_SEG_LENGTH = setting.get(OrthogonalLayout.MINPORTSEG, 500);
			const portloc = coordinates[0].toPoint(JSG.ptCache.get());
			const nextpt = coordinates[1].toPoint(JSG.ptCache.get());
			const secnextpt = coordinates[2].toPoint(JSG.ptCache.get());
			const secnextseg = JSG.ptCache
				.get()
				.setTo(nextpt)
				.subtract(secnextpt);
			const orthodir = line.getDirection(true, JSG.ptCache.get());
			doAutoLayout = secnextseg.lengthSquared() > 1 && secnextseg.isParallelTo(orthodir); // parallel check to
			// validate against
			// node rotation...
			if (!doAutoLayout) {
				orthodir.setLength(MIN_PORT_SEG_LENGTH).add(portloc);
				secnextpt.projectOnLine(portloc, orthodir);
				doAutoLayout = MathUtils.isPointBehind(secnextpt, portloc, orthodir);
				if (!doAutoLayout && last === 2 && edge.hasTargetAttached()) {
					// check target distance...
					const trgtportloc = coordinates[last].toPoint(JSG.ptCache.get());
					line.getDirection(false, orthodir);
					orthodir.setLength(MIN_PORT_SEG_LENGTH).add(trgtportloc);
					secnextpt.setTo(portloc).projectOnLine(trgtportloc, orthodir);
					doAutoLayout = MathUtils.isPointBehind(secnextpt, trgtportloc, orthodir);
					JSG.ptCache.release(trgtportloc);
				}
			}
			if (!doAutoLayout) {
				// we simply actualize point...
				edge.getShape()._setCoordinateAtToPoint(0, portloc);
			}
			JSG.ptCache.release(portloc, nextpt, secnextpt, secnextseg, orthodir);
		}
		if (doAutoLayout) {
			this._autoLayout(line);
		}
	}

	// ensures that all setting constraint are fulfilled, otherwise we do an auto-layout...
	_routeFromTargetPort(line, setting) {
		const { edge, coordinates } = line;
		const last = coordinates.length - 1;
		let doAutoLayout = last < 2;

		if (!doAutoLayout) {
			const MIN_PORT_SEG_LENGTH = setting.get(OrthogonalLayout.MINPORTSEG, 500);
			const portloc = coordinates[last].toPoint(JSG.ptCache.get());
			const prevpt = coordinates[last - 1].toPoint(JSG.ptCache.get());
			const preprevpt = coordinates[last - 2].toPoint(JSG.ptCache.get());
			const preprevseg = JSG.ptCache
				.get()
				.setTo(prevpt)
				.subtract(preprevpt);
			const orthodir = line.getDirection(false, JSG.ptCache.get());
			doAutoLayout = preprevseg.lengthSquared() > 1 && preprevseg.isParallelTo(orthodir); // parallel check
			// to validate
			// against node
			// rotation...
			if (!doAutoLayout) {
				orthodir.setLength(MIN_PORT_SEG_LENGTH).add(portloc);
				preprevpt.projectOnLine(portloc, orthodir);
				doAutoLayout = MathUtils.isPointBehind(preprevpt, portloc, orthodir);
				if (!doAutoLayout && last - 2 === 0 && edge.hasSourceAttached()) {
					// check source distance...
					const srcportloc = coordinates[0].toPoint(JSG.ptCache.get());
					line.getDirection(true, orthodir);
					orthodir.setLength(MIN_PORT_SEG_LENGTH).add(srcportloc);
					preprevpt.setTo(portloc).projectOnLine(srcportloc, orthodir);
					doAutoLayout = MathUtils.isPointBehind(preprevpt, srcportloc, orthodir);
					JSG.ptCache.release(srcportloc);
				}
			}
			if (!doAutoLayout) {
				// we simply actualize point...
				edge.getShape()._setCoordinateAtToPoint(last, portloc);
			}
			JSG.ptCache.release(portloc, prevpt, preprevpt, preprevseg, orthodir);
		}
		if (doAutoLayout) {
			this._autoLayout(line);
		}
	}

	_checkDistanceToPort(line, setting) {
		const DISTANCE_TO_PORT = setting.get(EdgeLayout.DIST_TO_PORT, 0);
		if (DISTANCE_TO_PORT > 0) {
			const { edge } = line;
			const last = line.coordinates.length - 1;
			const direction = JSG.ptCache.get();
			let port;
			if (edge.hasSourceAttached()) {
				// line.checkPortDistance(edge.getSourcePort(), DISTANCE_TO_PORT);
				port = edge.getSourcePort();
				this.getOrthoDirectionFromPort(edge, port, 0, last, direction);
				line.checkPortDistance(port, DISTANCE_TO_PORT, direction);
			}
			if (edge.hasTargetAttached()) {
				// line.checkPortDistance(edge.getTargetPort(), DISTANCE_TO_PORT);
				port = edge.getTargetPort();
				this.getOrthoDirectionFromPort(edge, port, last, 0, direction);
				line.checkPortDistance(port, DISTANCE_TO_PORT, direction);
			}
			JSG.ptCache.release(direction);
		}
	}

	/**
	 * @method _autoLayout
	 * @private
	 */
	_autoLayout(line) {
		const { edge, coordinates } = line;
		const last = coordinates.length - 1;
		const srcpt = coordinates[0].toPoint(JSG.ptCache.get());
		const srcPort = edge.getSourcePort();
		let srcdir = JSG.ptCache.get();
		srcdir = srcPort
			? line.getDirection(true, srcdir)
			: this._getOrthoDirectionFrom(srcPort, coordinates, 0, last, edge, srcdir);
		srcdir.fromPort = !!srcPort;
		const trgtpt = coordinates[last].toPoint(JSG.ptCache.get());
		const trgtPort = edge.getTargetPort();
		let trgtdir = JSG.ptCache.get();
		trgtdir = trgtPort
			? line.getDirection(false, trgtdir)
			: this._getOrthoDirectionFrom(trgtPort, coordinates, last, 0, edge, trgtdir);
		trgtdir.fromPort = !!trgtPort;

		if (srcdir.fromPort || trgtdir.fromPort) {
			if (srcdir.fromPort && !trgtdir.fromPort) {
				if (srcdir.segmentpt) {
					srcpt.setTo(srcdir.segmentpt);
				}
				const setting = this.getSettings(edge);
				if (setting.get(OrthogonalLayout.BEHAVIOR) === ItemAttributes.LineBehavior.MANUAL) {
					this._routeFromSourceManual(line);
				} else {
					this._routeFromSourceAuto(srcpt, srcdir, edge);
				}
			} else {
				if (srcdir.segmentpt) {
					srcpt.setTo(srcdir.segmentpt);
				}
				if (trgtdir.segmentpt) {
					trgtpt.setTo(trgtdir.segmentpt);
				}
				this._routeLine(srcpt, srcdir, trgtpt, trgtdir, edge, true);
			}
		} else {
			this._routeNotAttached(coordinates, edge);
		}
		srcdir.fromPort = undefined;
		srcdir.segmentpt = undefined;
		trgtdir.fromPort = undefined;
		trgtdir.segmentpt = undefined;
		JSG.ptCache.release(srcpt, srcdir, trgtpt, trgtdir);
	}

	/**
	 * @method _routeNotAttached
	 * @private
	 */
	_routeNotAttached(coordinates, edge) {
		const srcpt = coordinates[0].toPoint(JSG.ptCache.get(0, 0));
		const trgtpt = coordinates[coordinates.length - 1].toPoint(JSG.ptCache.get(0, 0));
		this._requires(4, coordinates);
		// 4 coordinates for autolayout non attached...
		const center = JSG.ptCache
			.get()
			.setTo(srcpt)
			.add(trgtpt)
			.multiply(0.5);
		if (this._doBreakHorizontal(srcpt, trgtpt, edge)) {
			coordinates[1].set(srcpt.x, center.y);
			coordinates[2].set(trgtpt.x, center.y);
		} else {
			coordinates[1].set(center.x, srcpt.y);
			coordinates[2].set(center.x, trgtpt.y);
		}
		JSG.ptCache.release(srcpt, trgtpt, center);
	}

	/**
	 * @method _doBreakHorizontal
	 * @private
	 */
	_doBreakHorizontal(srcpt, trgtpt, edge) {
		// var BEHAVIOR = ItemAttributes.LineBehavior;
		const behavior = this.getSettings(edge).get(OrthogonalLayout.BEHAVIOR);
		if (behavior === ItemAttributes.LineBehavior.AUTO) {
			const width = trgtpt.x - srcpt.x;
			const height = trgtpt.y - srcpt.y;
			return Math.abs(height / width) > 1;
		}
		return behavior === ItemAttributes.LineBehavior.HORIZONTAL;
	}

	/**
	 * Routes this line starting at source coordinate in direction of given vector.
	 *
	 * @method _routeFromSourceAuto
	 * @param {Point} srcpt The start point to route from.
	 * @param {Point} srcdir Orthogonal direction vector for source coordinate.
	 * @param {Edge} edge The edge to layout.
	 * @private
	 */
	_routeFromSourceAuto(srcpt, srcdir, edge) {
		const setting = this.getSettings(edge);
		const MIN_PORT_SEG_LENGTH = setting.get(OrthogonalLayout.MINPORTSEG, 500);
		const coordinates = edge.getShape()._coordinates;
		const trgtpt = coordinates[coordinates.length - 1].toPoint(JSG.ptCache.get(0, 0));
		const center = JSG.ptCache
			.get()
			.setTo(srcpt)
			.add(trgtpt)
			.multiply(0.5);
		const startpt = JSG.ptCache
			.get()
			.setTo(center)
			.subtract(srcpt);
		let val;
		startpt.set(startpt.x * Math.abs(srcdir.x), startpt.y * Math.abs(srcdir.y));
		// handle special case that startpt is (0,0):
		if (Numbers.areEqual(startpt.x, 0, 0.0001) && Numbers.areEqual(startpt.y, 0, 0.0001)) {
			startpt.setTo(srcdir);
		}
		const startlength = startpt.length();
		if (srcdir.x !== 0) {
			val = startpt.x;
			if (!Numbers.haveSameSign(val, srcdir.x) || startlength < MIN_PORT_SEG_LENGTH) {
				startpt.setLength(MIN_PORT_SEG_LENGTH);
			}
			if (!Numbers.haveSameSign(val, srcdir.x)) {
				startpt.x = -startpt.x;
			}
		} else {
			val = startpt.y;
			if (!Numbers.haveSameSign(val, srcdir.y) || startlength < MIN_PORT_SEG_LENGTH) {
				startpt.setLength(MIN_PORT_SEG_LENGTH);
			}
			if (!Numbers.haveSameSign(val, srcdir.y)) {
				startpt.y = -startpt.y;
			}
		}
		startpt.add(srcpt);

		this._requires(4, coordinates);

		this.biasPoint(startpt, srcpt, srcdir.swap());
		coordinates[1].setToPoint(startpt);
		this.biasPoint(startpt, trgtpt, srcdir);
		coordinates[2].setToPoint(startpt);
		JSG.ptCache.release(trgtpt, center, startpt);
	}

	// routes manual line from source port...
	_routeFromSourceManual(line) {
		const setting = line.settings;
		const MIN_PORT_SEG_LENGTH = setting.get(OrthogonalLayout.MINPORTSEG, 500);
		const { coordinates } = line;
		const direction = line.getDirection(true, JSG.ptCache.get());
		let pt = coordinates[0].toPoint(JSG.ptCache.get());
		const nextpt = JSG.ptCache
			.get()
			.setTo(direction)
			.setLength(MIN_PORT_SEG_LENGTH)
			.add(pt);
		coordinates[1].setToPoint(nextpt);
		// project on parallel segment...
		if (coordinates.length > 2) {
			pt = coordinates[2].toPoint(pt);
			nextpt.projectOnLine(pt, direction.add(pt));
			coordinates[2].setToPoint(nextpt);
		}
		JSG.ptCache.release(direction, pt, nextpt);
	}

	/**
	 * @method _layoutFromTarget
	 * @private
	 */
	_layoutFromTarget(port, edge) {
		const shape = edge.getShape();
		const coordinates = shape._coordinates;
		const last = coordinates.length - 1;
		// don't need to layout if only two points in line
		if (last > 1) {
			const orthopt = this.getOrthoDirectionFromPort(edge, port, last, 0, JSG.ptCache.get());
			orthopt.fromPort = true;
			const pt = orthopt.segmentpt || coordinates[last].toPoint(JSG.ptCache.get());
			const prevpt = coordinates[last - 1].toPoint(JSG.ptCache.get());
			const prevprevpt = coordinates[last - 2].toPoint(JSG.ptCache.get());
			let prevlinept = JSG.ptCache
				.get()
				.setTo(prevpt)
				.subtract(prevprevpt);
			prevlinept.fromPort = this._isAttached(edge, last - 2, coordinates);
			// prevlinept is ortho, i.e. one component is 0, so:
			prevlinept = this._roundedOrthoPoint(prevlinept);
			const newCoords = this._routeLine(prevprevpt, prevlinept, pt, orthopt, edge);
			coordinates[last - 1].setTo(newCoords.shift());
			Arrays.insertAt(coordinates, last, newCoords);
			orthopt.fromPort = undefined;
			orthopt.segmentpt = undefined;
			prevlinept.fromPort = undefined;
			JSG.ptCache.release(orthopt, pt, prevpt, prevprevpt, prevlinept);
		}
	}

	/**
	 * @method _layoutFromSource
	 * @private
	 */
	_layoutFromSource(port, edge) {
		const shape = edge.getShape();
		const coordinates = shape._coordinates;
		const last = coordinates.length - 1;
		// don't need to layout if only two points in line
		if (last > 1) {
			const orthopt = this.getOrthoDirectionFromPort(edge, port, 0, last, JSG.ptCache.get());
			orthopt.fromPort = true;
			const pt = orthopt.segmentpt || coordinates[0].toPoint(JSG.ptCache.get());
			const nextpt = coordinates[1].toPoint(JSG.ptCache.get());
			const secnextpt = coordinates[2].toPoint(JSG.ptCache.get());
			let nextlinept = JSG.ptCache
				.get()
				.setTo(nextpt)
				.subtract(secnextpt);
			nextlinept.fromPort = this._isAttached(edge, 2, coordinates);
			// line is ortho, i.e. one component is 0, so:
			nextlinept = this._roundedOrthoPoint(nextlinept);
			const newCoords = this._routeLine(pt, orthopt, secnextpt, nextlinept, edge);
			coordinates[1].setTo(newCoords.pop());
			Arrays.insertAt(coordinates, 1, newCoords);
			orthopt.fromPort = undefined;
			orthopt.segmentpt = undefined;
			nextlinept.fromPort = undefined;
			JSG.ptCache.release(orthopt, pt, nextpt, secnextpt, nextlinept);
		}
	}

	/**
	 * @method _isAttached
	 * @private
	 */
	_isAttached(edge, index, coordinates) {
		const last = coordinates.length - 1;
		return (index === 0 && edge.hasSourceAttached()) || (index === last && edge.hasTargetAttached());
	}

	/**
	 * Tries to determine the orthogonal direction vector at given Port or for given coordinates if
	 * port is undefined.
	 *
	 * @method _getOrthoDirectionFrom
	 * @param {Port} port The port to determine the direction vector for.
	 * @param {Array} coordinates The coordinates to use to determine direction vector.
	 * @param {Number} first The coordinate index which represents given port .
	 * @param {Number} last The index of the coordinate to use if direction vector must be determined by a line.
	 * @param {Edge} edge The edge to layout.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 * @private
	 */
	_getOrthoDirectionFrom(port, coordinates, first, last, edge, reusepoint) {
		// TODO to many method parameters => separate...
		// var edge = this._shape._item;
		const p1 = JSG.ptCache.get(0, 0);
		const p2 = JSG.ptCache.get(0, 0);
		let orthodir = reusepoint;

		// first check port:
		if (port) {
			this.getOrthoDirectionFromPort(edge, port, first, last, orthodir);
			orthodir.fromPort = true;
		} else {
			orthodir.valid = false;
			orthodir.fromPort = undefined;
			const behavior = this.getSettings(edge).get(OrthogonalLayout.BEHAVIOR);
			// check behavior...
			switch (behavior) {
				case ItemAttributes.LineBehavior.HORIZONTAL:
					orthodir.valid = true;
					orthodir.setTo(
						this._getOrthoDirectionFromPoint(
							1,
							0,
							coordinates[first].toPoint(p1),
							coordinates[last].toPoint(p2)
						)
					);
					break;
				case ItemAttributes.LineBehavior.VERTICAL:
					orthodir.valid = true;
					orthodir.setTo(
						this._getOrthoDirectionFromPoint(
							0,
							1,
							coordinates[first].toPoint(p1),
							coordinates[last].toPoint(p2)
						)
					);
					break;
				case ItemAttributes.LineBehavior.MANUAL:
					orthodir = this._getOrthoDirectionFromLineSegment(coordinates, first === 0, orthodir);
					break;
				default:
					break;
			}
		}
		if (orthodir.valid === false) {
			orthodir.valid = undefined;
			this.getOrthoDirectionFromLine(
				edge,
				coordinates[first].toPoint(p1),
				coordinates[last].toPoint(p2),
				orthodir
			);
		}

		JSG.ptCache.release(p1, p2);
		return orthodir;
	}

	/**
	 * Returns the orthogonal direction vector for specified line at given point.</br>
	 *
	 * @method _getOrthoDirectionFromPoint
	 * @param {Number} x The x point component.
	 * @param {Number} y The y point component.
	 * @param {Point} p0 First line point.
	 * @param {Point} p1 Last line point.
	 * @return {Point} The direction vector or <code>undefined</code> if none could be determined.
	 * @private
	 */
	_getOrthoDirectionFromPoint(x, y, p0, p1) {
		const direction = p1.subtract(p0);
		direction.x *= x;
		direction.y *= y;
		return this._roundedOrthoPoint(direction.normalize());
	}

	/**
	 * Returns an orthogonal direction vector based on given angle.</br>
	 * The direction vector is set clockwise where an angle of 0 leads to a direction vector of (1, 0).
	 *
	 * @method _getOrthoDirectionByAngle
	 * @param {Number} angle The angle in radians to determine the direction vector for.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 * @private
	 */
	_getOrthoDirectionByAngle(angle, reusepoint) {
		const direction = reusepoint;
		if (angle > -Math.PI_4 && angle < Math.PI_4) {
			direction.set(1, 0);
		} else if (angle > 0 && angle < 3 * Math.PI_4) {
			direction.set(0, 1);
		} else if (angle < 0 && angle > -3 * Math.PI_4) {
			direction.set(0, -1);
		} else {
			direction.set(-1, 0);
		}
		return direction;
	}

	/**
	 * Determines the orthogonal direction vector for given coordinates based on first line segment found which has a
	 * length.</br> Note: returned direction vector applies to start coordinate. Furthermore note that the returned
	 * vector gets an additional <code>valid</code> field which specifies if the returned vector is valid or not, i.e.
	 * could not be used as direction vector.
	 *
	 * @method _getOrthoDirectionFromLineSegment
	 * @param {Array} coordinates The coordinates to determine direction vector for.
	 * @param {Boolean} forward Specify <code>true</code> to traverse line segments from start or <code>false</code> to
	 *     traverse from back.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 * @private
	 */
	_getOrthoDirectionFromLineSegment(coordinates, forward, reusepoint) {
		const p0 = JSG.ptCache.get();
		const p1 = JSG.ptCache.get();
		const orthodir = reusepoint || new Point();
		let i;
		let n;

		// take first line which has a length > MIN_DISTANCE:
		orthodir.valid = false;
		if (forward) {
			for (i = 0, n = coordinates.length - 2; i < n; i += 1) {
				if (
					coordinates[i + 1]
						.toPoint(p1)
						.subtract(coordinates[i].toPoint(p0))
						.lengthSquared() > 0
				) {
					orthodir.valid = true;
					break;
				}
			}
		} else {
			for (i = coordinates.length - 1, n = 0; i > n; i -= 1) {
				if (
					coordinates[i - 1]
						.toPoint(p1)
						.subtract(coordinates[i].toPoint(p0))
						.lengthSquared() > 0
				) {
					orthodir.valid = true;
					break;
				}
			}
		}
		if (orthodir.valid) {
			orthodir.setTo(p1);
			orthodir.normalize();
			// we may have to swap orthodir since we want it to match to start/end of line...
			const swap = forward ? !Numbers.isEven(i) : Numbers.isEven(coordinates.length - 1) !== Numbers.isEven(i);
			if (swap) {
				orthodir.swap();
			}
			this._roundedOrthoPoint(orthodir);
		}
		JSG.ptCache.release(p0, p1);
		return orthodir;
	}

	/**
	 * @method _roundedOrthoPoint
	 * @private
	 */
	_roundedOrthoPoint(point) {
		if (Numbers.areEqual(point.x, 0, 0.0001)) {
			point.x = 0;
			point.y = point.y > 0 ? 1 : -1;
		} else {
			point.x = point.x > 0 ? 1 : -1;
			point.y = 0;
		}
		return point;
	}

	/**
	 * The actual auto layout for orthogonal lines.
	 *
	 * @method _routeLine
	 * @param {Point} srcdir Orthogonal direction vector for source point.
	 * @param {Point} trgtdir Orthogonal direction vector for target point.
	 * @private
	 */
	_routeLine(srcpt, srcdir, trgtpt, trgtdir, edge, auto) {
		const sMin = JSG.ptCache.get();
		const tMin = JSG.ptCache.get();
		const delta = JSG.ptCache.get();
		let sMinVal;
		let tMinVal;
		let workCoordinates;
		const MIN_PORT_SEG_LENGTH = this.getSettings(edge).get(OrthogonalLayout.MINPORTSEG, 500);

		if (trgtdir.isParallelTo(srcdir)) {
			// point to same direction?
			const sameDirection =
				srcdir.x !== 0 ? Numbers.haveSameSign(trgtdir.x, srcdir.x) : Numbers.haveSameSign(trgtdir.y, srcdir.y);
			if (sameDirection) {
				workCoordinates = this._workCoordinates(2, edge, auto);
				const sval = this._getValueInDirection(srcpt, srcdir);
				const tval = this._getValueInDirection(trgtpt, trgtdir);
				if (sval > tval) {
					this._breakAt(workCoordinates, 0, srcpt, 1, trgtpt, srcdir, MIN_PORT_SEG_LENGTH);
				} else {
					this._breakAt(workCoordinates, 1, trgtpt, 0, srcpt, trgtdir, MIN_PORT_SEG_LENGTH);
				}
			} else if (
				(srcdir.y !== 0 && Math.abs(srcpt.x - trgtpt.x) < 50) ||
				(srcdir.x !== 0 && Math.abs(srcpt.y - trgtpt.y) < 50)
			) {
				// condition: if parallel in y direction srcpt & trgtpt must have same x location and vice versa...
				// simply use the ports as only points...
				workCoordinates = this._workCoordinates(0, edge, auto);
			} else {
				this._getMinDistance(srcpt, srcdir, MIN_PORT_SEG_LENGTH, sMin);
				this._getMinDistance(trgtpt, trgtdir, MIN_PORT_SEG_LENGTH, tMin);
				sMinVal = this._getValueInDirection(sMin, srcdir);
				// note: tMinVal must use srcdir, otherwise we might have wrong value sign...
				tMinVal = this._getValueInDirection(tMin, srcdir);
				if (sMinVal > tMinVal) {
					// overlap
					workCoordinates = this._workCoordinates(4, edge, auto);
					delta.setTo(trgtpt).subtract(srcpt);
					// swap and divide in half:
					delta.x *= Math.abs(srcdir.y) / 2;
					delta.y *= Math.abs(srcdir.x) / 2;
					workCoordinates[0].setToPoint(sMin);
					workCoordinates[1].setToPoint(delta.add(sMin));
					this.biasPoint(delta, tMin, srcdir);
					workCoordinates[2].setToPoint(delta);
					workCoordinates[3].setToPoint(tMin);
				} else {
					workCoordinates = this._workCoordinates(2, edge, auto);
					const length = (tMinVal - sMinVal) / 2 + MIN_PORT_SEG_LENGTH;
					this._breakAt(workCoordinates, 0, srcpt, 1, trgtpt, srcdir, length);
				}
			}
		} else {
			const intersection = JSG.ptCache.get(0, 0);
			const srcCopy = JSG.ptCache.get().setTo(srcpt);
			const trgtCopy = JSG.ptCache.get().setTo(trgtpt);
			MathUtils.getIntersectionOfLines(
				srcpt,
				srcCopy.add(srcdir),
				trgtpt,
				trgtCopy.add(trgtdir),
				intersection,
				true
			);
			this.biasPoint(intersection, trgtpt, srcdir);
			// if intersection point is in direction of srcdir and trgtdir?
			const pointsInSrcDirection =
				this._pointsInDirection(srcpt, intersection, srcdir) && !intersection.isEqualTo(srcpt, 0.0001);
			const pointsInTrgtDirection =
				this._pointsInDirection(trgtpt, intersection, trgtdir) && !intersection.isEqualTo(trgtpt, 0.0001);
			if (pointsInSrcDirection && pointsInTrgtDirection) {
				workCoordinates = this._workCoordinates(1, edge, auto);
				workCoordinates[0].setToPoint(intersection);
			} else if (!pointsInSrcDirection && !pointsInTrgtDirection) {
				workCoordinates = this._workCoordinates(3, edge, auto);
				this._getMinDistance(srcpt, srcdir, MIN_PORT_SEG_LENGTH, sMin);
				this._getMinDistance(trgtpt, trgtdir, MIN_PORT_SEG_LENGTH, tMin);
				sMinVal = this._getValueInDirection(sMin, srcdir);
				// tMinVal = this._getValueInDirection(tMin, trgtdir);
				workCoordinates[0].setToPoint(sMin);
				this.biasPoint(sMin, tMin, srcdir.swap());
				workCoordinates[1].setToPoint(sMin);
				workCoordinates[2].setToPoint(tMin);
			} else if (pointsInSrcDirection && !pointsInTrgtDirection) {
				workCoordinates = this._workCoordinates(3, edge, auto);
				this._getMinDistance(srcpt, srcdir, MIN_PORT_SEG_LENGTH, sMin);
				this._getMinDistance(trgtpt, trgtdir, MIN_PORT_SEG_LENGTH, tMin);
				delta
					.setTo(tMin)
					.subtract(sMin)
					.multiply(0.5)
					.add(sMin);
				this.biasPoint(sMin, delta, srcdir);
				workCoordinates[0].setToPoint(sMin);
				this.biasPoint(sMin, tMin, srcdir.swap());
				workCoordinates[1].setToPoint(sMin);
				workCoordinates[2].setToPoint(tMin);
			} else if (!pointsInSrcDirection && pointsInTrgtDirection) {
				workCoordinates = this._workCoordinates(3, edge, auto);
				this._getMinDistance(srcpt, srcdir, MIN_PORT_SEG_LENGTH, sMin);
				this._getMinDistance(trgtpt, trgtdir, MIN_PORT_SEG_LENGTH, tMin);
				delta
					.setTo(sMin)
					.subtract(tMin)
					.multiply(0.5)
					.add(tMin);
				this.biasPoint(tMin, delta, trgtdir);
				workCoordinates[2].setToPoint(tMin);
				this.biasPoint(tMin, sMin, trgtdir.swap());
				workCoordinates[1].setToPoint(tMin);
				workCoordinates[0].setToPoint(sMin);
			} else {
				workCoordinates = this._workCoordinates(4, edge, auto);
				this._getMinDistance(srcpt, srcdir, MIN_PORT_SEG_LENGTH, sMin);
				this._getMinDistance(trgtpt, trgtdir, MIN_PORT_SEG_LENGTH, tMin);
				// sMinVal = this._getValueInDirection(sMin, srcdir);
				// note: tMinVal must use srcdir, otherwise we might have wrong value sign...
				// tMinVal = this._getValueInDirection(tMin, srcdir);
				delta.setTo(trgtpt).subtract(srcpt);
				// swap and divide in half:
				delta.x *= Math.abs(srcdir.y) / 2;
				delta.y *= Math.abs(srcdir.x) / 2;
				workCoordinates[0].setToPoint(sMin);
				workCoordinates[1].setToPoint(delta.add(sMin));
				this.biasPoint(delta, tMin, srcdir.swap());
				workCoordinates[2].setToPoint(delta);
				workCoordinates[3].setToPoint(tMin);
			}
			JSG.ptCache.release(intersection, srcCopy, trgtCopy);
		}
		JSG.ptCache.release(delta, sMin, tMin);
		return workCoordinates;
	}

	/**
	 * @method _workCoordinates
	 * @private
	 */
	_workCoordinates(count, edge, auto) {
		let i;
		let n;
		const coords = [];

		if (auto) {
			const coordinates = edge.getShape()._coordinates;
			this._requires(count + 2, coordinates);
			for (i = 1, n = count + 1; i < n; i += 1) {
				coords.push(coordinates[i]);
			}
		} else {
			for (i = 0; i < count; i += 1) {
				coords.push(new Coordinate());
			}
		}
		return coords;
	}

	/**
	 * Ensures that the given array of coordinates has the specified length.
	 *
	 * @method _requires
	 * @param {Number} nr The number of coordinates to keep or add to given coordinates array.
	 * @param {Array} coordinates The coordinates array to work on.
	 * @private
	 */
	_requires(nr, coordinates) {
		let i;
		if (coordinates.length < nr) {
			// insert coordinates until nr is reached
			for (i = coordinates.length; i < nr; i += 1) {
				Arrays.insertAt(coordinates, 1, Coordinate.fromXY(0, 0));
			}
		} else if (coordinates.length > nr) {
			// remove coordinates until nr is reached
			for (i = coordinates.length; i > nr; i -= 1) {
				Arrays.removeAt(coordinates, 1); // note: we preserve first coordinate, it might be attached...
			}
		}
	}

	/**
	 * @method _getValueInDirection
	 * @private
	 */
	_getValueInDirection(p0, direction) {
		return p0.x * direction.x + p0.y * direction.y;
	}

	/**
	 * @method _pointsInDirection
	 * @private
	 */
	_pointsInDirection(p0, p1, direction) {
		const pt = JSG.ptCache
			.get()
			.setTo(p1)
			.subtract(p0);
		const inDir = Numbers.haveSameSign(pt.x, direction.x) && Numbers.haveSameSign(pt.y, direction.y);
		JSG.ptCache.release(pt);
		return inDir;
	}

	/**
	 * @method _breakAt
	 * @private
	 */
	_breakAt(coordinates, idx1, p1, idx2, p2, direction, length) {
		const breaking = JSG.ptCache
			.get()
			.setTo(direction)
			.setLength(length)
			.add(p1);
		coordinates[idx1].setToPoint(breaking);
		this.biasPoint(breaking, p2, direction.swap());
		coordinates[idx2].setToPoint(breaking);
		JSG.ptCache.release(breaking);
	}

	/**
	 * @method _getMinDistance
	 * @private
	 */
	_getMinDistance(pt, direction, minPortDist, reusepoint) {
		const minlength = direction.fromPort ? minPortDist : 1;
		reusepoint.setTo(direction).setLength(minlength);
		return reusepoint.add(pt);
	}

	/**
	 * The unique layout type.
	 *
	 * @property TYPE
	 * @type {String}
	 * @static
	 */
	static get TYPE() {
		return TYPE;
	}

	/**
	 * Predefined constant to reference behavior setting.<br/>
	 * Corresponding setting value should be one of the predefined values in {{#crossLink
	 * "ItemAttributes.LineBehavior"}}{{/crossLink}}.<br/>
	 *
	 * @property BEHAVIOR
	 * @type {String}
	 * @static
	 */
	static get BEHAVIOR() {
		return BEHAVIOR;
	}
	/**
	 * Constant to reference the minimum port segment setting. This setting defines the minimum length of the line
	 * segment which is connected to a port.
	 * @property MINPORTSEG
	 * @type {String}
	 * @static
	 * @since 2.0.7
	 */
	static get MINPORTSEG() {
		return MINPORTSEG;
	}
	/**
	 * A general settings object which defines the default layout preferences.
	 *
	 * @property Settings
	 * @type {Settings}
	 * @static
	 */
	static get Settings() {
		return settings;
	}
}

module.exports = OrthogonalLayout;
