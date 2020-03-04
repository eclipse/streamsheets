const { sleep } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { createCellAt } = require('../../utilities');
const { newMachine, newSheet } = require('./utils');
const readQueryOptions = require('../../../src/functions/streamsheet/time/readQueryOptions');

const ERROR = FunctionErrors.code;
const getTimeStore = (cell) => cell.term._timestore;
const getQueryStore = (cell) => cell.term._querystore;
const getQueries = (cell) => cell.term._options.queries;

const getParams = (cell) => {
	const params = cell.term.params;
	// remove store parameter:
	params.shift();
	return params;
};
const runMachine = async (machine, period) => {
	await machine.start();
	await sleep(period);
	await machine.stop();
};

describe('timequery', () => {
	describe.skip('parameter parsing', () => {
		it('should accept multiple queries', () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1',
					A3: 'values', B3: 'v2'
				}
			});
			createCellAt('A4', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let params = getParams(sheet.cellAt('A4'));
			let options = readQueryOptions(sheet, params);
			expect(options).toBeDefined();
			expect(options.queries.length).toBe(1);
			createCellAt('A4', { formula: 'time.query(A1,JSON(A2:B2),JSON(A3:B3))' }, sheet);
			params = getParams(sheet.cellAt('A4'));
			options = readQueryOptions(sheet, params);
			expect(options.queries.length).toBe(2);
			createCellAt('A4', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2))' }, sheet);
			params = getParams(sheet.cellAt('A4'));
			options = readQueryOptions(sheet, params);
			expect(options.queries.length).toBe(3);
		});
		it('should identify interval parameter', () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let params = getParams(sheet.cellAt('A3'));
			let options = readQueryOptions(sheet, params);
			expect(options.interval).toBe(-1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.interval).toBe(-1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),60)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.interval).toBe(60);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),1)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.interval).toBe(1);
		});
		it('should identify range parameter', () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,A5:C6)' }, sheet);
			let params = getParams(sheet.cellAt('A3'));
			let options = readQueryOptions(sheet, params);
			expect(options.range.toString()).toBe('A5:C6');
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,A5:C6)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.range.toString()).toBe('A5:C6');
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,A5:C6)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.range.toString()).toBe('A5:C6');
		});
		it('should identify limit parameter', () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;

			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2))' }, sheet);
			let params = getParams(sheet.cellAt('A3'));
			let options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(100);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(100);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,60)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(60);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),1,,1)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(1);
			// MIN_LIMIT is 1
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,,0)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(1);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,-1)' }, sheet);
			params = getParams(sheet.cellAt('A3'));
			options = readQueryOptions(sheet, params);
			expect(options.limit).toBe(1);
		});
		it(`should return ${ERROR.ARGS} if two few arguments are given`, () => {
			const sheet = newSheet();
			createCellAt('A3', { formula: 'time.query()' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.ARGS);
			createCellAt('A3', { formula: 'time.query(,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query is not a json`, () => {
			const sheet = newSheet();
			createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
			createCellAt('A3', { formula: 'time.query(A1,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1, true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,"v1:1")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if query json contains no value or values field`, () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					B2: 'info', C2: 'v1',
					B3: 'infos', C3: 'v1, v2',
				}
			});

			createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
			createCellAt('A3', { formula: 'time.query(A1,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1, true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,"v1:1")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} for invalid interval parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),0)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),-12)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} for invalid range parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),1,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,"r1:s2")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,42)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),JSON(A2:B2),JSON(A2:B2),,)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(true);
		});
		it(`should return ${ERROR.VALUE} for invalid limit parameter`, () => {
			const sheet = newSheet();
			sheet.load({
				cells: {
					A1: { formula: 'time.store(JSON(B1:C1))' },
					A2: 'value', B2: 'v1'
				}
			});
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,true)' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,"")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
			createCellAt('A3', { formula: 'time.query(A1,JSON(A2:B2),,,"42")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.VALUE} if first parameter does not reference time.store`, () => {
			const sheet = newSheet();
			createCellAt('A1', 'v1', sheet);
			createCellAt('A4', { formula: 'time.query(A1, "v1")' }, sheet);
			const cell = sheet.cellAt('A4');
			// const term = cell.term;
			expect(cell.value).toBe(ERROR.VALUE);
		});
	});

	describe.skip('query',() => {
		it('should return all stored values if no interval and no aggregate method are specified', async () => {
			const machine = newMachine();
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1',
					A5: 'value', B5: 'v2',
					A6: { formula: 'time.query(A3, JSON(A4:B4), JSON(A5:B5))' }
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
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1',
					A5: 'value', B5: 'v2',
					A6: { formula: 'time.query(A3, JSON(A4:B4), JSON(A5:B5),,,2)' }
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
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1', C4: 'value', D4: 'v2',
					A5: 'aggregate', B5: 9, C5: 'aggregate', D5: 4,					
					A8: { formula: 'time.query(A3, JSON(A4:B5), 30/1000)' }
				}
			});
			let querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 55);
			expect(sheet.cellAt('B1').value).toBe(7)
			expect(querycell.info.values).toBeDefined();
			expect(querycell.info.values.v2).toBeUndefined();
			expect(querycell.info.values.v1.length).toBe(1);
			// check multiple aggregation:
			createCellAt('A8', { formula: 'time.query(A3, JSON(A4:B5), JSON(C4:D5), 30/1000)' }, sheet);
			querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 55);
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v2.length).toBe(1);
			expect(querycell.info.values.v2[0]).toBeGreaterThanOrEqual(100);
			await runMachine(machine, 105);
			expect(querycell.info.values.v1.length).toBe(3);
			expect(querycell.info.values.v2.length).toBe(3);
		});
		it('should only aggregate values with timestamp is in given interval', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 20/1000)` }
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
			await sleep(20);
			// run machine for a few milliseconds
			await runMachine(machine, 30);
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
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 20/1000, , 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			const querystore = getQueryStore(querycell);
			expect(querystore.entries.length).toBe(1);
		});
		it('should write result to target range', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1', C4: 'value', D4: 'v2',
					A5: 'aggregate', B5: 9, C5: 'aggregate', D5: 4,					
					A8: { formula: 'time.query(A3, JSON(A4:B5), JSON(C4:D5), 20/1000, B8:D12)' }
				}
			});
			const querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9')).toBeDefined();
			expect(sheet.cellAt('D9')).toBeDefined();
			expect(sheet.cellAt('B10').value).toBeGreaterThan(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBeGreaterThan(sheet.cellAt('C9').value);
			expect(sheet.cellAt('D10').value).toBeGreaterThan(sheet.cellAt('D9').value);
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
		});
		it('should clear cells in range if fewer results were written', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1', C4: 'value', D4: 'v2',
					A5: 'aggregate', B5: 9, C5: 'aggregate', D5: 4,					
					A8: { formula: 'time.query(A3, JSON(A4:B5), 20/1000, B8:D12)' },
					B8: 'hello', C9: 'world', D12: '!!'
				}
			});
			const querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			expect(sheet.cellAt('B8').value).toBe('hello');
			expect(sheet.cellAt('C9').value).toBe('world');
			expect(sheet.cellAt('D12').value).toBe('!!');
			await runMachine(machine, 30);
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
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1', C4: 'value', D4: 'v2',
					A5: 'aggregate', B5: 9, C5: 'aggregate', D5: 4,					
					A8: { formula: 'time.query(A3, JSON(A4:B5), JSON(C4:D5), 20/1000, B8:D12)' }
				}
			});
			const querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			const querystore = getQueryStore(querycell);
			expect(querystore.entries.length).toBe(2);
			// machine step should keep entries:
			await machine.step();
			expect(querystore.entries.length).toBeGreaterThanOrEqual(2);
			// machine start should reset entries:
			await runMachine(machine, 5);
			expect(querystore.entries.length).toBe(0);
		});
		it('should reset results range on machine start', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: 'v2', B2: { formula: 'B2+10)' },
					A3: { formula: 'time.store(JSON(A1:B2))' },
					A4: 'value', B4: 'v1', C4: 'value', D4: 'v2',
					A5: 'aggregate', B5: 9, C5: 'aggregate', D5: 4,					
					A8: { formula: 'time.query(A3, JSON(A4:B5), JSON(C4:D5), 20/1000, B8:D12)' }
				}
			});
			const querycell = sheet.cellAt('A8');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9')).toBeDefined();
			expect(sheet.cellAt('D9')).toBeDefined();
			expect(sheet.cellAt('B10').value).toBeGreaterThan(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBeGreaterThan(sheet.cellAt('C9').value);
			expect(sheet.cellAt('D10').value).toBeGreaterThan(sheet.cellAt('D9').value);
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('D11')).toBeUndefined();
			// machine step should keep target range:
			await machine.step();
			expect(sheet.cellAt('B8').value).toBe('time');
			expect(sheet.cellAt('C8').value).toBe('v1');
			expect(sheet.cellAt('D8').value).toBe('v2');
			expect(sheet.cellAt('B9')).toBeDefined();
			expect(sheet.cellAt('C9')).toBeDefined();
			expect(sheet.cellAt('D9')).toBeDefined();
			expect(sheet.cellAt('B10').value).toBeGreaterThan(sheet.cellAt('B9').value);
			expect(sheet.cellAt('C10').value).toBeGreaterThan(sheet.cellAt('C9').value);
			expect(sheet.cellAt('D10').value).toBeGreaterThan(sheet.cellAt('D9').value);
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
		it('should not change entries of time.store', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B1))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 20/1000)` }
				}
			});
			const storecell = sheet.cellAt('A2');
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 55);
			expect(sheet.cellAt('B1').value).toBe(7);
			expect(querycell.info.values.v1.length).toBe(2);
			// check timestore entries:
			const timestore = getTimeStore(storecell);
			const entries = timestore.entries.map((entry) => entry.values.v1);
			expect(entries).toEqual([2, 3, 4, 5, 6, 7]);
		});
		it(`should return ${ERROR.LIMIT} if limit was reached`, async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 20/1000, , 1)` }
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
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 20/1000)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 15);
			expect(querycell.value).toBe(ERROR.NA);
			await runMachine(machine, 35);
			expect(querycell.value).toBe(true);
		});

	});

	describe('aggregations methods', () => {
		test.skip('none', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 0,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		test.skip('avg', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 1,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(3);
		});
		test('avg should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '1,1,1,1,1,1,1,1',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('max', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 4,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(4);
		});
		test('max should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '4,4,4,4,4,4,4,4',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('min', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 5,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		test('min should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '5,5,5,5,5,5,5,5',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('count non zero', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: 'hello',
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 3,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			createCellAt('B1', 0, sheet);
			await machine.step();
			createCellAt('B1', 0, sheet);
			await machine.step();
			createCellAt('B1', 'hello', sheet);
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);			
		});
		test('count non zero should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '3,3,3,3,3,3,3,3',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 55);
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
		test.skip('count numbers', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 2,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			createCellAt('B1', 'hello', sheet);
			await machine.step();
			createCellAt('B1', 42, sheet);
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(2);
		});
		test.skip('count numbers should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '2,2,2,2,2,2,2,2',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('product', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 6,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1.length).toBe(1);
			expect(querycell.info.values.v1[0]).toBe(24);
		});
		test.skip('product should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '6,6,6,6,6,6,6,6',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('sum', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 9,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1[0]).toBe(9);
		});
		test('sum should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '9,9,9,9,9,9,9,9',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
		test.skip('standard derivation', async () => {
			const machine = newMachine({ cycletime: 10 });
			const sheet = machine.getStreamSheetByName('T1').sheet;
			sheet.load({
				cells: {
					A1: 'v1', B1: { formula: 'B1+1)' },
					A2: { formula: 'time.store(JSON(A1:B2))' },
					A3: 'value', B3: 'v1',
					A4: 'aggregate', B4: 7,
					A5: { formula: `time.query(A2, JSON(A3:B4), 1)` }
				}
			});
			const querycell = sheet.cellAt('A5');
			expect(querycell.value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			const timestore = getTimeStore(sheet.cellAt('A2'));
			const querystore = getQueryStore(querycell);
			querystore.query(timestore, getQueries(querycell));
			querystore.write(timestore, querycell);
			expect(sheet.cellAt('B1').value).toBe(4)
			expect(querycell.info.values.v1[0]).toBe(1);
		});
		test('astandard derivation should ignore non number values', async () => {
			const machine = newMachine({ cycletime: 10 });
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
					A9: { formula: 'time.store(JSON(A1:B8))' },
					A10: 'values', B10: 'v1,v2,v3,v4,v5,v6,v7,v8',
					A11: 'aggregates', B11: '7,7,7,7,7,7,7,7',
					A20: { formula: 'time.query(A9, JSON(A10:B11), 20/1000)' }
				}
			});
			const querycell = sheet.cellAt('A20');
			expect(querycell.value).toBe(true);
			await runMachine(machine, 50);
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
	describe.skip('compare methods', () => {

	});
	describe.skip('specifying time range', () => {

	});
});
