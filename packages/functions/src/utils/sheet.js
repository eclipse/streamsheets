/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const {
	isBoxFuncTerm,
	isInboxTerm,
	isInboxDataTerm,
	isInboxMetaDataTerm,
	isOutboxTerm,
	isOutboxDataTerm
} = require('./terms');
const { Term } = require('@cedalo/parser');
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, Message } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const toStaticCell = cell => (cell != null ? new Cell(cell.value, Term.fromValue(cell.value)) : undefined);

const cellFromFunc = (func) => {
	const funcTerm = func.term;
	return funcTerm && funcTerm.cell;
};

const getMachine = (sheet) => sheet.streamsheet && sheet.streamsheet.machine;

const getStreamSheetByName = (name, sheet) => {
	if (name) {
		const machine = getMachine(sheet);
		return machine && machine.getStreamSheetByName(name);
	}
	return sheet.streamsheet;
};

const getStreamSheet = (term, sheet) => {
	const name = term ? term.value : '';
	return getStreamSheetByName(name, sheet);
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

const getOutbox = (sheet) => {
	const machine = getMachine(sheet);
	return machine && machine.outbox;
};
const getInbox = (sheet, streamsheetName) => {
	const streamsheet = getStreamSheetByName(streamsheetName, sheet);
	return streamsheet ? streamsheet.inbox : undefined;
};

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
		message = FunctionErrors.isError(value) || new Message(typeof value === 'object' ? Object.assign({}, value) : { value });
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

module.exports = {
	cellFromFunc,
	createMessageFromValue,
	createMessageFromTerm,
	toStaticCell,
	getInbox,
	getLocale,
	getMachine,
	getMessagesFromBox,
	getOutbox,
	getStreamSheet,
	getStreamSheetByName,
	messageFromBox,
	messageFromBoxOrValue,
};
