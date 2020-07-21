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
	NotificationCenter,
	Arrays,
	Event,
	ItemAttributes,
	FormatAttributes,
	Notification,
	LayoutAttributes
} from '@cedalo/jsg-core';
import ModelController from './ModelController';
import GraphItemView from '../view/GraphItemView';
import ShapeRenderer from '../view/shapes/ShapeRenderer';
import Feedback from '../feedback/Feedback';

/**
 * A general controller that specifies common behavior for {{#crossLink
 * "GraphItem"}}{{/crossLink}}s.</br>
 *
 * A GraphItemController sends following notification: </br>
 * <ul>
 *    <li>{{#crossLink
 * "GraphItemController/ITEM_CHANGED_NOTIFICATION:property"}}{{/crossLink}}</li>
 * </ul>
 *
 * @class GraphItemController
 * @param {GraphItem} item The graph item model associated with this controller.
 * @extends ModelController
 * @constructor
 */
class GraphItemController extends ModelController {
	/**
	 * Returns the controller that is associated with with given model or <code>undefined</code> if none could be
	 * found.</br> In contrast to {{#crossLink
	 * "ModelController/getModelController:method"}}{{/crossLink}} this method traverses the
	 * complete controller hierarchy.
	 *
	 * @method findModelController
	 * @param {GraphItem} model The graph item model to get the controller for.
	 * @return {GraphItemController} The associated model controller or <code>undefined</code>
	 */
	findModelController(model) {
		if (model === this.getModel()) {
			return this;
		}
		const path = model.createPath();
		return this._findModelControllerByPath(path);
	}

	/**
	 * Returns the controller for the specified model path or <code>undefined</code> if none could be found.
	 *
	 * @method _findModelControllerByPath
	 * @param {Path} path The model path to get the controller for.
	 * @return {GraphItemController} The matching controller or <code>undefined</code>
	 * @private
	 */
	_findModelControllerByPath(path) {
		function findControllerById(id, controllers) {
			let res;
			Arrays.every(controllers, (controller) => {
				if (controller.getModel().getId() === id) {
					res = controller;
					return false;
				}
				return true;
			});
			return res;
		}

		if (path !== undefined) {
			const id = path.nextId();
			const controller =
				id !== undefined
					? id === this.getModel().getId()
						? this
						: findControllerById(id, this.children)
					: undefined;
			return controller !== undefined
				? path.hasNextId()
					? controller._findModelControllerByPath(path)
					: controller
				: undefined;
		}

		return undefined;
	}

	/**
	 * Returns the children of the model of this controller.
	 *
	 * @method getModelChildren
	 * @return {GraphItem []} Array of GraphItems.
	 */
	getModelChildren() {
		return this.getModel().getItems();
	}

	/**
	 * Creates a new View instance to visualize associated model.
	 *
	 * @method createView
	 * @param {GraphItem} model The model to create the view for.
	 * @return {GraphItemView} A view to use for GraphItem visualization.
	 */
	createView(model) {
		return new GraphItemView(model);
	}

	// overwritten to add an ItemBar if required...
	getView() {
		if (this.view === undefined) {
			this.view = this.createView(this.model);
		}
		return this.view;
	}

	/**
	 * Called, if the mouse is pressed on top of the controller. For a complex interaction you should implement an
	 * interaction handler and activate it in response to this event.
	 *
	 * @method onMouseDown
	 * @param {Point} location Location, relative to the container coordinates, of the mouse event.
	 * @param {GraphViewer} viewer Viewer to which the controller belongs.
	 * @param {MouseEvent} event MouseEvent parameters.
	 * @return {Boolean} Return false to intercept the event. No further processing will occur or true to allow default
	 *     handling.
	 */
	onMouseDown(location, viewer, event) {
		return this.getView().onMouseDown(location, viewer, event);
	}

	/**
	 * Returns the current collapsable state of associated model
	 *
	 * @method isCollapsable
	 * @return {Boolean} <code>true</code> if the controller model is collapsable, <code>false</code> otherwise.
	 */
	isCollapsable() {
		return this.getModel().isCollapsable();
	}

	/**
	 * Returns the current collapsed state of associated model
	 *
	 * @method isCollapsed
	 * @return {Boolean} <code>true</code> if the controller model is collapsed, <code>false</code> otherwise.
	 */
	isCollapsed() {
		return this.getModel().isCollapsed();
	}

	isSelectable() {
		// return this.getModel().isSelectable();
		return this._isSelectableInParent(this);
	}

