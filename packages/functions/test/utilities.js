const Functions = require('../src/functions');
const { FuncTerm, Term } = require('@cedalo/parser');
const { CellReference, CellRangeReference, SheetIndex, SheetParser } = require('@cedalo/machine-core');

const createCellTerm = (idxstr, sheet) => {
	const index = SheetIndex.create(idxstr);
	const reference = index ? new CellReference(index, sheet) : undefined;
	return new Term(reference);
};

const createCellTerms = (sheet, ...idxstrings) => idxstrings.map(idxstr => createCellTerm(idxstr, sheet));

const createCellRangeTerm = (rangestr, sheet) => {
	const reference = CellRangeReference.fromString(rangestr, sheet);
	return new Term(reference);
};

const createCellAt = (idxstr, value, sheet) => {
	const cell = SheetParser.createCell(value, sheet);
	const index = SheetIndex.create(idxstr);
	sheet.setCellAt(index, cell);
	return cell;
};

const createTerm = (formula, sheet) => SheetParser.parse(formula, sheet);

const createFuncTerm = (sheet, funcname, params) => {
	const funcTerm = new FuncTerm(funcname.toUpperCase());
	funcTerm.func = Functions[funcTerm.name];
	funcTerm.scope = sheet;
	funcTerm.params = params;
	return funcTerm;
};

const createParamTerms = (...params) => params.map(param => Term.fromValue(param));

module.exports = {
	createCellAt,
	createCellTerm,
	createCellTerms,
	createCellRangeTerm,
	createFuncTerm,
	createParamTerms,
	createTerm
};
