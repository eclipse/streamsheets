const { runFunction, sheet: { getMessagesFromBox, getStreamSheetByName } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

/** @deprecated ?? */
const inboxjson = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(streamsheet => getStreamSheetByName(streamsheet.value, sheet) || Error.INVALID_PARAM)
		.mapNextArg(inclMetaData => convert.toBoolean(inclMetaData && inclMetaData.value, false))
		.run((streamsheet, inclMetaData) => getMessagesFromBox(streamsheet.inbox, inclMetaData));

module.exports = inboxjson;