	/**
	 * Checks if given controller is selectable within its hierarchy, i.e. each parent is asked if given
	 * controller can be selected. This is useful to prevent selection of an actually not visible controller.
	 * See {ContentNodeController} as an example.
	 *
	 * @method _isSelectableInParent
	 * @param {GraphItemController} controller The controller to check for selection.
	 * @return {Boolean} <code>true</code> if given controller can be selected, <code>false</code> otherwise.
	 * @deprecated DON'T USE!! CURRENTYL UNDER REVIEW...
	 */
	_isSelectableInParent(controller) {
		// TODO (ah & mr) any better idea to prevent selection of "invisible" controllers...
		const parent = this.getParent();
		return parent !== undefined ? parent._isSelectableInParent(controller) : controller.getModel().isSelectable();
	}

	/**
	 * Checks, if item of this controller is selected.
	 *
	 * @method isSelected
	 * @return {boolean} True, if item is selected, otherwise false.
	 */
	isSelected() {
		return this.getModel()
			.getItemAttributes()
			.getSelected()
			.getValue();
	}

	/**
	 * Selects or deselects this controller. This means the select attribute state of inner model is
	 * changed and might raise an event.
	 *
	 * @method setSelected
	 * @param {Boolean} selected Specify either <code>true</code> or <code>false</code> to select or deselect this
	 *     controller.
	 * @param {Boolean} [disableEvent] Specify <code>true</code> to disable selection event raised by controller.
	 */
	setSelected(selected, disableEvent) {
		const model = this.getModel();
		const view = this.getView();
		const eventsEnabled = model.areEventsEnabled();
		if (disableEvent === true) {
			model.disableEvents();
		}
		model.setItemAttribute(ItemAttributes.SELECTED, selected);
		if (view.onSelectionChange) {
			view.onSelectionChange(selected);
		}
		if (eventsEnabled === true && disableEvent === true) {
			model.enableEvents();
		}
	}

	/**
	 * Returns the GraphController of the controller hierarchy this controller belongs to or <code>undefined</code> if
	 * hierarchy has none.
	 *
	 * @method getGraphController
	 * @return {GraphController} The graph controller of this controllers hierarchy or
	 *     <code>undefined</code>
	 */
	getGraphController() {
		return this.parent !== undefined ? this.parent.getGraphController() : undefined;
	}

	activate() {
		super.activate();
		this.getModel().addEventListener(Event.ALL, this);
	}

	deactivate() {
		this.getModel().removeEventListener(Event.ALL, this);
		super.deactivate();
	}

	/**
	 * Handles any pre event send by associated model.</br>
	 * Note: subclasses may overwrite to perform custom behavior but should call superclass implementation.
	 *
	 * @method handlePreEvent
	 * @param {Event} event The pre event send before model change.
	 */
	handlePreEvent(event) {
		// TESTING PURPOSE
		const parent = this.getParent();
		if (parent && parent.handleChildPreEvent) {
			parent.handleChildPreEvent(this, event);
		}
		// ~
	}

	// TESTING PURPOSE
	/**
	 * @method handleChildPreEvent
	 * @deprecated DON'T USE!! SUBJECT TO CHANGE!!
	 */
	handleChildPreEvent(child, event) {}

	// ~
	/**
	 * Handles any post event send by associated model.</br>
	 * Note: subclasses may overwrite to perform custom behavior but should call superclass implementation.
	 *
	 * @method handlePostEvent
	 * @param {Event} event The post event send after model changed.
	 */
	handlePostEvent(event) {
		// var markDirty = (event.id !== Event.ALL); <!-- ALL is currently used to signal
		// "stale" items...
		let markDirty = !event.isForced;
		let notificationName = GraphItemController.ITEM_CHANGED_NOTIFICATION;

		// console.log("event id: "+event.id);
		// console.log("event detailId: "+event.detailId);

		switch (event.id) {
			case Event.PARENT:
				this._onParentChange(event.value);
				break;
			case Event.ITEMREMOVE:
				// remove conditions to prevent stale state, e.g. condition of removed item is always true because it
				// cannot be resolved -> might lead to wrong stopAt...
				this.clearSelection();
				this.refresh();
				break;
			case Event.ITEMADD:
				this.refresh();
				break;
			case Event.SHAPE:
				this.getView().setShapeRenderer(ShapeRenderer.fromShape(this.getModel()._shape));
				break;
			case Event.ATTRIBUTE:
				markDirty = this._handleAttributeChanged(event);
				notificationName = markDirty === true ? notificationName : undefined;
				break;
		}

		this.markGraphDirty(markDirty);

		if (notificationName && !this.getModel()._reading) {
			this.sendNotification(notificationName, event);
		}

		// TESTING PURPOSE
		const parent = this.getParent();
		if (parent && parent.handleChildPostEvent) {
			parent.handleChildPostEvent(this, event);
		}
		// ~
	}

