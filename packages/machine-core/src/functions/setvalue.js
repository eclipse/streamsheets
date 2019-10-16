const ERROR = require('./errors');
const Cell = require('../machine/Cell');
const { Term } = require('@cedalo/parser');
const { convert, runFunction, sheet: sheetutils } = require('./_utils');


// const doIt = value => value || value == null;
const newCellAt = (index, value, sheet) => {
	const cell = new Cell(value);
	sheet.setCellAt(index, cell);
	return cell;
};

const setCells = (value, cellrefs, overwrite) => {
	let res = ERROR.isError(cellrefs);
	if (!res) {
		cellrefs.forEach((cellref) => {
			const cell = cellref.target || newCellAt(cellref.index, value, cellref.sheet);
			if (cell.formula == null || overwrite) {
				cell.term = Term.fromValue(value);
			} else {
				cell._value = value;
			}
		});
		res = true;
	}
	return res;
};

const setvalue = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg(condition => !!condition.value)
		.mapNextArg(val => val.value)
		.mapNextArg(cellrefs => sheetutils.getCellReferencesFromTerm(cellrefs, sheet) || [])
		.mapNextArg(overwrite => convert.toBoolean(overwrite && overwrite.value, false))
		.run((condition, val, cellrefs, overwrite) => condition && setCells(val, cellrefs, overwrite) || true);

module.exports = setvalue;
