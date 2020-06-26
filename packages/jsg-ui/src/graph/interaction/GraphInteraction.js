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
import { default as JSG, TextNode, GraphUtils, GraphSettings, Shape } from '@cedalo/jsg-core';
import InteractionDispatcher from './InteractionDispatcher';
import ViewActivator from './ViewActivator';
import CreateEdgeActivator from './CreateEdgeActivator';
import ResizeActivator from './ResizeActivator';
import ReshapeActivator from './ReshapeActivator';
import RotateActivator from './RotateActivator';
import EditTextActivator from './EditTextActivator';
import MoveActivator from './MoveActivator';
import MarqueeActivator from './MarqueeActivator';
import PinchActivator from './PinchActivator';
import TooltipActivator from './TooltipActivator';
import LinkActivator from './LinkActivator';
import PanActivator from './PanActivator';
import ResizeEditEdgeActivator from './ResizeEditEdgeActivator';
import ImageDropActivator from './ImageDropActivator';
import DefaultKeyHandler from './DefaultKeyHandler';
import SelectionVerifier from './SelectionVerifier';
import GraphController from '../controller/GraphController';
import Cursor from '../../ui/Cursor';

/**
 * Our own InteractionDispatcher used as default interaction in {{#crossLink
 * "GraphViewer"}}{{/crossLink}}. By default this interaction is registered for the {{#crossLink
 * "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} view mode within {{#crossLink
 * "GraphEditor"}}{{/crossLink}}.</br> Subclasses can overwrite to register custom {{#crossLink
 * "InteractionActivator"}}{{/crossLink}}s. See {{#crossLink
 * "GraphInteraction/registerActivators:method"}}{{/crossLink}} and to customize activators execution order refer to
 * the various <code>_compareXX</code> or the
 * {{#crossLink "GraphInteraction/sortActivatorsForFunc:method"}}{{/crossLink}} methods.
 *
 * @class GraphInteraction
 * @extends InteractionDispatcher
 * @constructor
 */
class GraphInteraction extends InteractionDispatcher {
	constructor() {
		super();

		// we use our own InteractionActivators:
		this.registerActivators();
		// our default key handler:
		this._keyHandler = new DefaultKeyHandler();
		// our controller on which an event occurred, note this can be influenced by a specifying an appropriate
		// condition function
		this._controller = undefined;
		this._activeHandle = undefined;
		this._cursorChanged = false;
	}

	activate(viewer) {
		super.activate(viewer);
		this._reset(viewer);
	}

	deactivate(viewer) {
		super.deactivate(viewer);
		this._reset(viewer);
	}

	initAsDefault(viewer) {
		super.initAsDefault(viewer);
		const graph = viewer.getGraph();
		const settings = graph ? graph.getSettings() : undefined;
		if (settings) {
			settings.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		}
	}

	/**
	 * Resets this interaction, i.e. clears any temporarily stored information.
	 *
	 * @method _reset
	 * @private
	 */
	_reset(viewer) {
		this._controller = undefined;
		this._activeHandle = undefined;
		this._cursorChanged = false;
	}

	/**
	 * Registers all used activators to this GraphInteraction.<br/>
	 * Note: this method is called during instantiation of a new GraphInteraction instance. Subclasses might overwrite
	 * to add custom activators.
	 *
	 * @method registerActivators
	 */
	registerActivators() {
		this.addActivator(ViewActivator.KEY, new ViewActivator());
		this.addActivator(CreateEdgeActivator.KEY, new CreateEdgeActivator());
		this.addActivator(ResizeActivator.KEY, new ResizeActivator());
		this.addActivator(ReshapeActivator.KEY, new ReshapeActivator());
		this.addActivator(RotateActivator.KEY, new RotateActivator());
		this.addActivator(EditTextActivator.KEY, new EditTextActivator());
		this.addActivator(MoveActivator.KEY, new MoveActivator());
		this.addActivator(MarqueeActivator.KEY, new MarqueeActivator());
		this.addActivator(PinchActivator.KEY, new PinchActivator());
		this.addActivator(PanActivator.KEY, new PanActivator());
		this.addActivator(TooltipActivator.KEY, new TooltipActivator());
		this.addActivator(LinkActivator.KEY, new LinkActivator());
		this.addActivator(ResizeEditEdgeActivator.KEY, new ResizeEditEdgeActivator());
		this.addActivator(ImageDropActivator.KEY, new ImageDropActivator());
	}

