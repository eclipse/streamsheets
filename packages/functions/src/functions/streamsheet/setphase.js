const ERROR = require('../errors');
const { convert, runFunction, terms: { cellFromTerm } } = require('../../utils');
const { Term } = require('@cedalo/parser');
const Cell = require('@cedalo/machine-core');

const createCell = (sheet, term) => {
	const refop = term && term.operand;
	const newcell = new Cell('');
	return (refop && sheet.setCellAt(refop.index, newcell)) ? newcell : null;
};

const setphase = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg(isTrue => convert.toBoolean(isTrue.value, false))
		.mapNextArg(phaseId => (phaseId.value ? `${phaseId.value}` : ERROR.NV))
		.mapNextArg(phaseCell => cellFromTerm(phaseCell))
		.mapNextArg(overwrite => convert.toBoolean(overwrite && overwrite.value, false))
		.run((isTrue, phaseId, phaseCell, overwrite) => {
			// do nothing if condition is not fulfilled
			if (!isTrue) return false;
			if (phaseCell == null || phaseCell.value !== phaseId) {
				phaseCell = phaseCell || createCell(sheet, terms[2]);
				if (phaseCell) {
					if (phaseCell.hasFormula && !overwrite) phaseCell.value = phaseId;
					else phaseCell.term = Term.fromString(phaseId);
				}
			}
			return !!(phaseCell && phaseCell.value === phaseId);
		});


module.exports = setphase;
