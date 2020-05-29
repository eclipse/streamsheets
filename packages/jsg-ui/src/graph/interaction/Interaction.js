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
import { default as JSG, Shape, Point } from '@cedalo/jsg-core';
import LayerId from '../view/LayerId';
import ClientEvent from '../../ui/events/ClientEvent';

/**
 * An Interaction is used to perform a more or less complex user task which is driven by mouse, key
 * or touch events. Only one Interaction can be active at a time and the currently active Interaction
 * will receive all generated user events. To activate an Interaction simply set it via the
 * {{#crossLink "InteractionHandler/setActiveInteraction:method"}}{{/crossLink}} method.</br>
 * Often an Interaction must handle many different tasks. To not clutter up a single Interaction which
 * surely will get unable to maintain it is better to split it into several smaller Interactions.
 * The framework supports this by providing the idea of an InteractionDispatcher which internally
 * uses InteractionActivators to activate the corresponding Interaction for each different task.</br>
 * For more information about this refer to the {{#crossLink
 * "InteractionDispatcher"}}{{/crossLink}} and {{#crossLink
 * "InteractionActivator"}}{{/crossLink}} classes. And for an example of an InteractionDispatcher
 * look at {{#crossLink "GraphInteraction"}}{{/crossLink}}.</br> Some Interactions support the
 * usage of a {{#crossLink "Delegate"}}{{/crossLink}} object which allows to influence the
 * Interaction behavior. These objects are always optional and if not provided the default interaction behavior is
 * performed. Since a delegate is special to an Interaction only a simple global interface is provided for them.
 * Therefore please refer to the Interaction of interest to get more information about its delegate support.
 */

/**
 * Base class for an Interaction.</br>
 * Provides stubs for all event functions which can be overwritten by subclasses.</br>
 * Note: besides the <code>activate</code> and <code>deactivate</code> methods a simple default Interaction
 * lifecycle is given. To normally finish an Interaction call {{#crossLink
 * "Interaction/finishInteraction:method"}}{{/crossLink}}. In analog a call to {{#crossLink
 * "Interaction/cancelInteraction:method"}}{{/crossLink}} signals an abnormal finish and cancels
 * this Interaction. Notice that in both cases {{#crossLink
 * "Interaction/didFinish:method"}}{{/crossLink}} gets called. As default the normal Interaction
 * termination is triggered by {{#crossLink "Interaction/onMouseUp:method"}}{{/crossLink}} and
 * canceled by {{#crossLink "Interaction/onMouseExit:method"}}{{/crossLink}}. To generally cancel
 * an Interaction on mouse or key event
 * {{#crossLink "Interaction/doCancelInteractionExit:method"}}{{/crossLink}}
 * is requested and can be overwritten by subclasses.<br/>
 * Here is a brief summary of the Interaction lifecycle:
 * <ul>
 *    <li>activate - called on Interaction activation: good place for initialization
 *    <li>finishInteraction - called on normal finish
 *    <li>willFinish - called by <code>finishInteraction</code>: good place to execute a corresponding Command
 *    <li>cancelInteraction - called on unnormal finish: good place to perform recover tasks
 *    <li>didFinish - called to signal Interaction has finished: can be used to clean up
 *    <li>deactivate - called on Interaction deactivation: final possibility to perform clean up tasks
 * <ul>
 *
 * @class Interaction
 * @constructor
 */
class Interaction {
	constructor() {
		/**
		 * The location at which this Interaction has started.
		 * @property startLocation
		 * @type {Point}
		 */
		this.startLocation = new Point(0, 0);
		/**
		 * The current location of this Interaction.
		 * @property currentLocation
		 * @type {Point}
		 */
		this.currentLocation = new Point(0, 0);
		/**
		 * Convenient property to save a last location of interest.
		 * @property lastLocation
		 * @type {Point}
		 */
		this.lastLocation = new Point(0, 0);
		/**
		 * The InteractionHandler which activated this Interaction. Can be <code>undefined</code>.
		 * @property interactionHandler
		 * @type {InteractionHandler}
		 */
		this.interactionHandler = undefined;
		/**
		 * An optional delegate object.
		 *
		 * @property _delegate
		 * @type {Object}
		 * @private
		 */
		this._delegate = undefined;
	}

