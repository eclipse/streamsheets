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
const Point = require('../../geometry/Point');
const Expression = require('../expr/Expression');
const CellRange = require('../model/CellRange');
const { getSheetFromItem } = require('./utils');

const cellsFromResponse = ({ machineserver }) =>
	machineserver ? machineserver.cells : {};
const cellDescriptor = (reference, cell) => {
	const expr = cell && cell.getExpression();
	const value = cell ? cell.getValue() : undefined;
	const formula = expr ? expr.getFormula() : undefined;
	return { reference, formula, value, type: typeof value }; // level
};
const areEqual = (descr1, descr2) =>
	descr1.expr === descr2.expr &&
	descr1.value === descr2.value &&
	descr1.formula === descr2.formula;

/**
 * const SampleData = {
 * 	cells : [{
 * 			reference: "A1",
 * 			value: "Test" or  10, or false ...,
 * 			formula: "SUM(A1:B1")
 * 			level: 0
 * 		}]
 * 	};
 * @type {module.SetSheetCellsCommand}
 */
module.exports = class SetCellsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetCellsCommand(
					item,
					data.cells,
					data.execute
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, data, execute) {
		super(item);

		this._cellDescriptors = data;
		this._execute = execute;
		this._oldCellDescriptors = undefined;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		this._oldCellDescriptors = data.undo.cellDescriptors;
		return cmd;
	}

	get sheet() {
		return getSheetFromItem(this._graphItem);
	}


	toObject() {
		const data = super.toObject();
		data.cells = this._cellDescriptors;
		data.execute = this._execute;
		data.undo.cellDescriptors = this._oldCellDescriptors;
		return data;
	}

	execute() {
		// save all cells to create delta for undo...
		const dataProvider = this._graphItem.getDataProvider();
		const range = new CellRange(this._graphItem, 0, 0);
		this._tmpCellDescriptors = {};
		dataProvider.enumerate((column, row, cell) => {
			range.set(column, row);
			range.shiftToSheet();
			this._tmpCellDescriptors[range.toString()] = cellDescriptor(
				range.toString(),
				cell
			);
		});

		this.redo();
	}

	undo() {
		this.setCells(this._oldCellDescriptors);
	}

	redo() {
		if (this._execute) {
			this.setCells(this._cellDescriptors);
		}
	}

	setCells(cellDescriptors = []) {
		const data = this._graphItem.getCells().getDataProvider();
		cellDescriptors.forEach((cellData) => {
			const res = CellRange.refToRC(cellData.reference, this._graphItem);
			if (res != null) {
				const pos = new Point(
					res.column -
						this._graphItem.getColumns().getInitialSection(),
					res.row
				);

				let cell;
				if (
					cellData.value === undefined &&
					cellData.formula === undefined
				) {
					cell = data.get(pos);
					if (cell) {
						cell.clearContent();
					}
				} else {
					cell = data.create(pos);
					const expr = new Expression(
						cellData.value,
						cellData.formula
					);
					cell.setExpression(expr);
					// cell.setValue(cellData.value);
					cell._value = cellData.value;
				}

				if (cellData.level !== undefined && cell) {
					cell.getOrCreateAttributes().setLevel(cellData.level);
				}
			}
		});
		data.evaluate(this._graphItem);
		this._graphItem.getGraph().markDirty();
	}

	handleResponse(response, error) {
		if (response && !this._oldCellDescriptors) {
			const oldcells = this._tmpCellDescriptors;
			const sheetcells = cellsFromResponse(response);
			this._oldCellDescriptors = [];
			Object.keys(sheetcells).forEach((key) => {
				const oldCellDescr = oldcells[key];
				const newCellDescr = sheetcells[key];
				if (!oldCellDescr || !areEqual(oldCellDescr, newCellDescr)) {
					this._oldCellDescriptors.push(
						oldCellDescr || cellDescriptor(key)
					);
				}
			});
		} else {
			// if (error)
			this._oldCellDescriptors = undefined;
		}
		this._tmpCellDescriptors = undefined;
	}
};
