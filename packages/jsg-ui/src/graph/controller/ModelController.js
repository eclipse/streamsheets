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
import { default as JSG, Model, Dictionary, TextNode, Arrays, Shape } from '@cedalo/jsg-core';

import View from '../../ui/View';

/**
 * Controllers are used to implement any logic or behavior a model can have. Since it links view to model
 * Controllers are created via GraphControllerFactory. Custom controllers can easily be attached
 * by setting a custom controller factory derived from {{#crossLink
 * "GraphControllerFactory"}}{{/crossLink}} to the Viewer, which is attached to the GraphEditor.
 */

/**
 * The base controller which provides general functionality to build up and manage controller hierarchy.
 *
 * @class ModelController
 * @param {Model} model The associated controller model.
 * @constructor
 */
class ModelController {
	constructor(model) {
		/**
		 * The associated controller model.
		 *
		 * @property model
		 * @type {Model}
		 */
		this.model = model !== undefined ? model : new Model();
		/**
		 * The associated controller view.
		 *
		 * @property view
		 * @type {View}
		 */
		this.view = undefined;
		/**
		 * Flag to indicate if this controller is active or not.
		 *
		 * @property isActive
		 * @type {Boolean}
		 */
		this.isActive = false;
		/**
		 * The parent controller.
		 *
		 * @property parent
		 * @type {ModelController}
		 */
		this.parent = undefined;
		/**
		 * The child controllers.
		 *
		 * @property children
		 * @type {Array}
		 */
		this.children = [];
	}

	/**
	 * Returns the parent of this controller or <code>undefined</code> if it has none.
	 *
	 * @method getParent
	 * @return {ModelController} The parent controller or <code>undefined</code>
	 */
	getParent() {
		return this.parent;
	}

	/**
	 * Returns the index of this controller within the children list of its parent. If this controller
	 * has no parent -1 is returned.
	 *
	 * @method getIndex
	 * @return {Number} The index in children list of its parent or -1 if parent is undefined.
	 */
	getIndex() {
		return this.parent !== undefined ? this.parent.children.indexOf(this) : -1;
	}

	/**
	 * Moves this controller to the specified index within the children list of its parent. If the
	 * index is out of range calling this method has no effect.
	 *
	 * @method moveToIndex
	 * @param {Number} newIndex The index within the parent children list to  move this controller to.
	 */
	moveToIndex(newIndex) {
		if (newIndex < 0 || newIndex >= this.parent.children.length) {
			return;
		}

		const index = this.parent.children.indexOf(this);
		Arrays.move(this.parent.children, index, newIndex);
		this.getView().moveToIndex(newIndex);
		this.getModel().moveToIndex(newIndex);
	}

	/**
	 * Moves this controller to the top of the children list of its parent.
	 *
	 * @method moveToTop
	 */
	moveToTop() {
		const index = this.parent.children.indexOf(this);
		Arrays.move(this.parent.children, index, this.parent.children.length - 1);
		this.getView().moveToTop();
		this.getModel().moveToTop();
	}

	/**
	 * Moves this controller one step up within the children list of its parent.
	 *
	 * @method moveUp
	 */
	moveUp() {
		const index = this.parent.children.indexOf(this);
		if (index < this.parent.children.length - 1) {
			Arrays.move(this.parent.children, index, index + 1);
		}
		this.getView().moveUp();
		this.getModel().moveUp();
	}

	/**
	 * Moves this controller to the bottom of the children list of its parent.
	 *
	 * @method moveToBottom
	 */
	moveToBottom() {
		const index = this.parent.children.indexOf(this);
		Arrays.move(this.parent.children, index, 0);
		this.getView().moveToBottom();
		this.getModel().moveToBottom();
	}

	/**
	 * Moves this controller one step down within the children list of its parent.
	 *
	 * @method moveDown
	 */
	moveDown() {
		const index = this.parent.children.indexOf(this);
		if (index > 0) {
			Arrays.move(this.parent.children, index, index - 1);
		}
		this.getView().moveDown();
		this.getModel().moveDown();
	}

