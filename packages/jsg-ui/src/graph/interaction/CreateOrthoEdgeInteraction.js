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
	OrthogonalLayout,
	Edge,
	Arrays,
	Coordinate,
	ItemAttributes,
	Point,
	Shape,
	OrthoLineShape,
	PortCoordinateProxy
} from '@cedalo/jsg-core';
import CreateEdgeInteraction from './CreateEdgeInteraction';
import ConnectionController from '../controller/ConnectionController';
import PortController from '../controller/PortController';
import MouseEvent from '../../ui/events/MouseEvent';
import Cursor from '../../ui/Cursor';

/**
 * An interaction to create an {{#crossLink "Edge"}}{{/crossLink}} with an
 * {{#crossLink "OrthoLineShape"}}{{/crossLink}}. To specify the creation
 * behavior, namely automatic or manual layout, use one of the predefined
 * {{#crossLink "CreateOrthoEdgeInteraction.CREATION_MODE"}}{{/crossLink}} constants.
 *
 * @class CreateOrthoEdgeInteraction
 * @extends CreateEdgeInteraction
 * @param {Edge} [graphItem] An edge to use for creation. If not given a new Edge with an
 *     OrthoLineShape will be created.
 * @param {CreateOrthoEdgeInteraction.CREATION_MODE} [creationMode] The creation mode to use. If
 *     not given the <code>CLICK</code> mode is used for creation.
 * @param {String} [label] An optional default label for the new edge.
 * @constructor
 */
class CreateOrthoEdgeInteraction extends CreateEdgeInteraction {
	constructor(graphItem, creationMode, label) {
		if (!graphItem) {
			graphItem = new Edge(new OrthoLineShape());
		}
		super(graphItem, label);

		this._ortholine = this._graphItem._shape;
		this._graphItem.setLayout(OrthogonalLayout.TYPE);
		// remove all coordinates, since we add them point by point...
		Arrays.removeAll(this._ortholine._coordinates);
		this._creationmode = undefined;
		this.useCreationMode(creationMode || CreateOrthoEdgeInteraction.CREATION_MODE.CLICK);
		this._minDistanceToPort = this._graphItem.getLayoutSettings().get(OrthogonalLayout.MINPORTSEG, 500);
	}

	deactivate(viewer) {
		this._ortholine = undefined;
		this._creationmode = undefined;
		super.deactivate(viewer);
	}

	/**
	 * Sets the mode to use during creation of orthogonal line. <br/>
	 * <b>Note:</b> should be set before any event is passed to this interaction! Use one of the
	 * predefined creation modes.
	 *
	 * @method useCreationMode
	 * @param {CreateOrthoEdgeInteraction.CREATION_MODE} mode One of predefined modes.
	 */
	useCreationMode(mode) {
		this._creationmode = mode;
		// TODO we have horizontal & vertical too!!
		const BEHAVIOR = ItemAttributes.LineBehavior;
		const behavior =
			mode === CreateOrthoEdgeInteraction.CREATION_MODE.CLICK
				? BEHAVIOR.MANUAL
				: BEHAVIOR.AUTO;
		this._graphItem.getLayoutSettings().set(OrthogonalLayout.BEHAVIOR, behavior);
	}

	/**
	 * Returns <code>true</code> if current creation mode is <code>CREATION_MODE.DRAG</code>, <code>false</code>
	 * otherwise.
	 *
	 * @method _useDragCreationMode
	 * @return {Boolean} <code>true</code> if current creation mode is <code>CREATION_MODE.DRAG</code>,
	 *     <code>false</code> otherwise.
	 * @private
	 */
	_useDragCreationMode() {
		return this._creationmode === CreateOrthoEdgeInteraction.CREATION_MODE.DRAG;
	}

