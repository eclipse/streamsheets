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
	Coordinate,
	Edge,
	Arrays,
	BezierLineShape,
	BezierShape,
	Shape
} from '@cedalo/jsg-core';
import CreateEdgeInteraction from './CreateEdgeInteraction';
import BezierEdgeHelper from './BezierEdgeHelper';
import EditBezierShapeInteraction from './EditBezierShapeInteraction';
import ConnectionController from '../controller/ConnectionController';
import PortController from '../controller/PortController';
import Cursor from '../../ui/Cursor';

/**
 * An interaction to create an {{#crossLink "Edge"}}{{/crossLink}} with a
 * {{#crossLink "BezierLineShape"}}{{/crossLink}}.
 *
 * @class CreateBezierEdgeInteraction
 * @extends CreateEdgeInteraction
 * @constructor
 * @param {Edge} graphItem An <code>Edge</code> item with a <code>BezierLineShape</code>.
 * @since 1.6.15
 */
class CreateBezierEdgeInteraction extends CreateEdgeInteraction {
	constructor(graphItem) {
		graphItem = graphItem || new Edge(new BezierLineShape());
		super(graphItem);
		this.lineshape = graphItem.getShape();
		this.bezierhelper = new BezierEdgeHelper(graphItem);
		// remove all coordinates, since we add them point by point...
		Arrays.removeAll(this.lineshape._coordinates);
	}

	deactivate(viewer) {
		this.lineshape = undefined;
		super.deactivate(viewer);
	}

	onMouseDown(event, viewer) {
		const self = this;
		const last = this.lineshape.getCoordinatesCount() - 1;

		if (JSG.touchDevice) {
			this.highlightPortsUnderMouse(event, viewer);
		}

		// first mouse down => init
		if (last < 0) {
			this._initShape(this.lineshape, viewer, event);
		} else if (this.hitTargetPort()) {
			this._attachTargetPort();
			this.finishInteraction(event, viewer);
		} else if (this._graphItem.isVisible()) {
			// stop creation if we are not visible:
			// set last coordinate to given point:
			const currloc = this._alignedLocation(this.currentLocation.copy(), viewer, event);
			const location = this._graphItem.translateFromParent(currloc);
			this.lineshape.setCoordinateAtToPoint(last, location);
			// and add a new coordinate:
			this.lineshape.addCoordinate(Coordinate.fromPoint(location));
		} else {
			this.finishInteraction(event, viewer);
		}
	}

	/**
	 * Initializes the <code>BezierLineShape</code> of the {{#crossLink "Edge"}}{{/crossLink}} which is
	 * used for creation.
	 *
	 * @method _initEdge
	 * @param {BezierLineShape} lineshape The shape to initialize.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {ClientEvent} event The current event.
	 * @private
	 */
	_initShape(lineshape, viewer, event) {
		const setParent = () => {
			if (!this._parent) {
				const location = event.location.copy();
				this._parent = viewer.findControllerAt(location, Shape.FindFlags.AUTOMATIC);
				if (this._parent instanceof ConnectionController || this._parent instanceof PortController) {
					this._parent = this._parent.getParent();
				}
			}
		};

		lineshape.addCoordinate(Coordinate.fromXY(0, 0));
		lineshape.addCoordinate(Coordinate.fromXY(0, 0));
		setParent();
		this._setFeedback(event, viewer);
		this._attachSourcePort();
	}

	hitTargetPort() {
		if (this._portFeedback) {
			// target port is not source port...
			if (this._graphItem.getSourcePort()) {
				const trgtportpoint = this._portFeedback.getPosition();
				const srcportpoint = this._graphItem.getSourcePort().getConnectionPoint();
				return !trgtportpoint.isEqualTo(srcportpoint, 1);
			}
			return true;
		}
		return false;
	}

	_setControlPointAtPort(portLocation, node, isEnd) {
		const ctrlpt = this.bezierhelper.getControlPointAtPort(portLocation, node, isEnd, JSG.ptCache.get());
		const cpcoord = isEnd ? this._graphItem.getEndCoordinate().cpFrom : this._graphItem.getStartCoordinate().cpTo;
		cpcoord.setToPoint(ctrlpt);
		JSG.ptCache.release(ctrlpt);
	}

	// overwritten to adjust control point...
	_attachSourcePort() {
		super._attachSourcePort();
		if (this._sourcePortInfo) {
			const portLocation = this._getPortLocation(this._sourcePortInfo, JSG.ptCache.get());
			this._setControlPointAtPort(portLocation, this._sourcePortInfo.node, false);
			JSG.ptCache.release(portLocation);
		}
	}

	// overwritten to adjust control point on possible target attach...
	setPortFeedback(viewer, event) {
		super.setPortFeedback(viewer, event);
		if (this._portFeedback && this.lineshape.hasCoordinates() > 0) {
			// adjust target port...
			this._setControlPointAtPort(this._portFeedback._point, this._portFeedback._model, true);
		}
	}

	onMouseDrag(event, viewer) {
		this._updateFeedback(event, viewer);
	}

	onMouseMove(event, viewer) {
		this._updateFeedback(event, viewer);
		this.setCursor(Cursor.Style.CROSS);
		event.isConsumed = true;
	}

	_updateFeedback(event, viewer) {
		this.setPortFeedback(viewer, event);
		this.updateFeedback(event, viewer);
		// preserve start coordinate if attached...
		const cpStart = this._sourcePortInfo ? this._graphItem.getStartCoordinate().cpTo.copy() : undefined;
		BezierShape.initControlPoints(this.lineshape.getCoordinates());

		if (cpStart) {
			this._graphItem.getStartCoordinate().cpTo.setTo(cpStart);
		}
	}

	onMouseUp(event, viewer) {
		// ignore since we finish on double click...
	}

	onMouseDoubleClick(event, viewer) {
		this.finishInteraction(event, viewer);
	}

	willFinish(event, viewer, offset) {
		const removeLastCoordinates = (lineshape) => {
			const coords = lineshape.getCoordinates();
			let last = coords.length - 1;
			const count = last;
			const p1 = JSG.ptCache.get();
			const p2 = JSG.ptCache.get();
			while (last > 1) {
				coords[last].toPoint(p1).subtract(coords[last - 1].toPoint(p2));
				if (p1.length() < 200) {
					lineshape.removeCoordinateAt(last);
					last -= 1;
				} else {
					break;
				}
			}
			JSG.ptCache.release(p1, p2);
			return last !== count;
		};

		removeLastCoordinates(this.lineshape);
		this.setPortFeedback(viewer, event);
		super.willFinish(event, viewer, offset);
	}

	hasExtend(minExtend) {
		const ptlist = this.lineshape.getPointList();
		const bounds = ptlist.getBoundingRect(JSG.rectCache.get());

		minExtend = minExtend || (JSG.touchDevice ? 1000 : 500);
		const hasExtend = bounds.width > minExtend || bounds.height > minExtend;
		JSG.rectCache.release(bounds);

		return hasExtend;
	}

	// overwritten to active edit interaction after creation...
	didFinish(event, viewer) {
		super.didFinish(event, viewer);
		const interactionHandler = this.getInteractionHandler();
		interactionHandler.setActiveInteraction(new EditBezierShapeInteraction());
	}
}

export default CreateBezierEdgeInteraction;