	/**
	 * Checks if this controller has any registered child controllers.
	 *
	 * @method hasChildren
	 * @return {Boolean} <code>true</code> if this controller has children, <code>false</code> otherwise.
	 */
	hasChildren() {
		return this.children.length !== 0;
	}

	/**
	 * Returns direct access to the underlying children list of this controller.
	 *
	 * @method getChildren
	 * @return {Array} The controller children list.
	 */
	getChildren() {
		return this.children;
	}

	/**
	 * Returns the controller child at specified index or <code>undefined</code> if index is out of range.
	 *
	 * @method getChildAt
	 * @param {Number} index The index within this controller children list.
	 * @return {ModelController} The controller at specified index or <code>undefined</code>.
	 */
	getChildAt(index) {
		return index >= 0 && index < this.children.length ? this.children[index] : undefined;
	}

	/**
	 * Returns the current selectable state of this controller. I.e. if this controller can be
	 * selected or not.</br>
	 * <b>Note:</b> this method is intended to be overwritten by subclasses. Default implementation
	 * simply returns <code>false</code>.
	 *
	 * @method isSelectable
	 * @return {Boolean} <code>true</code> if this controller can be selected, <code>false</code> otherwise.
	 */
	isSelectable() {
		return false;
	}

	/**
	 * Returns the current selection state of this controller.</br>
	 * <b>Note:</b> this method is intended to be overwritten by subclasses. Default implementation
	 * simply returns <code>false</code>.
	 *
	 * @method isSelected
	 * @return {Boolean} <code>true</code> if this controller is selected, <code>false</code> otherwise.
	 */
	isSelected() {
		return false;
	}

	/**
	 * Sets the selection state of this controller.</br>
	 * <b>Note:</b> this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method setSelected
	 * @param {Boolean} selected The new selection state.
	 */
	setSelected(selected) {}

	/**
	 * Returns the currently associated model.
	 *
	 * @method getModel
	 * @return {Model} The associated controller model.
	 */
	getModel() {
		return this.model;
	}

	/**
	 * Returns the currently associated view.
	 *
	 * @method getView
	 * @return {View} The view currently used for model visualization.
	 */
	getView() {
		if (this.view === undefined) {
			this.view = this.createView(this.model);
		}
		return this.view;
	}

	/**
	 * Creates a new View instance to visualize associated model.</br>
	 * <b>Note:</b> this method is intended to be overwritten by subclasses.
	 *
	 * @method createView
	 * @param {Model} model The model to create the view for.
	 * @return {View} A view to use for model visualization.
	 */
	createView(model) {
		return new View();
	}

	/**
	 * Sets given view as associated controller view.
	 *
	 * @method setView
	 * @param {View} view The view to use for model visualization.
	 */
	setView(view) {
		this.view = view;
	}

	/**
	 * Adds given controller to the children list of this controller.
	 *
	 * @method addChild
	 * @param {ModelController} controller The controller to add.
	 * @param {Number} atIndex The index within the children list to given controller at.
	 */
	addChild(controller, atIndex) {
		Arrays.insertAt(this.children, atIndex, controller);
		controller.parent = this;
		this.addChildView(controller, atIndex);
		if (this.isActive) {
			controller.activate();
		}
		// call refresh to build up child controller hierarchy
		controller.refresh();
	}

	/**
	 * Activates this controller and all of its children.</br>
	 * Subclasses can overwrite to perform any initialization tasks, e.g. to register listeners. Default
	 * implementation simply calls <code>activate</code> on all registered child controllers.
	 *
	 * @method activate
	 */
	activate() {
		this.isActive = true;
		// activate kids:
		this.children.forEach((child) => {
			child.activate();
		});
	}

	/**
	 * Adds the view of given controller to this controller associated view at specified index.
	 *
	 * @method addChildView
	 * @param {ModelController} controller The controller whose view should be added.
	 * @param {Number} atIndex The index within sub view list of this controller view.
	 */
	addChildView(controller, atIndex) {
		this.getView().addView(controller.getView(), atIndex);
	}