	onMouseDown(event, viewer) {
		const last = this._ortholine.getCoordinatesCount() - 1;

		if (JSG.touchDevice) {
			this.highlightPortsUnderMouse(event, viewer);
		}

		// first mouse down => init
		if (last < 0) {
			this.initEdge(this._ortholine, viewer, event);
		} else if (this.hitTargetPort()) {
			this.finishInteraction(event, viewer);
		} else if (this._graphItem.isVisible()) {
			// stop creation if we are not visible:
			// set last coordinate to given point:
			const currloc = this._alignedLocation(this.currentLocation.copy(), viewer, event);
			const location = this._graphItem.translateFromParent(currloc);
			this._ortholine.setCoordinateAtToPoint(last, location);
			// and add a new coordinate:
			this.useCreationMode(CreateOrthoEdgeInteraction.CREATION_MODE.CLICK);
			this._ortholine.addCoordinate(Coordinate.fromPoint(location));
		}
	}

	/**
	 * Initializes the {{#crossLink "Edge"}}{{/crossLink}} used for creation.<br/>
	 * Subclasses might overwrite this method but should call it to perform proper initialization.
	 *
	 * @method initEdge
	 * @param {OrthoLineShape} ortholine The shape to initialize.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {ClientEvent} event The current event.
	 */
	initEdge(ortholine, viewer, event) {
		const setParent = () => {
			if (!this._parent) {
				const location = event.location.copy();
				this._parent = viewer.findControllerAt(location, Shape.FindFlags.AUTOMATIC);
				if (this._parent instanceof ConnectionController || this._parent instanceof PortController) {
					this._parent = this._parent.getParent();
				}
			}
		};

		// add 3 coordinates...
		const initpos = JSG.ptCache.get().set(0, 0);
		if (this._graphItem.hasSourceAttached()) {
			// we set coordinates to source port point...
			this._graphItem.getSourcePort().getConnectionPoint(viewer.getGraph(), initpos);
			this._graphItem.translateFromParent(initpos);
		}
		ortholine.addCoordinate(Coordinate.fromPoint(initpos));
		ortholine.addCoordinate(Coordinate.fromPoint(initpos));
		ortholine.addCoordinate(Coordinate.fromPoint(initpos));
		if (this._useDragCreationMode()) {
			// and another one for drag mode...
			ortholine.addCoordinate(Coordinate.fromXY(0, 0));
			this.useCreationMode(CreateOrthoEdgeInteraction.CREATION_MODE.DRAG);
		}
		setParent();
		this._setFeedback(event, viewer);
		this._attachSourcePort();
		const visible = this._useDragCreationMode();
		this._graphItem.setItemAttribute(ItemAttributes.VISIBLE, visible);
		JSG.ptCache.release(initpos);
	}

	/**
	 * Checks if current <code>_portFeedback</code> hits a possible target port.
	 *
	 * @method hitTargetPort
	 * @return {Boolean} <code>true</code> if a possible target port is hit, <code>false</code> otherwise.
	 */
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

	onMouseDrag(event, viewer) {
		if (!this._useDragCreationMode() && this._graphItem.getPointsCount() === 3) {
			// change mode if drag exceeds threshold, otherwise it might not be wanted by user...
			const coordinates = this._ortholine.getCoordinates();
			const startpoint = coordinates[0].toPoint();
			const endpoint = coordinates[coordinates.length - 1].toPoint();
			if (endpoint.subtract(startpoint).length() > 200) {
				// change mode:
				this._ortholine.addCoordinate(Coordinate.fromXY(0, 0));
				this.useCreationMode(CreateOrthoEdgeInteraction.CREATION_MODE.DRAG);
			}
		}

		this.setPortFeedback(viewer, event);
		this._updateFeedback(viewer, event);
	}

	onMouseMove(event, viewer) {
		this.setPortFeedback(viewer, event);
		this._updateFeedback(viewer, event);
		this.setCursor(Cursor.Style.CROSS);
		event.isConsumed = true;
	}

