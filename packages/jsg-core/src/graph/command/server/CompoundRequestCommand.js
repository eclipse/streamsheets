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


class CompoundRequestCommand extends RequestCommand {

	constructor(sheet) {
		super(sheet);
		this.commands = [];
	}
	
	add(cmd) {
		if (cmd != null) this.commands.push(cmd);
		return this;
	}

	_doCreateRequest(requests) {
		return this.createRequest('command.server.CompoundRequestCommand', requests);
	}

	getExecuteRequest() {
		const requests = this.commands.map(cmd => cmd.getExecuteRequest());
		return this._doCreateRequest(requests);
	}
	
	getRedoRequest() {
		const requests = this.commands.map(cmd => cmd.getRedoRequest());
		return this._doCreateRequest(requests);
	}
	
	getUndoRequest() {
		const requests = this.commands.reverse().map(cmd => cmd.getUndoRequest());
		return this._doCreateRequest(requests);
	}

	handleError(error) {
		this.commands.map(cmd => cmd.handleError(error));
	}
	handleResult(results) {
		this.commands.map((cmd, index) => cmd.handleResult(results[index].result));
	}
}

module.exports = CompoundRequestCommand;