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
/**
 * The CommandStack organizes the executed commands. After a command is created, it should executed via the
 * CommandStack. The CommandStack saves the executed commands in the order they are executed in an undo list and allows
 * to undo the commands by retrieving the command from the saved command list. An undone command can be redone, as
 * undone commands are also saved. If the commands are executed via the InteractionHandler, the CommandStack is
 * automatically involved. All interactions use the InteractionHandler and therefore register the commands resulting
 * from an interaction using the provided CommandStack. This is the recommended approach. Therefore this class should
 * normally not be used externally.
 *
 * @class CommandStack
 * @constructor
 */
class CommandStack {
	constructor() {
		this.undostack = [];
		this.redostack = [];
	}

	/**
	 * Execute a given command and adds it to the undo stack.
	 *
	 * @method execute
	 * @param {Command} cmd Command to be executed.
	 */
	execute(cmd) {
		if (cmd && (cmd.isNoOp === undefined || cmd.isNoOp === false)) {
			cmd.execute();
			if (!cmd.isVolatile) {
				this._clearRedoStack();
				this.undostack.push(cmd);
			}
		}
	}

	_clearRedoStack() {
		this.redostack = [];
	}

	addCommandToUndoStack(cmd) {
		if (cmd && (cmd.isNoOp === undefined || cmd.isNoOp === false)) {
			this.undostack.push(cmd);
		}
	}

	addCommandsToUndoStack(cmds) {
		cmds.forEach((cmd) => this.addCommandToUndoStack(cmd));
	}

	/**
	 * Information function to find out, whether any command can be undone.
	 *
	 * @method canUndo
	 * @return {Boolean} True, if there is a Command to undo, otherwise false.
	 */
	canUndo() {
		return this.undostack.length !== 0;
	}

	/**
	 * Information function to find out, whether any command can be redone.
	 *
	 * @method canRedo
	 * @return {Boolean} True, if there is a Command to redo, otherwise false.
	 */
	canRedo() {
		return this.redostack.length !== 0;
	}

	/**
	 * Undo a previosly executed Command. The last executed command is undone, removed from the undo list and added to
	 * the redo list.
	 *
	 * @method undo
	 * @return {Command} The command on which undo was performed.
	 */
	undo() {
		const cmd = this.canUndo() ? this.undostack.pop() : undefined;
		if (cmd) {
			cmd.undo();
			this.redostack.push(cmd);
		}
		return cmd;
	}

	/**
	 * Redo a previously undone Command. The last undone command is redone, removed from the redo list and added to the
	 * undo list.
	 *
	 * @method redo
	 * @return {Command} The command on which redo was performed.
	 */
	redo() {
		const cmd = this.canRedo() ? this.redostack.pop() : undefined;
		if (cmd) {
			cmd.redo();
			this.undostack.push(cmd);
		}
		return cmd;
	}
}

module.exports = CommandStack;
