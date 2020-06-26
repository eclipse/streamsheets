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
const AbstractItemCommand = require('./AbstractItemCommand');

/**
 * A dummy command to instruct the server to execute a function on the server
 * @class ExecuteFunctionCommand
 * @type {module.ExecuteFunctionCommand}
 */
module.exports = class ExecuteFunctionCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new ExecuteFunctionCommand(item, data.function).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(item, functionText) {
		super(item);
		this._functionText = functionText;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.function = this._functionText;
		return data;
	}

	undo() {}

	redo() {}
};
