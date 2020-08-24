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
const MESSAGES = require('../_data/messages.json');
const { DELETE } = require('../../src/functions/streamsheet').functions;
const { createFuncTerm, createParamTerms } = require('../utilities');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const createMessage = (config, id) => {
	const msg = new Message(JSON.parse(JSON.stringify(config.data)), id);
	Object.assign(msg.metadata, JSON.parse(JSON.stringify(config.metadata)));
	return msg;
};
const setup = (config) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet({ name: config.streamsheetName });
	machine.addStreamSheet(streamsheet);
	streamsheet.inbox.put(createMessage(MESSAGES.SIMPLE, 'msg-simple'));
	streamsheet.inbox.put(createMessage(MESSAGES.SIMPLE2, 'msg-simple2'));
	return streamsheet.sheet;
};
const setupWithOutbox = (config) => {
	const sheet = setup(config);
	const outbox = sheet.streamsheet.machine.outbox;
	outbox.put(createMessage(MESSAGES.SIMPLE, 'msg-simple'));
	outbox.put(createMessage(MESSAGES.SIMPLE2, 'msg-simple2'));
	return { sheet, outbox };
};

describe('delete', () => {
	it('should clear all data from a message in inbox', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', 'msg-simple2')))).toBe(true);
		expect(inbox.peek('msg-simple2').data).toEqual({});
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', 'msg-simple')))).toBe(true);
		expect(inbox.peek('msg-simple').data).toEqual({});
	});
	it('should clear all metadata from a message in inbox', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxmetadata', createParamTerms('T1', 'msg-simple2'))))
			.toBe(true);
		expect(inbox.peek('msg-simple2').metadata).toEqual({ id: 'msg-simple2' });
		expect(inbox.peek('msg-simple2').data).toEqual(MESSAGES.SIMPLE2.data);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxmetadata', createParamTerms('T1', 'msg-simple'))))
			.toBe(true);
		expect(inbox.peek('msg-simple').metadata).toEqual({ id: 'msg-simple' });
		expect(inbox.peek('msg-simple').data).toEqual(MESSAGES.SIMPLE.data);
	});
	it('should clear all metadata from an outbox message', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxmetadata', createParamTerms('msg-simple2'))))
			.toBe(true);
		expect(outbox.peek('msg-simple2').metadata).toEqual({ id: 'msg-simple2' });
		expect(outbox.peek('msg-simple2').data).toEqual(MESSAGES.SIMPLE2.data);
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxmetadata', createParamTerms('msg-simple'))))
			.toBe(true);
		expect(outbox.peek('msg-simple').metadata).toEqual({ id: 'msg-simple' });
		expect(outbox.peek('msg-simple').data).toEqual(MESSAGES.SIMPLE.data);
	});
	it('should clear all data from a message in outbox', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata', createParamTerms('msg-simple2')))).toBe(true);
		expect(outbox.peek('msg-simple2').data).toEqual({});
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata', createParamTerms('msg-simple')))).toBe(true);
		expect(outbox.peek('msg-simple').data).toEqual({});
	});
	it('should delete data from an inbox message', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', 'msg-simple', 'Kundenname'))))
			.toBe(true);
		// pop message
		const msg = inbox.pop('msg-simple');
		expect(msg).toBeDefined();
		expect(msg.data.Kundenname).toBeUndefined();
	});
	it('should delete metadata from an inbox message', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		const inboxmetadata = createFuncTerm(sheet, 'inboxmetadata', createParamTerms('T1', '', 'sender'));
		let msg = inbox.peek();
		expect(msg.metadata.sender).toBeDefined();
		expect(DELETE(sheet, inboxmetadata)).toBe(true);
		msg = inbox.peek();
		expect(msg).toBeDefined();
		expect(msg.metadata.name).toBeDefined();
		expect(msg.metadata.sender).toBeUndefined();
	});
	it('should delete metadata from an outbox message', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		const outboxmetadata = createFuncTerm(sheet, 'outboxmetadata', createParamTerms('msg-simple2', 'sender'));
		let msg = outbox.peek();
		expect(msg.metadata.sender).toBeDefined();
		expect(DELETE(sheet, outboxmetadata)).toBe(true);
		msg = outbox.peek();
		expect(msg).toBeDefined();
		expect(msg.metadata.name).toBeDefined();
		expect(msg.metadata.sender).toBeUndefined();
	});
	it('should delete data from an outbox message', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		let msg = outbox.peek('msg-simple');
		expect(msg.data.Kundenname).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata', createParamTerms('msg-simple', 'Kundenname'))))
			.toBe(true);
		msg = outbox.peek('msg-simple');
		expect(msg.data.Kundenname).toBeUndefined();
		// delete an array element
		expect(msg.data.Positionen[1]).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata', createParamTerms('msg-simple', 'Positionen', 1))))
			.toBe(true);
		// pop message
		msg = outbox.peek('msg-simple');
		expect(msg.data.Positionen[1]).toBeUndefined();
		expect(msg.data.Positionen[2].Artikelnr).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata',
			createParamTerms('msg-simple', 'Positionen', 2, 'Artikelnr')))).toBe(true);
		// pop message
		msg = outbox.peek('msg-simple');
		expect(msg.data.Positionen[2].Artikelnr).toBeUndefined();
		expect(msg.data.Positionen).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxdata', createParamTerms('msg-simple', 'Positionen'))))
			.toBe(true);
		// pop message
		msg = outbox.peek('msg-simple');
		expect(msg.data.Positionen).toBeUndefined();
	});
	it('should be possible to delete loop element from an inbox message', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		sheet.streamsheet.setLoopPath('[data][Positionen]');
		const msgBefore = inbox.peek('msg-simple');
		expect(msgBefore).toBeDefined();
		expect(msgBefore.data.Positionen).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', 'msg-simple', ''))))
			.toBe(true);
		let msgAfter = inbox.peek('msg-simple');
		expect(msgAfter).toBeDefined();
		expect(msgAfter.data.Positionen[0]).toBeUndefined();
		expect(msgAfter.data.Positionen[1]).toBeDefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', 'msg-simple', 'Positionen'))))
			.toBe(true);
		// pop message
		msgAfter = inbox.pop('msg-simple');
		expect(msgAfter).toBeDefined();
		expect(msgAfter.data.Positionen).toBeUndefined();
	});
	it('should delete specified messages from inbox', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple2')))).toBe(true);
		expect(inbox.size).toBe(1);
		expect(inbox.peek('msg-simple')).toBeDefined();
		expect(inbox.peek('msg-simple2')).toBeUndefined();
		// once again should do no harm
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple')))).toBe(true);
		expect(inbox.size).toBe(0);
	});
	it('should delete current message in inbox if no message id was specified', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', '')))).toBe(true);
		expect(inbox.size).toBe(1);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple2')))).toBe(true);
		expect(inbox.size).toBe(0);
	});
	it('should delete all messages from inbox if "*" is passed', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', '*')))).toBe(true);
		expect(inbox.size).toBe(0);
		// once again should do no harm
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', '*')))).toBe(true);
		expect(inbox.size).toBe(0);
	});
	it('should delete specified message from outbox', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		expect(outbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('msg-simple2')))).toBe(true);
		expect(outbox.size).toBe(1);
		expect(outbox.peek('msg-simple')).toBeDefined();
		expect(outbox.peek('msg-simple2')).toBeUndefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('msg-simple')))).toBe(true);
		expect(outbox.size).toBe(0);
	});
	it('should delete top message from outbox if no id was specified', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		expect(outbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('')))).toBe(true);
		expect(outbox.size).toBe(1);
		// note: reverse order in outbox
		expect(outbox.peek('msg-simple')).toBeDefined();
		expect(outbox.peek('msg-simple2')).toBeUndefined();
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('')))).toBe(true);
		expect(outbox.size).toBe(0);
	});
	it('should delete all messages from outbox if "*" is passed', () => {
		const { sheet, outbox } = setupWithOutbox({ streamsheetName: 'T1' });
		expect(outbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('*')))).toBe(true);
		expect(outbox.size).toBe(0);
		// once again should do no harm
		expect(DELETE(sheet, createFuncTerm(sheet, 'outbox', createParamTerms('*')))).toBe(true);
		expect(outbox.size).toBe(0);
	});
	it('should return #NO_MSG if deleting unknown message', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		expect(inbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'unknown')))).toBe(ERROR.NO_MSG);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple')))).toBe(true);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple2')))).toBe(true);
		expect(inbox.size).toBe(0);
		// eslint-disable-next-line
		expect(DELETE(sheet, createFuncTerm(sheet, 'inbox', createParamTerms('T1', 'msg-simple')))).toBe(ERROR.NO_MSG);
		expect(inbox.size).toBe(0);
	});
	it('should return #NO_MSG_DATA if deleting unknown message data or metadata', () => {
		const sheet = setup({ streamsheetName: 'T1' });
		const inbox = sheet.streamsheet.inbox;
		const outbox = sheet.streamsheet.machine.outbox;
		outbox.put(createMessage(MESSAGES.SIMPLE, 'msg-simple'));
		expect(inbox.size).toBe(2);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('T1', '', 'unknown'))))
			.toBe(ERROR.NO_MSG_DATA);
		expect(DELETE(sheet, createFuncTerm(sheet, 'inboxmetadata', createParamTerms('T1', '', 'unknown'))))
			.toBe(ERROR.NO_MSG_DATA);
		expect(DELETE(sheet, createFuncTerm(sheet, 'outboxmetadata', createParamTerms('msg-simple', 'unknown'))))
			.toBe(ERROR.NO_MSG_DATA);
	});
});
