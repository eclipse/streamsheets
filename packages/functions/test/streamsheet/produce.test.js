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
const MSG = require('../_data/messages.json');
const SHEETS = require('../_data/sheets.json');
const { PRODUCE } = require('../../src/functions/streamsheet').functions;
const { createCellRangeTerm, createFuncTerm, createParamTerms, createTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Machine, Message, Streams, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

let published = {};

Streams.publish = (streamId, msg) => {
	published[msg.topic] = msg.message;
};

const TEST_PRODUCER = { type: 'producer', id: 'test_stream', name: 'test_stream', state: 'connected' };

const producerRef = (sheet) => createTerm(`|${TEST_PRODUCER.name}`, sheet);

const setup = () => {
	const machine = new Machine();
	Streams.registerSource(TEST_PRODUCER, machine);
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	return streamsheet.sheet;
};

beforeEach(() => {
	published = {};
});

describe('produce', () => {
	describe('produce message from outbox', () => {
		it('should publish outbox message', () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const outbox = sheet.streamsheet.machine.outbox;
			outbox.put(new Message({ topic: 'test/topic', message: Object.assign({}, MSG.SIMPLE.data) }, 'out1'));
			// publish this message...
			const msgId = createTerm('OUTBOX("out1")', sheet);
			expect(PRODUCE(sheet, producerRef(sheet), msgId)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message.Kundenname.Vorname).toBe('Max');
			expect(message.Positionen.length).toBe(3);
		});
		it('should leave published message in outbox', () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const outbox = sheet.streamsheet.machine.outbox;
			outbox.put(new Message({ topic: 'test/topic', message: Object.assign({}, MSG.SIMPLE.data) }, 'out1'));
			expect(outbox.size).toBe(1);
			// publish this message...
			const msgId = createTerm('OUTBOX("out1")', sheet);
			expect(PRODUCE(sheet, producerRef(sheet), msgId)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message).toEqual(MSG.SIMPLE.data);
			expect(outbox.size).toBe(1);
			expect(outbox.peek('out1').data.message).toEqual(message);
			expect(outbox.peek('out1').data.topic).toEqual('test/topic');
		});
	});
	describe('produce a message from a json string', () => {
		it('should publish simple string', () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const json = Term.fromString('{"message":"Message","topic":"test/topic"}');
			expect(PRODUCE(sheet, producerRef(sheet), json)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message).toBe('Message');
		});
		it('should require a valid JSON', () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const json = Term.fromString('{"message":"Message","topic":"test/topic"');
			expect(PRODUCE(sheet, producerRef(sheet), json)).toBe(ERROR.INVALID_PARAM);
		});
		it('should require a message field', () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const json = Term.fromString('{"noMessageField":"Message","topic":"test/topic"');
			expect(PRODUCE(sheet, producerRef(sheet), json)).toBe(ERROR.INVALID_PARAM);
		});
	});
	describe.skip('publish json created by dictionary, array or subtree function', () => {
		it('should publish data specified by dictionary function', () => {
			const sheet = setup().load({ cells: SHEETS.SIMPLE });
			sheet.processor._isProcessing = true;
			const topic = Term.fromString('test/topic');
			// publish data defined by dictionary:
			const data = createFuncTerm(sheet, 'dictionary', [createCellRangeTerm('A1:C2', sheet)]);
			expect(PRODUCE(sheet, producerRef(sheet), data, topic)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message[0].A1).toBe('B1');
			expect(message[0].A2).toBe('B2');
			expect(message[1].A1).toBe('C1');
			expect(message[1].A2).toBe('C2');
		});
		it('should publish data specified by array function', () => {
			const sheet = setup().load({ cells: SHEETS.SIMPLE });
			sheet.processor._isProcessing = true;
			const topic = Term.fromString('test/topic');
			// publish data defined by dictionary:
			const data = createFuncTerm(sheet, 'array', [createCellRangeTerm('B1:C3', sheet)]);
			expect(PRODUCE(sheet, producerRef(sheet), data, topic)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message[0]).toEqual(['B1', 'C1']);
			expect(message[1]).toEqual(['B2', 'C2']);
		});
		it('should publish data specified by subtree function', () => {
			const sheet = setup();
			sheet.streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
			sheet.processor._isProcessing = true;
			const topic = Term.fromString('test/topic');
			// publish data defined by dictionary:
			const inboxdata = createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Kundenname'));
			const data = createFuncTerm(sheet, 'subtree', [inboxdata]);
			expect(PRODUCE(sheet, producerRef(sheet), data, topic)).toBe(true);
			const message = published['test/topic'];
			expect(message).toBeDefined();
			expect(message.Vorname).toBe('Max');
			expect(message.Nachname).toBe('Mustermann');
		});
	});
	describe('error messages', () => {
		it(`should return with ${ERROR.ARGS} if number of parameters are wrong`, () => {
			expect(PRODUCE()).toBe(ERROR.ARGS);
			const sheet = setup();
			sheet.processor._isProcessing = true;
			expect(PRODUCE(sheet)).toBe(ERROR.ARGS);
		});
		it(`should return with ${ERROR.NO_MACHINE} if machine could not be found`, () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const msgId = createTerm('OUTBOX("out1")', sheet);
			sheet.streamsheet.machine = undefined;
			expect(PRODUCE(sheet, producerRef(sheet), msgId)).toBe(ERROR.NO_MACHINE);
		});
		it(`should return with ${ERROR.INVALID_PARAM} if message could not be found`, () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const msgId = createTerm('OUTBOX("out1")', sheet);
			expect(PRODUCE(sheet, producerRef(sheet), msgId)).toBe(ERROR.INVALID_PARAM);
		});
		it(`should return with ${ERROR.NO_PRODUCER} if stream could not be resolved`, () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const outbox = sheet.streamsheet.machine.outbox;
			const msgId = createTerm('OUTBOX("out1")', sheet);
			const streamId = createTerm(`|Unknown`, sheet);
			outbox.put(new Message(Object.assign({}, MSG.SIMPLE.data), 'out1'));
			expect(PRODUCE(sheet, streamId, msgId)).toBe(ERROR.NO_PRODUCER);
		});
		it(`should return with ${ERROR.ARGS} if tried to publish null or undefined`, () => {
			const sheet = setup();
			sheet.processor._isProcessing = true;
			const topic = Term.fromString('test/topic');
			expect(PRODUCE(sheet, producerRef(sheet), Term.fromString(null), topic)).toBe(ERROR.ARGS);
			expect(published['test/topic']).toBeUndefined();
			expect(PRODUCE(sheet, producerRef(sheet), Term.fromString(undefined), topic)).toBe(ERROR.ARGS);
			expect(published['test/topic']).toBeUndefined();
		});
	});
});
