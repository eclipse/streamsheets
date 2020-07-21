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
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

const runAfter = (ms, fn) => new Promise((resolve) => {
	setTimeout(() => resolve(fn()), ms);
});


describe('sleep', () => {
	it(`should return ${ERROR.ARGS} error if called with to few or to many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('sleep()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('sleep(,)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('sleep(23,45)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if called with non number`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('sleep("")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sleep("hello")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sleep(A1)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sleep(true)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sleep(false)', sheet).value).toBe(ERROR.VALUE);
	});
	it('should pause sheet processing for specified amount of time', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'sleep(0.05)' }, A2: { formula: 'A2+1' } });
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('A2').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe(1);
		await runAfter(60, async () => { await machine.step(); });
		expect(sheet.cellAt('A2').value).toBe(2);
		await machine.step();		// should sleep again
		expect(sheet.cellAt('A2').value).toBe(2);
		await runAfter(60, async () => { await machine.step(); });
		expect(sheet.cellAt('A2').value).toBe(3);
	});
	it('should not prevent other sheets from processing', async () => {
		const machine = new Machine();
		const sheet1 = new StreamSheet().sheet;
		const sheet2 = new StreamSheet().sheet;
		machine.addStreamSheet(sheet1.streamsheet);
		machine.addStreamSheet(sheet2.streamsheet);
		sheet1.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'sleep(1)' },
		});
		sheet2.loadCells({ B2: { formula: 'B2+1' } });
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet2.cellAt('B2').value).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B2').value).toBe(4);
	});
	it('should handle delete of sleep term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'sleep(5)' },
			A3: { formula: 'A3+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(1);
		sheet.setCellAt('A2', undefined);
		expect(sheet.cellAt('A2')).toBeUndefined();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe(3);
	});
	it('should handle replace of sleep term', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'sleep(2)' },
			A3: { formula: 'A3+1' }
		});
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(1);
		// replace await
		createCellAt('A2', 'replaced', sheet);
		expect(sheet.cellAt('A2').value).toBe('replaced');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A3').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A3').value).toBe(3);
		// sleep again
		createCellAt('A2', { formula: 'sleep(2)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A3').value).toBe(3);
		// replace with another sleep
		createCellAt('A2', { formula: 'sleep(0.05)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A3').value).toBe(3);
		await runAfter(60, async () => {
			await machine.step();
		});
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('A3').value).toBe(4);
	});
	it('should not pause sheet processing if seconds is less then 1ms (0.001)', async() => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'sleep(0.0001)' },
			A2: { formula: 'A2+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('A2').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe(2);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe(5);
	});
	it('should be possible to update sleep time', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: 500,
			A2: { formula: 'sleep(A1)' },
			A3: { formula: 'A3+1' }
		});
		expect(sheet.cellAt('A1').value).toBe(500);
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(500);
		expect(sheet.cellAt('A3').value).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(500);
		expect(sheet.cellAt('A3').value).toBe(1);
		// update reference:
		createCellAt('A1', 0.0001, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(0.0001);
		expect(sheet.cellAt('A3').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(4);
		// update reference:
		createCellAt('A1', 0.001, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(0.001);
		expect(sheet.cellAt('A3').value).toBe(4);
	});
	it('should not consume messages if sleep() is replaced', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A2: { formula: 'sleep(5)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// replace
		createCellAt('A2', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		// restore:
		createCellAt('A2', { formula: 'sleep(5)' }, sheet);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		// replace again
		createCellAt('A2', 'replaced', sheet);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A2').value).toBe('replaced');
		expect(sheet.cellAt('A4').value).toBe(5);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
	it('should not consume messages while sleeping', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.load({ settings: {cycletime: 10} });
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: 5,
			A2: { formula: 'sleep(A1)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		sheet.streamsheet.inbox.put(new Message());
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// sleeping...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		// update sleep time to resolve...
		createCellAt('A1', 0.0001, sheet);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.streamsheet.inbox.size).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(3);
		expect(sheet.streamsheet.inbox.size).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(4);
		expect(sheet.streamsheet.inbox.size).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe(5);
		expect(sheet.streamsheet.inbox.size).toBe(1);
	});
	it('should not loop message while sleeping', async () => {
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
			A1: { formula: 'read(inboxdata("S1",,,"Name"), B1)' },
			A2: 5,
			A3: { formula: 'sleep(A2)' },
			A4: { formula: 'A4+1' }
		});
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Foo' }, { Name: 'Bar' }] }));
		sheet.streamsheet.inbox.put(new Message({ Customers: [{ Name: 'Schmidt' }, { Name: 'Muller' }] }));
		expect(sheet.cellAt('A1').value).toBe('Name');
		expect(sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Foo');
		// sleeping...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Foo');
		expect(sheet.cellAt('A4').value).toBe(1);
		createCellAt('A2', 0.0001, sheet);	// resolve
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Foo');
		expect(sheet.cellAt('A4').value).toBe(2);
		createCellAt('A2', 5, sheet);	// sleep
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Bar');
		expect(sheet.cellAt('A4').value).toBe(2);
		createCellAt('A2', 0.0001, sheet);	// resolve
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Bar');
		expect(sheet.cellAt('A4').value).toBe(3);
		createCellAt('A2', 5, sheet);	// sleep
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Schmidt');
		expect(sheet.cellAt('A4').value).toBe(3);
		createCellAt('A2', 0.0001, sheet);	// resolve
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Schmidt');
		expect(sheet.cellAt('A4').value).toBe(4);
		createCellAt('A2', 5, sheet);	// sleep
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Muller');
		expect(sheet.cellAt('A4').value).toBe(4);
		createCellAt('A2', 0.0001, sheet);	// resolve
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Muller');
		expect(sheet.cellAt('A4').value).toBe(5);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('B1').value).toBe('Muller');
		expect(sheet.cellAt('A4').value).toBe(7);
	});
});
