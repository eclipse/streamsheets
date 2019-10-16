const Message = require('../machine/Message');
const jsonpath = require('./jsonpath');
const ERROR = require('./errors');
const { convert } = require('./_utils');


const cutBrackets = (str) => {
	str = str.startsWith('[') ? str.substr(1) : str;
	return str.endsWith(']') ? str.substr(0, str.length - 1) : str;
};

const cellFromTerm = (term) => {
	const refop = term && term.operand;
	return refop && refop.sheet && refop.sheet.cellAt(refop.index);
};

const rowAt = (idx, arr) => {
	arr[idx] = arr[idx] || [];
	return arr[idx];
};

// how to handle metatdata? => inside payload (message.data object) or additional or as an own metadata property...
const getMessagesFromBox = (box, includeMetaData) =>
	box.messages.map((message) => {
		const msg = message.data;
		if (includeMetaData) {
			Object.assign(msg, message.metadata);
		}
		return msg;
	});

const getOutboxMessage = (id, machine) => machine.outbox && machine.outbox.peek(id);

const getInboxMessage = (streamsheetName, messageId, machine) => {
	const streamsheet = machine.getStreamSheetByName(streamsheetName);
	return streamsheet ? streamsheet.inbox.peek(messageId) : undefined;
};

const getInboxOrOutboxMessage = (path, machine) => {
	let message;
	// first check if we reference an outbox message...
	if (path.length === 1) {
		message = getOutboxMessage(path[0], machine);
	}
	return message || getInboxMessage(path[0], path[1], machine);
};

const createMessageFromValue = (value) => {
	let message;
	if (value != null) {
		message = ERROR.isError(value) || new Message(typeof value === 'object' ? Object.assign({}, value) : { value });
	}
	return message;
};

// term can be simple cell-ref, DICTIONARY, ARRAY, inbox, outbox message...
const createMessageFromTerm = (term, machine) => {
	let message;
	const value = term.value;
	const path = jsonpath.parse(value);
	if (path.length) {
		message = getInboxOrOutboxMessage(path, machine);
		// we need to copy, because MessageHandler & StreamSheet compare messages via ===
		return message ? message.copy() : undefined;
	}
	return createMessageFromValue(value);
};

const termAs = (f) => (term, fallback) => (term ? f(term.value, fallback) : fallback);

const termAsString = termAs(convert.toString);
const termAsNumber = termAs(convert.toNumber);

const getMachine = (sheet) => sheet.streamsheet && sheet.streamsheet.machine;

const getStreamSheetByName = (name, sheet) => {
	if (name) {
		const machine = getMachine(sheet);
		return machine && machine.getStreamSheetByName(name);
	}
	return sheet.streamsheet;
};
const getOutbox = (sheet) => {
	const machine = getMachine(sheet);
	return machine && machine.outbox;
};
const getInbox = (sheet, streamsheetName) => {
	const streamsheet = getStreamSheetByName(streamsheetName, sheet);
	return streamsheet ? streamsheet.inbox : undefined;
};

const getStreamSheet = (term, sheet) => {
	const name = term ? term.value : '';
	return getStreamSheetByName(name, sheet);
};

const getLocale = (sheet) => {
	const machine = getMachine(sheet);
	const locale = machine && machine.locale;
	return locale || 'en';
};

const messageFromInbox = (sheet, term) => {
	const [streamsheetName, msgId] = jsonpath.parse(term.value);
	const inbox = getInbox(sheet, streamsheetName);
	return inbox.peek(msgId);
};

const messageFromOutbox = (machine, term) => {
	const [msgId] = jsonpath.parse(term.value);
	return machine.outbox.peek(msgId);
};

const isFuncTerm = (term, func) =>
	term && term.func && typeof term.name === 'string' && term.name.toLowerCase() === func.toLowerCase();

const isInboxTerm = (term) => isFuncTerm(term, 'inbox');

const isOutboxTerm = (term) => isFuncTerm(term, 'outbox');

const isOutboxDataTerm = (term) => isFuncTerm(term, 'outboxdata');

const isInboxDataTerm = (term) => isFuncTerm(term, 'inboxdata');

const isInboxMetaDataTerm = (term) => isFuncTerm(term, 'inboxmetadata');

const isBoxFuncTerm = (term) =>
	isInboxTerm(term) ||
	isOutboxTerm(term) ||
	isOutboxDataTerm(term) ||
	isInboxDataTerm(term) ||
	isInboxMetaDataTerm(term);

const messageFromBox = (machine, sheet, term, requireMessageData = true) => {
	let message;
	if (isInboxTerm(term)) {
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? { metadata: inboxMessage.metadata, data: inboxMessage.data } : ERROR.NO_MSG;
	} else if (isOutboxTerm(term)) {
		const outboxMessage = messageFromOutbox(machine, term);
		message = outboxMessage ? outboxMessage.data : ERROR.NO_MSG;
	} else if (isOutboxDataTerm(term)) {
		const [, ...path] = jsonpath.parse(term.value);
		const outboxMessage = messageFromOutbox(machine, term);
		message = outboxMessage ? jsonpath.query(path, outboxMessage.data) : ERROR.NO_MSG;
	} else if (isInboxDataTerm(term)) {
		const [, , ...path] = jsonpath.parse(term.value);
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? jsonpath.query(path, inboxMessage.data) : ERROR.NO_MSG;
	} else if (isInboxMetaDataTerm(term)) {
		const [, , ...path] = jsonpath.parse(term.value);
		const inboxMessage = messageFromInbox(sheet, term);
		message = inboxMessage ? jsonpath.query(path, inboxMessage.metadata) : ERROR.NO_MSG;
	}
	if (requireMessageData && (message === null || message === undefined)) {
		return ERROR.NO_MSG_DATA;
	}
	return message;
};

const messageFromBoxOrValue = (machine, sheet, term, requireMessageData = true) => {
	if (isBoxFuncTerm(term)) {
		return messageFromBox(machine, sheet, term, requireMessageData);
	}
	return term.value;
};

const requestIdCurrentMessage = (sheet) => {
	const message = sheet.streamsheet.getMessage();
	return message && message.metadata && message.metadata.requestId;
};

const getRequestId = (requestIdTerm, sheet) => {
	const requestIdParam = requestIdTerm && requestIdTerm.value;
	const requestId = requestIdParam || requestIdCurrentMessage(sheet);
	const error = ERROR.ifNot(typeof requestId === 'string', ERROR.INVALID_PARAM);
	return error || requestId;
};

module.exports = {
	cellFromTerm,
	createMessageFromTerm,
	createMessageFromValue,
	cutBrackets,
	getInbox,
	getInboxOrOutboxMessage,
	getLocale,
	getMessagesFromBox,
	getMachine,
	getOutbox,
	getRequestId,
	getStreamSheet,
	getStreamSheetByName,
	isBoxFuncTerm,
	isFuncTerm,
	isInboxTerm,
	isOutboxTerm,
	messageFromBox,
	messageFromBoxOrValue,
	rowAt,
	termAsNumber,
	termAsString,
};
