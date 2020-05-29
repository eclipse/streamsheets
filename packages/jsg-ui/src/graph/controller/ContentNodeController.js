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
import { Event, NotificationCenter, StreamSheet, WorksheetNode } from '@cedalo/jsg-core';
import NodeController from './NodeController';
import GraphItemController from './GraphItemController';
import StreamSheetView from '../view/StreamSheetView';
import WorksheetView from '../view/WorksheetView';
import ContentPaneView from '../view/ContentPaneView';
import ContentNodeView from '../view/ContentNodeView';

class ContentPaneController extends GraphItemController {
	createFeedback() {
		return this.getParent().createFeedback();
	}

	isSelectable() {
		return false;
		// later we maybe want to select port and move it...
	}

	createView(model) {
		return new ContentPaneView(model);
	}

	handlePostEvent(event) {
		switch (event.id) {
			//	case ID.PIN: don't use this, its called on each scroll...
		case Event.BBOX:
		case Event.SIZE:
			if (this.getModel().getGraph() !== undefined) {
				this.getModel()
					.getGraph()
					.markDirty();
				// TODO (ah) TESTING PURPOSE: -review-
			}
			this.getView()._fireOnResize();
			break;
		default:
			super.handlePostEvent(event);
		}
	}
}

/**
 * This controller handles the behavior of {{#crossLink "ContentNode"}}{{/crossLink}}s.</br>
 * Since a ContentNode has a so called ContentPane sub item, this controller adds a corresponding
 * {{#crossLink "ContentPaneController"}}{{/crossLink}} to its child list. This
 * ContentPaneController can be retrieved via
 * {{#crossLink "ContentNodeController/getContentPaneController:method"}}{{/crossLink}}.
 *
 *
 * @class ContentNodeController
 * @extends NodeController
 * @param {ContentNode} node The ContentNode model associated with this controller.
 * @constructor
 */
class ContentNodeController extends NodeController {
	constructor(node, viewer) {
		super(node);
		this._viewer = viewer;
		this._contentPaneController = undefined;
	}

	isSelectable() {
		return (
			this.getModel().isVisible() &&
			this.getModel()
				.getItemAttributes()
				.getSelectionMode()
				.getValue() !== 0
		);
	}

	createView(model) {
		if (model instanceof StreamSheet) {
			return new StreamSheetView(model);
		}
		if (model instanceof WorksheetNode) {
			return new WorksheetView(model);
		}

		return new ContentNodeView(model, this._viewer.getCoordinateSystem());
	}

	activate() {
		super.activate();
		const contentPane = this.getModel().getContentPane();
		this._setContentPaneController(new ContentPaneController(contentPane));
		this.getView().layout();
		// we have to relayout ScrollView on zoom so:
		NotificationCenter.getInstance().register(this, NotificationCenter.ZOOM_NOTIFICATION, 'onZoom');
	}

	deactivate() {
		super.deactivate();
		NotificationCenter.getInstance().unregister(this, NotificationCenter.ZOOM_NOTIFICATION);
	}

	onZoom(notification) {
		this.getView().layout();
	}

	/**
	 * Sets the given ContentPaneController.
	 *
	 * @method _setContentPaneController
	 * @param {ContentPaneController} cpController The ContentPaneController to use.
	 * @private
	 */
	_setContentPaneController(cpController) {
		if (this._contentPaneController !== undefined) {
			this.removeChild(this._contentPaneController);
		}
		this._contentPaneController = cpController;
		this.addChild(this._contentPaneController);
	}

	/**
	 * Returns the ContentPaneController which manages the ContentNodes content pane.
	 *
	 * @method getContentPaneController
	 * @return {ContentPaneController} The ContentPaneController for ContentNodes content pane.
	 */
	getContentPaneController() {
		return this._contentPaneController;
	}

	refresh() {
		// super.refresh();
		if (this._contentPaneController !== undefined) {
			this._contentPaneController.refresh();
		}
	}

	addChildView(controller, atIndex) {
		this.getView().setContentPaneView(controller.getView());
	}

	onMouseDown(location, viewer, event) {
		const contentview = this.getView();
		return contentview.doHandleEventAt(location, event) ? true : contentview.onMouseDown(location, viewer, event);
		// var	eventConsumed = contentview.doHandleEventAt(location, event);
		// if(eventConsumed === true) {
		// viewer.clearSelection(); //event handled by scrollbar:  <- CANNOT clear selection here!! it will clear
		// SselectionView bounds too!!! } else { eventConsumed = contentview.onMouseDown(location, viewer, event); }
		// return eventConsumed;
	}

	handlePostEvent(event) {
		super.handlePostEvent(event);
		const view = this.getView();
		if (view instanceof ContentNodeView) {
			/* eslint-disable no-fallthrough */
			switch (event.id) {
				case Event.ALL: // <-- to call layout after loading...
					view.init();
				case Event.BBOX:
				case Event.SIZE:
					// case Event.PIN:
					view.layout();
					break;
				default:
					break;
			}
			/* eslint-enable no-fallthrough */
		}
	}

	getModelController(model) {
		let ctrlr = super.getModelController(model);
		if (ctrlr === undefined) {
			// extend search to ContentPaneController, which is not visited by baseclass function...
			ctrlr =
				this._contentPaneController !== undefined
					? this._contentPaneController.getModelController(model)
					: undefined;
		}
		return ctrlr;
	}

	findControllerByConditionAndLocation(location, condition) {
		// stop traversal if given location is not within content view...
		if (this._isVisible(location)) {
			return super.findControllerByConditionAndLocation(location, condition);
		}
		return undefined;
	}

	getControllerAt(location, flags, condition) {
		// stop traversal if given location is not within content view...
		if (this._isVisible(location)) {
			return super.getControllerAt(location, flags, condition);
		}
		return undefined;
	}

	_getSubControllerAt(location, flags, condition) {
		// stop traversal if given location is not within content view...
		if (this._isVisible(location)) {
			return super._getSubControllerAt(location, flags, condition);
		}
		return undefined;
	}

	_collectVisibleSubControllersAt(location, controllers) {
		if (this._isVisible(location)) {
			super._collectVisibleSubControllersAt(location, controllers);
		}
	}

	_isVisible(point) {
		return this.getView().containsPoint(point);
	}

	_stopLookUp(location) {
		const loc = location.copy();
		this.getView().translateFromParent(loc);
		return this.getView().doHandleEventAt(loc);
	}

	_isSelectableInParent(controller) {
		const selectable = super._isSelectableInParent(controller);
		if (selectable === true) {
			const parent = this.getModel().getParent();
			const myBBox = this.getModel().getBoundingBox();
			const childBBox = controller.getModel().getTranslatedBoundingBox(parent);
			return myBBox.doesIntersectWith(childBBox);
		}
		return selectable;
	}
}
/**
//
// CONTENT PANE CONTROLLER CLASS: currently testing purpose only...
//
 * The default controller to manage ContentNodes content pane.</br>
 * A {{#crossLink "ContentNodeView"}}{{/crossLink}} is created for a content pane view.
 *
 * @class ContentPaneController
 * @extends GraphItemController
 * @param {GraphItem} pane The ContentNodes content pane.
 * @constructor
 */


export default ContentNodeController;
