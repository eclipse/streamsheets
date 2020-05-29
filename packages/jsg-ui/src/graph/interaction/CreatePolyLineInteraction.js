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
	Coordinate,
	ItemAttributes,
	NumberExpression,
	AddItemCommand,
	Arrays,
	MathUtils,
	GraphUtils,
	Point,
	Shape
} from '@cedalo/jsg-core';
import AbstractInteraction from './AbstractInteraction';
import ConnectionController from '../controller/ConnectionController';
import GraphController from '../controller/GraphController';
import PortController from '../controller/PortController';
import Highlighter from './Highlighter';
import LayerId from '../view/LayerId';
import SelectionFeedbackView from '../view/SelectionFeedbackView';
import MouseEvent from '../../ui/events/MouseEvent';
import Cursor from '../../ui/Cursor';

/**
 * An interaction to create a {{#crossLink "Node"}}{{/crossLink}} with a
 * {{#crossLink "PolygonShape"}}{{/crossLink}}.
 *
 * @class CreatePolyLineInteraction
 * @extends AbstractInteraction
 * @param {Node} graphItem The node to create.
 * @constructor
 */
class CreatePolyLineInteraction extends AbstractInteraction {
	constructor(graphItem) {
		super();

		this._polyline = graphItem;
		this._polyshape = graphItem._shape;
		this._isClosed = this._polyline.isClosed();
		this._polyline.setItemAttribute(ItemAttributes.CLOSED, false);

		this._fbView = undefined;
		this._parent = undefined;
		this._lastAction = 0;
	}

	deactivate(viewer) {
		this._polyline = undefined;
		this._fbView = undefined;
		this._parent = undefined;
		super.deactivate(viewer);
	}