	/**
	 * Sets the default handler to use for handling key events.<br/>
	 * The key handler should implement the <code>onKeyDown</code> and <code>onKeyUp</code> methods.
	 * See {{#crossLink "DefaultKeyHandler"}}{{/crossLink}}.
	 *
	 * @method setDefaultKeyHandler
	 * @param {Object} keyHandler The new key handler to use.
	 */
	setDefaultKeyHandler(keyHandler) {
		this._keyHandler = keyHandler;
	}

	condition(controller, location) {
		let child;
		let i;
		let j;
		let model = controller.getModel();

		if (model instanceof TextNode && model.isAssociated()) {
			const parent = controller.getParent();
			if (parent) {
				for (i = 0, j = parent.children.length; i < j; i += 1) {
					child = parent.children[i];
					model = child.getModel();
					if (model instanceof TextNode && model.isAssociated()) {
						if (child.isSelected()) {
							return true;
						}
					}
				}
				if (!parent.isSelected()) {
					const loc = location.copy();
					parent.getModel().translateToParent(loc);
					if (parent.containsPoint(loc, Shape.FindFlags.AREA)) {
						return false;
					}
				}
			}
		}
		return controller.isSelectable();
	}

	getControllerAt(location, flags, condition) {
		flags = flags || Shape.FindFlags.AUTOMATIC;
		let ctrlr = this._controller;
		if (condition || !ctrlr || flags !== Shape.FindFlags.AUTOMATIC) {
			ctrlr = this._findControllerAt(location, flags, condition, this.getViewer());
			// cache search result only no condition was provided...
			this._controller = ctrlr && !condition ? ctrlr : this._controller;
		}
		return ctrlr;
	}

	/**
	 * Checks if a condition function is specified and if not uses the default interaction condition.
	 * Than calls the corresponding <code>findControllerAt</code> method of given viewer.
	 *
	 * @method _findControllerAt
	 * @param {Point} location The location to look at.
	 * @param {Shape.FindFlags} flags Depending on the flag, the search algorithm behaves different.
	 * @param {Function} [condition] An optional condition function. Should return <code>true</code> if passed
	 *     controller is accepted, <code>false</code> otherwise
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @return {ModelController} A suitable model controller or <code>undefined</code> if none
	 * could be found.
	 * @private
	 */
	_findControllerAt(location, flags, condition, viewer) {
		condition = condition || this.condition;
		return viewer.findControllerAt(location, flags, condition);
	}

	getActiveHandle() {
		return this._activeHandle;
	}

	/**
	 * Sets the new active handle.
	 *
	 * @method setActiveHandle
	 * @param {ActionHandle} handle The new active handle.
	 */
	_setActiveHandle(handle) {
		// OLD doesn't work with minify: this._activeHandle = (handle != undefined && handle.getType() != undefined) ?
		// handle : undefined;
		this._activeHandle = undefined;
		if (handle && handle.getType()) {
			this._activeHandle = handle;
		}
		// change cursor if we have a new _activeHandle, otherwise keep current...
		if (this._activeHandle) {
			super.setCursor(this._activeHandle.getCursor());
		} else if (!this._cursorChanged) {
			super.setCursor(Cursor.Style.AUTO);
		}
	}

	/**
	 * Handles a right button mouse click.
	 *
	 * @method handleRightClick
	 * @param {MouseEvent} event The triggering mouse event.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 */
	handleRightClick(event, viewer) {
		const { keyCode } = event.event;
		if (keyCode === 0 || !keyCode) {
			// handle only if no key is pressed
			let controller = this.getControllerAt(event.location, Shape.FindFlags.AREA, this._rightClickCondition);
			controller = this._selectOnRightClick(controller, viewer);
			if (controller instanceof GraphController) {
				// check if we clicked inside selection view:
				const selView = viewer.getSelectionView();
				const location = JSG.ptCache.get().setTo(event.location);
				viewer.translateFromParent(location);
				if (!selView || !selView.containsPoint(location)) {
					viewer.clearSelection(true);
					this.getInteractionHandler().repaint();
				}
				JSG.ptCache.release(location);
			} else if (controller && !controller.isSelected()) {
				viewer.clearSelection(false);
				viewer.select(controller);
				this.getInteractionHandler().repaint();
			}
		}
	}