	/**
	 * Removes given controller from the children list of this controller.
	 *
	 * @method removeChild
	 * @param {ModelController} controller The controller to remove.
	 */
	removeChild(controller) {
		if (Arrays.remove(this.children, controller)) {
			if (this.isActive) {
				controller.deactivate();
			}
			controller.parent = undefined;
			this.removeChildView(controller);
		}
	}

	/**
	 * Called if this controller is about to be removed.</br>
	 * Subclasses can overwrite to perform any clean up tasks, e.g. to unregister listeners. Default
	 * implementation simply calls <code>deactivate</code> on all registered child controllers.
	 *
	 * @method deactivate
	 */
	deactivate() {
		this.children.forEach((child) => {
			child.deactivate();
		});
		this.isActive = false;
		this.getView().dispose();
	}

	/**
	 * Removes the view associated with given controller from the sub views of this controller view.</br>
	 * Subclasses can overwrite.
	 *
	 * @method removeChildView
	 * @param {ModelController} controller The controller whose view should be removed.
	 */
	removeChildView(controller) {
		const view = controller.getView();
		this.getView().removeView(view);
	}

	/**
	 * Refreshes this controller to reflect changes within the list of model children.</br>
	 * Usually this method should be called after an item was added to or removed from the model
	 * children list.<br/>
	 * Please see {{#crossLink "ModelController/update:method"}}{{/crossLink}} too.
	 *
	 * @method refresh
	 */
	refresh() {
		this._refreshViews();
		this._refreshChildren();
	}

	/**
	 * Refreshes the views of child controllers.</br>
	 * <b>Note:</b> this method can be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method _refreshViews
	 * @private
	 */
	_refreshViews() {}

	/**
	 * Refreshes the child controllers list.</br>
	 * I.e. it synchronizes with the model to reflect changes within the list of model children.
	 *
	 * @method _refreshChildren
	 * @private
	 */
	_refreshChildren() {
		const kidsMap = new Dictionary();

		this.children.forEach((child) => {
			const kidController = child;
			kidsMap.put(kidController.getModel().getId(), kidController);
		});

		const modelKids = this.getModelChildren();

		modelKids.forEach((model, i) => {
			let controller = kidsMap.remove(model.getId());
			if (controller === undefined) {
				// create a new one:
				controller = this.getViewer()
					.getControllerFactory()
					.createController(model);
				this.addChild(controller, i);
			}
		});

		// finally remove remaining obsolete controllers...
		kidsMap.iterate((key, element) => {
			this.removeChild(element);
		});
	}

	/**
	 * Returns the sub items of associated model.</br>
	 * <b>Note:</b> this method is intended to be overwritten by subclasses. Default implementation
	 * simply returns an empty list.
	 *
	 * @method getModelChildren
	 * @return {Array} The sub items of associated model.
	 */
	getModelChildren() {
		return [];
	}

	/**
	 * Returns the ControllerViewer this controller is added to or <code>undefined</code> if controller
	 * was not added yet.
	 *
	 * @method getViewer
	 * @return {ControllerViewer} The viewer which displays a controller hierarchy.
	 */
	getViewer() {
		if (this.parent !== undefined) {
			return this.parent.getViewer();
		}
		return undefined;
	}

	/**
	 * Returns the root of the controller hierarchy this controller belongs to or <code>undefined</code>
	 * if this controller is not part of a controller hierarchy.</br>
	 * <b>Note:</b> a controller hierarchy can only be build by using a {{#crossLink
	 * "ControllerViewer"}}{{/crossLink}} which defines the hierarchy root.
	 *
	 * @method getRootParent
	 * @return {ModelController} The root of the controller hierarchy or <code>undefined</code>.
	 */
	getRootParent() {
		return this.parent !== undefined ? this.parent.getRootParent() : undefined;
	}

	/**
	 * Returns the direct sub controller that is associated with given model or <code>undefined</code> if none could be
	 * found.</br> Note that only the sub controllers of this controller are queried!
	 *
	 * @method getModelController
	 * @param {Model} model The model to get the controller for.
	 * @return {ModelController} The associated model controller or <code>undefined</code>
	 */
	getModelController(model) {
		if (model) {
			let i;
			let n;

			for (i = 0, n = this.children.length; i < n; i += 1) {
				if (model.getId() === this.children[i].getModel().getId()) {
					return this.children[i];
				}
			}
		}
		return undefined;
	}