	onMouseDown(event, viewer) {
		const self = this;
		const index = this._polyshape.getCoordinatesCount() - 1;

		function setParent() {
			if (!self._parent) {
				if (viewer.getDefaultController()) {
					self._parent = viewer.getDefaultController();
				} else {
					self._parent = self.findControllerAt(event, viewer);
				}
			}
		}

		function setFeedback() {
			if (!self._fbView) {
				const tmpController = viewer.getControllerFactory().createController(self._polyline);
				self._polyline.setItemAttribute(ItemAttributes.CLOSED, false);
				self._fbView = tmpController.getView();
				self.lastLocation.setTo(self.getStartLocation());
				viewer.addInteractionFeedback(self._fbView);
			}
		}

		setParent();

		const graph = viewer.getGraphController();
		this._parent = this._parent || graph;
		if (this._parent && this._parent.getModel().isContainer()) {
			this.setCursor(Cursor.Style.CROSS);
		} else {
			this.cancelInteraction(event, viewer);
			if (!event.isConsumed && event instanceof MouseEvent) {
				this.getInteractionHandler().handleMouseEvent(event);
			}
			return;
		}

		setFeedback();

		// initialize on first down...
		if (index < 0) {
			const coord = new Coordinate();
			const currloc = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);
			coord.set(currloc.x, currloc.y);
			this._polyshape.addCoordinate(coord);
			this._polyshape.addCoordinate(coord.copy());
		} else {
			this._addNewPoint(this._polyshape, event, viewer);
		}
		super.onMouseDown(event, viewer);
	}

	/**
	 * Adds a new point to the PolygonShape.
	 *
	 * @method _addNewPoint
	 * @param {PolygonShape} toShape The PolygonShape to add a point to.
	 * @param {ClientEvent} event The current event which provides the location of the point to add.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_addNewPoint(toShape, event, viewer) {
		const last = toShape.getCoordinatesCount() - 1;
		const lastCoord = toShape.getCoordinateAt(last);
		const secToLastCoord = toShape.getCoordinateAt(last - 1);
		const currloc = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);
		const radius = viewer.getGraph().getCreateThreshhold();
		if (!this._atSameLocation(secToLastCoord.toPoint(), currloc, radius)) {
			lastCoord.set(currloc.x, currloc.y);
			// now add new coordinate:
			toShape.addCoordinate(lastCoord.copy());
		}
	}

	/**
	 * Checks if given points specify same location.
	 *
	 * @method _atSameLocation
	 * @param {Point} p1 First location to check.
	 * @param {Point} p2 Second location to check.
	 * @param {Number} [threshold] An accuracy threshold. If not given a threshold of 250 is used as default.
	 * @return {Boolean} <code>true</code> if both points refer to same location within specified threshold,
	 *     <code>false</code> otherwise.
	 * @private
	 */
	_atSameLocation(p1, p2, threshold) {
		p1.subtract(p2);
		threshold = threshold || 250;
		return p1.length() < threshold;
	}

	onMouseDrag(event, viewer) {
		this._updateFeedback(event, viewer);
		this._lastAction = CreatePolyLineInteraction.STATE._MOUSE_DRAG;
	}

	findControllerAt(event, viewer) {
		return viewer.findControllerAt(
			event.location.copy(),
			Shape.FindFlags.AREA,
			(controller) =>
				controller.getModel().isContainer() &&
				controller.getModel().isVisible() &&
				!(controller instanceof ConnectionController) &&
				!(controller instanceof PortController) &&
				!(controller instanceof GraphController)
		);
	}

	onMouseMove(event, viewer) {
		const self = this;

		function highlightTargetController() {
			const controller = self.findControllerAt(event, viewer);
			if (controller) {
				Highlighter.getDefault().highlightController(controller, viewer);
			}
			return controller;
		}

		viewer.clearLayer(LayerId.TARGETCONTAINER);

		if (this._polyshape.getCoordinatesCount() === 0) {
			const controller = highlightTargetController() || viewer.getGraphController();

			if (controller.getModel().isContainer()) {
				this.setCursor(Cursor.Style.CROSS);
			} else {
				this.setCursor(Cursor.Style.DENY);
			}
		} else {
			this.setCursor(Cursor.Style.CROSS);
		}

		event.doRepaint = true;
		event.isConsumed = true;

		this._updateFeedback(event, viewer);
	}

	onMouseExit(event, viewer) {
		super.onMouseExit(event, viewer);
	}

	createActionFeedback(event, viewer) {
		return new SelectionFeedbackView(12);
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback && this._polyline) {
			const box = this.getNewBoundingBox(this._polyline._shape);
			this.actionFeedback._box.setTo(box);
			const last = this.alignToGrid(this.lastLocation, viewer, event.event.altKey, new Point(0, 0));
			this.actionFeedback._point.setTo(last);
		}
	}

	_updateFeedback(event, viewer) {
		const self = this;
		const last = this._polyshape.getCoordinatesCount() - 1;
		const currloc = this.alignToGrid(this.currentLocation.copy(), viewer, event.event.altKey);

		function calculateOffset(location) {
			self._offset.setTo(location);
			self.lastLocation.setTo(location);
		}

		function updateCoordinate(coord) {
			if (coord) {
				calculateOffset(currloc);
				coord.set(self._offset.x, self._offset.y);
			}
		}

		updateCoordinate(this._polyshape.getCoordinateAt(last));
		this._polyshape.refresh(); // TODO (ah) TESTING PURPOSE: -review-
		this.updateActionFeedback(event, viewer);
	}

	onMouseUp(event, viewer) {
		if (this._lastAction === CreatePolyLineInteraction.STATE._MOUSE_DRAG) {
			this._addNewPoint(this._polyshape, event, viewer);
		}
		this._lastAction = CreatePolyLineInteraction.STATE._MOUSE_UP;
	}

	onMouseDoubleClick(event, viewer) {
		this.finishInteraction(event, viewer);
	}

	willFinish(event, viewer) {
		// removes all last added coordinates from polyline which are nearly same...
		// have to do this, because on dblclick we get 2x mouse down too => could be a FF bug?
		const removeLastCoordinates = (coordinates) => {
			let last = coordinates.length - 1;
			const count = last;
			const tmppoint = new Point(0, 0);
			while (last > 1) {
				coordinates[last].toPoint(tmppoint);
				if (this._atSameLocation(tmppoint, coordinates[last - 1].toPoint(), 100)) {
					Arrays.removeAt(coordinates, last);
					last -= 1;
				} else {
					break;
				}
			}
			return last !== count;
		};

		const interactionHandler = this.getInteractionHandler();
		if (interactionHandler) {
			if (removeLastCoordinates(this._polyshape.getCoordinates())) {
				// TODO (ah) TESTING PURPOSE: -review- we removed coordinates, so do a refresh...
				this._polyshape.refresh();
			}
			const newItem = this._polyline.copy();
			const rootController = viewer.getRootController();
			const parent = this._parent ? this._parent.getModel() : rootController.getContent().getModel();
			this.initNewItem(newItem, viewer);
			interactionHandler.execute(new AddItemCommand(newItem, parent));
			// finally select it:
			// this._parent = this._parent ? this._parent : rootController; <-- rootController has no selectItem....
			if (this._parent) {
				this._parent.selectItem(newItem, true);
			}
		}
		// this.didFinish(event, viewer);
	}

	initNewItem(newItem, viewer) {
		let angle = 0;
		const bbox = this.getNewBoundingBox(newItem._shape);
		const origin = bbox.getTopLeft();

		// translate origin to meet our parent coordinatesystem:
		if (this._parent) {
			const parent = this._parent.getView();
			const rootView = viewer.rootController.getView();
			GraphUtils.traverseDown(rootView, parent, (v) => {
				angle -= v.getAngle();
				v.translateFromParent(origin);
				return true;
			});
			newItem.setAngle(angle);
		}

		// translate coordinates:
		const size = bbox.getSize();
		this.translate(newItem._shape, bbox.getTopLeft(), size);

		// set pin of new item:
		const pin = newItem.getPin();
		pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));
		pin.evaluate(); // we use a formula for local pin, so we evaluate it...

		// set new size:
		newItem.setSize(size.x, size.y);
		newItem.setOriginTo(origin);

		newItem.setItemAttribute(ItemAttributes.CLOSED, this._isClosed);
	}

	/**
	 * Returns the BoundingBox which covers all points of given shape.
	 *
	 * @method getNewBoundingBox
	 * @param {PolygonShape} shape The shape which determines the returned BoundingBox.
	 * @param {BoundingBox} [reusebbox] A BoundingBox to reuse. If not given a new BoundingBox instance is
	 *     created.
	 * @return {BoundingBox} A BoundingBox which covers all points of given shape. If provided, this is
	 *     the reusebbox instance.
	 */
	getNewBoundingBox(shape, reusebbox) {
		return shape.getPointList().getBoundingBox(reusebbox);
	}

	/**
	 * Translates all points of given shape.<br/>
	 * For each point a corresponding coordinate will be created with a formula depending on the size of the shapes
	 * BoundingBox.
	 *
	 * @method translate
	 * @param {PolygonShape} shape The shape to translate.
	 * @param {Point} origin The origin to translate the shape points to.
	 * @param {Point} size A BoundingBox size used to determine the factor of each point.
	 */
	translate(shape, origin, size) {
		const tmppoint = new Point(0, 0);

		shape.getCoordinates().forEach((coordinate) => {
			coordinate.toPoint(tmppoint);
			tmppoint.translate(-origin.x, -origin.y);
			const x = size.x !== 0 ? tmppoint.x / size.x : 0;
			const y = size.y !== 0 ? tmppoint.y / size.y : 0;
			coordinate.set(
				new NumberExpression(0, `width * ${MathUtils.roundTo(x, 2)}`),
				new NumberExpression(0, `height * ${MathUtils.roundTo(y, 2)}`)
			);
		});
	}
	// private state constants used for _lastAction field...
	static get STATE() {
		return {
			MOUSE_UP: 1,
			MOUSE_DRAG: 8,
		};
	}
}

export default CreatePolyLineInteraction;
