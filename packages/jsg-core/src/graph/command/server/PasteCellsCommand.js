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
const { getCellDescriptorsFromRanges /* , setCells */ } = require('../utils');
const RequestCommand = require('./RequestCommand');

// TODO: support cut
class PasteCellsCommand extends RequestCommand {
	// action: 'all', 'values', 'formulas', 'formats'
	constructor(target, { /* cut, */ data, range }, action, fill) {
		super(target.getSheet());

		this._cellsPasted = undefined;
		this._cellsReplaced = undefined;

		this.info = { action, extend: fill };
		this.info.cells = getCellDescriptorsFromRanges([range], data);
		this.info.targetrange = target
			.copy()
			.shiftToSheet()
			.toString();
		this.info.sourcesheetId = this.getStreamSheetId();
	}

	// conform to legacy PateCellsFromClipboardCommand
	getCompleteTargetRange() {}
	addCut(cmd) {}
	addSeries(cmd) {}

	getExecuteRequest() {
		return this.createRequest('command.server.PasteCellsCommand', this.info);
	}
	getRedoRequest() {
		this.info.cells = this._cellsPasted;
		return this.createRequest('command.server.SetCellsCommand', this.info);
	}
	getUndoRequest() {
		this.info.cells = this._cellsReplaced;
		return this.createRequest('command.server.SetCellsCommand', this.info);
	}

	handleResult(result) {
		const { /* cellsCut, */ cellsPasted, cellsReplaced } = result;
		this._cellsPasted = this._cellsPasted || cellsPasted;
		this._cellsReplaced = this._cellsReplaced || cellsReplaced;
		// const descriptors = type === 'undo' ? this._cellsReplaced : this._cellsPasted;
		// this._setCells(descriptors);
	}
	// _setCells(descriptors) {
	// 	const { sheet } = this;
	// 	if (setCells(descriptors, sheet)) {
	// 		sheet.getCells().getDataProvider().evaluate(sheet);
	// 		sheet.getGraph().markDirty();
	// 	}
	// }
}

module.exports = PasteCellsCommand;
