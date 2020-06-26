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
const CompoundCommand = require('./CompoundCommand');
const DeletePortCommand = require('./DeletePortCommand');
const InternalDetachCommand = require('./InternalDetachCommand');
/**
 * CompoundCommand to detach an edge from a port. If the port is not used any more, it will also be deleted. This
 * way two commands are created and bundled in a CompoundCommand
 *
 * @example
 *     // edge, port and interactionhandler given
 *     var cmd = new DetachCommand(edge, port);
 *     interactionHandler.execute(cmd);
 *     //undo command
 *     interactionHandler.undo();
 *     //redo it again
 *     interactionHandler.redo();
 *
 * @class DetachCommand
 * @extends Command
 * @constructor
 * @param {Edge} edge Edge that is removed from a port.
 * @param {Port} fromPort Port to remove the edge from.
 */
class DetachCommand extends CompoundCommand {
	static createFromObject(data = {}, context) {
		return new DetachCommand().initWithObject(data, context);
	}
	constructor(edge, fromPort) {
		super();
		if (edge) {
			// a detach removes source/target ports of an edge AND maybe the port itself...
			this.add(new InternalDetachCommand(edge, fromPort));
			// after detach we might remove port. note: port is set in initNextCommand, because port could be deleted if
			// its node parent was removed before...
			this.add(new DeletePortCommand(undefined));
		}
	}

	initNextCommand(cmd, index) {
		if (index === 1) {
			// command must be DeletePortCommand:
			const port = this.commands[index - 1]._oldport;
			if (port && port.getEdgesCount() === 0 && port.isDeleteable()) {
				cmd.setPort(port);
			}
		}
	}
}

module.exports = DetachCommand;
