const ERROR = require('./errors');
const { getStreamSheet } = require('./utils');
const runFunction = require('./_utils').runFunction;

const inbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(2)
		.mapNextArg((term) => getStreamSheet(term, sheet) || ERROR.NO_STREAMSHEET)
		.mapNextArg((msgid) => (msgid ? msgid.value || '' : ''))
		.run((streamsheet, messageId) => `[${streamsheet.name}][${messageId}]`);

module.exports = inbox;
