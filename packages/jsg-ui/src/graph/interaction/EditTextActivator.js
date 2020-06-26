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
import { default as JSG, TextNode, AddItemCommand, GraphUtils, ItemAttributes } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import EditTextInteraction from './EditTextInteraction';
import GraphController from '../controller/GraphController';
import ActionHandle from "./ActionHandle";

/**
 * An InteractionActivator used to activate a {{#crossLink "EditTextInteraction"}}{{/crossLink}}.
 *
 * @class EditTextActivator
 * @extends InteractionActivator
 * @constructor
 */
class EditTextActivator extends InteractionActivator {
	getKey() {
		return EditTextActivator.KEY;
	}

	/**
	 * Implemented to simply return <code>false</code> in order to let the InteractionDispatcher perform its default
	 * handling.
	 *
	 * @method onResizeCanvas
	 * @param {Number} width The new canvas width.
	 * @param {Number} height The new canvas height.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @return {Boolean} <code>true</code> if Interaction handles resize, <code>false</code> otherwise.
	 */
	onResizeCanvas(width, height, viewer, dispatcher) {
		// not used -> let interactionhandler execute default handling
		return false;
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
		if (this.isDisposed === false) {
			const activeHandle = dispatcher.getActiveHandle();
			const handleType = activeHandle !== undefined ? activeHandle.getType() : undefined;

			if (handleType === ActionHandle.TYPE.EDIT) {
				this._startEditTextInteraction(event, viewer, dispatcher, activeHandle.getController());
			}
		}
	}

	/**
	 * Implemented to be notified about mouse double click events.</br>
	 *
	 * @method onMouseDoubleClick
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDoubleClick(event, viewer, dispatcher) {
		if (this.isDisposed === false && !event.isConsumed) {
			// on double click we renewal selection, so find controller again...
			let controller = dispatcher.getControllerAt(event.location, undefined, this._dblclickCondition);
			controller = this._getTextNodeController(dispatcher, controller, dispatcher.currentLocation);
			if (controller !== undefined) {
				viewer.clearSelection(false);
				viewer.onSelectionChanged();
				if (
					controller
						.getParent()
						.getModel()
						.isSelectParentFirst()
				) {
					viewer.select(controller.getParent());
				}
				this._startEditTextInteraction(event, viewer, dispatcher, controller);
			}
		}
	}

	/**
	 * Controller look up condition used on mouse double click.
	 *
	 * @method _dblclickCondition
	 * @param {ControllerViewer} viewer The ControllerViewer to check.
	 * @return {Boolean} <code>true</code> if given controller is suitable for double click handling,
	 *     <code>false</code> otherwise.
	 * @private
	 */
	_dblclickCondition(controller) {
		if (controller instanceof GraphController) {
			return false;
		}

		return controller.isSelectable();
	}

	/**
	 * Implemented to be notified about key down events.</br>
	 *
	 * @method onMouseDoubleClick
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onKeyDown(event, viewer, dispatcher) {
		if (event.event.keyCode === 113) {
			// F2
			const selection = viewer.getSelection();
			if (selection !== undefined && selection.length === 1) {
				const controller = this._getTextNodeController(dispatcher, selection[0]);
				if (controller !== undefined) {
					this._startEditTextInteraction(event, viewer, dispatcher, controller);
					event.doRepaint = true;
				}
			}
		}
	}

	/**
	 * Returns the controller for a {{#crossLink "TextNode"}}{{/crossLink}} at specified position. If
	 * no
	 * TextNode exists at given location, one will be created and its controller will be returned. Note: only the
	 * passed in controller and its direct child controllers are traversed.
	 *
	 * @method _getTextNodeController
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @param {GraphItemController} controller The controller to start look up at.
	 * @param {Point} evloc The event location to look for a TextNode.
	 * @return {NodeController} The controller for a TextNode at specified position or
	 *     <code>undefined</code>.
	 * @private
	 */
	_getTextNodeController(dispatcher, controller, evloc) {
		if (controller !== undefined) {
			const item = controller.getModel();
			if (!(item instanceof TextNode)) {
				let loc = evloc ? JSG.ptCache.get().setTo(evloc) : undefined;
				loc = loc ? GraphUtils.translatePointDown(loc, item.getGraph(), item) : undefined;
				let editItem = item.getEditableTextSubItem(loc);
				if (editItem === undefined && item.isAddLabelAllowed()) {
					this._addLabel(dispatcher, item);
					editItem = item.getEditableTextSubItem();
				}
				controller = editItem !== undefined ? controller.getModelController(editItem) : undefined;
				JSG.ptCache.release(loc);
			}
		}
		return controller;
	}

	/**
	 * Performs an {{#crossLink "AddLabelCommand"}}{{/crossLink}} to directly add a default label to
	 * given GraphItem.
	 *
	 * @method _addLabel
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @param {GraphItem} item    The GraphItem to add a label to.
	 * @private
	 */
	_addLabel(dispatcher, item) {
		const node = new TextNode('Label');
		dispatcher.getInteractionHandler().execute(new AddItemCommand(node, item));
		item.updateLabelPositions();

		return node;
	}

	/**
	 * Activates and starts the text edit interaction.<br/>
	 *
	 * @method _startEditTextInteraction
	 * @param {MouseEvent} event The current event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 * @param {GraphItemController} controller The controller to start the edit interaction for.
	 * @private
	 */
	_startEditTextInteraction(event, viewer, dispatcher, controller) {
		let interaction;

		if (this._isEditable(controller)) {
			interaction = this.activateInteraction(new EditTextInteraction(), dispatcher);
			interaction.setController(controller);
			interaction.startEdit(controller, event, viewer);
			event.hasActivated = true;
		}
	}

	/**
	 * Checks if given controller is editable or not.<br/>
	 *
	 * @method _isEditable
	 * @param {GraphItemController} controller The controller to check.
	 * @return {Boolean} <code>true</code> if given controller is editable, <code>false</code> otherwise.
	 * @private
	 */
	_isEditable(controller) {
		const attributes = controller !== undefined ? controller.getModel().getItemAttributes() : undefined;
		return attributes !== undefined ? !attributes.hasEditMask(ItemAttributes.EditMask.LABEL) : false;
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
		return 'edittext.activator';
	}
}

export default EditTextActivator;
