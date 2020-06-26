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
const { sleep } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { createCellAt } = require('../../utilities');
const { date: { localNow } } = require('../../../src/utils');
const { newMachine, newSheet, runMachine } = require('./utils');

const ERROR = FunctionErrors.code;

const timestoreFrom = (cell) => () => cell.term._timestore;

describe('timestore', () => {
	it('should store values over specified time', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1))' }, sheet);
		const cell = sheet.cellAt('A3');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		expect(timestore().size).toBe(1);
		expect(timestore().values('v1')).toEqual([2]);
		await machine.step();
		await machine.step();
		expect(timestore().size).toBe(3);
		expect(timestore().values('v1')).toEqual([2, 3, 4]);
	});
	it('should support period parameter', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),1/1000)' }, sheet);
		const cell = sheet.cellAt('A3');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		expect(timestore().size).toBe(1);
		expect(timestore().values('v1')).toEqual([2]);
		await sleep(10);
		await machine.step();
		await sleep(10);
		await machine.step();
		expect(timestore().size).toBe(1);
		expect(timestore().values('v1')).toEqual([4]);
	});
	it('should support limit parameter', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,,1)' }, sheet);
		const cell = sheet.cellAt('A3');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		expect(timestore().size).toBe(1);
		expect(timestore().values('v1')).toEqual([2]);
		await machine.step();
		await machine.step();
		expect(timestore().size).toBe(1);
		expect(timestore().values('v1')).toEqual([4]);
	});
	it('should be allowed to add values with undefined values!!', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1))' }, sheet);
		const cell = sheet.cellAt('A3');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		createCellAt('B1', undefined, sheet);
		await machine.step();
		await machine.step();
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		await machine.step();
		await machine.step();
		expect(timestore().values('v1')).toEqual([2, undefined, undefined, 2, 3]);
	});
	it('should support multiple values', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('A2', 'v2', sheet);
		createCellAt('A3', 'v3', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('B2', { formula: 'B2+10' }, sheet);
		createCellAt('B3', { formula: 'B3+100' }, sheet);
		createCellAt('A5', { formula: 'timestore(JSON(A1:B3))' }, sheet);
		const cell = sheet.cellAt('A5');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(timestore().values('v1')).toEqual([2, 3, 4]);
		expect(timestore().values('v2')).toEqual([20, 30, 40]);
		expect(timestore().values('v3')).toEqual([200, 300, 400]);
	});
	it('should ignore values without a key', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('A3', 'v3', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('B2', { formula: 'B2+10' }, sheet);
		createCellAt('B3', { formula: 'B3+100' }, sheet);
		createCellAt('A5', { formula: 'timestore(JSON(A1:B4))' }, sheet);
		const cell = sheet.cellAt('A5');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(timestore().values('v1')).toEqual([2, 3, 4]);
		expect(timestore().values('v2')).toEqual([]);
		expect(timestore().values('v3')).toEqual([200, 300, 400]);
	});
	it('should reset store on machine start', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1))' }, sheet);
		const cell = sheet.cellAt('A3');
		const timestore = timestoreFrom(cell);
		expect(cell.value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(timestore().size).toBe(3);
		await runMachine(machine, 50);
		// one is stored on machine start...
		expect(timestore().size).toBe(1);
	});
	it(`should return error ${ERROR.ARGS} if required parameter is missing`, () => {
		const sheet = newSheet();
		createCellAt('A3', { formula: 'timestore()' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
		createCellAt('A3', { formula: 'timestore(,)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
		createCellAt('A3', { formula: 'timestore(,,)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
		createCellAt('A3', { formula: 'timestore(,,,)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
	});
	it(`should return error ${ERROR.VALUE} if limit is below 1`, async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,,0)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,,-1)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,,-123456)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
	});
	it(`should return ${ERROR.LIMIT} if limit is reached`, async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1' }, sheet);
		createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,,2)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe(ERROR.LIMIT);
	});
	describe('timestamp usage', () => {
		it(`should return ${ERROR.VALUE} error if timestamp is not an excel serial number`, async () => {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'timestamp', B2: "hello",
					A3: { formula: 'timestore(JSON(A1:B2),,B2)' },
				}
			});
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('B2', true, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('B2', false, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it('should treat null, undefined and empty string as valid, i.e. no timestamp', async () => {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'timestamp', B2: '',
					A3: { formula: 'timestore(JSON(A1:B2),,B2)' },
				}
			});
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			createCellAt('B2', null, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			createCellAt('B2', undefined, sheet);
			await machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
		});
		it('should drop new entry if its not in defined time period', async ()=> {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'timestamp', B2: '',
					A3: { formula: 'timestore(JSON(A1:B2),60,B2)' },
				}
			});
			const cell = sheet.cellAt('A3');
			const timestore = timestoreFrom(cell);
			await machine.step();
			await machine.step();
			// expect 2 values
			expect(timestore().size).toBe(2);
			expect(timestore().values('v1')).toEqual([2, 3]);
			// create timestamp before period:
			const msBefore = localNow() - 2 * 60 * 1000;
			createCellAt('B2', { formula: `mstoserial(${msBefore})` }, sheet);
			await machine.step();
			expect(timestore().size).toBe(2);
			expect(timestore().values('v1')).toEqual([2, 3]);
			// create timetamp within period:
			const msBetween = localNow() - 10 * 1000;
			createCellAt('B2', { formula: `mstoserial(${msBetween})` }, sheet);
			await machine.step();
			expect(timestore().size).toBe(3);
			expect(timestore().values('v1')).toEqual([5, 2, 3]);
			// after timetamp within period:
			const msAfter = localNow() + 2 * 60 * 1000;
			createCellAt('B2', { formula: `mstoserial(${msAfter})` }, sheet);
			machine.step();
			expect(sheet.cellAt('A3').value).toBe(true);
			expect(timestore().size).toBe(3);
			expect(timestore().values('v1')).toEqual([2, 3, 6]);
		});
		it('should support timestamp parameter', async () => {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			const ts = localNow();
			createCellAt('A1', 'v1', sheet);
			createCellAt('B1', { formula: 'B1+1' }, sheet);
			createCellAt('C1', { formula: `mstoserial(${ts})` }, sheet);
			createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,C1)' }, sheet);
			const cell = sheet.cellAt('A3');
			const timestore = timestoreFrom(cell);
			expect(cell.value).toBe(true);
			await machine.step();
			expect(timestore().timestamps()).toEqual([ts]);
			createCellAt('C1', { formula: `mstoserial(${ts + 10})` }, sheet);
			await machine.step();
			createCellAt('C1', { formula: `mstoserial(${ts + 50})` }, sheet);
			await machine.step();
			expect(timestore().timestamps()).toEqual([ts, ts + 10, ts + 50]);
		});
		it('should sort entries by timestamp', async () => {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', 'v1', sheet);
			createCellAt('B1', { formula: 'B1+1' }, sheet);
			createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,C1)' }, sheet);
			const cell = sheet.cellAt('A3');
			const timestore = timestoreFrom(cell);
			expect(cell.value).toBe(true);
			const timestamp1 = localNow();
			createCellAt('C1', { formula: `mstoserial(${timestamp1})`}, sheet);
			await machine.step();
			expect(timestore().timestamps()).toEqual([timestamp1]);
			const timestamp2 = timestamp1 - 100;
			createCellAt('C1', { formula: `mstoserial(${timestamp2})`}, sheet);
			await machine.step();
			const timestamp3 = timestamp1 - 200;
			createCellAt('C1', { formula: `mstoserial(${timestamp3})`}, sheet);
			await machine.step();
			expect(timestore().timestamps()).toEqual([timestamp3, timestamp2, timestamp1]);
		});
		it('should add new entry after last entry with same timestamp', async () => {
			const machine = newMachine({ cycletime: 1000 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			const ts1 = localNow();
			createCellAt('A1', 'v1', sheet);
			createCellAt('B1', { formula: 'B1+1' }, sheet);
			createCellAt('C1', { formula: `mstoserial(${ts1})`}, sheet);
			createCellAt('A3', { formula: 'timestore(JSON(A1:B1),,C1)' }, sheet);
			const cell = sheet.cellAt('A3');
			const timestore = timestoreFrom(cell);
			expect(cell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(timestore().values('v1')).toEqual([2, 3, 4]);
			expect(timestore().timestamps()).toEqual([ts1, ts1, ts1]);
			const ts2 = ts1 - 500;
			createCellAt('C1', { formula: `mstoserial(${ts2})`}, sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(timestore().values('v1')).toEqual([5, 6, 7, 2, 3, 4]);
			expect(timestore().timestamps()).toEqual([ts2, ts2, ts2, ts1, ts1, ts1]);
		});
	});
});
