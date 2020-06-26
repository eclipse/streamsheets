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
const JSONReader = require('../../commons/JSONReader');
const JSONWriter = require('../../commons/JSONWriter');
const DataProvider = require('../model/DataProvider');
const Selection = require('../model/Selection');
const CellRange = require('../model/CellRange');
/**
 * Command to delete the cell content within an array of ranges
 *
 * @class DeleteCellContentCommand
 * @param {Array} ranges Array of CellRange objects.
 */
module.exports = class DeleteCellContentCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new DeleteCellContentCommand(
					item,
					data.reference,
					data.action
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, ref, action) {
		super(item);

		const selection = Selection.fromStringMulti(ref, item);

		if (!selection._ranges) {
			return;
		}

		this._action = action;
		this._ranges = selection._ranges;
		this._ref = ref;
		this._oldCells = new DataProvider(this._ranges[0].getSheet());

		// save cells in given ranges
		const data = this._ranges[0].getSheet().getDataProvider();
		this._ranges.forEach((range) => {
			range.enumerateCells(false, (pos) => {
				const cell = data.get(pos);
				if (cell) {
					this._oldCells.setTo(pos, cell.copy());
				}
			});
		});
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		const undoJSON = data.undo.json;
		if (undoJSON) {
			const reader = new JSONReader(undoJSON);
			const root = reader.getObject(reader.getRoot(), 'data');
			cmd._oldCells = new DataProvider(cmd._ranges[0].getSheet());
			cmd._oldCells.read(reader, root);
		}
		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.reference = this._ref;
		data.action = this._action;

		// undo info
		const writer = new JSONWriter();
		writer.writeStartDocument();
		this._oldCells.save(writer);
		writer.writeEndDocument();

		data.undo.json = writer.flush();

		const cellDescriptors = [];
		const range = new CellRange(this._ranges[0].getSheet(), 0, 0, 0, 0);

		this._oldCells.enumerate((column, row, cell) => {
			range.set(column, row);
			range.shiftToSheet();
			const expr = cell.getExpression();
			const attributes = cell.getAttributes();
			const cellDescriptor = {
				reference: range.toString(),
				formula: expr ? expr.getFormula() : undefined,
				value: cell.getValue(),
				type: typeof cell.getValue(),
				level: attributes ? attributes.getLevel().getValue() : undefined
			};
			cellDescriptors.push(cellDescriptor);
		});
		data.undo.cellDescriptors = cellDescriptors;

		return data;
	}

	get sheet() {
		return this._ranges[0].getSheet();
	}

	undo() {
		const data = this._ranges[0].getSheet().getDataProvider();

		this._ranges.forEach((range) => {
			range.enumerateCells(false, (pos) => {
				const cell = this._oldCells.get(pos);
				if (cell) {
					data.setTo(pos, cell.copy());
				}
			});
		});

		this._ranges[0]
			.getSheet()
			.getGraph()
			.markDirty();
	}

	redo() {
		this._ranges.forEach((range) => {
			range.deleteCellContent(this._action);
		});

		this._ranges[0]
			.getSheet()
			.getGraph()
			.markDirty();
	}

	execute() {
		this.redo();
	}
};