	// TESTING PURPOSE  TODO remove??!!
	/**
	 * @method handleChildPostEvent
	 * @deprecated DON'T USE!! SUBJECT TO CHANGE!!
	 */
	handleChildPostEvent(child, event) {}

	/**
	 * Marks parent {{#crossLink "Graph"}}{{/crossLink}} model as dirty if passed <code>doIt</code>
	 * parameter is <code>true</code>.</br>
	 * @method markGraphDirty
	 * @param {Boolean} doIt Set to <code>true</code> to mark <code>Graph</code> model dirty.
	 * @since 2.0.17
	 */
	markGraphDirty(doIt) {
		if (doIt) {
			const graph = this.getModel().getGraph();
			if (graph) {
				graph.markDirty();
			}
		}
	}

	/**
	 * Handles attribute changed of associated model.</br>
	 * This method returns <code>true</code> to signal that a corresponding <code>Graph</code> model should be marked
	 * as
	 * dirty or otherwise <code>false</code>.</br>
	 * Note: subclasses may overwrite to perform custom behavior but should call superclass implementation.
	 *
	 * @method _handleAttributeChanged
	 * @param {AttributeChangeEvent} event The corresponding change event.
	 * @return {Boolean} Returns <code>true</code> to signal that <code>Graph</code> model should be marked as dirty,
	 *     <code>false</code> otherwise.
	 * @private
	 */
	_handleAttributeChanged(event) {
		let markDirty = true;

		if (event.id === Event.ATTRIBUTE) {
			const attr = event.getAttribute();
			const attrname = attr.getName();

			if (attrname === 'selection') {
				markDirty = false;
			}

			if (event.isCategory(ItemAttributes.NAME)) {
				if (attrname === ItemAttributes.SELECTED) {
					const isSelected = attr.getValue();
					this.getView().isSelected = isSelected;
					// do selection via selection provider:
					const viewer = this.getViewer();
					const selectionProvider = viewer.getSelectionProvider();
					if (isSelected) {
						selectionProvider.select(this);
					} else {
						selectionProvider.deselect(this);
					}
					markDirty = false;
				}
			} else if (event.isCategory(LayoutAttributes.NAME)) {
				markDirty = attrname !== LayoutAttributes.ENABLED;
			}
		}
		return markDirty;
	}

	sendNotification(name, event) {
		const viewer = this.getViewer();
		if (viewer && viewer.areNotificationsEnabled()) {
			const notification = new Notification(name, this);
			notification.event = event;
			notification.viewer = viewer;
			NotificationCenter.getInstance().send(notification);
		}
	}

	/**
	 * Selects or deselects given item.
	 *
	 * @method selectItem
	 * @param {GraphItem} item The graph item to select.
	 * @param {Boolean} doIt Specify <code>true</code> to select item, <code>false</code> to deselect it.
	 */
	selectItem(item, doIt) {
		const viewer = this.getViewer();
		if (viewer) {
			const controller =
				item.getId() === this.getModel().getId() ? this : this.getControllerByModelId(item.getId());
			if (controller) {
				const selectionProvider = viewer.getSelectionProvider();
				if (doIt) {
					selectionProvider.clearSelection(false);
					selectionProvider.select(controller);
				} else {
					selectionProvider.deselect(controller);
				}
			}
		}
	}

	/**
	 * Clears current selection within {{#crossLink "GraphViewer"}}{{/crossLink}}.
	 *
	 * @method clearSelection
	 */
	clearSelection() {
		const viewer = this.getViewer();
		if (viewer) {
			const selectionProvider = viewer.getSelectionProvider();
			selectionProvider.clearSelection();
		}
	}

	/**
	 * Handles parent switch of associated model.</br>
	 * Note: subclasses may overwrite to perform custom behavior but should call superclass implementation.
	 *
	 * @method _onParentChange
	 * @param {GraphItem} newparent The new parent of associated model.
	 * @private
	 */
	_onParentChange(newparent) {
		function removeFromOldParent(self) {
			const oldparent = self.parent;
			if (oldparent !== undefined) {
				Arrays.remove(oldparent.children, self);
				oldparent.removeChildView(self);
			}
		}

		function addToNewParent(self) {
			// and add ourself to new parent:
			const newparentController = self.getGraphController().findModelController(newparent);
			if (newparentController !== undefined) {
				self.parent = newparentController;
				newparentController.children.push(self);
				newparentController.addChildView(self);
			}
		}

		if (newparent === undefined) {
			this.parent.removeChild(this);
		} else {
			removeFromOldParent(this);
			addToNewParent(this);
		}
	}

