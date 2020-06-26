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
const { FEEDINBOX } = require('../../src/functions/streamsheet').functions;
const { createTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const setup = () => {
	const machine = new Machine();
	const t1 = new StreamSheet();
	t1.name = 'T1';
	const t2 = new StreamSheet();
	t2.name = 'T2';
	machine.removeAllStreamSheets();
	machine.addStreamSheet(t1);
	machine.addStreamSheet(t2);
	return t1.sheet;
};

const getStreamSheet = (name, sheet) => sheet.machine.getStreamSheetByName(name);

describe('feedinbox', () => {
	it('should push a new message with data to streamsheet T2', () => {
		const sheet = setup();
		const t2 = getStreamSheet('T2', sheet);
		sheet.processor._isProcessing = true;
		expect(t2.inbox.size).toBe(0);
		expect(FEEDINBOX(sheet, Term.fromString('Data'), Term.fromString('T2'))).toBe(true);
		expect(t2.inbox.size).toBe(1);
		const msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.data).toBeDefined();
		expect(msg.data.value).toBe('Data');
	});
	// DL-2914
	it('should create a deep copy of message taken from inbox or outbox', () => {
		const sheet = setup();
		const t1 = getStreamSheet('T1', sheet);
		const t2 = getStreamSheet('T2', sheet);
		// add messages to in- and outbox
		const inmsg = new Message({ test: { value: 23 } });
		const outmsg = new Message({ test: { value: 42 } });
		t1.inbox.put(inmsg);
		t1.machine.outbox.put(outmsg);
		sheet.processor._isProcessing = true;
		// feed inbox message
		expect(createTerm('feedinbox(inbox("",""), "T2")', sheet).value).toBe(true);
		// get feeded msg from inbox:
		let msg = t2.inbox.pop();
		expect(msg.data.Data.test.value).toBe(23);
		// change original:
		inmsg.data.newvalue = 12;
		inmsg.data.test.value = 1234;
		// check feeded message did not change
		expect(msg.data.Data.newvalue).toBeUndefined();
		expect(msg.data.Data.test.value).toBe(23);

		// feed outbox message
		expect(createTerm('feedinbox(OUTBOX(""), "T2")', sheet).value).toBe(true);
		msg = t2.inbox.pop();
		expect(msg.data.Data.test.value).toBe(42);
		// change original:
		outmsg.data.newvalue = 'out';
		outmsg.data.test.value = 4321;
		expect(msg.data.Data.newvalue).toBeUndefined();
		expect(msg.data.Data.test.value).toBe(42);
	});
	// DL-1835
	it('should extend metadata of pushed message with source and trigger properties', async () => {
		const sheet = setup();
		const machine = sheet.machine;
		const t2 = machine.getStreamSheetByName('T2');
		sheet.loadCells({ 'A1': { formula: 'feedinbox("Data2", "T2")}' } });
		expect(t2.inbox.size).toBe(0);
		await machine.step();
		expect(t2.inbox.size).toBe(1);
		let msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.metadata).toBeDefined();
		expect(msg.metadata.source).toBe('T1');
		expect(msg.metadata.trigger).toBe('FEEDINBOX');
		// feed T1 from T1
		const t1 = machine.getStreamSheetByName('T1');
		sheet.loadCells({ 'A1': { formula: 'feedinbox("Data1", "T1")}' } });
		await machine.step();
		expect(t1.inbox.size).toBe(1);
		msg = t1.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.metadata).toBeDefined();
		expect(msg.metadata.source).toBe('T1');
		expect(msg.metadata.trigger).toBe('FEEDINBOX');
		// feed T1 from T2
		t1.sheet.loadCells({ 'A1': 23 }); // replace feedinbox formula otherwise we have 2 messages
		t2.sheet.loadCells({ 'A1': { formula: 'feedinbox("Data", "T1")}' } });
		await machine.step();
		expect(t1.inbox.size).toBe(1);
		msg = t1.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.metadata).toBeDefined();
		expect(msg.metadata.source).toBe('T2');
		expect(msg.metadata.trigger).toBe('FEEDINBOX');
	});
	// DL-1275
	it('should nest complete messages from inbox & outbox under data of new message', () => {
		const sheet = setup();
		const t1 = getStreamSheet('T1', sheet);
		const t2 = getStreamSheet('T2', sheet);
		// add messages to in- and outbox
		const inmsg = new Message({ temperature: 23 });
		const outmsg = new Message({ pressure: 42.3 });
		t1.inbox.put(inmsg);
		t1.machine.outbox.put(outmsg);
		sheet.processor._isProcessing = true;
		expect(t1.inbox.size).toBe(1);
		expect(t1.machine.outbox.size).toBe(1);
		expect(t2.inbox.size).toBe(0);
		// feed  inbox message
		expect(createTerm('feedinbox(inbox("",""), "T2")', sheet).value).toBe(true);
		expect(t1.inbox.size).toBe(1);
		expect(t2.inbox.size).toBe(1);
		let msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.data).toBeDefined();
		expect(msg.data.Data).toBeDefined();
		expect(msg.data.Metadata).toBeDefined();
		expect(msg.data.Metadata.id).toBe(inmsg.id);
		expect(msg.data.Data.temperature).toBe(23);
		// feed  outbox message
		expect(createTerm('feedinbox(OUTBOX(""), "T2")', sheet).value).toBe(true);
		expect(t1.machine.outbox.size).toBe(1);
		expect(t2.inbox.size).toBe(1);
		msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.data).toBeDefined();
		expect(msg.data.Data).toBeDefined();
		expect(msg.data.Metadata).toBeDefined();
		expect(msg.data.Metadata.id).toBe(outmsg.id);
		expect(msg.data.Data.pressure).toBe(42.3);
	});
	it('should return an error if streamsheet T2 is not available', () => {
		const sheet = setup();
		const t2 = getStreamSheet('T2', sheet);
		sheet.machine.removeStreamSheet(t2);
		sheet.processor._isProcessing = true;
		expect(FEEDINBOX(sheet, Term.fromString('Data'), Term.fromString('T2'))).toBe(ERROR.NO_STREAMSHEET);
	});
	// is allowed now: DL-876
	it('should be allowed to push a message to own sheet streamsheet', () => {
		const sheet = setup();
		const t1 = getStreamSheet('T1', sheet);
		sheet.processor._isProcessing = true;
		expect(t1.inbox.size).toBe(0);
		expect(FEEDINBOX(sheet, Term.fromString('Data'), Term.fromString('T1'))).toBe(true);
		expect(t1.inbox.size).toBe(1);
		const msg = t1.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.data).toBeDefined();
		expect(msg.data.value).toBe('Data');
	});
	// DL-1834
	it('should work with inboxdata and inboxmetadata', async () => {
		const sheet = setup();
		const machine = sheet.machine;
		const t1 = getStreamSheet('T1', sheet);
		const t2 = getStreamSheet('T2', sheet);
		// add messages to in- and outbox
		const inmsg = new Message({ temperature: 23 });
		t1.inbox.put(inmsg);
		sheet.loadCells({ A1: { formula: 'feedinbox(INBOXDATA(,), "T2")' } });
		expect(t1.inbox.size).toBe(1);
		expect(t2.inbox.size).toBe(0);
		machine.step();
		expect(t2.inbox.size).toBe(1);
		let msg = t2.inbox.pop();
		expect(msg.data.temperature).toBe(23);
		// check with inboxmetadata:
		sheet.loadCells({ A1: { formula: 'feedinbox(INBOXMETADATA(,), "T2")' } });
		expect(t1.inbox.size).toBe(1);
		expect(t2.inbox.size).toBe(0);
		await machine.step();
		expect(t2.inbox.size).toBe(1);
		msg = t2.inbox.pop();
		expect(msg.data.id).toBe(inmsg.id);
		expect(msg.data.arrivalTime).toBe(inmsg.metadata.arrivalTime);
	});
	// DL-1833
	it('should return an error if no message data is available', async () => {
		const sheet = setup();
		const machine = sheet.machine;
		const t2 = machine.getStreamSheetByName('T2');
		sheet.loadCells({ 'A1': { formula: 'feedinbox(inbox(,"adsd"), "T2")}' } });
		expect(t2.inbox.size).toBe(0);
		await machine.step();
		expect(t2.inbox.size).toBe(0);
		expect(sheet.cellAt('A1').value).toBe(ERROR.NO_MSG_DATA);
		// expect(FEEDINBOX(sheet, createCellTerm('A1', sheet), Term.fromString('T2'))).toBe(ERROR.NO_MSG_DATA);
		sheet.loadCells({ 'A1': { formula: 'feedinbox(B1, "T2")}' } });
		await machine.step();
		expect(t2.inbox.size).toBe(0);
		expect(sheet.cellAt('A1').value).toBe(ERROR.NO_MSG_DATA);
	});
	it('should return #ARG_NUM error if not enough parameters are specified', () => {
		const sheet = setup();
		expect(FEEDINBOX()).toBe(ERROR.ARGS);
		expect(FEEDINBOX(sheet)).toBe(ERROR.ARGS);
		expect(FEEDINBOX(sheet, Term.fromString('Data'))).toBe(ERROR.ARGS);
	});
});
