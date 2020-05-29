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
	GraphUtils,
} from '@cedalo/jsg-core';
import RootController from '../../graph/controller/RootController';

/**
 * Viewers are used to display a hierarchy of {{#crossLink "ModelController"}}{{/crossLink}}s. At
 * the top there is always a so called root controller to have a well defined hierarchy root. Hence, the default root
 * controller is an instance of {{#crossLink "RootController"}}{{/crossLink}}. Now this root
 * controller defines the actual content controller of the viewer, e.g. for a displayed {{#crossLink
 * "Graph"}}{{/crossLink}} model the content controller will be an instance of {{#crossLink
 * "GraphController"}}{{/crossLink}}. Based on this root the controller hierarchy is build up
 * running from top to bottom where each controller is created using a registered {{#crossLink
 * "GraphControllerFactory"}}{{/crossLink}}. That means the controller hierarchy is simply like
 * <code>RootController -> ContentController -> ModelControllers</code>. For example a displayed
 * <code>Graph</code> has following hierarchy <code>RootController -> GraphController ->
 * GraphItemController[s]</code>.</br> To easily get these controllers each viewer providers corresponding methods like
 * {{#crossLink "ControllerViewer/getRootController:method"}}{{/crossLink}},
 * {{#crossLink "ControllerViewer/getContent:method"}}{{/crossLink}} and various
 * <code>findController</code> methods to search for special controllers within displayed controller hierarchy. </br>
 * To provide default user interaction a viewer also has a default {{#crossLink
 * "Interaction"}}{{/crossLink}} which will be set if no other <code>Interaction</code> is
 * explicitly set to active. This default <code>Interaction</code> will than receive all mouse and key events. Please
 * refer to the {{#crossLinkModule "interaction"}}{{/crossLinkModule}} module for more information on this.
 * It is possible for applications to set their custom default <code>Interaction</code> via
 * {{#crossLink "ControllerViewer/setDefaultInteraction:method"}}{{/crossLink}}.
 * </br>
 * Finally if a viewer is no longer needed it should be destroyed via a call to
 * {{#crossLink "ControllerViewer/destroy:method"}}{{/crossLink}} to free up resources.
 *
 */

/**
 * This is the base viewer class to display a hierarchy of {{#crossLink
 * "ModelController"}}{{/crossLink}}s.</br> Controllers are created by using a controller factory
 * which can be set via
 * {{#crossLink "ControllerViewer/setControllerFactory:method"}}{{/crossLink}}, allowing applications to
 * pass in their own custom factory.</br>
 * To ease the lookup of certain controllers within displayed controller hierarchy this viewer defines some useful
 * <code>find</code>-functions like {{#crossLink
 * "ControllerViewer/findControllerAt:method"}}{{/crossLink}} or {{#crossLink
 * "ControllerViewer/findControllerByConditionAndLocation:method"}}{{/crossLink}}.
 * <b>Note:</b> some provided functions only work if the content controller is a kind of {{#crossLink
 * "GraphController"}}{{/crossLink}}.
 *
 * @class ControllerViewer
 * @constructor
 */
class ControllerViewer {
	constructor() {
		this.rootController = undefined;
		this.controllerFactory = undefined;
		this.setRootController(new RootController());
		this._defaultInteraction = undefined;
		this._defaultController = undefined;
		this._notificationsEnabled = true;
	}

	/**
	 * Call this method if the viewer is no longer used to free up resources.
	 *
	 * @method destroy
	 */
	destroy() {
		this.rootController.deactivate();
		this.rootController = undefined;
		// remove from controller factory...
		if (this.controllerFactory && this.controllerFactory.registerViewer) {
			this.controllerFactory.registerViewer(undefined);
		}
		this.controllerFactory = undefined;
		this._defaultInteraction = undefined;
	}

	/**
	 * Enables or disables notifications for the controller hierarchy of this viewer.</br>
	 * For more information about the notification feature please refer to {{#crossLink
	 * "Notification"}}{{/crossLink}}
	 *
	 * @method enableNotifications
	 * @param {Boolean} doIt Specify <code>true</code> to enable notifications or <code>false</code> to disable them.
	 * @return {Boolean} The previous notification state.
	 * @since 2.0.20.1
	 */
	enableNotifications(doIt) {
		const oldstate = this._notificationsEnabled;
		this._notificationsEnabled = doIt;
		return oldstate;
	}

