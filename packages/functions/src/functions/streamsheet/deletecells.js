const { runFunction, sheet: sheetutils } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const deleteRange = (cellrange) => {
	const sheet = cellrange.sheet;
	if (cellrange) {
		cellrange.iterate((cell, index) => {
			sheet.setCellAt(index, undefined);
		});
	}
};
const deletecells = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => {
			let error;
			terms.some((term) => {
				const cellrange = sheetutils.getCellRangeFromTerm(term, sheet);
				error = Error.isError(cellrange);
				if (!error) deleteRange(cellrange);
				return !!error;
			});
			return error || true;
		});

module.exports = deletecells;
