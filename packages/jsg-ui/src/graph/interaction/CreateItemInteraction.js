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
import { default as JSG, Shape, TextNode, NumberExpression, AddItemCommand, Point, GraphUtils } from '@cedalo/jsg-core';

import AbstractInteraction from './AbstractInteraction';
import Highlighter from './Highlighter';
import ConnectionController from '../controller/ConnectionController';
import GraphController from '../controller/GraphController';
import PortController from '../controller/PortController';
import LayerId from '../view/LayerId';
import SelectionFeedbackView from '../view/SelectionFeedbackView';
import MouseEvent from '../../ui/events/MouseEvent';
import Cursor from '../../ui/Cursor';

/**
 * A general interaction used to create given {{#crossLink "GraphItem"}}{{/crossLink}}.<br/>
 * Note: this class is seldom used directly. Instead one of its specialized subclasses, e.g.
 * {{#crossLink "CreateNodeInteraction"}}{{/crossLink}} or
 * {{#crossLink "CreateEdgeInteraction"}}{{/crossLink}}, should be used.
 *
 * @class CreateItemInteraction
 * @extends AbstractInteraction
 * @param {GraphItem} graphItem The item to use for creation.
 * @param {String} [label] An optional default label for the new node.
 * @constructor
 */
class CreateItemInteraction extends AbstractInteraction {
	constructor(graphItem, label) {
		super();

		this._graphItem = graphItem;
		this._fbView = undefined;
		this._parent = undefined;
		this._label = label;
		if (graphItem) {
			graphItem.evaluate();
		}
	}

	activate(viewer) {
		super.activate(viewer);
		viewer.clearSelection();
	}

	deactivate(viewer) {
		this._graphItem = undefined;
		this._bbox = undefined;
		this._fbView = undefined;
		this._parent = undefined;
		super.deactivate(viewer);
	}

	onMouseDown(event, viewer) {
		this._parent = this._findParentControllerAt(event.location.copy(), viewer);

		// check, if click on valid container
		const graph = viewer.getGraphController().getModel();
		const parent = this._parent ? this._parent.getModel() : graph;
		if (!this.isAddAllowed(parent)) {
			this.cancelInteraction(event, viewer);
			if (!event.isConsumed && event instanceof MouseEvent) {
				this.getInteractionHandler().handleMouseEvent(event);
			}
		}
	}

	onMouseUp(event, viewer) {
		this._setFeedback(event, viewer);
		super.onMouseUp(event, viewer);
	}

	_setFeedback(event, viewer) {
		if (!this._fbView) {
			this._fbView = this.createFeedback(this._graphItem, viewer);
			this.initializeFeedback(this._fbView, viewer, event);
			viewer.addInteractionFeedback(this._fbView);
			this.lastLocation.setTo(this.getStartLocation());

			this.actionFeedback = this.createActionFeedback();
			if (this.actionFeedback) {
				viewer.addInteractionFeedback(this.actionFeedback);
			}
		}
	}

	createActionFeedback(event, viewer) {
		return new SelectionFeedbackView(11);
	}

	updateActionFeedback(event, viewer) {
		if (this.actionFeedback && this._graphItem) {
			const box = this._graphItem.getBoundingBox();
			this.actionFeedback._box.setTo(box);
		}
	}

	/**
	 * Creates a feedback for given GraphItem to use during interaction.
	 *
	 * @method createFeedback
	 * @param {GraphItem} forItem The item to create a feedback for.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {View} A view to use as feedback.
	 */
	createFeedback(forItem, viewer) {
		// we use a controller which is not added to a viewer, so we have to handle this...
		const tmpController = viewer.getControllerFactory().createController(forItem);
		tmpController.getViewer = () => viewer;
		tmpController.refresh(); // item may consist of subitems... //TODO (ah) TESTING PURPOSE: -review-
		const feedback = tmpController.getView();
		tmpController.deactivate(); // tmpController no longer needed...
		return feedback;
	}

	/**
	 * Initializes given feedback view.
	 *
	 * @method initializeFeedback
	 * @param {View} fbView The feedbak view to initialize.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {ClientEvent} event The current event.
	 */
	initializeFeedback(fbView, viewer, event) {
		const pin = this._graphItem.getPin();
		pin.setLocalPoint(0, 0);
		const p = this.alignToGrid(this.startLocation, viewer, event.event.altKey, new Point(0, 0));
		pin.setPointTo(p);
	}

	updateFeedback(event, viewer, offset) {
		const start = this.alignToGrid(this.startLocation, viewer, event.event.altKey, new Point(0, 0));
		const last = this.alignToGrid(this.lastLocation, viewer, event.event.altKey, new Point(0, 0));

		last.x = Math.max(start.x, last.x);
		last.y = Math.max(start.y, last.y);

		let width = start.x - last.x;
		let height = start.y - last.y;
		let newOrigin = last.copy();

		newOrigin.x = Math.min(newOrigin.x, newOrigin.x + width);
		newOrigin.y = Math.min(newOrigin.y, newOrigin.y + height);
		newOrigin = this.alignToGrid(newOrigin, viewer, event.event.altKey, newOrigin);

		if (event.event.shiftKey) {
			if (this.currentLocation.x - this.startLocation.x > this.currentLocation.y - this.startLocation.y) {
				height = width;
			} else {
				width = height;
			}
		}
		if (event.event.ctrlKey) {
			newOrigin.x += width;
			newOrigin.y += height;
			height *= 2;
			width *= 2;
		}

		this._graphItem.setPinPointTo(newOrigin);

		this._graphItem.setSize(Math.abs(width), Math.abs(height));
		// call layoutAll to update items which depends on layout, e.g. lane...
		this._graphItem.layoutAll();
	}

