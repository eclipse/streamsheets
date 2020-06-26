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
import { default as JSG } from '@cedalo/jsg-core';
import ModelController from './ModelController';

/**
 * The root controller defines the fixed root within a hierarchy of controllers.</br>
 * As such this controller is registered to a {{#crossLink "ControllerViewer"}}{{/crossLink}}.
 * That means this controller knows about the viewer used to display the controller hierarchy. Note
 * that a root controller has no associated model or view. The actual hierarchy starts by setting a
 * content controller which also defines the view shown by the viewer.
 *
 * @class RootController
 * @extends ModelController
 * @constructor
 */
class RootController extends ModelController {
	constructor() {
		super();
		/**
		 * The viewer which contains this controller.
		 *
		 * @property viewer
		 * @type {ControllerViewer}
		 */
		this.viewer = undefined;
		/**
		 * The actual root of controller hierarchy.
		 *
		 * @property content
		 * @type {ModelController}
		 */
		this.content = undefined;
	}

	/**
	 * Returns the viewer which contains this controller.
	 *
	 * @method getViewer
	 * @return {ControllerViewer} The viewer of this controller.
	 */
	getViewer() {
		return this.viewer;
	}

	/**
	 * Registers a ControllerViewer.</br>
	 * <b>Note:</b> the viewer should contain this controller as root.
	 *
	 * @method setViewer
	 * @param {ControllerViewer} The viewer of this controller.
	 */
	setViewer(viewer) {
		this.viewer = viewer;
	}

	getRootParent() {
		return this;
	}

	/**
	 * Returns <code>true</code> if this RootController has a content, <code>false</code> otherwise.
	 *
	 * @method hasContent
	 * @return {Boolean} Returns <code>true</code> if a content is defined, <code>false</code> otherwise.
	 */
	hasContent() {
		return this.content !== undefined;
	}

	/**
	 * Returns the content of this controller.</br>
	 * The content is the actual root of the controller hierarchy. For example: the content of
	 * RootController for a {{#crossLink "GraphViewer"}}{{/crossLink}} is a
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method getContent
	 * @return {ModelController} The actual root of controller hierarchy.
	 */
	getContent() {
		return this.content;
	}

	/**
	 * Sets the content of this controller.</br>
	 * The content is the actual root of the controller hierarchy. For example: the content of
	 * RootController for a {{#crossLink "GraphViewer"}}{{/crossLink}} is a
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method setContent
	 * @param {ModelController} The actual root of controller hierarchy.
	 */
	setContent(controller) {
		if (this.content !== undefined) {
			this.removeChild(this.content);
		}
		this.content = controller;
		if (this.content !== undefined) {
			this.addChild(this.content, 0);
		}

		this.setView(controller.getView());
	}

	_isSelectableInParent(controller) {
		return controller.getModel().isSelectable();
	}

	collectVisibleControllersAt(location, controllers) {
		return this.content !== undefined ? this.content.collectVisibleControllersAt(location, controllers) : undefined;
	}

	getControllerAt(location, flags, condition) {
		return this.content !== undefined ? this.content.getControllerAt(location, flags, condition) : undefined;
	}

	findControllerByConditionAndLocation(location, condition) {
		return this.content !== undefined
			? this.content.findControllerByConditionAndLocation(location, condition)
			: undefined;
	}

	findControllerByConditionAndBox(box, condition) {
		return this.content !== undefined ? this.content.findControllerByConditionAndBox(box, condition) : undefined;
	}
}

export default RootController;
