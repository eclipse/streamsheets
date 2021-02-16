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
const { SheetRange } = require('@cedalo/machine-core');
const { createCellAt } = require('../../utilities');
const { newMachine, newSheet, runMachine, runMachinePause } = require('./utils');

const ERROR = FunctionErrors.code;
const timestoreFrom = (cell) => () => cell.term._timestore;
const querystoreFrom = (cell) => () => cell.term._querystore;
const query = (querycell, timecell, range) => {
	const timestore = timestoreFrom(timecell);
	const querystore = querystoreFrom(querycell);
	querystore().performQuery(timestore());
	querystore().write(querycell, range);
};

describe('timequery', () => {
	describe('parameter parsing', () => {
		it('should parse given json query', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1',
					A3: 'select', B3: 'v1, v2, v3',
					A4: 'aggregate', B4: 'none, avg, count, counta, max, min, product, stdevs, sum'
				}
			});
			createCellAt('A5', { formula: 'timequery(A1,JSON(A2:B2))' }, sheet);
			let querystore = querystoreFrom(sheet.cellAt('A5'));
			await machine.step();
			expect(querystore()).toBeDefined();
			expect(querystore().queryjson).toBeDefined();
			expect(querystore().queryjson.select).toEqual('v1');
			expect(querystore().queryjson.aggregate).toBeUndefined();
			expect(querystore().queryjson.where).toBeUndefined();
			createCellAt('A5', { formula: 'timequery(A1,JSON(A3:B4))' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A5'));
			await machine.step();
			expect(querystore().queryjson.select).toEqual('v1, v2, v3');
			expect(querystore().queryjson.aggregate).toEqual('none, avg, count, counta, max, min, product, stdevs, sum');
			expect(querystore().queryjson.where).toBeUndefined();
		});
		it('should identify interval parameter', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2))' }, sheet);
			let querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().interval).toBe(-1);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),)' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().interval).toBe(-1);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),60)' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().interval).toBe(60);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),1)' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().interval).toBe(1);
		});
		// it('should identify range parameter', async () => {
		// 	// range is not stored...
		// 	const machine = newMachine();
		// 	const sheet = machine.getStreamSheetByName('T1').sheet;
		// 	sheet.load({
		// 		cells: {
		// 			A1: { formula: 'timestore(JSON(B1:C1))' },
		// 			A2: 'select', B2: 'v1'
		// 		}
		// 	});
		// 	createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),1,A5:C6)' }, sheet);
		// 	await machine.step();
		// 	let querystore = getQueryStore(sheet.cellAt('A3'));
		// 	expect(querystore.range.toString()).toBe('A5:C6');
		// 	createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,A5:C6)' }, sheet);
		// 	await machine.step();
		// 	querystore = getQueryStore(sheet.cellAt('A3'));
		// 	expect(querystore.range.toString()).toBe('A5:C6');
		// });
		it('should identify limit parameter', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2))' }, sheet);
			let querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().limit).toBe(1000);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,)' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().limit).toBe(1000);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,60)' }, sheet);
			querystore = querystoreFrom(sheet.cellAt('A3'));
			await machine.step();
			expect(querystore().limit).toBe(60);
		});
		it(`should return ${ERROR.ARGS} if too few arguments are given`, () => {
			const sheet = newSheet();
			createCellAt('A3', { formula: 'timequery()' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
			createCellAt('A3', { formula: 'timequery(,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query does not contain a select clause`, () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'selection', B2: 'v1', C2: 'select',
					A3: 'values', B3: 'v1, v2',
					// json() does not trim key, so following results in an error
					A4: ' select ', B4: 'v1, v2, v3'
				}
			});
			createCellAt('A5', { formula: 'timequery(A1,JSON(F2:G2))' }, sheet);
			expect(sheet.cellAt('A5').value).toBe(ERROR.VALUE);
			createCellAt('A5', { formula: 'timequery(A1,JSON(C2))' }, sheet);
			expect(sheet.cellAt('A5').value).toBe(ERROR.VALUE);
			createCellAt('A5', { formula: 'timequery(A1,JSON(A2:B2))' }, sheet);
			expect(sheet.cellAt('A5').value).toBe(ERROR.VALUE);
			createCellAt('A5', { formula: 'timequery(A1,JSON(A3:B3))' }, sheet);
			expect(sheet.cellAt('A5').value).toBe(ERROR.VALUE);
			createCellAt('A5', { formula: 'timequery(A1,JSON(A4:B4))' }, sheet);
			expect(sheet.cellAt('A5').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query is not a json`, () => {
			const sheet = newSheet();
			createCellAt('A1', { formula: 'timestore(JSON(B1:C1))' }, sheet);
			createCellAt('A3', { formula: 'timequery(A1,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1, true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,"v1:1")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query contains unknown aggregate method`, async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1',
					A3: 'aggregate', B3: 'fun',
				}
			});
			createCellAt('A4', { formula: 'timequery(A1,JSON(A2:B3))' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(ERROR.VALUE);
			createCellAt('B3', 'none, avg, count, counta, fn, max, min, product, stdevs, sum', sheet); // fn is unknown...
			createCellAt('A4', { formula: 'timequery(A1,JSON(A2:B3))' }, sheet);
			await machine.step();
			expect(sheet.cellAt('A4').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} for invalid interval parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),0)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),-12)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),JSON(A2:B2))' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} for invalid range parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),1,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,"r1:s2")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),JSON(A2:B2),,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(true);
		});
		it(`should return ${ERROR.VALUE} for invalid limit parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'timestore(JSON(B1:C1))' },
					A2: 'select', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			// MIN_LIMIT is 1
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),1,,0)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'timequery(A1,JSON(A2:B2),,,-1)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if first parameter does not reference timestore`, () => {
			const sheet = newSheet();
			createCellAt('A1', 'v1', sheet);
			createCellAt('A4', { formula: 'timequery(A1, "v1")' }, sheet);
			const cell = sheet.cellAt('A4');
			// const term = cell.term;
			expect(cell.value).toBe(ERROR.VALUE);
		});
	});
	describe('query',() => {
		it('should aggregate all stored values if no interval is specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1, v2',
					A5: 'aggregate', B5: 'sum, max',
					A6: { formula: 'timequery(A3, JSON(A4:B5))' }
				}
			});
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1).toBeDefined();
			expect(querycell.info.values.v2).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(3);
			expect(querycell.info.values.v2.length).toBe(3);
			expect(querycell.info.values.v1[0]).toBe(2);
			expect(querycell.info.values.v1[1]).toBe(5);
			expect(querycell.info.values.v1[2]).toBe(9);
			expect(querycell.info.values.v2[0]).toBe(20);
			expect(querycell.info.values.v2[1]).toBe(30);
			expect(querycell.info.values.v2[2]).toBe(40);
			await machine.step();
			expect(querycell.info.values.v1.length).toBe(4);
			expect(querycell.info.values.v2.length).toBe(4);
			expect(querycell.info.values.v1[3]).toBe(14);
			expect(querycell.info.values.v2[3]).toBe(50);
		});
		it('should return all stored values if no interval and no aggregate method are specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1, v2',
					A6: { formula: 'timequery(A3, JSON(A4:B5))' }
				}
			});
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1).toBeDefined();
			expect(querycell.info.values.v2).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(3);
			expect(querycell.info.values.v2.length).toBe(3);
			expect(querycell.info.values.v1[0]).toBe(2);
			expect(querycell.info.values.v1[1]).toBe(3);
			expect(querycell.info.values.v1[2]).toBe(4);
			expect(querycell.info.values.v2[0]).toBe(20);
			expect(querycell.info.values.v2[1]).toBe(30);
			expect(querycell.info.values.v2[2]).toBe(40);
			await machine.step();
			expect(querycell.info.values.v1.length).toBe(4);
			expect(querycell.info.values.v2.length).toBe(4);
			expect(querycell.info.values.v1[3]).toBe(5);
			expect(querycell.info.values.v2[3]).toBe(50);
		});
		it('should return all stored values but bounded to limit if no interval and no aggregate method are specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,v2',
					A6: { formula: 'timequery(A3, JSON(A4:B4),,,2)' }
				}
			});
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1).toBeDefined();
			expect(querycell.info.values.v2).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2.length).toBe(2);
			expect(querycell.info.values.v1[0]).toBe(3);
			expect(querycell.info.values.v1[1]).toBe(4);
			expect(querycell.info.values.v2[0]).toBe(30);
			expect(querycell.info.values.v2[1]).toBe(40);
			await machine.step();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2.length).toBe(2);
			expect(querycell.info.values.v1[0]).toBe(4);
			expect(querycell.info.values.v1[1]).toBe(5);
			expect(querycell.info.values.v2[0]).toBe(40);
			expect(querycell.info.values.v2[1]).toBe(50);
		});
		it('should aggregate values in given interval', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1', C4: 'select', D4: 'v1,v2',
					A5: 'aggregate', B5: 'sum', C5: 'aggregate', D5: 'sum, max',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 20/1000)' }
				}
			});
			let querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			expect(querycell.info.values).toBeUndefined();
			await runMachine(machine, 50);
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v2).toBeUndefined();
			expect(querycell.info.values.v1.length).toBeGreaterThanOrEqual(1);
			// check multiple aggregation:
			createCellAt('A8', { formula: 'timequery(A3, JSON(C4:D5), 20/1000)' }, sheet);
			querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			expect(querycell.info.values.v1.length).toBeGreaterThanOrEqual(1);
			expect(querycell.info.values.v2.length).toBeGreaterThanOrEqual(1);
		});
		it('should only aggregate values with timestamp in given interval', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 200/1000)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const minimum = 4;
			expect(sheet.cellAt('B1').value).toBe(minimum)
			// wait a few milliseconds
			await sleep(250);
			// run machine for a few milliseconds
			await runMachine(machine, 350);
			// expect result to be greater then our minimum
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBeGreaterThan(minimum);
		});
		it('should limit number of aggregated values', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 20/1000, , 1)` }
				}
			});
			const querystore = querystoreFrom(sheet.cellAt('A5'));
			await runMachine(machine, 100);
			expect(querystore().entries.length).toBe(1);
		});
		it('should write result to target range', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,v2',
					A5: 'aggregate', B5: 'sum,max',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 200/1000, B8:D12)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A8');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell, SheetRange.fromRangeStr('B8:D12', sheet));
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9').value).toBe(9);
			expect(sheet.cellAt('D9').value).toBe(40);
			expect(sheet.cellAt('B10')).toBeUndefined();
			expect(sheet.cellAt('C10')).toBeUndefined();
			expect(sheet.cellAt('D10')).toBeUndefined();
			await machine.step();
			await machine.step();
			query(querycell, timecell, SheetRange.fromRangeStr('B8:D12', sheet));
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9').value).toBe(9);
			expect(sheet.cellAt('D9').value).toBe(40);
			expect(sheet.cellAt('B10').value).toBeGreaterThan(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBe(20);
			expect(sheet.cellAt('D10').value).toBe(60);
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
		});
		it('should clear cells in range if fewer results were written', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1',
					A5: 'aggregate', B5: 'sum',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 200/1000, B8:D12)' },
					B8: 'hello', C9: 'world', D12: '!!'
				}
			});
			expect(sheet.cellAt('B8').value).toBe('hello');
			expect(sheet.cellAt('C9').value).toBe('world');
			expect(sheet.cellAt('D12').value).toBe('!!');
			await runMachine(machine, 350);
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8')).toBeUndefined();
			expect(sheet.cellAt('B9').value).toBeDefined();
			expect(sheet.cellAt('C9').value).toBeDefined();
			expect(sheet.cellAt('D9')).toBeUndefined();
			expect(sheet.cellAt('B10')).toBeUndefined();
			expect(sheet.cellAt('C10')).toBeUndefined();
			expect(sheet.cellAt('D10')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('D12')).toBeUndefined();
		});
		it('should reset entries on machine start', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,v2',
					A5: 'aggregate', B5: 'sum,max',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 200/1000)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A8');
			const querystore = querystoreFrom(sheet.cellAt('A8'));
			await machine.step();
			query(querycell, timecell);
			expect(querystore().entries.length).toBe(1);
			// machine step should keep entries:
			await machine.step();
			query(querycell, timecell);
			expect(querystore().entries.length).toBe(2);
			// machine start should reset entries:
			await runMachine(machine, 5);
			expect(querystore().entries.length).toBe(0);
		});
		it('should reset results range on machine start', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,v2',
					A5: 'aggregate', B5: 'sum,max',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 200/1000, B8:D12)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A8');
			await machine.step();
			await machine.step();
			query(querycell, timecell, SheetRange.fromRangeStr('B8:D12', sheet));
			await machine.step();
			await machine.step();
			query(querycell, timecell, SheetRange.fromRangeStr('B8:D12', sheet));
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9').value).toBe(5);
			expect(sheet.cellAt('D9').value).toBe(30);
			expect(sheet.cellAt('B10').value).toBeGreaterThanOrEqual(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBe(14);
			expect(sheet.cellAt('D10').value).toBe(50);
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
			// machine step should keep target range:
			await machine.step();
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9').value).toBe(5);
			expect(sheet.cellAt('D9').value).toBe(30);
			expect(sheet.cellAt('B10').value).toBeGreaterThanOrEqual(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBe(14);
			expect(sheet.cellAt('D10').value).toBe(50);
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
			// machine start should clear target range:
			await runMachine(machine, 5);
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8')).toBeUndefined();
			expect(sheet.cellAt('D8')).toBeUndefined();
			expect(sheet.cellAt('B9')).toBeUndefined();
			expect(sheet.cellAt('C9')).toBeUndefined();
			expect(sheet.cellAt('D9')).toBeUndefined();
			expect(sheet.cellAt('B10')).toBeUndefined();
			expect(sheet.cellAt('C10')).toBeUndefined();
			expect(sheet.cellAt('D10')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
		});
		it('should not change entries of timestore', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B1))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 200/1000)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			const timestore = timestoreFrom(timecell);
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B1').value).toBe(7);
			expect(querycell.info.values.v1.length).toBe(2);
			// check timestore entries:
			const entries = timestore().entries.map((entry) => entry.values.v1);
			expect(entries).toEqual([2, 3, 4, 5, 6, 7]);
		});
		it('should reuse query if it does not change', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A3: { formula: 'timestore(JSON(A1:B1))' },
					A4: 'select', B4: 'v1',
					A5: 'aggregate', B5: 'sum',
					A8: { formula: 'timequery(A3, JSON(A4:B5), 100/1000)' }
				}
			});
			const querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			// collect some query results
			await runMachinePause(machine, 350);
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBeGreaterThanOrEqual(2);
			await runMachinePause(machine, 250);
			expect(querycell.info.values.v1.length).toBeGreaterThanOrEqual(3);
			// new query store resets:
			createCellAt('B5', 'avg', sheet);
			await runMachinePause(machine, 150);
			expect(querycell.info.values.v1.length).toBeLessThan(3);
		});
		it(`should return ${ERROR.LIMIT} if limit was reached`, async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 15/1000, , 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			expect(querycell.value).toBe(ERROR.LIMIT);
		});
		it(`should return ${ERROR.NA} until first value is available`, async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 20/1000)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 15);
			expect(querycell.value).toBe(ERROR.NA);
			await runMachine(machine, 50);
			expect(querycell.value).toBe(true);
		});
	});
	describe('aggregations methods', () => {
		test('none', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'none',
					A5: { formula: 'timequery(A2, JSON(A3:B4), 1)' }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		test('avg', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'avg',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(3);
		});
		test('avg should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'avg,avg,avg,avg,avg,avg,avg,avg',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([0]);
			expect(querycell.info.values.v3).toEqual([0]);
			expect(querycell.info.values.v4).toEqual([0]);
			expect(querycell.info.values.v5).toEqual([0]);
			expect(querycell.info.values.v6).toEqual([0]);
			expect(querycell.info.values.v7).toEqual([0]);
			expect(querycell.info.values.v8).toEqual([0]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([0, 0]);
			expect(querycell.info.values.v3).toEqual([0, 0]);
			expect(querycell.info.values.v4).toEqual([0, 0]);
			expect(querycell.info.values.v5).toEqual([0, 0]);
			expect(querycell.info.values.v6).toEqual([0, 0]);
			expect(querycell.info.values.v7).toEqual([0, 0]);
			expect(querycell.info.values.v8).toEqual([0, 0]);
		});
		test('max', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'max',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		test('max should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'max,max,max,max,max,max,max,max',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v3).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v4).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v5).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v6).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v7).toEqual([Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v8).toEqual([Number.MIN_SAFE_INTEGER]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v3).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v4).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v5).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v6).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v7).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
			expect(querycell.info.values.v8).toEqual([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
		});
		test('min', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		test('min should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'min,min,min,min,min,min,min,min',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v3).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v4).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v5).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v6).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v7).toEqual([Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v8).toEqual([Number.MAX_SAFE_INTEGER]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v3).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v4).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v5).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v6).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v7).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
			expect(querycell.info.values.v8).toEqual([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]);
		});
		test('count non zero', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: 'hello',
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'counta',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			createCellAt('B1', 0, sheet);
			await machine.step();
			createCellAt('B1', 0, sheet);
			await machine.step();
			createCellAt('B1', 'hello', sheet);
			await machine.step();
			createCellAt('B1', 23, sheet);
			await machine.step();
			createCellAt('B1', 42, sheet);
			await machine.step();
			query(querycell, timecell)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		test('count non zero should count non number values??', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'counta,counta,counta,counta,counta,counta,counta,counta',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([0]);
			expect(querycell.info.values.v3).toEqual([0]);
			expect(querycell.info.values.v4).toEqual([0]);
			expect(querycell.info.values.v5).toEqual([0]);
			expect(querycell.info.values.v6).toEqual([0]);
			expect(querycell.info.values.v7).toEqual([0]);
			expect(querycell.info.values.v8).toEqual([0]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([0, 0]);
			expect(querycell.info.values.v3).toEqual([0, 0]);
			expect(querycell.info.values.v4).toEqual([0, 0]);
			expect(querycell.info.values.v5).toEqual([0, 0]);
			expect(querycell.info.values.v6).toEqual([0, 0]);
			expect(querycell.info.values.v7).toEqual([0, 0]);
			expect(querycell.info.values.v8).toEqual([0, 0]);
		});
		test('count numbers', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'count',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			createCellAt('B1', 'hello', sheet);
			await machine.step();
			createCellAt('B1', 42, sheet);
			await machine.step();
			query(querycell, timecell);
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		test('count numbers should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'count,count,count,count,count,count,count,count',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([0]);
			expect(querycell.info.values.v3).toEqual([0]);
			expect(querycell.info.values.v4).toEqual([0]);
			expect(querycell.info.values.v5).toEqual([0]);
			expect(querycell.info.values.v6).toEqual([0]);
			expect(querycell.info.values.v7).toEqual([0]);
			expect(querycell.info.values.v8).toEqual([0]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([0, 0]);
			expect(querycell.info.values.v3).toEqual([0, 0]);
			expect(querycell.info.values.v4).toEqual([0, 0]);
			expect(querycell.info.values.v5).toEqual([0, 0]);
			expect(querycell.info.values.v6).toEqual([0, 0]);
			expect(querycell.info.values.v7).toEqual([0, 0]);
			expect(querycell.info.values.v8).toEqual([0, 0]);
		});
		test('product', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'product',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(24);
		});
		test('product should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'product,product,product,product,product,product,product,product',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([1]);
			expect(querycell.info.values.v3).toEqual([1]);
			expect(querycell.info.values.v4).toEqual([1]);
			expect(querycell.info.values.v5).toEqual([1]);
			expect(querycell.info.values.v6).toEqual([1]);
			expect(querycell.info.values.v7).toEqual([1]);
			expect(querycell.info.values.v8).toEqual([1]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([1, 1]);
			expect(querycell.info.values.v3).toEqual([1, 1]);
			expect(querycell.info.values.v4).toEqual([1, 1]);
			expect(querycell.info.values.v5).toEqual([1, 1]);
			expect(querycell.info.values.v6).toEqual([1, 1]);
			expect(querycell.info.values.v7).toEqual([1, 1]);
			expect(querycell.info.values.v8).toEqual([1, 1]);
		});
		test('sum', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'sum',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1[0]).toBe(9);
		});
		test('sum should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'sum,sum,sum,sum,sum,sum,sum,sum',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([0]);
			expect(querycell.info.values.v3).toEqual([0]);
			expect(querycell.info.values.v4).toEqual([0]);
			expect(querycell.info.values.v5).toEqual([0]);
			expect(querycell.info.values.v6).toEqual([0]);
			expect(querycell.info.values.v7).toEqual([0]);
			expect(querycell.info.values.v8).toEqual([0]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([0, 0]);
			expect(querycell.info.values.v3).toEqual([0, 0]);
			expect(querycell.info.values.v4).toEqual([0, 0]);
			expect(querycell.info.values.v5).toEqual([0, 0]);
			expect(querycell.info.values.v6).toEqual([0, 0]);
			expect(querycell.info.values.v7).toEqual([0, 0]);
			expect(querycell.info.values.v8).toEqual([0, 0]);
		});
		test('standard derivation', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'stdevs',
					A5: { formula: `timequery(A2, JSON(A3:B4), 1)` }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1[0]).toBe(1);
		});
		test('standard derivation should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 100 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: '',
					A3: 'v3', B3: 'hello',
					A4: 'v4', B4: true,
					A5: 'v5', B5: false,
					A6: 'v6', B6: '23',
					A7: 'v7', B7: null,
					A8: 'v8', B8: undefined,
					A9: { formula: 'timestore(JSON(A1:B8))' },
					A10: 'select', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregate', B11: 'stdevs,stdevs,stdevs,stdevs,stdevs,stdevs,stdevs,stdevs',
					A20: { formula: 'timequery(A9, JSON(A10:B11), 1)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2).toEqual([0]);
			expect(querycell.info.values.v3).toEqual([0]);
			expect(querycell.info.values.v4).toEqual([0]);
			expect(querycell.info.values.v5).toEqual([0]);
			expect(querycell.info.values.v6).toEqual([0]);
			expect(querycell.info.values.v7).toEqual([0]);
			expect(querycell.info.values.v8).toEqual([0]);
			await machine.step();
			await machine.step();
			query(querycell, sheet.cellAt('A9'));
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v1.length).toBe(2);
			expect(querycell.info.values.v2).toEqual([0, 0]);
			expect(querycell.info.values.v3).toEqual([0, 0]);
			expect(querycell.info.values.v4).toEqual([0, 0]);
			expect(querycell.info.values.v5).toEqual([0, 0]);
			expect(querycell.info.values.v6).toEqual([0, 0]);
			expect(querycell.info.values.v7).toEqual([0, 0]);
			expect(querycell.info.values.v8).toEqual([0, 0]);
		});
	});
	describe('where', () => {
		it('should filter entries by > and >=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: 'where', B5: 'v1 > 2',
					A6: { formula: 'timequery(A2, JSON(A3:B5), 100)' }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(3);
			// check for >=
			createCellAt('B5', 'v1 >= 6', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(6);
		});
		it('should filter non number entries by > and >=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'hello',
					A3: 'v3', B3: { formula: 'concat("count",B1)' },
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 > "he"',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(sheet.cellAt('B3').value).toBe('count4');
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
			// check for >=
			createCellAt('B10', 'v3 >= "count6"', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(sheet.cellAt('B3').value).toBe('count8');
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(6);
		});
		it('should filter entries by < and <=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'max',
					A5: 'where', B5: 'v1 < 4',
					A6: { formula: 'timequery(A2, JSON(A3:B5), 100)' }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(3);
			// check for <=
			createCellAt('B5', 'v1 <= 7', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(7);
		});
		it('should filter non number entries by < and <=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'hello',
					A3: 'v3', B3: { formula: 'concat("count",B1)' },
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'max',
					A10: 'where', B10: 'v2 < "world"',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(sheet.cellAt('B3').value).toBe('count4');
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
			// check for <=
			createCellAt('B10', 'v3 <= "count7"', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(sheet.cellAt('B3').value).toBe('count8');
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(7);
		});
		it('should filter entries by = and !=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'timestore(JSON(A1:B2))' },
					A3: 'select', B3: 'v1',
					A4: 'aggregate', B4: 'min',
					A5: 'where', B5: 'v1 = 4',
					A6: { formula: 'timequery(A2, JSON(A3:B5), 100)' }
				}
			});
			const timecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
			// check for !=
			createCellAt('B5', 'v1 != 5', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		it('should filter non number entries by = and !=', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: true,
					A3: 'v3', B3: '',
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 = true',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
			// check for !=
			createCellAt('B3', 'text', sheet);
			createCellAt('B10', 'v3 != ""', sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			// changed query => new store
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(8)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(5);
		});
		it('should be possible to combine constraints with AND', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'kitchen',
					A3: 'v3', B3: { formula: 'B3+10)' },
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 = "kitchen" AND v3 > 30',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		it('should be possible to combine constraints with OR', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'kitchen',
					A3: 'v3', B3: { formula: 'B3+10)' },
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 = "bathroom" OR v3 > 30',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		it('should be possible to combine constraints with OR and AND', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'kitchen',
					A3: 'v3', B3: { formula: 'B3+10)' },
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 = "bathroom" OR v3 > 20 AND v3 = 40',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		it('should ignore AND and OR within strings', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: 'kitchen AND bathroom',
					A3: 'v3', B3: 'bedroom OR toilet',
					A7: { formula: 'timestore(JSON(A1:B3))' },
					A8: 'select', B8: 'v1',
					A9: 'aggregate', B9: 'min',
					A10: 'where', B10: 'v2 = "bedroom AND bathroom" OR v3 = "bedroom OR toilet"',
					A11: { formula: 'timequery(A7, JSON(A8:B10), 100)' }
				}
			});
			const timecell = sheet.cellAt('A7');
			const querycell = sheet.cellAt('A11');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		it('should support where with no aggregate', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'concat("count",B1)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,v2',
					A5: 'where', B5: 'v2 > "count3"',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 100)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(sheet.cellAt('B2').value).toBe('count4')
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
			expect(querycell.info.values.v2.length).toBe(1);
			expect(querycell.info.values.v2[0]).toBe('count4');
		});
	});
	describe('wildcard support', () => {
		it('should aggregate all stored values', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: '*',
					A5: 'aggregate', B5: 'sum',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 10)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(querycell.info.values.v1[0]).toBe(9);
			expect(querycell.info.values.v2[0]).toBe(90);
		});
		it('should only apply first aggregate on all stored values', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: '*',
					A5: 'aggregate', B5: 'max,sum,avg',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 10)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(querycell.value).toBe(ERROR.NA);
			query(querycell, timecell);
			expect(querycell.info.values.v1[0]).toBe(4);
			expect(querycell.info.values.v2[0]).toBe(40);
		});
		it('should take last value if no aggregate method is specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: '*',
					A5: 'aggregate', B5: '',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 10)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			expect(querycell.value).toBe(ERROR.NA);
			query(querycell, timecell);
			expect(querycell.info.values.v1[0]).toBe(3);
			expect(querycell.info.values.v2[0]).toBe(30);
			// clear aggregation, will change query!
			createCellAt('B5', undefined, sheet);
			await machine.step();
			await machine.step();
			expect(querycell.value).toBe(ERROR.NA);
			query(querycell, timecell);
			expect(querycell.info.values.v1[0]).toBe(5);
			expect(querycell.info.values.v2[0]).toBe(50);
			// clear aggregation, will change query!
			createCellAt('A5', undefined, sheet);
			await machine.step();
			await machine.step();
			expect(querycell.value).toBe(ERROR.NA);
			query(querycell, timecell);
			expect(querycell.info.values.v1[0]).toBe(7);
			expect(querycell.info.values.v2[0]).toBe(70);
			await machine.step();
			await machine.step();
			expect(querycell.value).toBe(true);
			query(querycell, timecell);
			expect(querycell.info.values.v1[1]).toBe(9);
			expect(querycell.info.values.v2[1]).toBe(90);
		});
		it('should always do wildcard aggregation if select contains at least one *', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: 'v1,*',
					A5: 'aggregate', B5: 'max,sum',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 10)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(querycell.info.values.v1).toBeDefined();
			expect(querycell.info.values.v2).toBeDefined();
			expect(querycell.info.values.v1[0]).toBe(9);
			expect(querycell.info.values.v2[0]).toBe(90);
		});
		it('return all stored values if no aggregate and no interval are specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: '*',
					A6: { formula: 'timequery(A3, JSON(A4:B5))' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);			
			expect(querycell.info.values.v1[0]).toBe(2);
			expect(querycell.info.values.v2[0]).toBe(20);
			expect(querycell.info.values.v1[1]).toBe(3);
			expect(querycell.info.values.v2[1]).toBe(30);
			expect(querycell.info.values.v1[2]).toBe(4);
			expect(querycell.info.values.v2[2]).toBe(40);
		});
		it('should handle values added later too', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A3: { formula: 'timestore(JSON(A1:B2))' },
					A4: 'select', B4: '*',
					A5: 'aggregate', B5: 'sum',
					A6: { formula: 'timequery(A3, JSON(A4:B5), 10)' }
				}
			});
			const timecell = sheet.cellAt('A3');
			const querycell = sheet.cellAt('A6');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(querycell.info.values.v1).toBeDefined();
			expect(querycell.info.values.v2).toBeUndefined();
			expect(querycell.info.values.v1[0]).toBe(9);
			// now add second value
			createCellAt('A2', 'v2', sheet);
			createCellAt('B2', { formula: 'B2+10' }, sheet);
			await machine.step();
			await machine.step();
			await machine.step();
			query(querycell, timecell);
			expect(querycell.info.values.v2).toBeDefined();
			expect(querycell.info.values.v1[0]).toBe(9);
			expect(querycell.info.values.v1[1]).toBe(27);
			expect(querycell.info.values.v2[0]).toBeUndefined();
			expect(querycell.info.values.v2[1]).toBe(90);
		});
	});
});