	/**
	 * Condition function to find a suitable controller on right click.
	 *
	 * @method _rightClickCondition
	 * @param {ModelController} controller The controller to apply condition on.
	 * @param {Point} location The location to look at.
	 * @return {Boolean} <code>true</code> if passed controller matches condition function, <code>false</code> otherwise
	 * @private
	 */
	_rightClickCondition(controller, location) {
		// for right click we want the area to be selectable, even for pools, which are normally only selectable near
		// the border...
		return controller.isSelectable() && controller.containsPoint(location, Shape.FindFlags.AUTOMATIC);
	}

	/**
	 * Checks if given controller can be selected on right click. If so it will be selected, otherwise its parent is
	 * checked. The finally selected controller will be returned. If no controller could be selected
	 * <code>undefined</code> is returned.
	 *
	 * @method _selectOnRightClick
	 * @param {ModelController} controller The controller to check.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @return {ModelController} The selected controller or <code>undefined</code> if none could
	 *     be
	 * selected.
	 * @private
	 */
	_selectOnRightClick(controller, viewer) {
		if (controller && !(controller instanceof GraphController)) {
			// handle part of group:
			const group = GraphUtils.getGroupController(controller, viewer);
			if (group) {
				return group.isSelected()
					? group
					: SelectionVerifier.getDefault().checkSingle(controller, viewer);
			}
			let parent = controller.getParent();
			// handle TextNode:
			const model = controller.getModel();
			if (model instanceof TextNode && model.isAssociated()) {
				parent = model.getParent();
				const parentctrlr = controller.getParent();
				const pbox = parent.getBoundingBox(JSG.boxCache.get());
				const mbox = model.getTranslatedBoundingBox(parent.getParent(), JSG.boxCache.get());
				if (pbox.doesIntersectWith(mbox) && !controller.isSelected()) {
					controller = parentctrlr;
				}
				JSG.boxCache.release(pbox, mbox);
			}
		}
		return controller && !controller.isSelected() ? controller : undefined;
	}

	onResizeCanvas(width, height, viewer) {
		// pass event to edit text activator:
		const activator = this.getActivator(EditTextActivator.KEY);
		return activator ? activator.onResizeCanvas(width, height, viewer, this) : false;
	}

	onRotateStart(event, viewer) {
		const activator = this.getActivator(RotateActivator.KEY);
		if (activator) {
			activator.onRotateStart(event, viewer, this);
		}
	}

	onPinchStart(event, viewer) {
		const activator = this.getActivator(PinchActivator.KEY);
		if (activator) {
			activator.onPinchStart(event, viewer, this);
		}
	}

	onPanStart(event, viewer) {
		const activator = this.getActivator(PanActivator.KEY);
		if (activator) {
			activator.onPanStart(event, viewer, this);
		}
	}

