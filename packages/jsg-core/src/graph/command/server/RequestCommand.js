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
const JSG = require('../../../JSG');
const Command = require('../Command');


// think about a command which is simply based on server request/response
class RequestCommand extends Command {
	constructor(sheet) {
		super();
		this._sheet = sheet;
	}

	get isRequest() {
		return true;
	}

	get sheet() {
		if (!this._sheet) throw new Error('sheet property must be provided by sub-class');
		return this._sheet;
	}

	execute() {}

	redo() {}

	undo() {}

	toObject() {
		const data = super.toObject();
		data.name = `command.server.${this.constructor.name}`;
		return data;
	}
	createRequest(commandId, info) {
		return { name: commandId, streamsheetId: this.getStreamSheetId(), info };
	}

	getStreamSheetId() {
		const sheetcontainer = this.sheet && this.sheet.getStreamSheetContainer();
		return sheetcontainer ? sheetcontainer.getStreamSheetContainerAttributes().getSheetId().getValue() : undefined;
	}

	getExecuteRequest() {
		throw new Error('getExecuteRequest() must be provided by sub-class');
	}
	getRedoRequest() {
		throw new Error('getRedoRequest() must be provided by sub-class');
	}
	getUndoRequest() {
		throw new Error('getUndoRequest() must be provided by sub-class');
	}

	handleError(error) {
		JSG.debug.logError('Command failed on server!!', error);
	}
	handleResult(/* result */) {
		JSG.debug.info('handleResult(result) should be implemented by sub-class');
	}
}

module.exports = RequestCommand;
