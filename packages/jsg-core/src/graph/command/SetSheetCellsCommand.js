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
 * @type {module.SetSheetCellsCommand}
 */
module.exports = class SetSheetCellsCommand extends AbstractItemCommand {
	static createFromObject(data = {}, { graph }) {
		const item = graph.getItemById(data.itemId);
		return item
			? new SetSheetCellsCommand(
					item,
					data.cells,
					data.drawings,
					data.graphItems
			  ).initWithObject(data)
			: undefined;
	}

	constructor(item, data, drawings, graphItems, graphCells, namedCells) {
		super(item);

		this._data = data;
		this._graphItems = graphItems;
		this._namedCells = namedCells;
		this._graphCells = graphCells;

		// TODO save undo info
	}
	initWithObject(data) {
		const cmd = super.initWithObject(data);
		return cmd;
	}

	toObject() {
		const data = super.toObject();

		data.cells = this._data;
		data.graphItems = this._graphItems;
		data.namedCells = this._namedCells;
		data.graphCells = this._graphCells;

		return data;
	}

	undo() {
		// this._graphItem.getCells().getDataProvider().set(this._pos, this._oldExpr);
	}

	redo() {
		const data = this._graphItem.getCells().getDataProvider();

		data.clearContent();

		this._data.forEach((cellData) => {
			const res = CellRange.refToRC(cellData.reference, this._graphItem);
			if (res === undefined) {
				return;
			}
			const pos = new Point(
				res.column - this._graphItem.getColumns().getInitialSection(),
				res.row - this._graphItem.getRows().getInitialSection()
			);

			const cell = data.create(pos);
			if (
				cellData.value === undefined &&
				cellData.formula === undefined
			) {
				cell.clearContent();
			} else {
				// this is to ensure that temporary values form ui interaction (e.g. slider) are not overwritten
				if (cell._targetValue !== undefined && cellData.value !== cell._targetValue) {
					cellData.value = cell._targetValue;
				}
				const expr = new Expression(cellData.value, cellData.formula);
				cell.setExpression(expr);
				cell.setValue(cellData.value);
				if (cell._targetValue !== undefined && cellData.value === cell._targetValue) {
					cell._targetValue = undefined;
				}
			}
			cell.setValues(cellData.info.values);
		});

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

		if (this._graphItems) {
			this._graphItem.setGraphItems(this._graphItems);
		}

		data.evaluate(this._graphItem);
		this._graphItem.getGraph().markDirty();
	}
};
