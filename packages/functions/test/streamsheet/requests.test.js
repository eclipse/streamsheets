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
const { createCellAt } = require('../utilities');
const { Machine, Message, SheetIndex, Streams, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const cellAt = (idxstr, sheet) => sheet.cellAt(SheetIndex.create(idxstr));

// eslint-disable-next-line
let pendingRequest = undefined;

Streams.request = (streamId, message) => new Promise((resolve, rejectIt) => {
	const responseMessage = {
		type: 'response',
		response: message.toJSON(),
		requestId: message.id
	};
	pendingRequest = {
		message: responseMessage,
		resolve: () => resolve(responseMessage),
		reject: (err) => rejectIt(err)
	};
});


const TEST_PRODUCER = { type: 'producer', id: 'test_stream', name: 'test_stream', state: 'connected' };

const setupStreamSheet = (cells) => {
	const machine = new Machine();
	Streams.registerSource(TEST_PRODUCER, machine);
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	streamsheet.sheet.load({ cells });
	return streamsheet;
};

beforeEach(() => {
	pendingRequest = undefined;
});

describe('request', () => {
	it('should return with request id', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", outbox("response"))' } });
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		await machine.step();
		const reqId = cellAt('A1', sheet).value;
		expect(reqId).toBeDefined();
		expect(sheet.getPendingRequests().size).toBe(1);
		expect(sheet.getPendingRequests().get(reqId)).toBeDefined();
	});
	it('should not request twice with same request id', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", outbox("response"))' } });
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		await machine.step();
		const reqId = cellAt('A1', sheet).value;
		expect(reqId).toBeDefined();
		expect(sheet.getPendingRequests().size).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.getPendingRequests().size).toBe(1);
	});
	it('should store request response to outbox', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", outbox("response"))' } });
		const machine = streamsheet.machine;
		const outbox = machine.outbox;
		expect(outbox.size).toBe(0);
		await machine.step();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(outbox.size).toBe(1);
		expect(outbox.peek('response')).toBeDefined();
	});
	it('should store request response to inbox', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", inbox())' } });
		const machine = streamsheet.machine;
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(1);
		expect(streamsheet.inbox.peek().data.value).toBe('hallo');
	});
	it('should request with message from outbox', async () => {
		const streamsheet = setupStreamSheet({
			A1: { formula: 'request(|test_stream, outboxdata("request"), inbox())' }
		});
		const machine = streamsheet.machine;
		const outbox = machine.outbox;
		outbox.put(new Message({ text: 'hallo' }, 'request'));
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(1);
		expect(streamsheet.inbox.peek().data.text).toBe('hallo');
	});
	it('should create a new request if previous finished', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", inbox())' } });
		const machine = streamsheet.machine;
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(1);
		expect(streamsheet.inbox.peek().data.value).toBe('hallo');
		await machine.step();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(2);
	});
	it('should remove resolved or rejected request on next cycle', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", inbox())' } });
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		expect(sheet.getPendingRequests().size).toBe(1);
		const previousRequestId = sheet
		.getPendingRequests()
		.keys()
		.next();
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(1);
		await machine.step();
		expect(sheet.getPendingRequests().size).toBe(1);
		const currentRequestId = sheet
		.getPendingRequests()
		.keys()
		.next();
		expect(currentRequestId).not.toBe(previousRequestId);
	});
	it('should remove all pending request on machine stop', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", inbox())' } });
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		expect(sheet.getPendingRequests().size).toBe(1);
		await machine.pause();
		await machine.stop();
		expect(sheet.getPendingRequests().size).toBe(0);
		// resolve request => should not do anything?
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(0);
	});
	it('should remove pending request if function is replaced', async () => {
		const streamsheet = setupStreamSheet({ A1: { formula: 'request(|test_stream, "hallo", inbox())' } });
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		expect(streamsheet.inbox.size).toBe(0);
		await machine.step();
		expect(sheet.getPendingRequests().size).toBe(1);
		createCellAt('A1', 'A1+1', sheet);
		expect(sheet.getPendingRequests().size).toBe(0);
		// resolve request => should not do anything?
		await pendingRequest.resolve(pendingRequest.message.data);
		expect(streamsheet.inbox.size).toBe(0);
	});
});

describe('requestinfo', () => {
	it('should return false for a pending request', async () => {
		const streamsheet = setupStreamSheet({
			A1: { formula: 'request(|test_stream, "hallo", outbox("response"))' },
			B1: { formula: 'requestinfo(a1)' }
		});
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		await machine.step();
		expect(cellAt('B1', sheet).value).toBe(false);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(cellAt('B1', sheet).value).toBe(false);
	});
	it('should return true for a finished request', async () => {
		const streamsheet = setupStreamSheet({
			A1: { formula: 'requestinfo(a2)' },
			A2: { formula: 'request(|test_stream, "hallo", outbox("response"))' }
		});
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(false);
		await machine.step();
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(false);
		await pendingRequest.resolve(pendingRequest.message.data);
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(true);
		await pendingRequest.resolve(pendingRequest.message.data);
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(true);
	});
	it(`should return ${ERROR.ERR} for a rejected request`, async () => {
		const streamsheet = setupStreamSheet({
			A1: { formula: 'requestinfo(a2)' },
			A2: { formula: 'request(|test_stream, "hallo", outbox("response"))' }
		});
		const sheet = streamsheet.sheet;
		const machine = streamsheet.machine;
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(false);
		expect(sheet.getPendingRequests().size).toBe(1);
		await machine.step();
		await machine.step();
		expect(cellAt('A1', sheet).value).toBe(false);
		expect(sheet.getPendingRequests().size).toBe(1);
		try {
			await pendingRequest.reject('error');
		} catch (err) {
			await machine.step();
			expect(cellAt('A1', sheet).value).toBe(ERROR.ERR);
			// because of requestinfo we cannot remove request, so
			expect(sheet.getPendingRequests().size).toBe(1);
		}
	});
});
