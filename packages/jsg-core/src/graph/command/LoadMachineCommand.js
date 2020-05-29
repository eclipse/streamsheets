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

/**
 * const SampleData = {
 * 	cells : [{
 * 			reference: "A1",
 * 			value: "Test" or  10, or false ...,
 * 			formula: "SUM(A1:B1")
 * 			formulaWithValues: "BAR(23)
 * 		}]
 * 	};
 * @type {module.SetMachineCommand}
 */
module.exports = class LoadMachineCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new LoadMachineCommand(graph, data.machineData).initWithObject(
					data
			  )
			: undefined;
	}

	constructor(item, machineData) {
		super(item);

		this._data = machineData;
	}

	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}
	toObject() {
		const data = super.toObject();
		data.machineData = this._data;
		return data;
	}
	undo() {
		// no undo necessary
	}

	redo() {
		const graph = this._graphItem;
		const container = graph.getStreamSheetsContainer();

		const getProcessSheetByName = (name) => {
			let result;
			container.enumerateStreamSheetContainers((sheet) => {
				const processSheet = sheet.getStreamSheet();
				if (name === processSheet.getName().getValue()) {
					result = processSheet;
				}
			});
			return result;
		};

		// global names
		Object.entries(this._data.namedCells).forEach(([name, value]) => {
			const sheetName = graph.getOrCreateName(name);
			if (sheetName) {
				const expr = new Expression(value.value, value.formula);
				sheetName.setExpression(expr);
				sheetName.setValue(value.value);
				sheetName.evaluate(graph);
			}
		});

		this._data.streamsheets.forEach((streamsheet) => {
			const sheet = getProcessSheetByName(streamsheet.name);
			if (sheet) {
				const data = sheet.getDataProvider();

				data.clearContent();

				streamsheet.sheet.cells.forEach((cellData) => {
					const res = CellRange.refToRC(cellData.reference, sheet);
					if (res === undefined) {
						return;
					}
					const pos = new Point(
						res.column - sheet.getColumns().getInitialSection(),
						res.row
					);

					const cell = data.create(pos);
					const expr = new Expression(
						cellData.value,
						cellData.formula
					);

					cell.setExpression(expr);
					cell.setValue(cellData.value);
					cell.setInfo(cellData.info);
				});

				if (streamsheet.sheet.namedCells) {
					Object.entries(streamsheet.sheet.namedCells).forEach(
						([name, value]) => {
							const serverName = data.getOrCreateName(name);
							if (serverName) {
								const expr = new Expression(
									value.value,
									value.formula
								);
								serverName.setExpression(expr);
								serverName.setValue(value.value);
							}
						}
					);
				}

				if (streamsheet.sheet.graphCells) {
					Object.entries(streamsheet.sheet.graphCells).forEach(
						([name, value]) => {
							const serverName = data.getOrCreateGraph(name);
							if (serverName) {
								const expr = new Expression(
									value.value,
									value.formula
								);
								serverName.setExpression(expr);
								serverName.setValue(value.value);
							}
						}
					);
				}

				if (streamsheet.sheet.graphItems) {
					sheet.setGraphItems(streamsheet.sheet.graphItems);
				}
			}
		});

		graph.evaluate();
		graph.markDirty();
	}
};
