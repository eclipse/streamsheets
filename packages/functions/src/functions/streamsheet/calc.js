const { runFunction, sheet: sheetutils } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const calc = (sheet, ...terms) => runFunction(sheet, terms).withArgCount(0).run(() => {
	// should not be used directly in cell:
	const cell = sheetutils.cellFromFunc(calc);
	return cell ? ERROR.INVALID : sheet.startProcessing();
});

module.exports = calc;
