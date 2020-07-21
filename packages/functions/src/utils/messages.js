const { jsonpath } = require('@cedalo/commons');

// TODO: a lot of message handling functions have slightly different requirements... :-( 
// => COMBINE!! all message handling methods!!

const getStreamSheetByName = (sheet, name) => {
	if (name) {
		const machine = sheet.machine;
		if (machine) return machine.getStreamSheetByName(name);
	}
	return sheet.streamsheet;
};
const readInboxMessage = (sheet, streamsheetName, messageId) => {
	const streamsheet = getStreamSheetByName(sheet, streamsheetName);
	// note: read current message from streamsheet instead of inbox, since it might not be top in inbox!!
	return streamsheet ? streamsheet.getMessage(messageId) : undefined;
};
const readOutboxMessage = (sheet, messageId) => sheet.machine.outbox.peek(messageId);

const getMessageInfo = (sheet, term) => {
	const path = jsonpath.parse(term.value);
	const fnName = term.func && term.name && term.name.toUpperCase();
	const messageKey = `${fnName}-${term.value}`;
	const isInbox = fnName && fnName.startsWith('INBOX');
	const isOutbox = fnName && fnName.startsWith('OUTBOX');
	// eslint-disable-next-line
	const message = isOutbox
		? readOutboxMessage(sheet, path.shift())
		: isInbox ? readInboxMessage(sheet, path.shift(), path.shift())	: undefined;
	const isProcessed = !!message && sheet.streamsheet.isMessageProcessed(message);
	return { message, messageKey, isProcessed, path, fnName };
};

const isData = (fnName) => fnName && fnName.endsWith('DATA');
const isMeta = (fnName) => fnName && fnName.endsWith('METADATA');

const getMessageValue = (msginfo) => {
	const { fnName, message, path } = msginfo;
	if (message) {
		// eslint-disable-next-line no-nested-ternary
		return isMeta(fnName) ? message.getMetaDataAt(path) : isData(fnName) ? message.getDataAt(path) : message;
	}
	return undefined;
};

const dataKey = (fnName) => (isData(fnName) ? 'Data' : undefined);
const metadataKey = (fnName) => (isMeta(fnName) ? 'Metadata' : undefined);
const getMessageValueKey = (msginfo) => {
	const { fnName, path } = msginfo;
	const key = path[path.length - 1];
	// should return undefined for complete message!! i.e. inbox/outbox
	return key || (fnName ? metadataKey(fnName) || dataKey(fnName) : undefined);
};
module.exports = {
	getMessageInfo,
	getMessageValue,
	getMessageValueKey
};
