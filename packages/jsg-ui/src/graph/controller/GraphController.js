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
import { Arrays, Dictionary, Event, Graph, default as JSG } from '@cedalo/jsg-core';

import GraphItemController from './GraphItemController';
import GraphView from '../view/GraphView';

/**
 * The GraphController is a derived controller that handles some operations differently which
 * do apply to a Graph in contrast to a GraphItem.</br>
 *
 * A GraphController sends following notifications: </br>
 * <ul>
 *    <li>{{#crossLink "GraphController/GRAPH_CHANGED_NOTIFICATION:property"}}{{/crossLink}}</li>
 *    <li>{{#crossLink "GraphController/GRAPH_SETTINGS_NOTIFICATION:property"}}{{/crossLink}}</li>
 * </ul>
 *
 * @class GraphController
 * @extends GraphItemController
 * @constructor
 * @param {Graph} model Graph to attach to the controller.
 */
class GraphController extends GraphItemController {
	constructor(model) {
		super(model);
		this.graph = model;
		this.additions = [];
	}

	getGraphController() {
		return this;
	}

	/**
	 * Create the corresponding GraphView.
	 *
	 * @method createView
	 * @param {Graph} model Model to create view for.
	 * @return {GraphView} View representing a Graph.
	 */
	createView(model) {
		return new GraphView(model);
	}

	/**
	 * Get the children of the associated model of the controller.
	 *
	 * @method getModelChildren
	 * @return {GraphItem[]} Model children.
	 */
	getModelChildren() {
		return this.graph.getItems();
	}

	isSelectable() {
		return true;
	}

	setCursor(name) {
		this.getView().setCursor(name);
	}

	addFeedback(view) {
		this.getView().addFeedback(view);
	}

	removeFeedback(view) {
		this.getView().removeFeedback(view);
	}

	clearFeedback() {
		this.getView().clearFeedback();
	}

	createFeedback() {
		// no feedback for graph...
	}

	// convenience methods for layer view handling...
	getLayer(layerId) {
		return this.getView().getLayer(layerId);
	}

	hasLayer(layerId) {
		return this.getView().hasLayer(layerId);
	}

	clearLayer(layerId) {
		return this.getView().clearLayer(layerId);
	}

	clearAllLayer() {
		this.getView().clearAllLayer();
	}

	handlePostEvent(event) {
		let notificationName = GraphController.GRAPH_CHANGED_NOTIFICATION;

		switch (event.id) {
			case Event.BBOX:
			case Event.SIZE:
				this.markGraphDirty(true);
				this.getView()._fireOnResize();
				break;
			case Event.ITEMADD:
				this.refresh();
				this.markGraphDirty(true);
				break;
			case Event.ITEMREMOVE:
				this.refresh();
				this.clearSelection();
				this.markGraphDirty(true);
				break;
			case Event.GRAPHSETTINGS:
				notificationName = GraphController.GRAPH_SETTINGS_NOTIFICATION;
				this.markGraphDirty(true);
				break;
			case Event.GRAPH:
				// Event.GRAPH is currently only used for refresh!!
				if (event.detailId === Graph.AttributeID.REFRESH) {
					this.getView().clearCache();
				}
				break;
			case Event.ATTRIBUTE:
				this.getModel()
					.getGraph()
					.setChanged(true);
				break;
			case Event.ADDITIONADD:
			case Event.ADDITIONREMOVE:
			case Event.ADDITIONREMOVEALL:
				this.refresh();
				break;
		}

		if (notificationName) {
			this.sendNotification(notificationName, event);
		}
	}

	refresh() {
		super.refresh();
		this._syncAdditions();
	}

	/**
	 * Syncs additions of {{#crossLink "Graph"}}{{/crossLink}} model.
	 * @method _syncAdditions
	 * @since 1.6.44
	 * @private
	 */
	_syncAdditions() {
		// old additions
		const graph = this.getModel();
		let i;
		let n;
		const oldAdditions = new Dictionary();
		this.additions.forEach((additionCtrlr) => {
			oldAdditions.put(additionCtrlr.getModel().getId(), additionCtrlr);
		});
		// current addition models
		const controllerFab = this.getViewer().getControllerFactory();
		const newAdditions = graph._additions;

		for (i = 0, n = newAdditions.length; i < n; i += 1) {
			let additionCtrlr = oldAdditions.remove(newAdditions[i].getId());
			if (!additionCtrlr) {
				// must be a new addition...
				additionCtrlr = controllerFab.createController(newAdditions[i]);
				this._addAddition(additionCtrlr, i);
			}
		}
		// remove remaining old additions...
		oldAdditions.iterate((id, addition) => {
			this._removeAddition(addition);
		});
	}

	/**
	 * Adds a new {{#crossLink "GraphItemController"}}{{/crossLink}} which represents an addition.
	 * This will update the view hierarchy too.
	 * @method _addAddition
	 * @param {GraphItemController} controller The addition controller to add.
	 * @param {Number} atIndex The index of given controller within the addition list of its parent controller.
	 * @since 1.6.44
	 * @private
	 */
	_addAddition(controller, atIndex) {
		Arrays.insertAt(this.additions, atIndex, controller);
		controller.parent = this.getParent();
		this._addAdditionView(controller, atIndex);
		if (this.isActive) {
			controller.activate();
		}
		// call refresh to build up addition controller hierarchy
		controller.refresh();
	}

	/**
	 * Adds a new addition view.
	 * @method _addAdditionView
	 * @param {GraphItemController} controller The addition controller which provides the view to
	 *     add.
	 * @param {Number} atIndex The index of addition view.
	 * @since 1.6.44
	 * @private
	 */
	_addAdditionView(controller, atIndex) {
		const graphView = this.getView();
		const additionView = controller.getView();
		additionView.setParent(graphView.getParent());
		Arrays.insertAt(graphView._additions, atIndex, additionView);
	}

	/**
	 * Removes {{#crossLink "GraphItemController"}}{{/crossLink}} which represents an addition.
	 * This will update the view hierarchy too.
	 * @method _removeAddition
	 * @param {GraphItemController} controller The addition controller to remove.
	 * @since 1.6.44
	 * @private
	 */
	_removeAddition(controller) {
		if (Arrays.remove(this.additions, controller)) {
			if (this.isActive) {
				controller.deactivate();
			}
			controller.parent = undefined;
			this._removeAdditionView(controller);
		}
	}

	/**
	 * Removes an addition view.
	 * @method _removeAdditionView
	 * @param {GraphItemController} controller The addition controller which provides the view to
	 *     remove.
	 * @since 1.6.44
	 * @private
	 */
	_removeAdditionView(controller) {
		const graphView = this.getView();
		Arrays.remove(graphView._additions, controller.getView());
	}

	getModelController(model) {
		let ctrlr = super.getModelController(model);
		// check additions if not found yet...
		if (!ctrlr) {
			this.additions.some((addition) => {
				ctrlr = addition.getModelController(model);
				return !!ctrlr;
			});
		}
		return ctrlr;
	}

	// SENDS FOLLOWING NOTIFICATIONS:
	static get GRAPH_SETTINGS_NOTIFICATION() {
		return 'graphcontroller.graph.settings.notification';
	}

	static get GRAPH_CHANGED_NOTIFICATION() {
		return 'graphcontroller.graph.changed.notification';
	}
}

export default GraphController;
