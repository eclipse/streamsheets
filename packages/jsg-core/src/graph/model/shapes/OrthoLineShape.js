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
const LineShape = require('./LineShape');
const Numbers = require('../../../commons/Numbers');
const Coordinate = require('../../Coordinate');
const ItemAttributes = require('../../attr/ItemAttributes');
const ShapeEvent = require('../events/ShapeEvent');
const OrthogonalLayout = require('../../../layout/OrthogonalLayout');

/**
 * This shape is used to define orthogonal lines, i.e. this shape tries to keep its inner
 * {{#crossLink "Coordinate"}}{{/crossLink}}s orthogonal to each other. This is fully
 * done internally and no explicit call to (e.g.) {{#crossLink
 * "OrthoLineShape/autolayout:method"}}{{/crossLink}} is required. </br>
 *
 * @example
 *     //create an orthogonal edge with an orthogonal layout:
 *     var edge = new JSG.grap.model.Edge(new OrthoLineShape());
 *     //set auto layout:
 *     var layout = edge.getLayout();
 *     layout.getSettings(edge).set(OrthogonalLayout.BEHAVIOR,
 *     ItemAttributes.LineBehavior.AUTO);
 *
 * See {{#crossLink "OrthogonalLayout"}}{{/crossLink}} </br>
 * and {{#crossLink "ItemAttributes.LineBehavior"}}{{/crossLink}} for information about how to influence the
 *     layout.
 *
 * @class OrthoLineShape
 * @constructor
 * @extends LineShape
 */
