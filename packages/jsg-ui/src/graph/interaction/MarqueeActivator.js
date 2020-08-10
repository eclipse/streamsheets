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
import { default as JSG, TextNode, GraphUtils, Shape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import MarqueeInteraction from './MarqueeInteraction';
import SelectionVerifier from './SelectionVerifier';
import GraphController from '../controller/GraphController';
import ClientEvent from '../../ui/events/ClientEvent';
import Cursor from '../../ui/Cursor';
import CellEditor from '../view/CellEditor';

/**
 * An InteractionActivator used to activate a {{#crossLink
 * "MarqueeInteraction"}}{{/crossLink}}.<br/> Note: single selection is handled here directly. To
 * verify and possibly change the {{#crossLink "ModelController"}}{{/crossLink}} to select the
 * {{#crossLink "SelectionVerifier"}}{{/crossLink}} helper class is used.
 *
 * @class MarqueeActivator
 * @extends InteractionActivator
 * @constructor
 */
class MarqueeActivator extends InteractionActivator {
	constructor() {
		super();
		this._newSelected = false;
		this._marqueeThreshold = undefined;
	}

	getKey() {
		return MarqueeActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
		this._newSelected = false;
		this._marqueeThreshold = undefined;
	}

	/**
	 * Implemented to be notified about mouse down events.</br>
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDown(event, viewer, dispatcher) {
		let controller;
		if (this.isDisposed === false && !dispatcher.getActiveHandle()) {
			this._marqueeThreshold = viewer
				.getCoordinateSystem()
				.metricToLogXNoZoom(MarqueeActivator.THRESHOLD);
			// specify AREA to ignore selectParentFirst setting! in possible controller...
			controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, this._condition);
			controller = this._checkParent(controller);
			if (controller === undefined || controller instanceof GraphController) {
				viewer.clearSelection();
			}
		}
		this._controller = controller;
	}

	/**
	 * A condition function to use for finding a suitable controller in
	 * {{#crossLink "MarqueeActivator/getController:method"}}{{/crossLink}}
	 *
	 * @method _condition
	 * @param {ModelController} controller The controller to check.
	 * @param {Point} location The current location relative to controller parent.
	 * @return {Boolean} <code>true</code> if given controller is suitable, <code>false</code> otherwise.
	 * @private
	 */
	_condition(controller, location) {
		return controller.isSelectable() && controller.containsPoint(location, Shape.FindFlags.AUTOMATIC);
	}

	/**
	 * Checks the parent of given controller and returns it if it should be selected. If the parent controller should
	 * not be selected, the given controller is returned.
	 *
	 * @method _checkParent
	 * @param {ModelController} controller The controller to check the parent of.
	 * @return {ModelController} Either the parent or the given controller.
	 * @private
	 */
	_checkParent(controller) {
		return controller;
	}

	/**
	 * Implemented to be notified about mouse drag events.</br>
	 *
	 * @method onMouseDrag
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDrag(event, viewer, dispatcher) {
		// check threshold:
		const threshold = JSG.ptCache
			.get()
			.setTo(dispatcher.currentLocation)
			.subtract(dispatcher.startLocation);
		if (threshold.length() > this._marqueeThreshold) {
			// const controller = viewer.filterFoundControllers(Shape.FindFlags.AREA, this._condition);
			if (!this._controller || !this._controller.getModel().isProtected()) {
				viewer.clearSelection();
				const interaction = this.activateInteraction(new MarqueeInteraction(), dispatcher);
				interaction.onMouseDrag(event, viewer);
				event.hasActivated = true;
			}
		}
		JSG.ptCache.release(threshold);
	}

	/**
	 * Implemented to be notified about mouse up events.</br>
	 *
	 * @method onMouseUp
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseUp(event, viewer, dispatcher) {
		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor === undefined && this.isDisposed === false && event.isInCanvas()) {
			const isNewSelection = this._isNewSelection(event, viewer);

			let controller;

			if (isNewSelection) {
				controller = viewer.filterFoundControllers(Shape.FindFlags.AUTOMATIC);
				if (controller) {
					const model = controller.getModel();
					if (
						model.getParent() &&
						!(model instanceof TextNode && model.isAssociated()) &&
						model.getParent().isSelectParentFirst()
					) {
						controller = controller.getParent();
					}
				}
			} else {
				controller = this._clickthrough(event, viewer);
			}

			// const controller = isNewSelection ? dispatcher.getControllerAt(event.location) :
			// this._clickthrough(event,
			// 	viewer);
			this._setSelection(controller, event, viewer, !isNewSelection);
		}
	}

	/**
	 * Checks if given event results in a new selection.
	 *
	 * @method _isNewSelection
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {Boolean} <code>true</code> if event selected a new controller, <code>false</code> otherwise.
	 * @private
	 */
	_isNewSelection(event, viewer) {
		const selProvider = viewer.getSelectionProvider();

		if (viewer.getGraphSettings().getSelectTopOnly()) {
			return true;
		}

		// check position because of nested nodes...
		if (selProvider.hasSingleSelection()) {
			const selection = selProvider.getFirstSelection();
			const pt = JSG.ptCache.get().setTo(event.location);
			viewer.translateFromParent(pt);
			GraphUtils.translatePointDown(pt, selection.model.getGraph(), selection.model.getParent());
			const contains = selection.containsPoint(pt);
			JSG.ptCache.release(pt);
			return !contains;
		}
		return true;
	}

	/**
	 * Returns the next controller to be selected in a click-through scenario.
	 *
	 * @method _clickthrough
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {ModelController} The next controller to select or <code>undefined</code>.
	 */
	_clickthrough(event, viewer) {
		let takeNext = false;
		let nextcontroller;
		let firstcontroller;
		const currentselection = viewer.getSelectionProvider().getFirstSelection();

		function getParent(ctrlr) {
			const parent = ctrlr.getParent();
			return parent instanceof GraphController ? ctrlr : parent;
		}

		function doSelectParentFirst(ctrlr) {
			const item = ctrlr.getModel();
			return item instanceof TextNode && item.isAssociated();
		}

		function isSelected(ctrlr) {
			// checks if given controller or one of its siblings is currently selected
			return ctrlr.getParent() === currentselection.getParent();
		}

		// to find controller before current selection...
		function selectPrevCondition(ctrlr) {
			// first check if controller is GraphController
			if (ctrlr instanceof GraphController || (!event.event.altKey && !ctrlr.isSelectable())) {
				return false;
			}
			// store first traversed controller, used if we reached end
			firstcontroller = firstcontroller || ctrlr;
			// pass current selection -> select next after
			if (ctrlr === currentselection) {
				takeNext = true;
				return false;
			}
			// set next controller to select:
			nextcontroller = takeNext ? ctrlr : undefined;
			if (nextcontroller && doSelectParentFirst(firstcontroller)) {
				if (firstcontroller.getParent() === currentselection) {
					nextcontroller = firstcontroller;
				} else if (isSelected(firstcontroller) && firstcontroller.getParent() === nextcontroller) {
					nextcontroller = undefined;
				}
			}
			return !!nextcontroller;
		}

		if (currentselection) {
			// && selectionView.containsPoint(location)) {
			viewer.findControllerAt(event.location, Shape.FindFlags.AREA, selectPrevCondition);
			if (!nextcontroller && doSelectParentFirst(firstcontroller)) {
				// we run through -> check if select parent first of firstcontroller
				const parent = getParent(firstcontroller);
				nextcontroller = parent.isSelected() ? firstcontroller : parent;
			}
			return nextcontroller || firstcontroller || currentselection;
		}
		return currentselection;
	}

	/**
	 * Sets the controller to select.
	 *
	 * @method _setSelection
	 * @param {ModelController} newSelection The newly selected controller.
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {Boolean} [skipCheck] Specify <code>true</code> to skip verification of passed controller. This is done
	 *     during click-through selection.
	 * @private
	 */
	_setSelection(newSelection, event, viewer, skipCheck) {
		const selProvider = viewer.getSelectionProvider();
		if (newSelection && !(newSelection instanceof GraphController)) {
			const ctrlOrShift =
				event.isPressed(ClientEvent.KeyType.CTRL) || event.isPressed(ClientEvent.KeyType.SHIFT);
			if (ctrlOrShift) {
				const selectedParent = this._getSelectedParent(newSelection);
				if (selectedParent) {
					selProvider.deselect(selectedParent);
				}
				// if parent was deselected we might still want to select its child...
				if (newSelection.isSelected()) {
					selProvider.deselect(newSelection);
				} else {
					// but don't select previous deselected parent again...
					this._setMultiSelection(newSelection, viewer, selectedParent);
				}
			} else if (newSelection.getModel().isSelectable()) {
				this._setSingleSelection(newSelection, viewer, skipCheck);
			}
		}
	}

	/**
	 * Deselects all currently selected controllers and selects given one. Does nothing if given controller
	 * is selected already. <br/>
	 * Note: {{#crossLink "SelectionVerifier"}}{{/crossLink}} is used to verify and possibly
	 * change the controller to set.
	 *
	 * @method _setSingleSelection
	 * @param {ModelController} controller The controller to select.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @param {Boolean} [skipCheck] Specify <code>true</code> to skip verification of passed controller. This is done
	 *     during click-through selection.
	 * @private
	 */
	_setSingleSelection(controller, viewer, skipCheck) {
		// check controller:
		controller = skipCheck
			? controller
			: SelectionVerifier.getDefault().checkSingle(controller, viewer);
		if (!controller.isSelected()) {
			viewer.clearSelection(false);
			// set initial rotation:
			let angle = 0;
			const model = controller.getModel();
			const selectionView = viewer.getSelectionView();
			// traverse to graph since selectionView is displayed within GraphView
			GraphUtils.traverseItemUp(model, model.getGraph(), (item) => {
				angle += item.getAngle().getValue();
			});
			selectionView.setRotationAngle(angle);
			viewer.select(controller);
			viewer.getSelectionView().refresh();
			viewer.setCursor(Cursor.Style.MOVE);
		}
	}

	/**
	 * Adds given controller to already selected controllers.<br/>
	 * Note: {{#crossLink "SelectionVerifier"}}{{/crossLink}} is used to verify and possibly
	 * change the controller to add.
	 *
	 * @method _setMultiSelection
	 * @param {ModelController} controller The controller to add.
	 * @param {ControllerViewer} viewer The controller viewer on which the interaction happened.
	 * @param {ModelController} deselectedController The controller which was deselected before.
	 *     We
	 * don't want to selected it again, e.g. if it is a label parent...
	 * @private
	 */
	_setMultiSelection(controller, viewer, deselectedController) {
		controller = SelectionVerifier.getDefault().checkSingle(controller, viewer);
		if (controller !== deselectedController && !this._hasSelectedParent(controller)) {
			const selProvider = viewer.getSelectionProvider();
			const newSelection = [];
			const selection = selProvider.getSelection();
			selection.forEach((sel) => {
				if (!this._hasSelectedParent(sel, controller)) {
					newSelection.push(sel);
				}
			});
			newSelection.push(controller);
			selProvider.setSelection(newSelection);
		}
	}

	/**
	 * Checks if the hierarchy of given controller has a selected parent. The optional second parameter
	 * defines the controller which is not selected yet but will be.
	 *
	 * @method _hasSelectedParent
	 * @param {ModelController} controller The controller to check.
	 * @param {ModelController} [newSelected] A controller which is about to be selected.
	 * @return {Boolean} <code>true</code> if given controller has a parent which is marked as selected,
	 * <code>false</code> otherwise.
	 * @private
	 */
	_hasSelectedParent(controller, newSelected) {
		const parent = controller.getParent();
		return parent
			? parent.isSelected() || parent === newSelected
				? true
				: this._hasSelectedParent(parent)
			: false;
	}

	/**
	 * Traverses the hierarchy of given controller and returns the first parent which is selected. If none could be
	 * found
	 * <code>undefined</code> is returned.
	 * @method _getSelectedParent
	 * @param {ModelController} controller The controller to check.
	 * @return {ModelController} A selected parent or <code>undefined</code>.
	 * @private
	 */
	_getSelectedParent(controller) {
		const parent = controller.getParent();
		return parent ? (parent.isSelected() ? parent : this._getSelectedParent(parent)) : undefined;
	}

	/**
	 * Threshold which is used to activate {{#crossLink "MarqueeInteraction"}}{{/crossLink}} when
	 * handling {{#crossLink "MarqueeActivator/onMouseDrag:method"}}{{/crossLink}}. Note: value
	 * should be equal or greater to {{#crossLink "MoveActivator/THRESHOLD:property"}}{{/crossLink}}.
	 * Otherwise <code>MarqueeInteraction</code> might be activated before {{#crossLink
	 * "MoveInteraction"}}{{/crossLink}}.
	 *
	 * @property THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get THRESHOLD() {
		return 50;
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'marquee.activator';
	}
}

export default MarqueeActivator;
