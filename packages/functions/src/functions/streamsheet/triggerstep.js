const { runFunction, sheet: sheetutils } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const triggerstep = (sheet, ...terms) => runFunction(sheet, terms).withArgCount(0).run(() => {
	// should not be used directly in cell:
	const cell = sheetutils.cellFromFunc(triggerstep);
	const streamsheet = sheet.streamsheet;
	return (cell || !streamsheet) ? ERROR.INVALID : streamsheet.step('force');
});

module.exports = triggerstep;
