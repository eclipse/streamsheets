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
const JSG = require('../../JSG');
const Command = require('./Command');

/**
 * ChangeItemOrder definitions
 * @class ChangeItemOrder
 */
const Action = {
	/**
	 * Move items to the top.
	 * @property TOTOP
	 * @type {Number}
	 * @final
	 */
	TOTOP: -1,
	/**
	 * Move items to the bottom.
	 * @property TOBOTTOM
	 * @type {Number}
	 * @final
	 */
	TOBOTTOM: -2,
	/**
	 * Move items further to the top.
	 * @property UP
	 * @type {Number}
	 * @final
	 */
	UP: -3,
	/**
	 * Move items further to the bottom.
	 * @property DOWN
	 * @type {Number}
	 * @final
	 */
	DOWN: -4
};

/**
 * This command allows to change the order items are arranged within a container. This influences the drawing and
 * selection order. Items on top are drawn last (on top) and selected first.
 *
 * @example
 *     // given interactionhandler, change drawing order of first selected item.
 *     var selection = interactionhandler.viewer.getSelection();
 *     var cmd = new ChangeItemOrderCommand(selection[0], ChangeItemOrderCommand.Action.TOTOP);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class ChangeItemOrderCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} item GraphItem to
 *     change.
 * @param {ChangeItemOrderCommand.Action} targetPosition Flag, that indicates the move operation to execute.
 * @param {GraphViewer} [viewer]. Current Viewer, if available to update controller and view order.
 */
class ChangeItemOrderCommand extends Command {
	static createFromObject(data = {}, { graph, viewer }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new ChangeItemOrderCommand(
					item,
					data.position,
					viewer
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, targetPosition, viewer) {
		super();
		this._targetPosition = targetPosition;
		this._viewer = viewer;
		this._item = item;
		this._oldIndex = this._item.getIndex();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldIndex = data.oldIndex;
		return cmd;
	}

	static get Action() {
		return Action;
	}

	toObject() {
		const data = super.toObject();
		if (this._viewer) {
			const controller = this._getController();
			data.itemId = controller.getModel().getId();
		} else {
			data.itemId = this._item.getId();
		}
		data.position = this._targetPosition;
		data.oldIndex = this._oldIndex;
		return data;
	}

	doAfterRedo(selection /* , viewer */) {
		if (this._controller) {
			selection.push(this._item);
		}
	}

	doAfterUndo(selection /* , viewer */) {
		if (this._controller) {
			selection.push(this._item);
		}
	}

	/**
	 * Execute the change command.
	 *
	 * @method execute
	 */
	execute() {
		this.redo();
	}

	/**
	 * Undo a previously executed change command.
	 *
	 * @method undo
	 */
	undo() {
		if (this._viewer) {
			const controller = this._getController();
			if (controller) {
				controller.moveToIndex(this._oldIndex);
			}
		} else {
			this._item.moveToIndex(this._oldIndex);
		}
	}

	/**
	 * Redo a previously undone change command.
	 *
	 * @method redo
	 */
	redo() {
		if (this._viewer) {
			const controller = this._getController();
			switch (this._targetPosition) {
				case ChangeItemOrderCommand.Action.TOTOP:
					controller.moveToTop();
					break;
				case ChangeItemOrderCommand.Action.TOBOTTOM:
					controller.moveToBottom();
					break;
				case ChangeItemOrderCommand.Action.UP:
					controller.moveUp();
					break;
				case ChangeItemOrderCommand.Action.DOWN:
					controller.moveDown();
					break;
				default:
					controller.moveToIndex(this._targetPosition);
					break;
			}
		} else {
			switch (this._targetPosition) {
				case ChangeItemOrderCommand.Action.TOTOP:
					this._item.moveToTop();
					break;
				case ChangeItemOrderCommand.Action.TOBOTTOM:
					this._item.moveToBottom();
					break;
				case ChangeItemOrderCommand.Action.UP:
					this._item.moveUp();
					break;
				case ChangeItemOrderCommand.Action.DOWN:
					this._item.moveDown();
					break;
				default:
					this._item.moveToIndex(this._targetPosition);
					break;
			}
		}
	}

	// ensure controller is still in its controller hierarchy! might not be, if its corresponding model was removed...
	_getController() {
		return this._viewer
			.getRootController()
			.getControllerByModelId(this._item.getId());
	}
}

module.exports = ChangeItemOrderCommand;
