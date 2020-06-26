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
const { toCellRange } = require('./utils');

/**
 * Command to insert new cells
 *
 * @class InsertCellsCommand
 * @param {CellRange} range CellRange object.
 */
module.exports = class InsertCellsCommand extends Command {
	static createFromObject(data = {}, { graph }) {
		const cellrange = toCellRange(data.range, graph);
		return cellrange
			? new InsertCellsCommand(cellrange, data.type).initWithObject(data)
			: undefined;
	}

	constructor(range, type) {
		super();

		this._range = range.copy();
		this._type = type;
		this._oldJson = this._range.getSheet().saveForUndo();
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		cmd._oldJson = data.oldJson;
		return cmd;
	}

	toObject() {
		const data = super.toObject();
		data.type = this._type;
		data.range = this._range.toObject();
		data.oldJson = this._oldJson;

		// add some info for machine-server only
		const container = this._range.getSheet().getParent();
		data.streamsheetId = container
			.getStreamSheetContainerAttributes()
			.getSheetId()
			.getValue();
		data.msrvrinfo = {
			type: this._type,
			range: this._range.toString()
		};

		return data;
	}

	undo() {
		if (this._oldJson) {
			const sheet = this._range.getSheet();
			if (sheet) {
				sheet.readFromUndo(this._oldJson);
			}
		}

		this._range
			.getSheet()
			.getGraph()
			.markDirty();
	}

	redo() {
		switch (this._type) {
			case 'rows':
				this._range.insertRows();
				break;
			case 'columns':
				this._range.insertColumns();
				break;
			case 'cellshorizontal':
				this._range.insertCellsHorizontal();
				break;
			case 'cellsvertical':
				this._range.insertCellsVertical();
				break;
			default:
				break;
		}

		this._range
			.getSheet()
			.getGraph()
			.markDirty();
	}

	execute() {
		this.redo();
	}
};
