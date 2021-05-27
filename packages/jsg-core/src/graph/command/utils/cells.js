const CellRange = require('../../model/CellRange');
// const Expression = require('../../expr/Expression');
const { getCellProperties, toServerProperties } = require('../../model/utils');
const { getCellReference } = require('./cellrange');

const areEqual = (descr1, descr2) =>
	descr1.expr === descr2.expr && descr1.value === descr2.value && descr1.formula === descr2.formula;

const cellDescriptor = (reference, cell) => {
	const expr = cell && cell.getExpression();
	const value = cell ? cell.getValue() : undefined;
	const formula = expr ? expr.getFormula() : undefined;
	return { reference, formula, value, type: typeof value }; // level
};

const getCellDescriptor = (range, cell) => {
	const descr = cellDescriptor(range.toString(), cell);
	descr.ref = getCellReference(range, false);
	descr.properties = cell ? toServerProperties(getCellProperties(cell)) : undefined;
	return descr;
};

const getCellDescriptorsFromRanges = (ranges, dataProvider) => {
	const descriptors = [];
	if (ranges && ranges.length) {
		const sheet = ranges[0].getSheet();
		const tmprange = new CellRange(sheet, 0, 0, 0, 0);
		dataProvider = dataProvider || sheet.getDataProvider();
		ranges.forEach((range) => {
			// TODO: when relative, when absolute??
			const col = 0; // range.getX1();
			const row = 0; // range.getY1();
			range.enumerateCells(false, (pos) => {
				const cell = dataProvider.get({ x: pos.x - col, y: pos.y - row });
				if (cell) {
					tmprange.set(pos.x, pos.y);
					tmprange.shiftToSheet();
					descriptors.push(getCellDescriptor(tmprange, cell));
				}
			});
		});
	}
	return descriptors;
};

// const cellFactory = (dataProvider) => (col, row, cellData) => {
// 	let cell;
// 	const { formula, level, value } = cellData;
// 	if (value === undefined && formula === undefined) {
// 		cell = dataProvider.getRC(col, row);
// 		if (cell) cell.clearContent();
// 	} else {
// 		cell = dataProvider.createRC(col, row);
// 		const expr = new Expression(value, formula);
// 		cell.setExpression(expr);
// 		cell.setValue(value);
// 	}
// 	if (cell && level !== undefined) {
// 		cell.getOrCreateAttributes().setLevel(level);
// 	}
// };
// const setCells = (descriptors = [], sheetModel) => {
// 	const dataProvider = sheetModel && sheetModel.getCells().getDataProvider();
// 	if (dataProvider) {
// 		const createCellAt = cellFactory(dataProvider);
// 		descriptors.forEach((cellData) => {
// 			const res = CellRange.refToRC(cellData.reference, sheetModel);
// 			if (res != null) {
// 				const row = res.row - sheetModel.getRows().getInitialSection();
// 				const col = res.column -sheetModel.getColumns().getInitialSection();
// 				createCellAt(col, row, cellData);
// 			}
// 		});
// 		return true;
// 	}
// 	return false;
// };


module.exports = {
	areEqual,
	cellDescriptor,
	// getCellDescriptor,
	getCellDescriptorsFromRanges
	// setCells
};