	isAddAllowed(model) {
		return model.isContainer() && !model.isProtected() && model.isVisible();
	}

	onMouseMove(event, viewer) {
		const controller = this._highlightTargetController(event, viewer) || viewer.getGraphController();

		if (this.isAddAllowed(controller.getModel())) {
			this.setCursor(Cursor.Style.CROSS);
		} else {
			this.setCursor(Cursor.Style.DENY);
		}

		event.isConsumed = true;
	}

	/**
	 * Highlights a possible target controller. If a suitable target controller is found the highlight is added to the
	 * {{#crossLink "LayerId/TARGETCONTAINER:property"}}{{/crossLink}} layer. Please refer to
	 * {{#crossLink "InteractionUtils/highlightTargetController:method"}}{{/crossLink}} for
	 * additional information.
	 *
	 * @method name
	 * @param {ClientEvent} event The current event which provides the location to look for a suitable
	 *     controller.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_highlightTargetController(event, viewer) {
		viewer.clearLayer(LayerId.TARGETCONTAINER);

		const controller = this._findParentControllerAt(event.location.copy(), viewer);
		if (controller) {
			Highlighter.getDefault().highlightController(controller, viewer);
		}
		event.doRepaint = true;

		return controller;
	}

	/**
	 * Called during the look up of a suitable target controller. <br/>
	 * Please refer to {{#crossLink
	 * "CreateItemInteraction/_highlightTargetController:method"}}{{/crossLink}} for additional
	 * information.
	 *
	 * @method _findParentControllerAt
	 * @param {Point} location The location to look at.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {ModelController} A possible controller or <code>undefined</code> if none could be
	 *     found.
	 * @private
	 */
	_findParentControllerAt(location, viewer) {
		const constraint = (controller) => {
			if (this._graphItem) {
				if (
					!JSG.graphItemFactory.isValidSubItem(
						this._graphItem,
						controller
							.getModel()
							.getType()
							.getValue(),
						controller.getModel()
					)
				) {
					return false;
				}
			}

			return (
				this.isAddAllowed(controller.getModel()) &&
				!(controller instanceof ConnectionController) &&
				!(controller instanceof PortController) &&
				!(controller instanceof GraphController)
			);
		};

		if (viewer.getDefaultController()) {
			return viewer.getDefaultController();
		}
		const controller = viewer.findControllerAt(location, Shape.FindFlags.AREA, constraint);

		return controller;
	}

	willFinish(event, viewer) {
		const interactionHandler = this.getInteractionHandler();
		if (interactionHandler) {
			const newItem = this._graphItem.copy();
			const graphctrlr = viewer.getGraphController();
			const parentModel = this._initNewItem(newItem, graphctrlr.getModel(), this._graphItem);
			if (!parentModel) {
				return;
			}
			const size = newItem.getSize();
			if (this.hasExtend(viewer, size) === false) {
				newItem.setSize(2500, 2500);
			}

			interactionHandler.execute(new AddItemCommand(newItem, parentModel));
			// finally select it:
			this._parent = this._parent || graphctrlr;
			this._parent.selectItem(newItem, true);
			if (this._label) {
				const label = new TextNode(this._label);
				newItem.addLabel(label);
			}
		}
	}

	hasExtend(viewer, size) {
		const cs = viewer.getCoordinateSystem();
		let threshold = JSG.touchDevice ? 500 : 250;
		threshold = Math.max(JSG.MIN_WIDTH_HEIGHT, cs.metricToLogXNoZoom(threshold));
		return Math.abs(size.getWidth().getValue()) > threshold || Math.abs(size.getHeight().getValue()) > threshold;
	}

	/**
	 * Initializes given item before it is added.</br>
	 * Subclasses may overwrite.
	 *
	 * @method _initNewItem
	 * @param {GraphItem} newItem The item to initialize.
	 * @param {GraphItem} rootParent    The root parent, i.e. usually the Graph.
	 * @param {GraphItem} fbItem The feedback item to use for initialization.
	 * @return {GraphItem} The parent to add the newItem to or given rootParent.
	 */
	_initNewItem(newItem, rootParent, fbItem) {
		let angle = fbItem.getAngle().getValue();
		const origin = fbItem.getOrigin();
		// TODO(ah): this is not nice! parent must be undefined in case of graph here!! => check for it later
		const parent = this._parent ? this._parent.getModel() : rootParent;
		if (!this.isAddAllowed(parent)) {
			return undefined;
		}

		// translate origin to meet our parent coordinatesystem:
		GraphUtils.traverseItemDown(rootParent, parent, (item) => {
			angle -= item.getAngle().getValue();
			item.translateFromParent(origin);
			return true;
		});
		newItem.setAngle(angle);
		// init pin new item:
		this._initPinOf(newItem);
		// set new size:
		newItem.setSizeTo(fbItem.getSize());
		newItem.setOriginTo(origin);

		return parent;
	}

	/**
	 * Initializes the {{#crossLink "Pin"}}{{/crossLink}} of given GraphItem.<br/>
	 * By default only its local pin is set to the center of items BoundingBox. Subclasses may overwrite.
	 *
	 * @method _initPinOf
	 * @param {GraphItem} newItem The item to initialize the Pin of.
	 * @private
	 */
	_initPinOf(newItem) {
		const pin = newItem.getPin();
		pin.setLocalCoordinate(new NumberExpression(0, 'WIDTH * 0.5'), new NumberExpression(0, 'HEIGHT * 0.5'));
		// pin.setLocalCoordinate(new NumberExpression(0), new NumberExpression(0));
		pin.evaluate(); // we use a formula for local pin, so we evaluate it...
	}
}

export default CreateItemInteraction;
