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
const Command = require('./Command');

/**
 * The AbstractItemCommand is the base class for all single item related commands. It
 * stores the affected command and the selection status of the item. It should only be
 * used as a base class, as it does not provide any operation.
 *
 * @class AbstractItemCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} graphItem GraphItem to be handled by the Command.
 */
class AbstractItemCommand extends Command {
	constructor(graphItem) {
		super();
		this._graphItem = graphItem;
	}

	/**
	 * Get stored GraphItem
	 *
	 * @method getItem
	 * @return {GraphItem} Return handled GraphItem
	 */
	getItem() {
		return this._graphItem;
	}

	/**
	 * Execute the command. By default we simply call the redo method.
	 *
	 * @method execute
	 */
	execute() {
		this.redo();
	}

	doAfterRedo(selection /* , viewer */) {
		if (selection.indexOf(this._graphItem) < 0) {
			selection.push(this._graphItem);
		}
	}

	doAfterUndo(selection /* , viewer */) {
		if (selection.indexOf(this._graphItem) < 0) {
			selection.push(this._graphItem);
		}
	}

	/**
	 * Overwritten from superclass to call restoreState.</br>
	 *
	 * @method restoreStateAfterUndo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "AbstractGroupUngroupCommand/doAfterUndo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterUndo(viewer) {
		this.restoreState(viewer);
	}

	/**
	 * Overwritten from superclass to call restoreState.</br>
	 *
	 * @method restoreStateAfterRedo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "AbstractGroupUngroupCommand/doAfterRedo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterRedo(viewer) {
		this.restoreState(viewer);
	}

	/**
	 * Simply select inner GraphItem.</br>
	 *
	 * @method restoreState
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "AbstractGroupUngroupCommand/doAfterRedo:method"}}{{/crossLink}} or {{#crossLink
	 *     "AbstractGroupUngroupCommand/doAfterUndo:method"}}{{/crossLink}} instead.
	 */
	restoreState(viewer) {
		this.selectAll(this._graphItem, viewer);
	}

	toObject() {
		const data = super.toObject();

		data.itemId = this._graphItem.getId();

		return data;
	}
}

module.exports = AbstractItemCommand;
