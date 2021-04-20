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
const Selection = require('../../model/Selection');
const { getCellDescriptorsFromRanges } = require('../utils');
const RequestCommand = require('./RequestCommand');

const getCellsFromCurrentSelection = (ref, sheet) => {
	const selection = Selection.fromStringMulti(ref, sheet);
	return selection ? getCellDescriptorsFromRanges(selection._ranges) : [];
};

class DeleteCellsCommand extends RequestCommand {
	constructor(sheet, ref) {
		super(sheet);

		this.cellsDeleted = undefined;
		this.info = { cells: getCellsFromCurrentSelection(ref, sheet).map((descr) => descr.reference) };
	}

	getExecuteRequest() {
		return this.createRequest('command.server.DeleteCellsCommand', this.info);
	}
	getRedoRequest() {
		return this.createRequest('command.server.DeleteCellsCommand', this.info);
	}
	getUndoRequest() {
		return this.createRequest('command.server.SetCellsCommand', { cells: this.cellsDeleted });
	}

	handleResult(result) {
		const { cellsDeleted } = result;
		this.cellsDeleted = this.cellsDeleted || cellsDeleted;
	}
}
module.exports = DeleteCellsCommand;
