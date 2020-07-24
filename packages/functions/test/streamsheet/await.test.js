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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, Message, SheetParser, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../utilities');
const { AsyncRequest, runFunction } = require('../../src/utils');

const ERROR = FunctionErrors.code;

const noop = () => {};

const testRequest = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => AsyncRequest.create(sheet, testRequest.context).request(() => new Promise(noop)).reqId());
SheetParser.context.functions['TEST.REQUEST'] = testRequest;

const resolveRequestAt = (index, sheet) => {
	const reqId = sheet.cellAt(index).value;
	const req = sheet.getPendingRequests().get(reqId);
	if (req) req.status = 'resolved';
};

describe('await', () => {
	it(`should return ${ERROR.ARGS} error if called without any arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('await()', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if reference cell does not exist`, async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ 
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A5)' } });
		expect(sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		createCellAt('A3', { formula: 'await(A2, A5)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
	});
	it('should ignore empty cells in request range', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({  A3: { formula: 'await(B2:C4)' }, A4: { formula: 'A4+1' } });
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(2);
	});
	it('should wait until referenced request is resolved', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' },
			A4: { formula: 'A4+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(typeof sheet.cellAt('A2').value).toBe('string');
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		// now resolve...
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(2);
		await machine.step();	// will wait again...
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(2);
	});
	it('should handle list of requests', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'await(A2,A3,A4)' },
			A6: { formula: 'A6+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A5').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		// resolve last request:
		resolveRequestAt('A4', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(2);
		await machine.step();		// will wait again
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(2);
	});
	it('should handle a range of requests', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'await(A2:A4)' },
			A6: { formula: 'A6+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A5').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		// resolve last request:
		resolveRequestAt('A4', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(2);
		await machine.step();	// will wait again
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(2);
	});
	it('should not wait if reference or requestId is not valid', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' }, B1: 'unknownID',
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(B1)' },
			A4: { formula: 'A4+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(2);
		createCellAt('A3', { formula: 'await(42)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(3);
	});
	it('should not prevent other sheets from processing', async () => {
		const machine = new Machine();
		const sheet1 = new StreamSheet().sheet;
		const sheet2 = new StreamSheet().sheet;
		machine.addStreamSheet(sheet1.streamsheet);
		machine.addStreamSheet(sheet2.streamsheet);
		sheet1.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' }
		});
		sheet2.loadCells({ B2: { formula: 'B2+1' } });
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet2.cellAt('B2').value).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B2').value).toBe(4);
		resolveRequestAt('A2', sheet1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(3);
		expect(sheet2.cellAt('B2').value).toBe(7);
	});
	it('should handle delete of await term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' },
			A4: { formula: 'A4+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		// delete await
		sheet.setCellAt('A3', undefined);
		expect(sheet.cellAt('A3')).toBeUndefined();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(3);
	});
	it('should handle replace of await term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'await(A2)' },
			A5: { formula: 'A5+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A5').value).toBe(1);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A5').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A5').value).toBe(3);
		// add await again
		createCellAt('A4', { formula: 'await(A2)' }, sheet);
		expect(sheet.cellAt('A4').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(3);
		// replace by another await
		createCellAt('A4', { formula: 'await(A3)' }, sheet);
		expect(sheet.cellAt('A4').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(3);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(4);
	});
	// DL-4110
	it('should not consume messages while awaiting and OnMessage trigger', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		sheet.streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL });
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		// awaiting...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// now resolve...
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
	it('should not consume messages while awaiting', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(0);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(1);
		// awaiting...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		expect(sheet.streamsheet.stats.steps).toBe(1);
		// now resolve...
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		expect(sheet.streamsheet.stats.steps).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		expect(sheet.streamsheet.stats.steps).toBe(2);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		expect(sheet.streamsheet.stats.steps).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(3);
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(4);
	});
	it('should not loop message while awaiting', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.streamsheet.updateSettings({
			loop: { path: '[data][Customers]', enabled: true },
			trigger: { type: 'always' }
		});
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'read(inboxdata("S1",,,"Name"), B2)' }
		});
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Foo' }, { Name: 'Bar' }] }));
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe('Name');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B2').value).toBe('Foo');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B2').value).toBe('Bar');
		// add request & await
		createCellAt('A3', { formula: 'test.request()' }, sheet);
		createCellAt('A4', { formula: 'await(A3)' }, sheet);
		// new message
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Schmidt' }, { Name: 'Muller' }] }));
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B2').value).toBe('Schmidt');
		// awaiting...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B2').value).toBe('Schmidt');
		// now resolve...
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B2').value).toBe('Schmidt');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B2').value).toBe('Muller');
		// awaiting again...
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B2').value).toBe('Muller');
	});
	it('should not consume messages when await is replaced', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await(A2)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// replace await
		createCellAt('A3', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// restore await
		createCellAt('A3', { formula: 'await(A2)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		// replace await
		createCellAt('A3', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		// restore await
		createCellAt('A3', { formula: 'await(A2)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		// replace await
		createCellAt('A3', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A3').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		// restore await
		createCellAt('A3', { formula: 'await(A2)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
	// postponed or not done at all...
	// it.skip('should support waiting for requests from another sheet', async () => {
	// 	const machine = new Machine();
	// 	const sheet1 = new StreamSheet().sheet;
	// 	const sheet2 = new StreamSheet().sheet;
	// 	machine.addStreamSheet(sheet1.streamsheet);
	// 	machine.addStreamSheet(sheet2.streamsheet);
	// 	sheet1.loadCells({
	// 		A3: { formula: 'await(S2!A2)' },
	// 		A4: { formula: 'A4+1' }
	// 	});
	// 	sheet2.loadCells({ 
	// 		A1: { formula: 'A1+1' },
	// 		A2: { formula: 'test.request()' } });
	// 	expect(sheet1.cellAt('A3').value).toBe(true);
	// 	expect(sheet1.cellAt('A4').value).toBe(1);
	// 	expect(sheet2.cellAt('A1').value).toBe(1);
	// 	expect(sheet2.cellAt('A2').value).toBe(true);
	// 	await machine.step();
	// 	expect(sheet1.cellAt('A4').value).toBe(1);
	// 	expect(sheet2.cellAt('A1').value).toBe(2);
	// 	await machine.step();
	// 	expect(sheet1.cellAt('A4').value).toBe(1);
	// 	expect(sheet2.cellAt('A1').value).toBe(3);
	// 	// now resolve...
	// 	// resolveRequestAt('A2', sheet);
	// 	// await machine.step();
	// });
	// it.skip('should support multiple requests in another sheet', async () => {
	// });
});
describe('await.one', () => {
	it(`should return ${ERROR.ARGS} error if called without any arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('await.one()', sheet).value).toBe(ERROR.ARGS);
	});
	it('should wait until single referenced request is resolved', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await.one(A2)' },
			A4: { formula: 'A4+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		// now resolve...
		resolveRequestAt('A2', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		await machine.step();	// will wait again...
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(2);
	});
	it('should wait until at least one of referenced request is resolved', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'await.one(A2,A3,A4)' },
			A6: { formula: 'A6+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A5').value).toBe(true);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		// resolve one requests:
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(2);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(2);
		// resolve all requests:
		resolveRequestAt('A2', sheet);
		resolveRequestAt('A3', sheet);
		resolveRequestAt('A4', sheet);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A6').value).toBe(3);
	});
	it('should wait until at least one request within range is resolved', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'await.one(A2:A4)' },
			A6: { formula: 'A6+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A5').value).toBe(true);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		resolveRequestAt('A2', sheet);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(2);
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(3);
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A6').value).toBe(3);
		// resolve last request:
		resolveRequestAt('A4', sheet);
		resolveRequestAt('A3', sheet);
		resolveRequestAt('A2', sheet);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('A6').value).toBe(4);
	});
	it('should not wait if reference or requestId is not valid', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' }, B1: 'unknownID',
			A2: { formula: 'test.request()' },
			A3: { formula: 'await.one(B1, "id42")' },
			A4: { formula: 'A4+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(3);
	});
	it('should not prevent other sheets from processing', async () => {
		const machine = new Machine();
		const sheet1 = new StreamSheet().sheet;
		const sheet2 = new StreamSheet().sheet;
		machine.addStreamSheet(sheet1.streamsheet);
		machine.addStreamSheet(sheet2.streamsheet);
		sheet1.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'test.request()' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await.one(A2, B1)' }
		});
		sheet2.loadCells({ B2: { formula: 'B2+1' } });
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet2.cellAt('B2').value).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B2').value).toBe(4);
		resolveRequestAt('B1', sheet1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(3);
		expect(sheet2.cellAt('B2').value).toBe(7);
	});
	it('should handle delete of await.one term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'await.one(A2)' },
			A4: { formula: 'A4+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		// delete await
		sheet.setCellAt('A3', undefined);
		expect(sheet.cellAt('A3')).toBeUndefined();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(3);
	});
	it('should handle replace of await.one term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'await.one(A2)' },
			A5: { formula: 'A5+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A5').value).toBe(1);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A5').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A5').value).toBe(3);
		// add await again
		createCellAt('A4', { formula: 'await.one(A2)' }, sheet);
		expect(sheet.cellAt('A4').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(3);
		// replace by another await
		createCellAt('A4', { formula: 'await.one(A3)' }, sheet);
		expect(sheet.cellAt('A4').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(3);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A5').value).toBe(4);
	});
	it('should not consume messages while awaiting', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'await.one(A2,A3,A4)' },
			A6: { formula: 'A6+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A5').value).toBe(true);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// resolve one requests:
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A6').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		// resolve all requests:
		resolveRequestAt('A2', sheet);
		resolveRequestAt('A3', sheet);
		resolveRequestAt('A4', sheet);
		await machine.step();
		await machine.step();		// will wait again, since new request if made for resolved one!
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A6').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
	it('should not loop message while awaiting', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.streamsheet.updateSettings({
			loop: { path: '[data][Customers]', enabled: true },
			trigger: { type: 'always' }
		});
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'read(inboxdata("S1",,,"Name"), B2)' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'test.request()' },
			A5: { formula: 'test.request()' },
			A6: { formula: 'await.one(A3, A4, A5)' },
			A7: { formula: 'A7+1' }
		});
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Foo' }, { Name: 'Bar' }] }));
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Schmidt' }, { Name: 'Muller' }] }));
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe('Name');
		expect(sheet.cellAt('A7').value).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(0);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B2').value).toBe('Foo');
		expect(sheet.cellAt('A7').value).toBe(1);
		expect(sheet.streamsheet.stats.steps).toBe(1);
		// resolve one requests:
		resolveRequestAt('A3', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B2').value).toBe('Foo');
		expect(sheet.cellAt('A7').value).toBe(2);
		expect(sheet.streamsheet.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B2').value).toBe('Bar');
		expect(sheet.cellAt('A7').value).toBe(2);
		expect(sheet.streamsheet.stats.steps).toBe(2);
		// resolve all requests:
		resolveRequestAt('A3', sheet);
		resolveRequestAt('A4', sheet);
		resolveRequestAt('A5', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B2').value).toBe('Bar');
		expect(sheet.cellAt('A7').value).toBe(3);
		expect(sheet.streamsheet.stats.steps).toBe(2);
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B2').value).toBe('Schmidt');
		expect(sheet.cellAt('A7').value).toBe(3);
		expect(sheet.streamsheet.stats.steps).toBe(3);
		resolveRequestAt('A5', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B2').value).toBe('Schmidt');
		expect(sheet.cellAt('A7').value).toBe(4);
		expect(sheet.streamsheet.stats.steps).toBe(3);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B2').value).toBe('Muller');
		expect(sheet.cellAt('A7').value).toBe(4);
		expect(sheet.streamsheet.stats.steps).toBe(4);
	});
	it('should not consume messages if await.one is replaced', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'test.request()' },
			A3: { formula: 'test.request()' },
			A4: { formula: 'await.one(A2)' },
			A5: { formula: 'A5+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A5').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		expect(sheet.cellAt('A5').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		expect(sheet.cellAt('A5').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		// add await again
		createCellAt('A4', { formula: 'await.one(A2)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(true);
		expect(sheet.cellAt('A5').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		// replace by another await
		createCellAt('A4', { formula: 'await.one(A3)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe(true);
		expect(sheet.cellAt('A5').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		// replace await
		createCellAt('A4', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A4').value).toBe('replaced');
		expect(sheet.cellAt('A5').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('A5').value).toBe(5);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
});