const ERROR = require('../errors');
const { convert, runFunction, sheet: { getMessagesFromBox, getStreamSheetByName } } = require('../../utils');


/** @deprecated ?? */
const inboxjson = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(streamsheet => getStreamSheetByName(streamsheet.value, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(inclMetaData => convert.toBoolean(inclMetaData && inclMetaData.value, false))
		.run((streamsheet, inclMetaData) => getMessagesFromBox(streamsheet.inbox, inclMetaData));

module.exports = inboxjson;
