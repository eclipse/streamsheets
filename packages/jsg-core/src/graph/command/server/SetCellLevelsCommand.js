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
const { toCellsColsRows } = require('../utils');
const RequestCommand = require('./RequestCommand');

const getCellLevelAt = (column, row, sheet) => {
	// const attr = sheet.getCellAttributesAtRC(column, row);
	// return attr.getKey().getValue() ? attr.getLevel().getValue() : 0;
	const dataprovider = sheet.getDataProvider();
	const cell = dataprovider.getRC(column, row) || dataprovider.createRC(column, row);
	const attr = cell.getAttributes();
	return attr && attr.getKey().getValue() ? attr.getLevel().getValue() : 0;
};

class SetCellLevelsCommand extends RequestCommand {
	constructor(sheet, ranges, down) {
		super(sheet);

		this.oldLevels = undefined;
		this.newLevels = { ...toCellsColsRows(ranges, this._sheet) };
		this.newLevels.cells.forEach((cell) => {
			const { column, row } = cell;
			let currLevel = getCellLevelAt(column, row, this._sheet);
			const aboveLevel = getCellLevelAt(column, row - 1, this._sheet);
			currLevel += down ? -1 : currLevel <= aboveLevel ? 1 : 0;
			cell.properties = { attributes: { level: currLevel } };
		});
	}

	_createRequest(info) {
		return this.createRequest('command.server.SetCellsPropertiesCommand', info);
	}
	getExecuteRequest() {
		return this._createRequest(this.newLevels);
	}
	getRedoRequest() {
		return this._createRequest(this.newLevels);
	}
	getUndoRequest() {
		return this._createRequest(this.oldLevels);
	}

	handleResult(result) {
		const { changedProperties = {} } = result;
		this.oldLevels = this.oldLevels || changedProperties;
	}
}

module.exports = SetCellLevelsCommand;
