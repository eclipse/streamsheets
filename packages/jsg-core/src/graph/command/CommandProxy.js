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
 * A CommandProxy can be used to wrap a {{#crossLink "Command"}}{{/crossLink}} instance.
 * This can be useful if you need to hide the actual internal command representation.
 *
 * @class CommandProxy
 * @param {Command} cmd The Command instance to wrap.
 * @constructor
 */
class CommandProxy extends Command {
	constructor(cmd) {
		super();

		this._cmd = cmd;
	}

	execute() {
		this._cmd.execute();
	}

	undo() {
		this._cmd.undo();
	}

	redo() {
		this._cmd.redo();
	}

	toObject() {
		return this._cmd.toObject();
	}

	restoreStateAfterUndo(viewer) {
		this._cmd.restoreStateAfterUndo(viewer);
	}

	restoreStateAfterRedo(viewer) {
		this._cmd.restoreStateAfterRedo(viewer);
	}

	doAfterUndo(selection, viewer) {
		this._cmd.doAfterUndo(selection, viewer);
	}

	doAfterRedo(selection, viewer) {
		this._cmd.doAfterRedo(selection, viewer);
	}
}

module.exports = CommandProxy;