class OrthoLineShape extends LineShape {
	constructor() {
		super();
		// we push two additional coordinates: --> ALL inner coordinates are the "corners"!!
		this._coordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0)));
		this._coordinates.push(new Coordinate(this._newExpression(0), this._newExpression(0)));
	}

	getType() {
		return OrthoLineShape.TYPE;
	}

	newInstance() {
		return new OrthoLineShape();
	}

	setItem(item) {
		super.setItem(item);
		// check that we have ortho line layout settings...
		if (this._item) {
			// we set OrthogonalLayout if not already set...
			const layout = this._item.getLayout();
			if (!layout || layout.getType() !== OrthogonalLayout.TYPE) {
				this._item.setLayout(OrthogonalLayout.TYPE);
			}
		}
	}

	_getLayout() {
		return this._item ? this._item.getLayout() : undefined;
	}

	/**
	 * Partly layouts line shape from given port. Useful when attaching lines with a manual layout behavior.</br>
	 * Partly means that at most 5 coordinates starting from given port (inclusively) will be arranged.
	 *
	 * @method layoutFrom
	 * @param {Port} port The port to start layout at.
	 * @deprecated Use same method from <code>Layout</code> instance of type <code>OrthogonalLayout.TYPE</code>!
	 */
	layoutFrom(port) {
		// this._layouter.layoutFrom(port);
	}

	setCoordinateAtToPoint(index, point) {
		if (index >= 0 && index < this._coordinates.length) {
			const event = this._shapeWillChange(ShapeEvent.COORDS_REPLACE_AT, index, point.x, point.y);
			if (event.doIt === true) {
				this._setCoordinateAtToPoint(index, point);
				this.refresh();
				this._shapeDidChange(event);
			}
		}
	}

	/**
	 * Does the actual placement of the coordinate at specified index.</br>
	 * This method also tries to preserve the orthogonality of this shape by adjusting the neighbor
	 * coordinates too. I.e. the new location in a certain direction can only be set if the corresponding
	 * neighbor coordinate can be moved too.</br>
	 *
	 * @method _setCoordinateAtToPoint
	 * @param {Number} index The index of the coordinate to change.
	 * @param {Point} point The point which specifies the new coordinate location.
	 * @private
	 */
	_setCoordinateAtToPoint(index, point) {
		const coordinates = this._coordinates;
		const last = coordinates.length - 1;
		const item = this._item;
		const layout = this._getLayout();
		// var behavior = this._item.getLayoutAttributes().getLineBehavior().getValue();
		const orthodir = layout.getStartDirection(item, JSG.ptCache.get());
		// orthodir = this._getOrthogonalStartDirection(coordinates, orthodir);

		const orthodirswapped = JSG.ptCache
			.get()
			.setTo(orthodir)
			.swap();

		// neighbors:
		const next = index + 1;
		const previous = index - 1;

		const preserveMinDistanceFromLocation = (location, toLocation, direction) => {
			const behavior = layout
				? layout.getSettings(item).get(OrthogonalLayout.BEHAVIOR)
				: undefined;
			if (behavior === ItemAttributes.LineBehavior.MANUAL) {
				const MIN_PORT_SEG_LENGTH = layout
					.getSettings(item)
					.get(OrthogonalLayout.MINPORTSEG, 500);
				const pivot = JSG.ptCache
					.get()
					.setTo(toLocation)
					.subtract(location);
				const orthostart = JSG.ptCache
					.get()
					.setTo(location)
					.add(direction);
				if (direction.x !== 0) {
					// check minimum, otherwise set point.x
					if (
						!Numbers.haveSameSign(direction.x, pivot.x) ||
						orthostart.set(pivot.x, orthostart.y).length() < MIN_PORT_SEG_LENGTH
					) {
						// adjust given point
						toLocation.x = location.x + direction.x * MIN_PORT_SEG_LENGTH;
					}
				} else if (
					!Numbers.haveSameSign(direction.y, pivot.y) ||
					orthostart.set(orthostart.x, pivot.y).length() < MIN_PORT_SEG_LENGTH
				) {
					// check minimum, otherwise set point.y
					// adjust given point
					toLocation.y = location.y + direction.y * MIN_PORT_SEG_LENGTH;
				}
				JSG.ptCache.release(pivot, orthostart);
			}
			return toLocation;
		};

		const checkNext = (idx) => {
			if (idx <= last) {
				const litem = this._item;
				const port = litem.getTargetPort();
				const otdir = JSG.ptCache.get(0, 0);
				if (port !== undefined && layout) {
					// this._layouter.getOrthoDirectionFromPort(port, last, 0, behavior, otdir);
					layout.getOrthoDirectionFromPort(litem, port, last, 0, otdir);
				} else {
					otdir.setTo(orthodir);
				}
				const otswapped = JSG.ptCache
					.get()
					.setTo(otdir)
					.swap();
				const ptNext = JSG.ptCache.get();
				if (idx === last && litem.hasTargetAttached() && layout) {
					coordinates[idx].toPoint(ptNext);
					// first: prevent from being altered in orthogonal direction
					layout.biasPoint(point, ptNext, otswapped);
					// second: preserve minimum distance to port
					preserveMinDistanceFromLocation(point, ptNext, otdir);
					// preserveMinDistanceFromLocation(ptNext, point, otdir);
				} else if (idx === last - 1 && litem.hasTargetAttached()) {
					// we can only move up to minimum!!
					preserveMinDistanceFromLocation(point, coordinates[idx + 1].toPoint(ptNext), otdir);
					// preserveMinDistanceFromLocation(coordinates[idx + 1].toPoint(ptNext), point, otdir);
				}
				JSG.ptCache.release(otdir, otswapped, ptNext);
			}
		};

		const checkPrevious = (idx) => {
			if (idx >= 0) {
				const prev = JSG.ptCache.get();
				if (idx === 0 && this._item.hasSourceAttached() && layout) {
					coordinates[idx].toPoint(prev);
					// first: prevent from being altered in orthogonal direction
					layout.biasPoint(point, prev, orthodirswapped);
					// second: preserve minimum distance to port
					preserveMinDistanceFromLocation(prev, point, orthodir);
				} else if (idx === 1 && this._item.hasSourceAttached()) {
					// we can only move up to minimum!!
					preserveMinDistanceFromLocation(coordinates[idx - 1].toPoint(prev), point, orthodir);
				}
				JSG.ptCache.release(prev);
			}
		};

		const placeCoordinateAt = (idx) => {
			if (idx < 0 || idx > last) {
				return;
			}
			const lpoint = coordinates[idx].toPoint(JSG.ptCache.get());
			const odir = JSG.ptCache.get().setTo(orthodir);
			const tmppt = JSG.ptCache.get();
			const prvpt = idx - 1;
			const nxtpt = idx + 1;
			if (Numbers.isEven(idx)) {
				odir.swap();
			}
			if (nxtpt <= last && layout) {
				// next first since previous swaps odir...
				layout.biasPoint(lpoint, coordinates[nxtpt].toPoint(tmppt), odir);
			}
			if (prvpt >= 0 && layout) {
				layout.biasPoint(lpoint, coordinates[prvpt].toPoint(tmppt), odir.swap());
			}
			// finally set biased lpoint:
			coordinates[idx].setToPoint(lpoint);
			JSG.ptCache.release(lpoint, odir, tmppt);
		};

		checkNext(next);
		checkPrevious(previous);
		coordinates[index].setToPoint(point);
		placeCoordinateAt(previous);
		placeCoordinateAt(next);
		JSG.ptCache.release(orthodir, orthodirswapped);
	}

	/**
	 * Tries to determine the orthogonal start direction, i.e. the direction to go from start coordinate.
	 *
	 * @method _getOrthogonalStartDirection
	 * @param {Array} coordinates The coordinates this line shape is made of.
	 * @param {Point} reusepoint A Point instance to reuse. This instance will contain the determined
	 *     direction vector.
	 * @return {Point} The direction vector. Same instance as given reusepoint.
	 * @private
	 */
	_getOrthogonalStartDirection(coordinates, reusepoint) {
		const last = coordinates.length - 1;
		// var layouter = this._layouter;
		// var behavior = this._item.getLayoutAttributes().getLineBehavior().getValue();
		const p0 = JSG.ptCache.get();
		const p1 = JSG.ptCache.get();
		const item = this._item;
		const layout = this._getLayout();

		function setDirectionByStartEndLine(self) {
			if (layout) {
				layout.getOrthoDirectionFromLine(
					self._item,
					coordinates[0].toPoint(p0),
					coordinates[last].toPoint(p1),
					reusepoint
				);
			}
		}

		function setDirectionByFirstLineSegment(self) {
			const line = JSG.ptCache.get();
			let i;
			// take first line which has a length:
			for (i = 0; i < coordinates.length - 1; i += 1) {
				coordinates[i].toPoint(p0);
				coordinates[i + 1].toPoint(p1);
				if (
					layout &&
					line
						.setTo(p1)
						.subtract(p0)
						.lengthSquared() > 0
				) {
					layout.getOrthoDirectionFromLine(self._item, p0, p1, reusepoint);
					if (!Numbers.isEven(i)) {
						reusepoint.swap();
					}
					break;
				}
			}
			JSG.ptCache.release(line);
			return reusepoint;
		}

		function setSign() {
			const line = coordinates[1].toPoint(p1).subtract(coordinates[0].toPoint(p0));
			if (line.x < 0) {
				reusepoint.x = -reusepoint.x;
			}
			if (line.y < 0) {
				reusepoint.y = -reusepoint.y;
			}
		}

		// first check if source is attached
		const srcport = item.getSourcePort();
		if (srcport !== undefined && layout) {
			layout.getOrthoDirectionFromPort(item, srcport, 0, last, reusepoint);
		} else {
			// check layout setting:
			const BEHAVIOR = ItemAttributes.LineBehavior;
			const behavior = layout
				? layout.getSettings(item).get(OrthogonalLayout.BEHAVIOR)
				: undefined;
			switch (behavior) {
				case BEHAVIOR.AUTO:
					setDirectionByStartEndLine(this);
					break;
				case BEHAVIOR.MANUAL:
					setDirectionByFirstLineSegment(this);
					break;
				case BEHAVIOR.HORIZONTAL:
					reusepoint.set(1, 0);
					setSign();
					break;
				case BEHAVIOR.VERTICAL:
					reusepoint.set(0, 1);
					setSign();
					break;
				default:
					break;
			}
		}
		JSG.ptCache.release(p0, p1);

		return reusepoint;
	}

	/**
	 * Type string for an orthogonal line shape.
	 *
	 * @property TYPE
	 * @type String
	 * @static
	 */
	static get TYPE() {
		return 'ortholine';
	}
}

module.exports = OrthoLineShape;