	setPortFeedback(viewer, event) {
		function getCoordinate(coord) {
			return coord.getCoordinate ? coord.getCoordinate() : coord;
		}

		function attachTargetPort(portfeedback, self) {
			const edge = self._graphItem;
			const port = self.createPortFromFeedback(portfeedback);
			const lineshape = edge.getShape();
			const oldstate = lineshape.disableRefresh();
			edge.pointsCount = edge.getPointsCount();
			edge.setTargetPort(port);
			// TODO check if we have a layout set and if it is of type orthogonal!!
			edge.getLayout().layoutFrom(edge, port);
			if (oldstate) {
				lineshape.enableRefresh();
			}
		}

		function detachTargetPort(self) {
			const edge = self._graphItem;
			const lineshape = edge.getShape();
			edge.detachPort(edge.getTargetPort());
			// remove coordinates added by attach...
			if (edge.pointsCount > 0) {
				const diff = edge.getPointsCount() - edge.pointsCount;
				if (diff > 0) {
					const index = edge.pointsCount;
					lineshape.removeCoordinatesAt(index, diff);
				}
				edge.pointsCount = 0;
			}
		}

		super.setPortFeedback(viewer, event);

		const doAttachDetach = this._graphItem.getPointsCount() > 1;
		if (doAttachDetach) {
			if (this._graphItem.hasTargetAttached()) {
				detachTargetPort(this);
			}
			if (this.hitTargetPort()) {
				if (!this._graphItem.hasTargetAttached()) {
					attachTargetPort(this._portFeedback, this);
				}
			}
		}
	}

	_getCoordAt(index, reusepoint) {
		const coord = this._ortholine._coordinates[index];
		return coord instanceof PortCoordinateProxy ? coord.getPortPoint(reusepoint) : coord.toPoint(reusepoint);
	}

	_clearPreferredDir(coord) {
		if (coord instanceof PortCoordinateProxy) {
			coord._prefdir = undefined;
		}
	}