	/**
	 * Checks if notifications are currently available.</br>
	 * For more information about the notification feature please refer to {{#crossLink
	 * "Notification"}}{{/crossLink}}
	 *
	 * @method areNotificationsEnabled
	 * @return {Boolean} <code>true</code> if notifications are enabled, <code>false</code> otherwise.
	 * @since 2.0.20.1
	 */
	areNotificationsEnabled() {
		return this._notificationsEnabled;
	}


	/**
	 * Called by {{#crossLink "InteractionHandler"}}{{/crossLink}} to give viewer an option to
	 * handle current key event. If passed event should not be processed by <code>InteractionHandler</code> this method
	 * should return
	 * <code>true</code>.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>false</code>.
	 *
	 * @method handleKeyEvent
	 * @param {KeyEvent} event The current key event.
	 * @param {InteractionHandler} intHandler The <code>InteractionHandler</code> which calls
	 *     this method.
	 * @return {Boolean} <code>true</code> if event should not be processed by <code>InteractionHandler</code>,
	 *     <code>false</code> otherwise.
	 * @since 2.0.20.6
	 */
	handleKeyEvent(event, intHandler) {
		return false;
	}

	/**
	 * Called by {{#crossLink "InteractionHandler"}}{{/crossLink}} to give viewer an option to
	 * handle current mouse event. If passed event should not be processed by <code>InteractionHandler</code> this
	 * method should return
	 * <code>true</code>.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>false</code>.
	 *
	 * @method handleMouseEvent
	 * @param {MouseEvent} event The current mouse event.
	 * @param {InteractionHandler} intHandler The <code>InteractionHandler</code> which calls
	 *     this method.
	 * @return {Boolean} <code>true</code> if event should not be processed by <code>InteractionHandler</code>,
	 *     <code>false</code> otherwise.
	 * @since 2.0.20.6
	 */
	handleMouseEvent(event, intHandler) {
		return false;
	}

	/**
	 * Called by {{#crossLink "InteractionHandler"}}{{/crossLink}} to give viewer an option to
	 * handle current gesture event. If passed event should not be processed by <code>InteractionHandler</code> this
	 * method should return
	 * <code>true</code>.</br>
	 * This method is intended to be overwritten by subclasses. Default implementation simply returns
	 * <code>false</code>.
	 *
	 * @method handleGestureEvent
	 * @param {GestureEvent} event The current gesture event.
	 * @param {InteractionHandler} intHandler The <code>InteractionHandler</code> which calls
	 *     this method.
	 * @return {Boolean} <code>true</code> if event should not be processed by <code>InteractionHandler</code>,
	 *     <code>false</code> otherwise.
	 * @since 2.0.20.6
	 */
	handleGestureEvent(event, intHandler) {
		return false;
	}

	/**
	 * The controller factory to use to create {{#crossLink "ModelController"}}{{/crossLink}}s for
	 * a graph model.</br> Applications can register their own factory object to create custom controllers. In order to
	 * make this work the given factory object must implement following methods:
	 * <ul>
	 *    <li><code>getController(model)</code>, which returns a controller for given {{#crossLink
	 * "Model"}}{{/crossLink}}</li>
	 *    <li><code>createController(model)</code>, which creates a new controller for given {{#crossLink
	 * "Model"}}{{/crossLink}}</li>
	 * </ul>
	 * As an example for a valid controller factory refer to {{#crossLink
	 * "GraphControllerFactory"}}{{/crossLink}}.
	 *
	 * @method setControllerFactory
	 * @param {Object} controllFactory The factory object to use to create controllers.
	 */
	setControllerFactory(controllerFactory) {
		this.controllerFactory = controllerFactory;
	}

	/**
	 * Returns the currently used controller factory object.</br>
	 * See {{#crossLink "ControllerViewer/setControllerFactory:method"}}{{/crossLink}}
	 *
	 * @method getControllerFactory
	 * @return {Object} The current controller factory object.
	 */
	getControllerFactory() {
		const fab = this.controllerFactory;
		if (fab && fab.registerViewer) {
			fab.registerViewer(this);
		}
		return fab; // this.controllerFactory;
	}


