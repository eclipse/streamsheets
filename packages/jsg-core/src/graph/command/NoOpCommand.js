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
 * This command does nothing and therefore will neither be executed nor added to the undo/redo
 * {{#crossLink "CommandStack"}}{{/crossLink}}. It can be used in situations where
 * a Command must be created although its actually not required. E.g. as a return value when returning
 * <code>undefined</code> is not an option.
 *
 * @class NoOpCommand
 * @extends Command
 * @constructor
 */
class NoOpCommand extends Command {
	constructor() {
		super();

		this.isNoOp = true; // only there to easily identify this command...
	}
}

module.exports = NoOpCommand;