	/**
	 * Returns the InteractionHandler which has activated this Interaction.
	 *
	 * @method getInteractionHandler
	 * @return {InteractionHandler} The currently used InteractionHandler or
	 *     <code>undefined</code>.
	 */
	getInteractionHandler() {
		return this.interactionHandler;
	}

	/**
	 * Used by InteractionHandler upon activation to register itself.
	 *
	 * @method setInteractionHandler
	 * @param {InteractionHandler} interactionHandler The InteractionHandler which activates this
	 *     interaction.
	 */
	setInteractionHandler(interactionHandler) {
		this.interactionHandler = interactionHandler;
	}

	/**
	 * Sets the optional delegate for this interaction.</br>
	 * A delegate will be notified and consulted during the interaction. With a delegate its is possible
	 * to influence the behavior of an interaction. The delegate is optional meaning that if none is
	 * provided the default interaction behavior is performed. The methods a delegate must or should
	 * implement is different for most interactions. Therefore refer to the various interaction
	 * subclasses to get information about its delegate support.
	 *
	 * @method setDelegate
	 * @param {Object} delegate A delegate object to get customize interaction.
	 */
	setDelegate(delegate) {
		this._delegate = delegate;
	}

	/**
	 * Calls given function on an optional registered delegate object.</br>
	 * This method takes a variable amount of parameters, depending on the function to call. However,
	 * the first passed parameter must be the name of the function to call on delegate object.
	 *
	 * @method _notifyDelegate
	 * @param args* Arguments to pass to the function. First argument must be the name of the function to call on
	 *     delegate object.
	 * @return {Object} The value returned by called function. Maybe <code>undefined</code>.
	 * @private
	 */
	_notifyDelegate(...args) {
		if (this._delegate) {
			const funcstr = Array.prototype.shift.call(args);
			if (typeof this._delegate[funcstr] === 'function') {
				Array.prototype.unshift.call(args, this);
				// eslint-disable-next-line prefer-spread
				return this._delegate[funcstr].apply(this._delegate, args);
			}
		}
		return undefined;
	}

	/**
	 * Returns the ControllerViewer used by registered InteractionHandler. This function is simply a
	 * shortcut for <code>getInteractionHandler().getViewer()</code>.
	 *
	 * @method getViewer
	 * @return {ControllerViewer} The ControllerViewer or <code>undefined</code>.
	 */
	getViewer() {
		return this.interactionHandler ? this.interactionHandler.viewer : undefined;
	}

