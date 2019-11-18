const {runFunction, sheet: { getStreamSheet } } = require('../../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const inbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(2)
		.mapNextArg((term) => getStreamSheet(term, sheet) || Error.code.NO_STREAMSHEET)
		.mapNextArg((msgid) => (msgid ? msgid.value || '' : ''))
		.run((streamsheet, messageId) => `[${streamsheet.name}][${messageId}]`);

module.exports = inbox;