	/**
	 * Returns the currently displayed graph model.</br>
	 * Note: only works if content controller is an instance of {{#crossLink
	 * "GraphController"}}{{/crossLink}}.
	 *
	 * @method getGraph
	 * @return {Graph} The displayed graph model or <code>undefined</code>.
	 */
	getGraph() {
		const content = this.rootController.getContent();
		return content ? content.getModel() : undefined;
	}

	/**
	 * Specifies the graph model to display.
	 *
	 * @method setGraph
	 * @param {Graph} model The graph model to display.
	 */
	setGraph(model) {
		const controller = this.controllerFactory.createController(model);
		this.setContent(controller);
		this.getRootView().invalidate();
	}


	/**
	 * Returns the currently specified default controller which was previously set via
	 * {{#crossLink "ControllerViewer/setDefaultController:method"}}{{/crossLink}}. If no controller was
	 * specified as default before <code>undefined</code> is returned.
	 *
	 * @method getDefaultController
	 * @return {ModelController} The current default controller or <code>undefined</code>.
	 */
	getDefaultController() {
		return this._defaultController;
	}

	/**
	 * Specifies given controller as new default controller which can be accessed via
	 * {{#crossLink "ControllerViewer/getDefaultController:method"}}{{/crossLink}}.
	 *
	 * @method setDefaultController
	 * @param {ModelController} controller The new default controller.
	 */
	setDefaultController(controller) {
		this._defaultController = controller;
	}


	/**
	 * Returns the currently used default interaction.</br>
	 * Refer to {{#crossLink "ControllerViewer/setDefaultInteraction:method"}}{{/crossLink}} for more
	 * information.
	 *
	 * @method getDefaultInteraction
	 * @return {Interaction} The default interaction to use for this viewer.
	 */
	getDefaultInteraction() {
		return this._defaultInteraction;
	}

	/**
	 * Sets the new default interaction for this viewer.<br/>
	 * A default interaction is the main interaction which is used when no other interaction is currently active.
	 * Therefore it determines the fundamental behaviour of the viewer. Usually a default interaction is composed of
	 * several sub interactions. If this is the case it is a good idea to subclass InteractionDispatcher.<br/>
	 * <b>Note:</b> a default interaction can provide an <code>initAsDefault(controllerViewer)</code> and a
	 * <code>disposeAsDefault(controllerViewer)</code> function which are called only on registration and
	 * deregistration
	 * respectively.
	 *
	 * @method setDefaultInteraction
	 * @param {Interaction} interaction The new default interaction to use.
	 */
	setDefaultInteraction(interaction) {
		if (this._defaultInteraction && this._defaultInteraction.disposeAsDefault) {
			this._defaultInteraction.disposeAsDefault(this);
		}
		this._defaultInteraction = interaction;
		if (this._defaultInteraction && this._defaultInteraction.initAsDefault) {
			this._defaultInteraction.initAsDefault(this);
		}
	}


	/**
	 * Returns the content controller of current root controller. The content controller defines what is currently
	 * displayed within this viewer. If no content was set <code>undefined</code> is returned.</br>
	 *
	 * @method getContent
	 * @return {ModelController} The content controller or <code>undefined</code>.
	 */
	getContent() {
		return this.rootController.getContent();
	}

	/**
	 * Specifies the new content of current root controller.</br>
	 * E.g. to display a {{#crossLink "Graph"}}{{/crossLink}} model the content controller should can
	 * be an instance of {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method setContent
	 * @param {ModelController} controller The new root controller content.
	 */
	setContent(controller) {
		if (controller) {
			this.rootController.setContent(controller);
		}
	}

	/**
	 * Specifies a new root controller.</br>
	 * The root controller specifies the content to display within this viewer. E.g. if a viewer displays a
	 * {{#crossLink "Graph"}}{{/crossLink}} model the root controller should return an instance of
	 * {{#crossLink "GraphController"}}{{/crossLink}}. Therefore the root controller defines the
	 * top of the controller hierarchy and should always be given. By default a {{#crossLink
	 * "RootController"}}{{/crossLink}} is used.
	 *
	 * @method setRootController
	 * @param {ModelController} modelController The new root controller.
	 */
	setRootController(modelController) {
		this._deactivate(modelController);
		this._activate(modelController);
	}

	/**
	 * Deactivates given root controller.
	 *
	 * @method _deactivate
	 * @param {ModelController} controller The controller to deactivate.
	 * @private
	 */
	_deactivate(controller) {
		if (controller) {
			if (controller.isActive) {
				controller.deactivate();
			}
			// free view reference...
			controller.setView(undefined);
		}
	}