	_updateFeedback(viewer, event) {
		const coordinates = this._ortholine._coordinates;
		const currloc = this._alignedLocation(this.currentLocation.copy(), viewer, event);
		const last = coordinates.length - 1; // this._ortholine.getCoordinatesCount() - 1;
		const lastpt = this._graphItem.translateFromParent(currloc);

		// if we are in click mode and first segment is not fixed yet, adjust it here...
		if (last === 2 && !this._useDragCreationMode()) {
			const orthodir = JSG.ptCache.get(0, 0); // undefined;
			const startpt = this._getCoordAt(0); // coordinates[0].toPoint();
			const layout = this._graphItem.getLayout();
			if (layout) {
				this._clearPreferredDir(coordinates[0]);
				layout.getOrthoDirectionFromLine(this._graphItem, startpt, lastpt.copy(), orthodir);
				// if(this._graphItem.hasSourceAttached()) {
				// 	layout.getOrthoDirectionFromPort(this._graphItem, this._graphItem.getSourcePort(), 0, last,
				// orthodir); } else { //this._ortholine.getOrthoDirectionFromLine(startpt, lastpt.copy(), orthodir);
				// layout.getOrthoDirectionFromLine(this._graphItem, startpt, lastpt.copy(), orthodir); }
			}
			orthodir.setLength(this._minDistanceToPort);
			orthodir.add(startpt);
			coordinates[1].setToPoint(orthodir); // set coordinate directly, so that others are not affected
			JSG.ptCache.release(orthodir);
		}
		// update last coordinate to current location only if it is not attached!! or otherwise port connection
		// location is different...
		this._ortholine.setCoordinateAtToPoint(last, lastpt);

		// update visibility:
		const visible = this._useDragCreationMode() || this.hasExtend();
		this._graphItem.setItemAttribute(ItemAttributes.VISIBLE, visible);

		// TODO (ah) TESTING PURPOSE: -review-
		this._graphItem.layout();
		this._graphItem.refresh();
		// required because we currently don't listen to graphItem changes!!
		//	=> better use feedback => currently can't because CreateInteractions are tight to graphItem
		// which is copied in Controller#createFeedbackView!! => will be improved...
		// ~ TESTING PURPOSE
		this.updateActionFeedback(event, viewer);
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback && this._graphItem) {
			const box = this._graphItem.getBoundingBox();
			this.actionFeedback._box.setTo(box);
			const last = this.alignToGrid(this.lastLocation, viewer, event.event.altKey, new Point(0, 0));
			this.actionFeedback._point.setTo(last);
		}
	}

	onMouseUp(event, viewer) {
		if (this._useDragCreationMode()) {
			if (this.hasExtend()) {
				this.finishInteraction(event, viewer);
			} else {
				this.cancelInteraction(event, viewer);
			}
		}
	}

	onMouseDoubleClick(event, viewer) {
		if (this.hasExtend()) {
			// }!this._creationAborted) {
			this.finishInteraction(event, viewer);
		} else {
			this.cancelInteraction(event, viewer);
		}
	}

	cancelInteraction(event, viewer) {
		super.cancelInteraction(event, viewer);
		// pass last event to InteractionHandler
		if (!event.isConsumed && event instanceof MouseEvent) {
			this.getInteractionHandler().handleMouseEvent(event);
		}
	}

	willFinish(event, viewer, offset) {
		const interactionHandler = this.getInteractionHandler();

		// removes all last added coordinates from line which are nearly same...
		// have to do this, because on dblclick we get 2x mouse down too
		const removeLastCoordinates = (coordinates) => {
			let last = coordinates.length - 1;
			const count = last;
			const p1 = JSG.ptCache.get();
			const p2 = JSG.ptCache.get();
			while (last > 1) {
				coordinates[last].toPoint(p1);
				p1.subtract(coordinates[last - 1].toPoint(p2));
				if (p1.length() < 200) {
					Arrays.removeAt(coordinates, last);
					last -= 1;
				} else {
					break;
				}
			}
			JSG.ptCache.release(p1, p2);
			return last !== count;
		};

		const executed = (command, lviewer) => {
			this.executed(command, lviewer);
		};

		if (interactionHandler) {
			if (removeLastCoordinates(this._ortholine.getCoordinates())) {
				// TODO (ah) TESTING PURPOSE: -review- we removed coordinates, so do a refresh...
				this._ortholine.refresh();
			}
			const cmd = this.createCommand(viewer);
			if (cmd) {
				interactionHandler.execute(cmd, executed);
			} else {
				this.cancelInteraction(event, viewer);
			}
		}
	}

	_initNewItem(newItem, rootParent, fbItem) {
		// var parent = super._initNewItem(newItem, rootParent, fbItem);
		// this._graphItem._lineBehavior = newItem.getLayoutAttributes().getLineBehavior().getValue();
		// disable layout during creation...
		// newItem.getLayoutAttributes().setLineBehavior(ItemAttributes.LineBehavior.DISABLED);
		this._graphItem._layoutEnabled = newItem.getLayout().setEnabled(newItem, false);
		const parent = super._initNewItem(newItem, rootParent, fbItem);
		return parent;
	}

	_createdItem(item, viewer) {
		// item.getLayoutAttributes().setLineBehavior(this._graphItem._lineBehavior);
		item.getLayout().setEnabled(item, this._graphItem._layoutEnabled);
		super._createdItem(item, viewer);
	}

	hasExtend(minExtend) {
		minExtend = minExtend || (JSG.touchDevice ? 1000 : 250);
		return super.hasExtend(minExtend);
	}
	/**
	 * Creation mode constants to determine behavior of {{#crossLink
	 * "CreateOrthoEdgeInteraction"}}{{/crossLink}}.
	 *
	 * @class CreateOrthoEdgeInteraction.CREATION_MODE
	 * @constructor
	 * @static
	 */
	static get CREATION_MODE() {
		return {
			/**
			 * Constant to specify automatic behavior.
			 *
			 * @property DRAG
			 * @type {Number}
			 * @static
			 */
			DRAG: 1,
			/**
			 * Constant to specify manual behavior, i.e. a point is added by each mouse click.
			 *
			 * @property CLICK
			 * @type {Number}
			 * @static
			 */
			CLICK: 2,
			/**
			 * Start editing with a single click.
			 *
			 * @property INITIALCLICK
			 * @type {Number}
			 * @static
			 */
			INITIALCLICK: 4
		};
	}
}


export default CreateOrthoEdgeInteraction;
