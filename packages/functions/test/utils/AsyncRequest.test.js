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
// const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, SheetIndex, SheetParser, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt } = require('../utilities');
const { AsyncRequest, runFunction } = require('../../src/utils');

// const ERROR = FunctionErrors.code;
const noop = () => {};
const getRunningRequestsCount = (request) => request._queue.running;
const getRequestQueueLength = (request) => request._queue.queue.length;

let error;
let result;
let reject = noop;
let resolve = noop;
let requestCounter = 0;
const allSequentialResolve = new Map();
const allSequentialRequests = new Map();

// const runAsync = async (fn) => fn();

const LIMIT_QUEUE = new AsyncRequest.Queue(2);

const testRequest = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => 
			AsyncRequest
				.create(sheet, testRequest.context)
				.request(() => new Promise((_resolve, _reject) => {
					reject = _reject;
					resolve = _resolve;
					requestCounter += 1;
				}))
				.response((context, _result, _error) => {
					error = _error;
					result = _result;
				})
				.reqId()
		);
const sequentialRequest = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => {
			const cell = sequentialRequest.context.term.cell;
			const ref = `${SheetIndex.columnAsStr(cell.col)}${cell.row}`;
			const request = AsyncRequest
				.create(sheet, sequentialRequest.context)
				.queue(LIMIT_QUEUE)
				// .queue(SEQUENTIAL_QUEUE)
				.request(() => new Promise((_resolve) => {
					allSequentialResolve.set(ref, _resolve);
					requestCounter += 1;
				}))
				.response(noop);
			allSequentialRequests.set(ref, request);
			return request.reqId();
		});
const noRequest = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => AsyncRequest.create(sheet, noRequest.context).reqId());
SheetParser.context.functions['TEST.REQUEST'] = testRequest;
SheetParser.context.functions['TEST.NOREQUEST'] = noRequest;
SheetParser.context.functions['TEST.SEQUENTIALREQUEST'] = sequentialRequest;

beforeEach(() => {
	error = undefined;
	result = undefined;
	reject = noop;
	resolve = noop;
	allSequentialResolve.clear();
	allSequentialRequests.clear();
	requestCounter = 0;
});

describe('AsyncRequest utilities', () => {
	it('should register dispose listener only once', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'test.request()' }	});
		const context = sheet.cellAt('A1').term.context;
		await machine.step();
		await resolve('resolved');
		expect(context.getDisposeListeners().length).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(context.getDisposeListeners().length).toBe(1);
	});
	it('should remove request from sheets pending list on replace or delete', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ 
			A1: { formula: 'test.request()' },
			A2: { formula: 'test.request()' }
		});
		await machine.step();
		const reqId1 = sheet.cellAt('A1').value;
		const reqId2 = sheet.cellAt('A2').value;
		expect(sheet.getPendingRequests().get(reqId1).status).toBe('pending');
		expect(sheet.getPendingRequests().get(reqId2).status).toBe('pending');
		createCellAt('A1', 'replacedA1', sheet);
		expect(sheet.cellAt('A1').value).toBe('replacedA1');
		expect(sheet.getPendingRequests().get(reqId1)).toBeUndefined();
		expect(sheet.getPendingRequests().get(reqId2).status).toBe('pending');
		await machine.step();
		createCellAt('A2', 'replacedA2', sheet);
		expect(sheet.cellAt('A2').value).toBe('replacedA2');
		expect(sheet.getPendingRequests().get(reqId1)).toBeUndefined();
		expect(sheet.getPendingRequests().get(reqId2)).toBeUndefined();
	});
	it('should not create new request if a current one is not resolved or rejected', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'test.request()' }	});
		await machine.step();
		await machine.step();
		await machine.step();
		expect(requestCounter).toBe(1);
		await resolve('resolved');
		// TODO: review - it takes several steps until promise.finally gets called!!
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(requestCounter).toBe(2);
		await reject('rejected');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(requestCounter).toBe(3);
	});
	it('should call response callback on resolve or reject', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'test.request()' }	});
		await machine.step();
		await machine.step();
		await machine.step();
		expect(requestCounter).toBe(1);
		await resolve('resolved');
		// TODO: review - it takes several steps until promise.finally gets called!!
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(error).toBeUndefined();
		expect(result).toBe('resolved');
		expect(requestCounter).toBe(2);
		await reject('rejected');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(error).toBe('rejected');
		expect(result).toBeUndefined();
		expect(requestCounter).toBe(3);
	});
	it('should create always new AsyncRequest if no request function is passed', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		let lastReqId;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'test.norequest()' }	});
		await machine.step();
		expect(sheet.cellAt('A1').value).not.toEqual(lastReqId);
		lastReqId = sheet.cellAt('A1').value;
		await machine.step();
		expect(sheet.cellAt('A1').value).not.toEqual(lastReqId);
		lastReqId = sheet.cellAt('A1').value;
		await machine.step();
		expect(sheet.cellAt('A1').value).not.toEqual(lastReqId);
	});
	it('should support sequential request', async () => {
		let doResolve;
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ 
			A1: { formula: 'A1+1' },
			B1: { formula: 'if(A1==2, test.sequentialrequest(), "skip")' },
			A2: { formula: 'A2+1' },
			B2: { formula: 'if(A2==2, test.sequentialrequest(), "skip")' },
			A3: { formula: 'A3+1' },
			B3: { formula: 'if(A3==2, test.sequentialrequest(), "skip")' },
			A4: { formula: 'A4+1' },
			B4: { formula: 'if(A4==2, test.sequentialrequest(), "skip")' },
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe('skip');
		expect(sheet.cellAt('A2').value).toBe(1);
		expect(sheet.cellAt('B2').value).toBe('skip');
		expect(sheet.cellAt('A3').value).toBe(1);
		expect(sheet.cellAt('B3').value).toBe('skip');
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.cellAt('B4').value).toBe('skip');
		await machine.step();
		await machine.step();
		await machine.step();
		doResolve = allSequentialResolve.get('B1');
		await doResolve('resolved');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(getRequestQueueLength(allSequentialRequests.get('B1'))).toBe(1);
		expect(getRunningRequestsCount(allSequentialRequests.get('B1'))).toBe(2);
		doResolve = allSequentialResolve.get('B3');
		await doResolve('resolved');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(getRequestQueueLength(allSequentialRequests.get('B3'))).toBe(0);
		expect(getRunningRequestsCount(allSequentialRequests.get('B3'))).toBe(2);
		doResolve = allSequentialResolve.get('B4');
		await doResolve('resolved');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(getRequestQueueLength(allSequentialRequests.get('B4'))).toBe(0);
		expect(getRunningRequestsCount(allSequentialRequests.get('B4'))).toBe(1);
		doResolve = allSequentialResolve.get('B2');
		await doResolve('resolved');
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(getRequestQueueLength(allSequentialRequests.get('B2'))).toBe(0);
		expect(getRunningRequestsCount(allSequentialRequests.get('B2'))).toBe(0);
	});
});