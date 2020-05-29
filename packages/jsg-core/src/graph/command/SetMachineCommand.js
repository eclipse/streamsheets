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
module.exports = class SetMachineCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		// const item = graph.getItemById(data.itemId);
		const { machineData } = data;
		return machineData
			? new SetMachineCommand(graph, machineData).initWithObject(data)
			: undefined;
	}

	constructor(item, machineData) {
		super(item);

		this._data = machineData;
	}

	// initWithObject(data) {
	// 	const cmd = super.initWithObject(data);
	// 	return cmd;
	// }
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
		Object.values(this._data.names).forEach((serverName) => {
			const name = graph.getOrCreateName(serverName.name);
			if (name) {
				const expr = new Expression(
					serverName.value,
					serverName.formula
				);
				name.setExpression(expr);
				name.setValue(serverName.value);
				name.evaluate(graph);
			}
		});

		Object.keys(this._data.sheets).forEach((key) => {
			const sheet = getProcessSheetByName(key);
			if (sheet) {
				const data = sheet.getDataProvider();

				data.clearContent();

				const sourceData = this._data.sheets[key];

				sourceData.cells.forEach((cellData) => {
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

				if (sourceData.names) {
					Object.values(sourceData.names).forEach((serverName) => {
						const name = data.getOrCreateName(serverName.name);
						if (name) {
							const expr = new Expression(
								serverName.value,
								serverName.formula
							);
							name.setExpression(expr);
							name.setValue(serverName.value);
						}
					});
				}

				// if (sourceData.graphs) {
				// 	Object.values(sourceData.graphs).forEach((serverName) => {
				// 		const name = data.getOrCreateGraph(serverName.name);
				// 		if (name) {
				// 			const expr = new Expression(serverName.value, serverName.formula);
				// 			name.setExpression(expr);
				// 			name.setValue(serverName.value);
				// 		}
				// 	});
				// }
				//
				if (sourceData.graphItems) {
					sheet.setGraphItems(this.graphItems);
				}
			}
		});

		graph.evaluate();
		graph.markDirty();
	}
};