	/**
	 * Sets and activated given controller as new root controller.
	 *
	 * @method _activate
	 * @param {ModelController} controller The new root controller.
	 * @private
	 */
	_activate(controller) {
		this.rootController = controller;
		this.rootController.setViewer(this);
		this.rootController.activate();
	}

	/**
	 * Returns the currently used root controller.
	 *
	 * @method getRootController
	 * @return {ModelController} The currently used root controller.
	 */
	getRootController() {
		return this.rootController;
	}


	/**
	 * Returns the view of current root controller.
	 *
	 * @method getRootView
	 * @return {View} The root controller view.
	 */
	getRootView() {
		return this.rootController.getView();
	}

	collectVisibleControllersAt(location, controllers) {
		return this.rootController.collectVisibleControllersAt(location, controllers);
	}

	/**
	 * Returns a suitable controller for the specified location. A suitable controller must fulfill the (optional)
	 * given
	 * condition function.
	 *
	 * @method findControllerAt
	 * @param {Point} location Coordinate point to find controller at.
	 * @param {Shape.FindFlags} flags Find logic flag. Depending on the flag, the search algorithm
	 *     behaves different.
	 * @param {Function} [conditionFunc] Should return <code>true</code> if passed controller is accepted,
	 *     <code>false</code> otherwise.
	 * @return {GraphItemController} A controller or undefined if none is found.
	 */
	findControllerAt(location, flags, conditionFunc) {
		return this.rootController.getControllerAt(location, flags, conditionFunc);
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
		return this.rootController.findControllerByConditionAndLocation(location, condition);
	}

	/**
	 * Returns first controller which fulfills given condition function or <code>undefined</code> if none could be
	 * found.</br> The search is solely based on provided condition function, which gets called with a controller and
	 * specified BoundingBox. The condition should return <code>true</code> if passed controller is valid and to stop
	 * the search, otherwise <code>false</code> to go on.
	 *
	 * @method findControllerByConditionAndBox
	 * @param {BoundingBox} box A BoundingBox instance to pass to condition function.
	 * @param {Function} condition A condition function to check any possible controllers.
	 * @return {ModelController} A valid controller or <code>undefined</code>
	 */
	findControllerByConditionAndBox(box, condition) {
		// check root
		return this.rootController.findControllerByConditionAndBox(box, condition);
	}


	/**
	 * Convenience method to pass new cursor style to the root controller content.<br/>
	 * See {{#crossLink "Cursor.Style"}}{{/crossLink}} for predefined style constants.</br>
	 * Note: only works if content controller is an instance of {{#crossLink
	 * "GraphController"}}{{/crossLink}}.
	 *
	 * @method setCursor
	 * @param {String} cursor A cursor style name.
	 */
	setCursor(name) {
		if (this.rootController.hasContent()) {
			this.rootController.getContent().setCursor(name);
		}
	}

	/**
	 * Convenience method to register a feedback view to root controller content.<br/>
	 * This should only be called if content is an instance of {{#crossLink
	 * "GraphController"}}{{/crossLink}}.
	 *
	 * @method addInteractionFeedback
	 * @param {View} view The feedback view to register.
	 */
	addInteractionFeedback(view) {
		if (this.rootController.hasContent()) {
			this.rootController.getContent().addFeedback(view);
		}
	}

	/**
	 * Convenience method to unregister a feedback view from root controller content.<br/>
	 * This should only be called if content is an instance of {{#crossLink
	 * "GraphController"}}{{/crossLink}}.
	 *
	 * @method removeInteractionFeedback
	 * @param {View} view The feedback view to unregister.
	 */
	removeInteractionFeedback(view) {
		if (this.rootController.hasContent()) {
			this.rootController.getContent().removeFeedback(view);
		}
	}

	/**
	 * Convenience method to remove all registered a feedback views from root controller content.<br/>
	 * This should only be called if content is an instance of {{#crossLink
	 * "GraphController"}}{{/crossLink}}.
	 *
	 * @method clearInteractionFeedback
	 */
	clearInteractionFeedback() {
		if (this.rootController.hasContent()) {
			this.rootController.getContent().clearFeedback();
		}
	}

