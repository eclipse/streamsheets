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
 * The CompoundCommand contains an array of Commands. This way an operation that consists of multiple commands can be
 * combined into one command an then added to the undo/redo stack, which will result in only one undo/redo operation
 * for multiple commands.</br> By default the Commands are traversed in <code>lifo</code> order during the undo step,
 * i.e. undo starts at the last added Command. To reverse this order simply set <code>reverseUndo</code> parameter to
 * <code>true</code>.</br> Finally note that it is possible to disable refresh notifications of involved {{#crossLink
 * "GraphItem"}}{{/crossLink}}s. To make this work sub commands should provide a <code>getItem</code>
 * method. E.g.
 * {{#crossLink "AbstractGroupUngroupCommand"}}{{/crossLink}} provides such a method.
 *
 * @class CompoundCommand
 * @extends Command
 * @constructor
 * @param {Boolean} [reverseUndo] Set to <code>true</code> to traverse Commands in reverse order during undo.
 */
class CompoundCommand extends Command {
	static createFromObject(data = {}, context) {
		return new CompoundCommand(data.reverseUndo).initWithObject(data, context);
	}

	constructor(reverseUndo) {
		super();
		/**
		 * The list of inner Commands this CompoundCommand consists of.
		 *
		 * @property commands
		 * @type {Array}
		 */
		this.commands = [];
		this._oldRefreshStates = [];
		this._refreshDisabled = false;
		this._callRefreshAfter = false;
		/**
		 * Flag which specifies execution order of inner Commands on <code>undo</code>. Default order is
		 * <code>lifo</code>, i.e. undo starts at the last added Command. Set this flag to <code>true</code> to execute
		 * inner Commands in reverse order, i.e. first added Command is executed first.
		 *
		 * @property reverseUndo
		 * @type {Boolean}
		 */
		this.reverseUndo = !!reverseUndo;
	}

	initWithObject(data, { factory, graph, viewer }) {
		const cmd = super.initWithObject(data);
		cmd.commands = data.commands.map((cmddata) => factory.createCommand(graph, cmddata, viewer));
		cmd._graphItem = data.itemId !== undefined ? graph.getItemById(data.itemId) : undefined;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.commands = this.commands.map((cmd) => cmd.toObject());
		data.reverseUndo = this.reverseUndo;
		if (this._graphItem) {
			data.itemId = this._graphItem.getId();
		}
		return data;
	}

	/**
	 * Checks if this CompoundCommand has any commands registered.
	 *
	 * @method hasCommands
	 * @return {Boolean} <code>true</code> if at least one command was added to this CompoundCommand,
	 *     <code>false</code> otherwise.
	 */
	hasCommands() {
		return this.commands.length > 0;
	}

	/**
	 * Add a command to a CompoundCommand.
	 *
	 * @method add
	 * @param {Command} cmd Command to add.
	 * @return {Command} This command to support method concatenation.
	 */
	add(cmd) {
		if (cmd !== undefined) {
			this.commands.push(cmd);
		}
		return this;
	}

	/**
	 * Executes all sub-commands in this CompoundCommand.<br/>
	 * Note: {{#crossLink "Command/initNextCommand:method"}}{{/crossLink}} is called before a
	 * sub-command is executed and {{#crossLink
	 * "Command/executedCommand:method"}}{{/crossLink}} is called afterwards.
	 *
	 * @method execute
	 */
	execute() {
		// switch off before to prevent side effects...
		this._disableRefresh();

		this.commands.forEach((cmd, i) => {
			this.initNextCommand(cmd, i);
			cmd.execute();
			this.executedCommand(cmd, i);
		});
		this._enableRefresh();
	}

	/**
	 * This is called before the next command is executed. Subclasses can override this method and
	 * perform command initialization. Default implementation does nothing.
	 *
	 * @method initNextCommand
	 * @param {Command} cmd Next command which is executed.
	 * @param {Number} index Index of next command.
	 */
	initNextCommand(/* cmd, index */) {}

	/**
	 * This is called after a sub-command was executed.<br/>
	 * This method is intended to be overwritten by subclasses. Default implementation does nothing.
	 *
	 * @method executedCommand
	 * @param {Command} cmd Command which was executed.
	 * @param {Number} index Index of executed command.
	 * @since 2.0.20.5
	 */
	executedCommand(/* cmd, index */) {}

	/**
	 * Undo all commands in this CompoundCommand
	 *
	 * @method undo
	 */
	undo() {
		// switch off before to prevent side effects...
		this._disableRefresh();
		const doUndo = this.reverseUndo ? this._undoFiFo : this._undoLiFo;
		doUndo.call(this);
		this._enableRefresh();
	}

	_undoLiFo() {
		for (let i = this.commands.length - 1; i >= 0; i -= 1) {
			this.commands[i].undo();
		}
	}

	_undoFiFo() {
		this.commands.forEach((cmd) => {
			cmd.undo();
		});
	}

	/**
	 * Redo all commands in this CompoundCommand
	 *
	 * @method redo
	 */
	redo() {
		// switch off before to prevent side effects...
		this._disableRefresh();
		this.commands.forEach((cmd) => {
			cmd.redo();
		});
		this._enableRefresh();
	}

	/**
	 * Disables refresh notification of all involved GraphItems before this Command is executed. After
	 * execution the old refresh state is restored and optionally called. Sub-Commands must provide a
	 * <code>getItem</code> function returning the GraphItem on which the refresh state should be
	 * disabled.
	 *
	 * @method disableRefresh
	 * @param {Boolean} [callIt] Set to <code>true</code> to execute refresh on enable.
	 */
	disableRefresh(callIt) {
		this._refreshDisabled = true;
		this._callRefreshAfter = callIt;
	}

	/**
	 * Disables refresh notification of GraphItem in sub commands.
	 *
	 * @method _disableRefresh
	 * @private
	 */
	_disableRefresh() {
		let item;

		if (this._refreshDisabled === true) {
			this.commands.forEach((cmd, i) => {
				item = this._getItemFrom(cmd);
				if (item !== undefined) {
					this._oldRefreshStates[i] = item.isRefreshEnabled();
					item.disableRefresh();
				}
			});
		}
	}

	/**
	 * Enables refresh notification of GraphItem in sub commands.
	 *
	 * @method _enableRefresh
	 * @private
	 */
	_enableRefresh() {
		let item;

		if (this._refreshDisabled === true) {
			this.commands.forEach((cmd, i) => {
				if (this._oldRefreshStates[i] === true) {
					item = this._getItemFrom(cmd);
					if (item !== undefined) {
						item.enableRefresh(this._callRefreshAfter);
					}
				}
			});
		}
	}

	/**
	 * Returns involved GraphItem of given Command or <code>undefined</code>
	 *
	 * @method _getItemFrom
	 * @param {Command} cmd The Command to get the GraphItem from.
	 * @return {GraphItem} The involved GraphItem of given Command or <code>undefined</code>
	 * @private
	 */
	_getItemFrom(cmd) {
		return cmd.getItem !== undefined ? cmd.getItem() : undefined;
	}

	/**
	 * Overwritten from superclass to call restoreState.</br>
	 *
	 * @method restoreStateAfterUndo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "Command/doAfterUndo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterUndo(viewer) {
		if (!this.restoreState(viewer)) {
			this._restoreState('restoreStateAfterUndo', viewer);
		}
	}

	/**
	 * Overwritten from superclass to call restoreState.</br>
	 *
	 * @method restoreStateAfterUndo
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "Command/doAfterRedo:method"}}{{/crossLink}} instead.
	 */
	restoreStateAfterRedo(viewer) {
		if (!this.restoreState(viewer)) {
			this._restoreState('restoreStateAfterRedo', viewer);
		}
	}

	_restoreState(funcstr, viewer) {
		this.commands.forEach((cmd) => {
			if (cmd[funcstr]) {
				cmd[funcstr](viewer);
			}
		});
	}

	doAfterRedo(selection, viewer) {
		this.commands.forEach((cmd) => {
			cmd.doAfterRedo(selection, viewer);
		});
	}

	doAfterUndo(selection, viewer) {
		this.commands.forEach((cmd) => {
			cmd.doAfterUndo(selection, viewer);
		});
	}

	/** *
	 * Simply select all GraphItems of all inner Commands.</br>
	 *
	 * @method restoreState
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling InteractionHandler.
	 * @deprecated Subject to remove! Please use {{#crossLink
	 *     "Command/doAfterRedo:method"}}{{/crossLink}} or {{#crossLink
	 *     "Command/doAfterUndo:method"}}{{/crossLink}} instead.
	 */
	restoreState(viewer) {
		const selection = [];
		this._addToSelection(this, selection, viewer);
		viewer.setSelection(selection);
		return selection.length > 0;
	}

	_addToSelection(cmd, selection, viewer) {
		if (cmd.commands === undefined) {
			const controller = this._findItemController(cmd, viewer);
			if (controller !== undefined) {
				selection.push(controller);
			}
		} else {
			cmd.commands.forEach((lcmd) => {
				this._addToSelection(lcmd, selection, viewer);
			});
		}
	}

	_findItemController(cmd, viewer) {
		const item = this._getItemFrom(cmd);
		return item !== undefined ? viewer.findControllerForItem(item) : undefined;
	}

	setGraphItem(graphItem) {
		this._graphItem = graphItem;
	}
}

module.exports = CompoundCommand;
