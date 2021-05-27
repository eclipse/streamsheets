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
const RequestCommand = require('./RequestCommand');

class SetCellsCommand extends RequestCommand {
	constructor(sheet, cellDescriptors) {
		super(sheet);
		this.cells = cellDescriptors;
		this.oldcells = undefined;
	}

	_createRequest(cells) {
		return this.createRequest('command.server.SetCellsCommand', { cells });
	}
	getExecuteRequest() {
		return this._createRequest(this.cells);
	}
	getRedoRequest() {
		return this._createRequest(this.cells);
	}
	getUndoRequest() {
		return this._createRequest(this.oldcells);
	}

	handleResult(result) {
		const { oldcells } = result;
		this.oldcells = this.oldcells || oldcells;
	}
}
module.exports = SetCellsCommand;
