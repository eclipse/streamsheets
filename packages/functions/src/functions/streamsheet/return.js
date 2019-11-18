const { runFunction } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const _return = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMaxArgs(1)
		.addMappedArg(() => sheet.streamsheet || Error.code.NO_STREAMSHEET)
		.mapNextArg(retval => retval && retval.value)
		.run((streamsheet, retval) => {
			streamsheet.stopProcessing(retval);
			return retval != null ? retval : true;
		});

module.exports = _return;
