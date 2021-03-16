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
const BooleanExpression = require('../expr/BooleanExpression');
const NumberExpression = require('../expr/NumberExpression');
const StringExpression = require('../expr/StringExpression');
const CellRange = require('../model/CellRange');

const createExpression = ({ formula, type, value }) => {
	switch (type) {
		case 'bool':
			return new BooleanExpression(value, formula);
		case 'number':
			return new NumberExpression(value, formula);
		case 'string':
			return new StringExpression(value, formula);
		default:
			return new Expression(value, formula);
	}
};

/**
 * const SampleData = {
 * 	cells : [{
 * 			reference: "A1",
 * 			value: "Test" or  10, or false ...,
 * 			formula: "SUM(A1:B1")
 * 			formulaWithValues: "BAR(23)
 * 		}]
 * 	};
 * @type {module.SetSheetCellsCommand}
 */
module.exports = class SetSheetCellsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetSheetCellsCommand(
					item,
					data.cells,
					data.shapes
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, data, shapes, namedCells) {
		super(item);

		this._data = data;
		this._shapes = shapes;
		this._namedCells = namedCells;

		// TODO save undo info
	}
	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.cells = this._data;
		data.shapes = this._shapes;
		data.namedCells = this._namedCells;

		return data;
	}

	undo() {
		// this._graphItem.getCells().getDataProvider().set(this._pos, this._oldExpr);
	}

	redo() {
		const data = this._graphItem.getCells().getDataProvider();

		data.markUpdate();

		this._data.forEach((cellData) => {
			const res = CellRange.refToRC(cellData.reference, this._graphItem);
			if (res === undefined) {
				return;
			}
			const pos = new Point(
				res.column - this._graphItem.getColumns().getInitialSection(),
				res.row
			);

			const cell = data.create(pos);
			if (
				cellData.value === undefined &&
				cellData.formula === undefined
			) {
				cell.clearContent();
			} else {
				let expr = cell.getExpression();
				if (expr) {
					const term  = expr.getTerm();
					if (term && expr.getFormula() !== cellData.formula) {
						expr = createExpression(cellData);
						cell.setExpression(expr);
					} else {
						switch (cellData.type) {
							case 'bool':
								if (!(expr instanceof BooleanExpression)) {
									expr = createExpression(cellData);
									cell.setExpression(expr);
								}
								break;
							case 'number':
								if (!(expr instanceof NumberExpression)) {
									expr = createExpression(cellData);
									cell.setExpression(expr);
								}
								break;
							case 'string':
								if (!(expr instanceof StringExpression)) {
									expr = createExpression(cellData);
									cell.setExpression(expr);
								}
								break;
							default:
								if (!(expr instanceof Expression)) {
									expr = createExpression(cellData);
									cell.setExpression(expr);
								}
								break;
						}
					}
				}

				cell.setValue(cellData.value);
			}
			cell.setInfo(cellData.info);

			// mark cell as updated, not updated cells will be cleared
			cell._updated = true;
		});

		data.clearNotUpdated();

		if (this._namedCells) {
			Object.keys(this._namedCells).forEach((key) => {
				const name = data.getOrCreateName(key);
				if (name) {
					const serverName = this._namedCells[key];
					const expr = new Expression(
						serverName.value,
						serverName.formula
					);
					name.setExpression(expr);
					name.setValue(serverName.value);
					name.evaluate(this._graphItem);
				}
			});
		}

		if (this._shapes) {
			this._graphItem.setShapes(this._shapes);
		}

		data.evaluate(this._graphItem);
		this._graphItem.getGraph().markDirty();
	}
};
