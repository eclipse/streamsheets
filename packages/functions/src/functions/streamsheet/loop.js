const { runFunction } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');


const loopcount = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || Error.code.NO_STREAMSHEET)
		.run((streamsheet) => {
			const count = streamsheet.getLoopCount();
			return streamsheet.isLoopAvailable() && count >= 0 ? count : Error.code.NA;
		});

const loopindex = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || Error.code.NO_STREAMSHEET)
		// DL-1080: returned loop index should be based to 1
		.run(streamsheet => (streamsheet.isLoopAvailable() ? streamsheet.getLoopIndex() + 1 : Error.code.NA));


module.exports = {
	LOOPCOUNT: loopcount,
	LOOPINDEX: loopindex,
};