	/**
	 * Called by {{#crossLink "InteractionHandler"}}{{/crossLink}} to activate this interaction.
	 * Subclasses can override, default implementation does nothing.
	 *
	 * @method activate
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	activate(viewer) {
		if (viewer/* && viewer instanceof GraphViewer */) {
			const g = viewer.getGraph();
			if (g) {
				g._blockLayout = true;
			}
		}
		if (this._delegate && this._delegate.activate) {
			this._delegate.activate(this, viewer);
		}
	}

	/**
	 * Called by {{#crossLink "InteractionHandler"}}{{/crossLink}} to deactivate this interaction.
	 * Subclasses can override, default implementation does nothing.
	 *
	 * @method deactivate
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	deactivate(viewer) {
		if (viewer /* && viewer instanceof GraphViewer */) {
			viewer.clearLayer(LayerId.LAYOUTMARKER);
			viewer.clearLayer(LayerId.TARGETCONTAINER);
			viewer.clearLayer(LayerId.SNAPLINES);

			viewer.clearInteractionFeedback();
			const g = viewer.getGraph();
			if (g) {
				delete g._blockLayout;
			}
		}
		if (this._delegate && this._delegate.deactivate) {
			this._delegate.deactivate(this, viewer);
		}
		// was to greedy: sometimes sub Interactions finish and call getInteractionHandler afterwards
		//= > e.g. MoveInteraction#onMouseUp...
		// this.interactionHandler = undefined;
	}

	/**
	 * Framework internal method. Should usually not be overwritten by custom subclasses.
	 *
	 * @method isScrollBarEvent
	 * @return {Boolean} <code>true</code> if event is handled by a scrollbar, <code>false</code> otherwise.
	 * @deprecated Don't use! Currently under review and subject to change!!
	 */
	isScrollBarEvent() {
		// TODO this function is only needed for autoscroll feature. can do better????
		// NOTE: isScrollBarEvent is decorated by ScrollableViewerInteractionDecorator!!
		return false;
	}

	/**
	 * Called or should be called on normal Interaction termination.</br>
	 * This function is split into <code>willFinish</code> and <code>didFinish</code>. So it is rarely
	 * required to overwrite <code>finishInteraction</code>. Instead <code>willFinish</code> should
	 * be overwritten.
	 *
	 * @method finishInteraction
	 * @param {ClientEvent} [event] The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	finishInteraction(event, viewer) {
		this.willFinish(event, viewer);
		this.didFinish(event, viewer);
	}

	/**
	 * Called during finishing this Interaction.</br>
	 * Subclasses should overwrite to perform normal finish tasks. Default implementation does nothing.
	 *
	 * @method willFinish
	 * @param {ClientEvent} [event] The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	willFinish(event, viewer) {}

	/**
	 * Called after this Interaction terminated normally or not normally.</br>
	 * Default implementation simply deactivates this Interaction by setting the default Interaction of
	 * inner InteractionHandler to active.</br>
	 * Subclasses may overwrite but should call this method.
	 *
	 * @method didFinish
	 * @param {ClientEvent} [event] The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */

	didFinish(event, viewer) {
		const interactionHandler = this.getInteractionHandler();
		interactionHandler.setActiveInteraction(interactionHandler.getDefaultInteraction());
	}

	/**
	 * Called or should be called on not normal Interaction termination.</br>
	 * Default implementation simply calls <code>didFinish</code>, so subclasses may overwrite.
	 *
	 * @method cancelInteraction
	 * @param {ClientEvent} [event] The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	cancelInteraction(event, viewer) {
		this.didFinish(event, viewer);
	}

	/**
	 * Called to check if an interaction shall be cancelled upon given event.</br>
	 * This method is called by {{#crossLink "InteractionHandler"}}{{/crossLink}} on event
	 * processing to interrupt this interaction before it processes specified event.<br/> Default implementation simply
	 * checks for {{#crossLink "ClientEvent.KeyType.ESC:property"}}{{/crossLink}} being pressed. Subclasses may
	 * overwrite but should call this method to support cancel on ESC.
	 *
	 * @method doCancelInteraction
	 * @param {ClientEvent} event The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} True, to cancel interaction, false to continue.
	 */
	doCancelInteraction(event, viewer) {
		return event && event.key === ClientEvent.KeyType.ESC;
		// return false;
	}

	/**
	 * A condition function used for looking up {{#crossLink
	 * "ModelController"}}{{/crossLink}}.</br> Subclasses should overwrite, default implementation
	 * simply returns <code>true</code>.
	 *
	 * @method condition
	 * @param {ModelController} controller The controller to check.
	 * @return {Boolean} <code>true</code> if given controller fulfills this condition, <code>false</code> otherwise.
	 */
	condition(controller) {
		// TODO seems to be here only for GraphInteraction => remove => review various Viewer#findController
		// functions...
		return true;
	}

	/**
	 * Called when the canvas size has changed. If an interaction does not handle this, it should return
	 * <code>false</code> so that the InteractionHandler performs the default action.
	 *
	 * @method onResizeCanvas
	 * @param {Number} width The new canvas width.
	 * @param {Number} height The new canvas height.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if Interaction handles resize, <code>false</code> otherwise.
	 */
	onResizeCanvas(width, height, viewer) {
		return false;
	}

	/**
	 * Called to handle paste in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPaste
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @since 3.0
	 */
	onPaste(event, viewer) {}

	/**
	 * Called to handle mouse down with right mouse button in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onRightMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @since 3.0
	 */
	onRightMouseDown(event, viewer) {}

	/**
	 * Called to handle right mouse up in interaction specifically.</br>
	 * Default implementation finishes the interaction.
	 *
	 * @method onRightMouseUp
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onRightMouseUp(event, viewer) {}

	/**
	 * Called to handle mouse down in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseDown(event, viewer) {}

	/**
	 * Called to handle mouse double click in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onMouseDoubleClick
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseDoubleClick(event, viewer) {}

	/**
	 * Called to handle mouse move in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseMove(event, viewer) {}

	/**
	 * Called to handle mouse move in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onMouseMove
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseDrag(event, viewer) {}

	/**
	 * Called to handle mouse up in interaction specifically.</br>
	 * Default implementation finishes the interaction.
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseUp(event, viewer) {
		this.finishInteraction(event, viewer);
	}

	/**
	 * Called to handle mouse exit in interaction specifically.</br>
	 * Default implementation cancels the interaction.
	 *
	 * @method onMouseExit
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseExit(event, viewer) {
		this.cancelInteraction(event, viewer);
	}

	/**
	 * Called to handle mouse wheel in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onMouseWheel
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onMouseWheel(event, viewer) {}

	/**
	 * Called to handle drag enter in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onDragEnter
	 * @param {DragEvent} event The corresponding drag event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onDragEnter(event, viewer) {}

	/**
	 * Called to handle drag exit in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onDragExit
	 * @param {DragEvent} event The corresponding drag event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onDragExit(event, viewer) {}

	/**
	 * Called to handle drag leave in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onDragLeave
	 * @param {DragEvent} event The corresponding drag event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onDragLeave(event, viewer) {}

	/**
	 * Called to handle drag over in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onDragOver
	 * @param {DragEvent} event The corresponding drag event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onDragOver(event, viewer) {}

	/**
	 * Called to handle drop in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onDrop
	 * @param {DragEvent} event The corresponding drag event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onDrop(event, viewer) {}

	/**
	 * Called to handle rotation start in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onRotateStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onRotateStart(event, viewer) {}

	/**
	 * Called to handle rotation progress in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onRotate
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onRotate(event, viewer) {}

	/**
	 * Called to handle rotation finish in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onRotateEnd
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onRotateEnd(event, viewer) {}

	/**
	 * Called to handle pinch start in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPinchStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPinchStart(event, viewer) {}

	/**
	 * Called to handle pinch progress in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPinch
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPinch(event, viewer) {}

	/**
	 * Called to handle pinch finish in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPinchFinish
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPinchEnd(event, viewer) {}

	/**
	 * Called to handle pan start in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPanStart
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPanStart(event, viewer) {}

	isUsingPan() {
		return false;
	}

	/**
	 * Called to handle pan action in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPan
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPan(event, viewer) {}

	/**
	 * Called to handle pan end in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onPanEnd
	 * @param {GestureEvent} event The current gesture event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onPanEnd(event, viewer) {}

	onHold(event, viewer) {}

	/**
	 * Called to handle key down action in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onKeyDown
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onKeyDown(event, viewer) {}

	/**
	 * Called to handle key up action in interaction specifically.</br>
	 * Default implementation does nothing.
	 *
	 * @method onKeyUp
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	onKeyUp(event, viewer) {}

	onApplyAttributes(map, listpath, viewer) {
		return false;
	}

	canApplyAttributes(map, listpath, viewer) {
		return false;
	}

	/**
	 * Sets the location, where the interaction takes place. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method setCurrentLocation
	 * @param {Point} point Mouse coordinate.
	 */
	setCurrentLocation(point) {
		this.currentLocation.setTo(point);
	}

	/**
	 * Gets the location, where the interaction takes place. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method getCurrentLocation
	 * @return {Point} point Mouse coordinate.
	 */
	getCurrentLocation() {
		return this.currentLocation;
	}

	/**
	 * Sets the location, where the interaction initially started. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method setStartLocation
	 * @param {Point} point Mouse coordinate.
	 */
	setStartLocation(point) {
		this.startLocation.setTo(point);
	}

	/**
	 * Gets the location, where the interaction initially started. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method getStartLocation
	 * @param {Point} point Mouse coordinate.
	 */
	getStartLocation() {
		return this.startLocation;
	}

	/**
	 * Sets the location of previous interaction coordinate. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method setLastLocation
	 * @param {Point} point Mouse coordinate.
	 */
	setLastLocation(point) {
		this.lastLocation.setTo(point);
	}

	/**
	 * Gets the location of previous interaction coordinate. This information is set by the InteractionHandler
	 * and can be used by the interaction for processing it.
	 *
	 * @method getLastLocation
	 * @param {Point} point Mouse coordinate.
	 */
	getLastLocation() {
		return this.lastLocation;
	}

	/**
	 * Gets the current cursor setting.
	 *
	 * @method getCursor
	 * @return {String} Cursor name
	 */
	getCursor() {
		return this.interactionHandler.getCursor();
		// "auto";
	}

	/**
	 * Set a new cursor.
	 *
	 * @method setCursor
	 * @param {String} cursor New cursor name.
	 */
	setCursor(cursor) {
		this.interactionHandler.setCursor(cursor);
	}

	setRepaintOnDrag(event) {
		event.doRepaint = true;
	}

	/**
	 * Called to retrieve a controller at the given location. If a condition is provided, the function will
	 * be called before the location is checked. This way e.g. you can check for visibility or other status flags.
	 *
	 * @method getControllerAtLocation
	 * @param {Point} location Coordinates to check
	 * @param {Function} [conditionFunc] If specified, it will be called first before location is checked.
	 * @return {GraphItemController} Returns a contoller, if the item is at the location and the
	 *     option condition evaluates to true.
	 */

	getControllerAtLocation(location, conditionFunc) {
		const { viewer } = this.interactionHandler;
		const condition = conditionFunc || this._allwaysTrueCondition;
		const radius = viewer.getGraph().getFindRadius();

		const locationConditionFunc = (controller, loc) => {
			let containsLocation = false;
			const bbox = controller.getModel().getBoundingBox(JSG.boxCache.get());

			bbox.expandBy(radius);
			if (bbox.containsPoint(loc)) {
				// item box is already checked->check only shape
				if (controller.containsPoint(loc, Shape.FindFlags.AREAWITHFRAME)) {
					containsLocation = condition(controller, loc);
				}
			}
			JSG.boxCache.release(bbox);
			return containsLocation;
		};

		return viewer.findControllerByConditionAndLocation(location, locationConditionFunc);
	}

	_allwaysTrueCondition() {
		return true;
	}

	/**
	 * Checks if align to grid should be done.<br/>
	 * The default implementation simply checks the current {{#crossLink
	 * "GraphSettings"}}{{/crossLink}} and the passed event object.
	 *
	 * @method doAlignToGrid
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if align to grid should be performed, <code>false</code> otherwise.
	 * @since 1.6.0
	 */
	doAlignToGrid(event, viewer) {
		const settings = viewer.getGraphSettings();

		if (event.event.altKey) {
			return settings && !settings.getSnapToGrid();
		}

		return settings && settings.getSnapToGrid();
	}

	/**
	 * Aligns given point to graph grid.<br/>
	 * Note: this method calls {{#crossLink "Interaction/doAlignToGrid:method"}}{{/crossLink}} to
	 * decide if align to grid should be applied.
	 *
	 * @method alignPtToGrid
	 * @param {Point} point Point to align.
	 * @param {ClientEvent} event The current event or <code>undefined</code>.
	 * @param {ControllerViewer} viewer The current ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if point was aligned, <code>false</code> otherwise.
	 * @since 1.6.0
	 */
	alignPtToGrid(position, event, viewer) {
		if (this.doAlignToGrid(event, viewer)) {
			const settings = viewer.getGraphSettings();
			const gridstep = settings.getSnapStep();

			const xdiff = position.x % gridstep;
			const ydiff = position.y % gridstep;

			if (xdiff > gridstep / 2) {
				// snap to next coordinate step
				position.x += gridstep - xdiff;
			} else {
				// use previous
				position.x -= xdiff;
			}

			if (ydiff > gridstep / 2) {
				// snap to next coordinate step
				position.y += gridstep - ydiff;
			} else {
				// use previous
				position.y -= ydiff;
			}
			return true;
		}
		return false;
	}

	/**
	 * Aligns the bounding rectangle of given bounding-box to current graph grid. the offset required to align the
	 * bounding-box is returned.<br/> Note: this method calls {{#crossLink
	 * "Interaction/doAlignToGrid:method"}}{{/crossLink}} to decide if align to grid should be
	 * done.
	 *
	 * @method alignBBoxToGrid
	 * @param {BoundingBox} bbox The bounding-box to align.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current ControllerViewer used by InteractionHandler.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset point. If not provided a
	 *     new one will be created.
	 * @return {Point} The align offset.
	 * @since 1.6.0
	 */
	alignBBoxToGrid(bbox, event, viewer, reusepoint) {
		const topleft = bbox.getTopLeft(JSG.ptCache.get());
		const rect = bbox.getBoundingRectangle(JSG.rectCache.get());
		const offset = this.alignRectToGrid(rect, event, viewer, reusepoint);
		bbox.setTopLeftTo(topleft.add(offset));
		JSG.ptCache.release(topleft);
		JSG.rectCache.release(rect);
		return offset;
	}

	/**
	 * Aligns given rectangle to current graph grid. The offset required to align the rectangle is returned.<br/>
	 * Note: this method calls {{#crossLink "Interaction/doAlignToGrid:method"}}{{/crossLink}} to
	 * decide if align to grid should be done.
	 *
	 * @method alignRectToGrid
	 * @param {Rectangle} rect The rectangle to align.
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The current ControllerViewer used by InteractionHandler.
	 * @param {Point} [reusepoint] An optional point to reuse for returned offset point. If not provided a
	 *     new one will be created.
	 * @return {Point} The align offset.
	 * @since 1.6.0
	 */
	alignRectToGrid(rect, event, viewer, reusepoint) {
		const offset = reusepoint || new Point();
		const tl = JSG.ptCache.get(rect.x, rect.y);
		const tlGrid = JSG.ptCache.get().setTo(tl);
		const br = JSG.ptCache.get(rect.getRight(), rect.getBottom());
		const brGrid = JSG.ptCache.get().setTo(br);
		// align both points to grid:
		offset.set(0, 0);
		if (this.doAlignToGrid(event, viewer)) {
			this.alignPtToGrid(tlGrid, event, viewer);
			this.alignPtToGrid(brGrid, event, viewer);

			offset.x = tl.x - tlGrid.x < br.x - brGrid.x ? tlGrid.x - tl.x : brGrid.x - br.x;
			offset.y = tl.y - tlGrid.y < br.y - brGrid.y ? tlGrid.y - tl.y : brGrid.y - br.y;
			rect.x += offset.x;
			rect.y += offset.y;
		}
		JSG.ptCache.release(tl, tlGrid, br, brGrid);
		return offset;
	}

	/**
	 * Align the given point to the snap settings of the graph.
	 *
	 * @method alignToGrid
	 * @param {Point} point Point to align.
	 * @param {ControllerViewer} viewer Current viewer to use for retrieving the snap setting.
	 * @param {boolean} altKey Flag to indicate, if snap shall be applied or not. True, if yes, otherwise point remains
	 *     unchanged.
	 * @param {Point} [reusepoint] Optional point to reuse.
	 * @return {Point} Aligned point.
	 * @deprecated Use either {{#crossLink
	 *     "AbstractInteraction/alignPtToGrid:method"}}{{/crossLink}},
	 * {{#crossLink "AbstractInteraction/alignBBoxToGrid:method"}}{{/crossLink}} or
	 * {{#crossLink "AbstractInteraction/alignRectToGrid:method"}}{{/crossLink}}.
	 */
	alignToGrid(point, viewer, altKey, reusepoint) {
		const p = reusepoint || new Point(0, 0);

		p.setTo(point);

		const settings = viewer.getGraphSettings();
		if (settings) {
			if ((settings.getSnapToGrid() && altKey) || (!settings.getSnapToGrid() && !altKey)) {
				return p;
			}

			const gridStep = settings.getSnapStep();
			const xdiff = p.x % gridStep;
			const ydiff = p.y % gridStep;

			if (xdiff > gridStep / 2) {
				// snap to next coordinate step
				p.x += gridStep - xdiff;
			} else {
				// use previous
				p.x -= xdiff;
			}

			if (ydiff > gridStep / 2) {
				// snap to next coordinate step
				p.y += gridStep - ydiff;
			} else {
				// use previous
				p.y -= ydiff;
			}
		}
		return p;
	}

	doShowPortHighlights() {
		return false;
	}

	/**
	 * SnapType constants.
	 * <b>Note:</b> for API internal usage only!
	 *
	 * @class SnapType
	 * @constructor
	 * @private
	 */
	static get SnapType() {
		return {
			NONE: 0,
			CENTERX: 1,
			CENTERY: 2,
			LEFT: 4,
			TOP: 8,
			RIGHT: 16,
			BOTTOM: 32
		};
	}

	/**
	 * Static property to globally hide or show an additional action feedback for interactions which supports this
	 * feature.<br/> See {{#crossLink
	 * "AbstractInteraction/createActionFeedback:method"}}{{/crossLink}} too.
	 * @property SHOW_ACTION_FEEDBACK
	 * @type {Boolean}
	 * @since 2.0.20.5
	 */
	static get SHOW_ACTION_FEEDBACK() {
		return false;
	}

}

export default Interaction;