	onMouseDown(event, viewer) {
		if (JSG.touchDevice) {
			// to set active handle
			this.onMouseMove(event, viewer);
			// to reset state
			event.isConsumed = false;
			event.hasActivated = false;
		}

		this._controller = undefined;
		const activators = this.getActivatorsForFunc('onMouseDown');
		this.sortActivatorsForFunc('onMouseDown', activators);

		let i;

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onMouseDown(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onRightMouseDown(event, viewer) {
		if (JSG.touchDevice) {
			// to set active handle
			this.onMouseMove(event, viewer);
			// to reset state
			event.isConsumed = false;
			event.hasActivated = false;
		}

		this._controller = undefined;
		const activators = this.getActivatorsForFunc('onRightMouseDown');
		this.sortActivatorsForFunc('onRightMouseDown', activators);

		let i;

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onRightMouseDown(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	handleContextMenu(event, viewer) {
		this._controller = undefined;
		const activators = this.getActivatorsForFunc('handleContextMenu');
		let i;

		this.sortActivatorsForFunc('handleContextMenu', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].handleContextMenu(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onMouseDoubleClick(event, viewer) {
		this._controller = undefined;
		const activators = this.getActivatorsForFunc('onMouseDoubleClick');
		let i;

		this.sortActivatorsForFunc('onMouseDoubleClick', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onMouseDoubleClick(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onMouseMove(event, viewer) {
		this._reset(viewer);
		const activators = this.getActivatorsForFunc('onMouseMove');
		let i;

		this.sortActivatorsForFunc('onMouseMove', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onMouseMove(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}

		this._updateCursor(event, viewer);
	}

	/**
	 * Called to handle mouse wheel in interaction. Here we change the zoom factor.
	 *
	 * @method onMouseWheel
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @since 1.6.0
	 */
	onMouseWheel(event, viewer) {
		if (event && event.event.ctrlKey && !event.event.altKey) {
			viewer.setWheelZoom(event);
			return;
		}

		const activators = this.getActivatorsForFunc('onMouseWheel');
		let i;

		this.sortActivatorsForFunc('onMouseWheel', activators);
		for (i = 0; i < activators.length; i += 1) {
			activators[i].onMouseWheel(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	/**
	 * Internal method to track cursor update.
	 *
	 * @method _updateCursor
	 * @param {ClientEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_updateCursor(event, viewer) {
		let handle;
		// don't change handle/cursor if event was consumed => auto cursor
		if (!event.isConsumed && !event.hasActivated) {
			if (viewer.hasSelection()) {
				const loc = JSG.ptCache.get().setTo(event.location);
				viewer.translateFromParent(loc);
				handle = viewer.getHandleAt(loc, event);
				JSG.ptCache.release(loc);
			}
			this._setActiveHandle(handle);
		}
	}

	// overwritten: called by activators => we mark that they changed cursor
	setCursor(cursor) {
		this._cursorChanged = true;
		super.setCursor(cursor);
	}

	onMouseDrag(event, viewer) {
		const activators = this.getActivatorsForFunc('onMouseDrag');
		let i;

		this.sortActivatorsForFunc('onMouseDrag', activators);
		for (i = 0; i < activators.length; i += 1) {
			activators[i].onMouseDrag(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onMouseUp(event, viewer) {
		// don't handle event if it was consumed, this will prevent a second selection on document event dispatch...
		if (!event.isConsumed) {
			this._controller = undefined;

			const activators = this.getActivatorsForFunc('onMouseUp');
			let i;

			this.sortActivatorsForFunc('onMouseUp', activators);
			for (i = 0; i < activators.length; i += 1) {
				activators[i].onMouseUp(event, viewer, this);
				if (event.hasActivated === true) {
					break;
				}
			}

			this._updateCursor(event, viewer);
		}
	}

	onRightMouseUp(event, viewer) {
		// don't handle event if it was consumed, this will prevent a second selection on document event dispatch...
		if (!event.isConsumed) {
			this._controller = undefined;

			const activators = this.getActivatorsForFunc('onRightMouseUp');
			let i;

			this.sortActivatorsForFunc('onRightMouseUp', activators);
			for (i = 0; i < activators.length; i += 1) {
				activators[i].onRightMouseUp(event, viewer, this);
				if (event.hasActivated === true) {
					break;
				}
			}

			this._updateCursor(event, viewer);
		}
	}

	onDrop(event, viewer) {
		const activators = this.getActivatorsForFunc('onDrop');
		let i;

		this.sortActivatorsForFunc('onDrop', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onDrop(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onDragEnter(event, viewer) {
		const activators = this.getActivatorsForFunc('onDragEnter');
		let i;

		this.sortActivatorsForFunc('onDragEnter', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onDragEnter(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onDragOver(event, viewer) {
		const activators = this.getActivatorsForFunc('onDragOver');
		let i;

		this.sortActivatorsForFunc('onDragOver', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onDragOver(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
	}

	onKeyDown(event, viewer) {
		const activators = this.getActivatorsForFunc('onKeyDown');
		let i;

		this.sortActivatorsForFunc('onKeyDown', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onKeyDown(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}

		if (this._keyHandler !== undefined && !event.hasActivated) {
			this._keyHandler.onKeyDown(event, viewer, this);
		}
		if (event.isConsumed) {
			this._setActiveHandle(undefined);
		}
	}

	onKeyUp(event, viewer) {
		const activators = this.getActivatorsForFunc('onKeyUp');
		let i;

		this.sortActivatorsForFunc('onKeyUp', activators);

		for (i = 0; i < activators.length; i += 1) {
			activators[i].onKeyUp(event, viewer, this);
			if (event.hasActivated === true) {
				break;
			}
		}
		if (this._keyHandler !== undefined && !event.hasActivated) {
			this._keyHandler.onKeyUp(event, viewer, this);
		}
		if (event.isConsumed) {
			this._setActiveHandle(undefined);
		}
	}

	/**
	 * Sorts the given activators list before they are notified about about current event. The passed string specifies
	 * the function which was triggered by current event.<br/> To customize the activators order a subclass can
	 * overwrite either this method or one of the corresponding
	 * <code>_compareXXX</code> methods.
	 *
	 * @method sortActivatorsForFunc
	 * @param {String} funcstr A string specifying the function which was triggered by current event.
	 * @return {Array} The passed activators list for convenience.
	 */
	sortActivatorsForFunc(funcstr, activators) {
		let sortfunc;

		switch (funcstr) {
			case 'onMouseUp':
				sortfunc = this._compareOnMouseUp;
				break;
			case 'onMouseDown':
				sortfunc = this._compareOnMouseDown;
				break;
			case 'onMouseDoubleClick':
				sortfunc = this._compareOnMouseDoubleClick;
				break;
			case 'onMouseMove':
				sortfunc = this._compareOnMouseMove;
				break;
			case 'onMouseDrag':
				sortfunc = this._compareOnMouseDrag;
				break;
			case 'onKeyDown':
				sortfunc = this._compareOnKeyDown;
				break;
			case 'onKeyUp':
				sortfunc = this._compareOnKeyUp;
				break;
			default:
				break;
		}
		if (sortfunc !== undefined) {
			activators.sort(sortfunc.bind(this));
		}
		return activators;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnMouseDown
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnMouseDown(act1, act2) {
		// moveActivator is notified at last!!
		if (act1.getKey() === MoveActivator.KEY) {
			return 1;
		}

		if (act2.getKey() === MoveActivator.KEY) {
			return -1;
		}
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnMouseMove
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnMouseMove(act1, act2) {
		// edgeActivator is notified at last!!
		if (act1.getKey() === CreateEdgeActivator.KEY) {
			return 1;
		}

		if (act2.getKey() === CreateEdgeActivator.KEY) {
			return -1;
		}
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnMouseDrag
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnMouseDrag(act1, act2) {
		// new resize activator is notified first!!
		if (act1.getKey() === ResizeEditEdgeActivator.KEY) {
			return -1;
		}

		if (act2.getKey() === ResizeEditEdgeActivator.KEY) {
			return 1;
		}
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnMouseUp
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnMouseUp(act1, act2) {
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnKeyDown
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnKeyDown(act1, act2) {
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnKeyUp
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnKeyUp(act1, act2) {
		return 0;
	}

	/**
	 * Called during sorting of activators. Subclasses can overwrite.
	 *
	 * @method _compareOnMouseDoubleClick
	 * @param {InteractionActivator} act1 InteractionActivator to use for comparison.
	 * @param {InteractionActivator} act2 InteractionActivator to use for comparison.
	 * @return {Number} Return <code>1</code> if <code>act1</code> should be behind <code>act2</code>, <code>-1</code>
	 *     if
	 * <code>act1</code> should be before <code>act2</code> or <code>0</code> if order is not important.
	 * @private
	 */
	_compareOnMouseDoubleClick(act1, act2) {
		// EditTextActivator is notified at last, because it might insert a label!!
		if (act1.getKey() === EditTextActivator.KEY) {
			return 1;
		}

		if (act2.getKey() === EditTextActivator.KEY) {
			return -1;
		}
		return 0;
	}

	// overwritten to simply return false. this interaction should not be canceled by any mouse/key event...
	doCancelInteraction(event, viewer) {
		return false;
	}
}

export default GraphInteraction;
