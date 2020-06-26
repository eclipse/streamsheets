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
	common: { deepCopy },
	runFunction,
	sheet: { createMessageFromValue, getMachine, getStreamSheetByName }
} = require('../../utils');
const { jsonpath } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Message } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

// DL-1835:
const addMetaData = (message, sheet) => {
	message.metadata = message.metadata || {};
	message.metadata.source = sheet.streamsheet.name;
	message.metadata.trigger = 'FEEDINBOX';
	return message;
};

// DL-1834 TODO VERY SIMILAR to read.js => extract!!
const getInboxMessage = (machine, streamsheetName, messageId) => {
	const streamsheet = machine.getStreamSheetByName(streamsheetName);
	return streamsheet ? streamsheet.getMessage(messageId) : undefined;
};
const getOutboxMessage = (machine, messageId) => {
	const outbox = machine.outbox;
	return outbox ? outbox.peek(messageId) : undefined;
};
const getMessageDataAt = (path, message, metadata) => {
	let data;
	if (message) {
		data = metadata ? message.getMetaDataAt(path) : message.getDataAt(path);
	}
	return data;
};
const getMessage = (path, funcname, machine) => funcname.startsWith('OUTBOX') // outbox || outboxdata
	? getOutboxMessage(machine, path.shift())
	: getInboxMessage(machine, path.shift(), path.shift());


// term can be simple cell-ref, DICTIONARY, ARRAY, inbox, outbox message...
const createMessageFromTerm = (term, machine) => {
	let message;
	const value = term.value;
	const path = jsonpath.parse(value);
	if (path.length) {
		const funcname = (term.func && term.name) || '';
		message = getMessage(path, funcname, machine);
		if (funcname.endsWith('DATA')) {
			const data = getMessageDataAt(path, message, funcname === 'INBOXMETADATA');
			return data ?  new Message(data) : undefined;
		}
		// DL-1275: create new Message which contains passed message under its data property...
		return message ?  new Message(deepCopy(message.toJSON())) : undefined;
	}
	return createMessageFromValue(value);
};


const feedinbox = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(2)
		.addMappedArg(() => getMachine(sheet) || ERROR.NO_MACHINE)
		.addMappedArg((machine) => createMessageFromTerm(terms[0], machine) || ERROR.NO_MSG_DATA)
		.addMappedArg(() => getStreamSheetByName(terms[1].value, sheet) || ERROR.NO_STREAMSHEET)
		.run((machine, message, streamsheet) => {
			addMetaData(message, sheet);
			streamsheet.inbox.put(message);
			return true;
		});
feedinbox.displayName = true;

module.exports = feedinbox;