	/**
	 * Returns the controller whose model matches given id or <code>undefined</code> if none could be found.
	 *
	 * @method getControllerByModelId
	 * @param {Number} id The model id to get controller for.
	 * @return {ModelController} A matching controller of <code>undefined</code>.
	 */
	getControllerByModelId(id) {
		if (this.getModel().getId() === id) {
			return this;
		}

		let i;
		let n;
		let controller;

		for (i = 0, n = this.children.length; i < n; i += 1) {
			controller = this.children[i].getControllerByModelId(id);
			if (controller !== undefined) {
				return controller;
			}
		}
		return undefined;
	}

	/**
	// * Traverses controller hierarchy and returns first controller which fulfills given condition function or
	// * <code>undefined</code> if none could be found.</br>
	// * The search is solely based on provided condition function, which gets called with current visited controller
	// and * specified options object. The condition should return <code>true</code> if passed controller is valid and
	// to * stop the search, otherwise <code>false</code>. * * @method findControllerByCondition * @param {Function}
	// condition A condition function to check possible controller. * @param {Object} [options] An optional options
	// object which is passed to given condition function. * @return {ModelController} A valid
	// controller or <code>undefined</code> * @deprecated NOT USABLE RIGHT NOW!!! */
	findControllerByCondition(condition) {
		let controller;

		const findChildControllerByCondition = (lcondition) => {
			let i;
			let subController;

			for (i = this.children.length - 1; i >= 0; i -= 1) {
				subController = this.children[i].findControllerByCondition(lcondition);
				if (subController) {
					return subController;
				}
			}
			return undefined;
		};

		if (this.view) {
			if (condition(this)) {
				controller = this;
			} else {
				// check child controllers...
				const childController = findChildControllerByCondition(condition);
				controller = childController;
			}
		}

		return controller;
	}

	/**
	 * Returns first controller which fulfills given condition function or <code>undefined</code> if none could be
	 * found.</br> The search is solely based on provided condition function, which gets called with a controller and
	 * specified location. The condition should return <code>true</code> if passed controller is valid and to stop the
	 * search, otherwise <code>false</code>.
	 *
	 * @method findControllerByConditionAndLocation
	 * @param {Point} location A location to be passed to condition function.
	 * @param {Function} condition A condition function to check any possible controllers.
	 * @return {ModelController} A valid controller or <code>undefined</code>
	 */
	findControllerByConditionAndLocation(location, condition) {
		let controller;
		let loc = JSG.ptCache.get();

		const findChildControllerAtByCondition = (llocation, lcondition) => {
			let i;
			let subController;

			for (i = this.children.length - 1; i >= 0; i -= 1) {
				subController = this.children[i].findControllerByConditionAndLocation(llocation, lcondition);
				if (subController) {
					return subController;
				}
			}
			return undefined;
		};

		if (this.view) {
			loc = loc.setTo(location);
			if (condition(this, loc)) {
				controller = this;
			} else {
				// check child controllers...
				this.getModel().translateFromParent(loc);
				const childController = findChildControllerAtByCondition(loc, condition);
				controller = childController;
			}
		}

		JSG.ptCache.release(loc);

		return controller;
	}

	/**
	 * Returns first controller which fulfills given condition function or <code>undefined</code> if none could be
	 * found.</br> The search is solely based on provided condition function, which gets called with a controller and
	 * specified BoundingBox. The condition should return <code>true</code> if passed controller is valid and to stop
	 * the search, otherwise <code>false</code>.
	 *
	 * @method findControllerByConditionAndBox
	 * @param {BoundingBox} box A BoundingBox instance to pass to condition function.
	 * @param {Function} condition A condition function to check any possible controllers.
	 * @return {ModelController} A valid controller or <code>undefined</code>
	 */
	findControllerByConditionAndBox(box, condition) {
		const self = this;

		function findChildControllerAtByConditionAndBox(lbox, lcondition) {
			let i;
			let subController;

			for (i = self.children.length - 1; i >= 0; i -= 1) {
				subController = self.children[i].findControllerByConditionAndBox(lbox, lcondition);
				if (subController) {
					return subController;
				}
			}

			return undefined;
		}

		if (this.view) {
			if (condition(this, box)) {
				return this;
			}
			// check child controllers...
			const childController = findChildControllerAtByConditionAndBox(box, condition);
			return childController !== undefined ? childController : undefined;
		}

		return undefined;
	}

