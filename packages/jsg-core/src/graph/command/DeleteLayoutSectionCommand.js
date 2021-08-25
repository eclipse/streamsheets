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
const LayoutSection = require('../model/LayoutSection');

class DeleteLayoutSectionCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		let cmd;
		const item = graph.getItemById(data.itemId);
		if (item) {
			cmd = new DeleteLayoutSectionCommand(item, data.index, data.row).initWithObject(data);
		}
		return cmd;
	}

	constructor(item, index, row) {
		super(item);

		this._index = index;
		this._row = row;
	}

	execute() {
		if (this._row) {
			this._oldSection = this.getItem().rowData[this._index];
			this._removeCells = this.getItem().deleteRow(this._index);
		} else {
			this._oldSection = this.getItem().columnData[this._index];
			this._removeCells = this.getItem().deleteColumn(this._index);
		}
	}

	undo() {
		if (this._row) {
			this.getItem().addRow(this._oldSection, this._index, this._removeCells);
		} else {
			this.getItem().addColumn(this._oldSection, this._index, this._removeCells);
		}
	}

	redo() {
		this.execute();
	}

	toObject() {
		const data = super.toObject();

		data.index = this._index;
		data.row = this._row;

		return data;
	}
}

module.exports = DeleteLayoutSectionCommand;
