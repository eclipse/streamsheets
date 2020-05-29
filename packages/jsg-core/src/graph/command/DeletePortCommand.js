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
 * Command to delete a Port.
 *
 * @example
 *     // port and interactionhandler given
 *     var cmd = new DeletePortCommand(port);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class DeletePortCommand
 * @extends Command
 * @constructor
 * @param {GraphItem} port Port to be deleted.
 */
class DeletePortCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const port = graph.getItemById(data.itemId);
		return new DeletePortCommand(port).initWithObject(data);
	}

	constructor(port) {
		super();
		this.setPort(port);
	}

	toObject() {
		const data = super.toObject();
		data.itemId = this._port ? this._port.getId() : undefined;
		return data;
	}

	setPort(port) {
		this._port = port;
		this._portnode = port !== undefined ? port.getParent() : undefined;
	}

	execute() {
		this.redo();
	}

	undo() {
		if (this._port !== undefined && this._portnode !== undefined) {
			this._portnode.addPort(this._port);
		}
	}

	redo() {
		if (this._port !== undefined && this._portnode !== undefined) {
			this._portnode.removePort(this._port);
		}
	}

	restoreStateAfterUndo(viewer) {
		if (this._port !== undefined) {
			this.selectAll(this._port, viewer);
		}
	}
}

module.exports = DeletePortCommand;
