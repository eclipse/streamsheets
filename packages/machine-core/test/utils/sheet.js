const { SheetIndex } = require('../..');
const { SheetParser } = require('../../src/parser/SheetParser');


const createCellAt = (idxstr, value, sheet) => {
	const cell = SheetParser.createCell(value, sheet);
	const index = SheetIndex.create(idxstr);
	sheet.setCellAt(index, cell);
	return cell;
};

const createTerm = (formula, sheet) => SheetParser.parse(formula, sheet);

module.exports = {
	createCellAt,
	createTerm
};