	/**
	 * Convenience method to get the layer with specified from root controller content.<br/>
	 * For more information about the layer feature refer to {{#crossLink
	 * "GraphView"}}{{/crossLink}}.</br> This should only be called if content is an instance of
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method getLayer
	 * @param {String} layerId The id of the layer to get the views for.
	 * @return {Array} A list of {{#crossLink "View"}}{{/crossLink}}s registered for specified layer.
	 */
	getLayer(layerId) {
		return this.rootController.hasContent() ? this.rootController.getContent().getLayer(layerId) : undefined;
	}

	/**
	 * Convenience method to check if root controller content has secified layer.<br/>
	 * For more information about the layer feature refer to {{#crossLink
	 * "GraphView"}}{{/crossLink}}.</br> This should only be called if content is an instance of
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method hasLayer
	 * @param {String} layerId The id of the layer to check for.
	 * @return {Boolean} <code>true</code> if content has a non empty layer registered with specified id,
	 *     <code>false</code> otherwise.
	 */
	hasLayer(layerId) {
		return this.rootController.hasContent() ? this.rootController.getContent().hasLayer(layerId) : false;
	}

	/**
	 * Convenience method to remove specified layer from root controller content.<br/>
	 * For more information about the layer feature refer to {{#crossLink
	 * "GraphView"}}{{/crossLink}}.</br> This should only be called if content is an instance of
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method clearLayer
	 * @param {String} layerId The id of the layer to remove.
	 * @return {Array} Removed layer as convenience or <code>undefined</code> if no layer with given id was registered
	 *     before.
	 */
	clearLayer(layerId) {
		return this.rootController.hasContent() ? this.rootController.getContent().clearLayer(layerId) : undefined;
	}

	/**
	 * Convenience method to remove all layers from root controller content.<br/>
	 * For more information about the layer feature refer to {{#crossLink
	 * "GraphView"}}{{/crossLink}}.</br> This should only be called if content is an instance of
	 * {{#crossLink "GraphController"}}{{/crossLink}}.
	 *
	 * @method clearAllLayer
	 */
	clearAllLayer() {
		if (this.rootController.hasContent()) {
			this.rootController.getContent().clearAllLayer();
		}
	}

	clearAllOverlays() {
		if (this.rootController.hasContent()) {
			const view = this.rootController.getContent().getView();
			if (view) {
				view.clearAllOverlays();
			}
		}
	}

	/**
	 * Translates given point from root controller view.</br>
	 * That means that the translation and rotation of root controller view is applied to given point.
	 *
	 * @method translateFromParent
	 * @param {Point} point The point to translate.
	 * @return {Point} The given and now translated point as convenience.
	 */
	translateFromParent(point) {
		return this.rootController.getView().translateFromParent(point);
	}

	/**
	 * Translates given point to root controller view.</br>
	 * That means that the translation and rotation of root controller view is applied to given point.
	 *
	 * @method translateFromParent
	 * @param {Point} point The point to translate.
	 * @return {Point} The given and now translated point as convenience.
	 */
	translateToParent(point) {
		return this.rootController.getView().translateToParent(point);
	}

	_translateToParent(point) {
		return this.rootController.getView()._translateToParent(point);
	}

	/**
	 * Translates given point from specified view to the root view of the controller hierarchy.
	 *
	 * @method translateToRoot
	 * @param {Point} point The point to translate.
	 * @param {GraphItemView} fromView The view to start translation from, inclusively.
	 * @return {Point} The given and now translated point as convenience.
	 */
	translateToRoot(point, fromView) {
		const root = this.rootController.getView();
		while (fromView._parent && fromView._parent !== root) {
			fromView._parent.translateToParent(point);
			fromView = fromView._parent;
		}
		return point;
	}

	/**
	 * Translates given point from the root view of the controller hierarchy to the specified view.
	 *
	 * @method translateFromRoot
	 * @param {Point} point The point to translate.
	 * @param {GraphItemView} [toView] The view to stop translation at. If not specified the root
	 *     controller view is used.
	 * @return {Point} The given and now translated point as convenience.
	 */
	translateFromRoot(point, toView) {
		const root = this.rootController.getView();

		function translation(v) {
			v.translateFromParent(point);
		}

		toView = toView || root;
		GraphUtils.traverseDown(root, toView, translation);
		return point;
	}
}

export default ControllerViewer;
