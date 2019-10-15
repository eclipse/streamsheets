// const SheetIndex = require('../../machine/SheetIndex');
const ERROR = require('../errors');
const Cell = require('../../machine/Cell');
const SheetRange = require('../../machine/SheetRange');
const { CellReference } = require('../../parser/References');
const { Term } = require('@cedalo/parser');


// sheet: default sheet to use if CellReference must be created
const getCellFromTermIndex = (term, sheet) => {
	let cell;
	if (term.hasOperandOfType('CellRangeReference')) {
		const range = term.operand.range;
		cell = ERROR.isError(range) || range.sheet.cellAt(range.start);
	} else {
		// eslint-disable-next-line
		term.value; // we need to get value to ensure a possible cell-index is set...
		cell = term.cellIndex != null ? sheet.cellAt(term.cellIndex) : undefined;
	}
	return cell;
};
const getCellFromTerm = (term, sheet) => {
	let cell;
	if (term) {
		cell = term.hasOperandOfType('CellReference') ? term.operand.target : getCellFromTermIndex(term, sheet);
	}
	return cell;
};


const createCellRangeFromIndex = (index, sheet) => {
	const cellrange = index && SheetRange.fromStartEnd(index, index);
	if (cellrange) cellrange.sheet = sheet;
	return cellrange;
};
const createCellRangeFromCellReference = (term) => {
	const cellref = term.operand;
	return term.hasOperandOfType('CellReference') && cellref
		? createCellRangeFromIndex(cellref.index, cellref.sheet)
		: undefined;
};
const getCellRangeFromTerm = (term, sheet, strict) => {
	let range;
	if (term) {
		// we need to get value to ensure cell index is set...
		const value = term.value;
		// cannot simply return error here!! will prevent overriding an error-cell!!!
		// range = ERROR.isError(value) || ((value instanceof SheetRange) && value);
		range = (value instanceof SheetRange) && value;
		if (!range && !strict) {
			range = createCellRangeFromCellReference(term)
				|| (term.cellIndex ? createCellRangeFromIndex(term.cellIndex, sheet) : undefined);
		}
	}
	return range;
};

const getCellRangesFromTerm = (term, sheet, strict) => {
	const ranges = [];
	if (term) {
		const value = term.value;
		// did we get an array of values...
		if (Array.isArray(value)) {
			value.forEach(((val) => {
				const range = (val instanceof SheetRange) && val;
				if (range) ranges.push(range);
			}));
		} else {
			const range = getCellRangeFromTerm(term, sheet, strict);
			if (range) ranges.push(range);
		}
	}
	return ranges;
};


// const getCellsFromTerm = (term, sheet) => {
// 	let list = term ? [] : undefined;
// 	if (list) {
// 		const params = term.isList ? term.params : [term];
// 		params.some((param) => {
// 			const range = getCellRangeFromTerm(param, sheet);
// 			if (!ERROR.isError(range)) {
// 				range.iterate(cell => cell && list.push(cell));
// 				return false;
// 			}
// 			list = range;
// 			return true;
// 		});
// 	}
// 	return list;
// };
const getCellReferencesFromTerm = (term, sheet) => {
	let refs = term ? [] : undefined;
	if (refs) {
		const params = term.isList ? term.params : [term];
		params.some((param) => {
			const range = getCellRangeFromTerm(param, sheet);
			if (ERROR.isError(range)) {
				refs = range;
				return true;
			}
			const rangesheet = range && range.sheet;
			if (rangesheet) {
				range.iterate((cell, index) => {
					if (index) refs.push(new CellReference(index.copy(), rangesheet));
				});
			}
			return false;
		});
	}
	return refs;
};


const toStaticCell = cell => (cell != null ? new Cell(cell.value, Term.fromValue(cell.value)) : undefined);

const cellFromFunc = (func) => {
	const funcTerm = func.term;
	return funcTerm && funcTerm.cell;
};

module.exports = {
	cellFromFunc,
	getCellFromTerm,
	// getCellsFromTerm,
	getCellRangeFromTerm,
	getCellRangesFromTerm,
	getCellReferencesFromTerm,
	toStaticCell
};