	/**
	 * Returns the controller at specified location or <code>undefined</code> if none could be found.</br>
	 * The controller look up can be affected by the flags and condition parameter. The condition must
	 * be a function which gets called with a possible controller as parameter. If passed controller
	 * is valid, the function should return <code>true</code>.
	 *
	 * @method getControllerAt
	 * @param {Point} location The location to look at.
	 * @param {Shape.FindFlags} [flags] One of the predefined flags to affect to controller look up.
	 * @param {Function} [condition] An optional condition function to check any possible controllers.
	 * @return {ModelController} The controller at specified location.
	 */
	getControllerAt(location, flags, condition) {
		let controller;
		const model = this.getModel();

		function checkOurself(loc, self) {
			let ctrlr;
			if (self.containsPoint(loc, flags)) {
				if (condition === undefined || condition(self, loc)) {
					if (
						model.getParent() &&
						!(model instanceof TextNode && model.isAssociated()) &&
						model.getParent().isSelectParentFirst() &&
						flags !== Shape.FindFlags.AREA
					) {
						ctrlr = self.getParent();
					} else {
						ctrlr = self;
					}
				}
			}
			return ctrlr;
		}

		if (this.view) {
			const loc = JSG.ptCache.get(location.x, location.y);
			if (this._stopLookUp(loc) === true) {
				controller = checkOurself(loc, this);
			} else {
				// if (!model.isCollapsed()) {
				const subController = this._getSubControllerAt(loc, flags, condition);
				if (subController !== undefined) {
					controller = subController;
				}
				// }
				if (controller === undefined) {
					loc.setTo(location);
					controller = checkOurself(loc, this);
				}
			}
			JSG.ptCache.release(loc);
		}

		return controller;
	}

	addController(controllers, point) {
		controllers.length += 1;
		if (controllers.data.length < controllers.length) {
			controllers.data.push({
				controller: this,
				location: point.copy()
			});
		} else {
			controllers.data[controllers.length - 1].controller = this;
			controllers.data[controllers.length - 1].location.x = point.x;
			controllers.data[controllers.length - 1].location.y = point.y;
		}
	}

	collectVisibleControllersAt(location, controllers) {
		const model = this.getModel();
		const loc = JSG.ptCache.get(location.x, location.y);

		if (this._stopLookUp(loc) === true) {
			if (this.containsPoint(loc, Shape.FindFlags.BOXWITHFRAME)) {
				this.addController(controllers, loc);
			}
		} else if (model.isItemVisible()) {
			this._collectVisibleSubControllersAt(loc, controllers);
			if (this.containsPoint(loc, Shape.FindFlags.BOXWITHFRAME)) {
				this.addController(controllers, loc);
			}
		}

		JSG.ptCache.release(loc);

		return controllers;
	}

	_collectVisibleSubControllersAt(location, controllers) {
		const loc = JSG.ptCache.get(location.x, location.y);

		this.model.translateFromParent(loc);
		const parentCollapsed = this.isCollapsed();

		for (let i = this.children.length - 1; i >= 0; i -= 1) {
			const controller = this.children[i];
			if (controller.getModel().isItemVisible()) {
				if (
					parentCollapsed === false ||
					controller
						.getModel()
						.getItemAttributes()
						.getCollapseBehaviour()
						.getValue()
				) {
					controller.collectVisibleControllersAt(loc, controllers);
				}
			}
		}

		JSG.ptCache.release(loc);
	}

