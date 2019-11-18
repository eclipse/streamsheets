const { runFunction, sheet: { getMessagesFromBox, getStreamSheetByName } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

/** @deprecated ?? */
const inboxjson = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.withMaxArgs(2)
		.mapNextArg(streamsheet => getStreamSheetByName(streamsheet.value, sheet) || ERROR.INVALID_PARAM)
		.mapNextArg(inclMetaData => convert.toBoolean(inclMetaData && inclMetaData.value, false))
		.run((streamsheet, inclMetaData) => getMessagesFromBox(streamsheet.inbox, inclMetaData));

module.exports = inboxjson;