	/**
	 * Create a feedback object derived from this controller. Feedback items are used during the manipulation of items
	 * during a user interaction. The feedback visualizes the operation usually using a somehow changed visual
	 * appearance. It is mostly a less detailed visualization to allow a faster redraw operation during the
	 * interaction. In addition the feedback needs to handle dependencies of the original controller, which might not
	 * be available during an interaction.
	 *
	 * @method createFeedback
	 * @return {Feedback} Feedback item that is created.
	 */
	createFeedback() {
		const model = this.getModel();
		const detailed = model.getReshapeCoordinates().length !== 0;
		const fbItem = this.createFeedbackItem(detailed);
		const fbView = this.createFeedbackView(fbItem, detailed);

		const feedback = this._newFeedback(fbItem, fbView, model);
		feedback.init();

		return feedback;
	}

	_newFeedback(fbItem, fbView, model) {
		return new Feedback(fbItem, fbView, model);
	}

	applyFeedbackFormat(item, detailed, keepFormat) {
		const format = item.getFormat();

		if (keepFormat !== true) {
			format.setBrightness(0);
			// currently rgba() only works if brightness is 0...
			if (JSG.touchDevice) {
				format.setFillStyle(FormatAttributes.FillStyle.NONE);
				detailed = format.getLineStyle() === FormatAttributes.LineStyle.NONE;
				format.setLineCorner(0);
			} else {
				format.setFillColor(JSG.theme.feedbackFill);
			}
			format.setLineColor(JSG.theme.feedbackBorder);
		}
		const subitems = item.getItems();
		if (detailed === true) {
			subitems.forEach((litem) => {
				// we can filter out text nodes here, if wanted...
				this.applyFeedbackFormat(litem, false, keepFormat);
			});
		} else {
			subitems.forEach((litem) => {
				litem.setItemAttribute(ItemAttributes.VISIBLE, false);
			});
		}
	}

	/**
	 * Create an item that is a copy of the controller item and change some of its properties to allow
	 * a faster or reduced drawing operation.
	 *
	 * @method createFeedbackItem
	 * @param {boolean} detailed True to allow a more detailed visualization on the feedback item and its subitems.
	 * @return {GraphItem} The new model for the feedback.
	 */
	createFeedbackItem(detailed, keepFormat) {
		const model = this.getModel();
		const fbItem = model.copy(detailed);

		fbItem._isFeedback = true;
		fbItem._parent = model.getGraph();

		// if size references parent by formula, we better use the values
		fbItem.setWidth(model.getWidth().getValue());
		fbItem.setHeight(model.getHeight().getValue());

		const pin = model.getPinPoint();
		fbItem.setPinPointTo(pin);
		fbItem.evaluate();
		// required? => yes because of copy()!!!

		if (model instanceof JSG.TextNode) {
			fbItem.setText(model.getText().getPureValue());
			fbItem.updateSize(true);
		}

		this.applyFeedbackFormat(fbItem, detailed, keepFormat);

		return fbItem;
	}

	/**
	 * Create a feedback view derived from this controller. Feedback views are used during the manipulation of items
	 * during a user interaction. The feedback visualizes the operation usually using a somehow changed visual
	 * appearance. It is mostly a less detailed visualization to allow a faster redraw operation during the
	 * interaction.
	 *
	 * @method createFeedbackView
	 * @param {GraphItem} fbItem Item to create the view for.
	 * @param {boolean} detailed True to allow a more detailed visualization on the feedback item and its subitems.
	 * @return {Feedback} Feedback view that is created.
	 */
	createFeedbackView(fbItem, detailed, keepFormat) {
		const viewer = this.getViewer();
		const tmpController = viewer.getControllerFactory().createController(fbItem);
		// required during creation:
		tmpController.getViewer = () => viewer;
		tmpController.getRootParent = () => tmpController;

		if (detailed) {
			// for subitems, if we have a reshape coordinate, e.g. Cube...
			tmpController.refresh();
		} else if (keepFormat !== true) {
			// simply draw outline...
			const format = fbItem.getFormat();
			// visible...
			if (!JSG.touchDevice) {
				format.setFillStyle(FormatAttributes.FillStyle.SOLID);
			}
			format.setLineStyle(FormatAttributes.LineStyle.SOLID);
		}

		const fbView = tmpController.getView();
		// tmpController no longer needed...
		tmpController.deactivate();

		return fbView;
	}

	/**
	 * Sends this notification on each observed model change.
	 *
	 * @property ITEM_CHANGED_NOTIFICATION
	 * @type {String}
	 * @static
	 */
	static get ITEM_CHANGED_NOTIFICATION() {
		return 'graphitemcontroller.item.changed.notification';
	}
}


export default GraphItemController;