	/**
	 * Returns the sub controller for specified location or <code>undefined</code> if none could be found.</br>
	 * The controller look up can be affected by the flags and condition parameter. The condition must
	 * be a function which gets called with any possible controller as parameter. If passed controller
	 * is valid, the function should return <code>true</code>.
	 *
	 * @method _getSubControllerAt
	 * @param {Point} location The location to look at.
	 * @param {Shape.FindFlags} [flags] One of the predefined flags to affect to controller look up.
	 * @param {Function} [condition] An optional condition function to check any possible controllers.
	 * @return {ModelController} The controller at specified location.
	 * @private
	 */
	_getSubControllerAt(location, flags, condition) {
		this.getModel().translateFromParent(location);

		let i;
		let subController;
		let controller;
		const parentCollapsed = this.isCollapsed();

		for (i = this.children.length - 1; i >= 0; i -= 1) {
			controller = this.children[i];
			if (
				parentCollapsed === false ||
				controller
					.getModel()
					.getItemAttributes()
					.getCollapseBehaviour()
					.getValue()
			) {
				subController = controller.getControllerAt(location, flags, condition);
			}
			// verify condition => not needed, condition was already checked against in getControllerAt
			// if (subController && condition)
			// subController = condition(subController, location) ? subController : undefined;
			if (subController) {
				return subController;
			}
		}
		return undefined;
	}

	/**
	 * Checks if this controller contains given location.</br>
	 * The is equal to asking the inner {{#crossLink "View"}}{{/crossLink}} object if it contains passed
	 * location.
	 *
	 * @method containsPoint
	 * @param {Point} location The location to check.
	 * @param {Shape.FindFlags} [flags] One of the predefined flags to affect to controller look up.
	 * @return {Boolean} <code>true</code> if given location is within the bounds of inner view, <code>false</code>
	 *     otherwise.
	 */
	containsPoint(location, findFlag) {
		return this.model.containsPoint(location, findFlag);
	}

	/**
	 * Traverse controllers hierarchy starting with this controller. The currently visited controller
	 * is passed as parameter to specified function. If the function returns <code>false</code>
	 * traversing is stopped for this controller branch.
	 *
	 * @method traverse
	 * @param {Function} func The function to call on traversal. Should return <code>false</code> to stop traversal.
	 */
	traverse(func) {
		function doTraversal(controller, lfunc) {
			const goDeeper = func.call(controller, controller);
			if (controller && goDeeper) {
				const kids = controller.getChildren();
				kids.forEach((kid) => {
					doTraversal(kid, lfunc);
				});
			}
		}

		doTraversal(this, func);
	}

	/**
	 * Iterates over controller hierarchy starting with this controller. The currently visited controller
	 * is passed as parameter to specified function. If the function returns <code>true</code> the iteration stops at
	 * current controller. If given function returns nothing or <code>false</code> iteration goes on.<br/>
	 * Please refer to {{#crossLink "ModelController/traverse:method"}}{{/crossLink}} too.
	 *
	 * @method iterate
	 * @param {Function} func The function to call when visiting controller. Should return <code>true</code> to stop
	 * iteration at current controller.
	 * @since 1.6.0
	 */
	iterate(func) {
		function _iterate(controller, lfunc) {
			let stop = !!func.call(controller, controller);
			if (controller && !stop) {
				let i;
				let n;
				const kids = controller.getChildren();

				for (i = 0, n = kids.length; i < n && !stop; i += 1) {
					stop = _iterate(kids[i], lfunc);
				}
			}
			return stop;
		}

		_iterate(this, func);
	}

	/**
	 * Creates and returns a new Feedback instance.</br>
	 * Note: this method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method createFeedback
	 * @return {Feedback} A new Feedback instance.
	 */
	createFeedback() {}

	/**
	 * Called on Controller look up. Subclasses can overwrite if they want to handle events. Default
	 * implementation returns <code>false</code>
	 *
	 * @method _stopLookUp
	 * @param {Point} location The current location
	 * @return {Boolean} <code>true</code> to stop controller look up at this controller, <code>false</code> to go on.
	 * @private
	 * @deprecated DON'T USE!! CURRENTLY ONLY FOR TESTING AND SUBJECT TO BE REMOVED...
	 */
	_stopLookUp(location) {
		// TODO at least rename method! this signals if events at this location are handled by current controller
		// itself...
		return false;
	}
}

export default ModelController;
