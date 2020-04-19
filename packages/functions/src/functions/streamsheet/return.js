const { runFunction } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const _return = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withMaxArgs(1)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.mapNextArg(retval => retval && retval.value)
		.run((streamsheet, retval) => {
			streamsheet.stopProcessing(retval);
			return retval != null ? retval : true;
		});

module.exports = _return;
