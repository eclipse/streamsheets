const ERROR = require('../errors');
const { runFunction } = require('../../utils');


const loopcount = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		.run((streamsheet) => {
			const count = streamsheet.getLoopCount();
			return streamsheet.isLoopAvailable() && count >= 0 ? count : ERROR.NA;
		});

const loopindex = (sheet) =>
	runFunction(sheet)
		.withArgCount(0)
		.addMappedArg(() => sheet.streamsheet || ERROR.NO_STREAMSHEET)
		// DL-1080: returned loop index should be based to 1
		.run(streamsheet => (streamsheet.isLoopAvailable() ? streamsheet.getLoopIndex() + 1 : ERROR.NA));


module.exports = {
	LOOPCOUNT: loopcount,
	LOOPINDEX: loopindex,
};
