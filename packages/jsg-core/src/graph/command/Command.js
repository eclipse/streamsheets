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
const Graph = require('../model/Graph');

/**
 * The Command class is the abstract base class of all commands and simply defines the methods each
 * implementation must at least provide.
 *
 * A command should be used whenever undo/redo support is required.
 *
 * Commands are executed by the {{#crossLink "InteractionHandler"}}{{/crossLink}} which takes
 * care of adding them to the
 * {{#crossLink "CommandStack"}}{{/crossLink}} for undo/redo support.
 *
 * @example
 *     var cmd = new Command();
 *     interactionHandler.execute(cmd);
 *
 *     //undo command
 *     interactionHandler.undo();
 *
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class Command
 * @constructor
 */
class Command {
	constructor() {
		/**
		 * Flag which specifies that this command should just be executed but not be added to undo-redo stack. Set this
		 * flag to <code>true</code> to leave command stack unchanged.
		 *
		 * @property isVolatile
		 * @type {Boolean}
		 */
		this.isVolatile = undefined;
	}
	/**
	 * Executes this command. Default implementation does nothing.
	 *
	 * @method execute
	 */
	execute() {}

	/**
	 * Undo an executed command. Default implementation does nothing.
	 *
	 * @method undo
	 */
	undo() {}

	/**
	 * Redo an undone command. Default implementation does nothing.
	 *
	 * @method redo
	 */
	redo() {}

	/**
	 * Called by IneractionHandler after undo.</br>
	 * Subclasses may overwrite to restore state of affected objects, e.g. to set its selection state.
	 * Default implementation does nothing.
	 *
	 * @method restoreStateAfterUndo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "Command/doAfterUndo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterUndo(/* viewer */) {}

	/**
	 * Called by IneractionHandler after redo.</br>
	 * Subclasses may overwrite to restore state of affected objects, e.g. to set its selection state.
	 * Default implementation does nothing.
	 *
	 * @method restoreStateAfterRedo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "Command/doAfterRedo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterRedo(/* viewer */) {}

	/**
	 * Called by IneractionHandler after redo.</br>
	 * Subclasses may overwrite to perform custom tasks after redo was executed. Default implementation does
	 * nothing.</br> A common task is to set the selection state of {{#crossLink
	 * "GraphItem"}}{{/crossLink}}s. Therefore a list is passed to collect the items which should be
	 * selected after undo in one go.
	 *
	 * @method doAfterRedo
	 * @param {Array} selection Collects the <code>GraphItem</code>s which should be selected after redo.
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @since 1.6.18
	 */
	doAfterRedo(/* selection, viewer */) {}

	/**
	 * Called by IneractionHandler after undo.</br>
	 * Subclasses may overwrite to perform custom tasks after undo was executed. Default implementation does
	 * nothing.</br> A common task is to set the selection state of {{#crossLink
	 * "GraphItem"}}{{/crossLink}}s. Therefore a list is passed to collect the items which should be
	 * selected after undo in one go.
	 *
	 * @method doAfterUndo
	 * @param {Array} selection Collects the <code>GraphItem</code>s which should be selected after undo.
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @since 1.6.18
	 */
	doAfterUndo(/* selection, viewer */) {}

	/**
	 * Convenience method to select a single or multiple items.
	 *
	 * @method selectAll
	 * @param {Array | GraphItem} items A single GraphItem or an enumeration or an array of GraphItems to select.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 */
	selectAll(...args) {
		const controllers = [];
		const firstArg = args[0];
		const last = args.length - 1;
		const viewer = args[last];
		let i;

		// last argument must be viewer object
		if (firstArg.length !== undefined) {
			// array passed...
			this._addItemControllers(firstArg, controllers, viewer);
		} else {
			// enumeration of items...
			for (i = 0; i < last; i += 1) {
				this._addItemController(args[i], controllers, viewer);
			}
		}
		viewer.getSelectionProvider().setSelection(controllers);
	}

	_addItemControllers(items, controllers, viewer) {
		items.forEach((item) => {
			this._addItemController(item, controllers, viewer);
		});
	}

	_addItemController(item, controllers, viewer) {
		const ctrlr = viewer.findControllerForItem(item);
		if (
			ctrlr !== undefined &&
			!(ctrlr.getModel() instanceof Graph)
		) {
			controllers.push(ctrlr);
		}
	}

	set custom(custom) {
		this._custom = custom;
	}

	toObject() {
		const data = {};
		data.name = `command.${this.constructor.name}`;
		data.isVolatile = this.isVolatile;
		data.undo = {};
		// TODO check & review property: custom
		data.custom = this._custom;

		return data;
	}
	initWithObject(data) {
		this._custom = data.custom;
		this.isVolatile = data.isVolatile;
		return this;
	}

	undoFromObject(data) {}
}

module.exports = Command;
