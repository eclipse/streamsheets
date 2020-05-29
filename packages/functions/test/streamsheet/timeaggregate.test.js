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
const { Machine, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { createCellAt } = require('../utilities');

// eslint-disable-next-line no-undef
jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1000;

const ERROR = FunctionErrors.code;

const doAfter = (ms, fn) => new Promise((resolve) => {
	setTimeout(() => resolve(fn()), ms);
});

const expectAll = (...fns) => (value) => fns.forEach(fn => fn(value));
const isLessOrEqual = (max) => (value) => expect(value).toBeLessThanOrEqual(max);
const isGreatorOrEqual = (min) => (value) => expect(value).toBeGreaterThanOrEqual(min);
// const cellValue = index => val => (sheet) => expect(sheet.cellAt(index).value).toBe(val);


let machine;
beforeEach(() => {
	machine = new Machine();
	machine.cycletime = 1000;
	machine.removeAllStreamSheets();
	machine.addStreamSheet(
		new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' } })
	);
});

describe('timeaggregate', () => {
	// DL-2411
	it('should support optional parameters', () => {
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', { formula: 'A1+1' }, sheet);
		createCellAt('A3', { formula: 'timeaggregate(A1)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 9)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 9, 4000)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 9, 4000, 1)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, , , , , ,)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, , , , , , C31:D31)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, , , , , C31:D31)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 1, , , C31:D31)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, , 1)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 1, 2000, , C31:D31)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A3', { formula: 'timeaggregate(A1, 4, 1, 2000, 1, C31:D31)' }, sheet);
		expect(sheet.cellAt('A3').value).toBe(true);
	});
	// DL-3309
	it('should reset values on machine start', async () => {
		const sheet = machine.getStreamSheetByName('T1').sheet;
		sheet.machine.cycletime = 100;
		createCellAt('A1', { formula: 'A1+1' }, sheet);
		createCellAt('A3', { formula: 'timeaggregate(A1, 8, 0, , 4)' }, sheet);
		await machine.start();
		await doAfter(1000, () => { machine.stop(); });
		const term = sheet.cellAt('A3').term;
		expect(term._timeaggregator.valStore.entries.length).toBeGreaterThan(8);
		await machine.start();
		await machine.stop();
		expect(term._timeaggregator.valStore.entries.length).toBeLessThan(8);
	});
	it('should not reset values on machine transition from pause to start', async () => {
		const sheet = machine.getStreamSheetByName('T1').sheet;
		sheet.machine.cycletime = 100;
		createCellAt('A1', { formula: 'A1+1' }, sheet);
		createCellAt('A3', { formula: 'timeaggregate(A1, 8, 0, , 4)' }, sheet);
		await machine.start();
		await doAfter(1000, () => { machine.pause(); });
		const term = sheet.cellAt('A3').term;
		expect(term._timeaggregator.valStore.entries.length).toBeGreaterThan(8);
		await machine.start();
		await machine.stop();
		expect(term._timeaggregator.valStore.entries.length).toBeGreaterThan(9);
	});
	it(`should return ${ERROR.NA} until value is available`, async () => {
		const sheet = machine.getStreamSheetByName('T1').sheet;
		sheet.machine.cycletime = 100;
		createCellAt('A1', 'hello', sheet);
		createCellAt('A3', { formula: 'timeaggregate(A1, 8, 0, , 4)' }, sheet);
		await machine.start();
		expect(sheet.cellAt('A3').value).toBe(ERROR.NA);
		await doAfter(500, () => { createCellAt('A1', { formula: 'A1+1' }, sheet) });
		await doAfter(500, () => { machine.stop(); });
		expect(sheet.cellAt('A3').value).toBe(sheet.cellAt('A1').value);
		// start again should reset
		createCellAt('A1', 'hello', sheet);
		await machine.start();
		expect(sheet.cellAt('A3').value).toBe(ERROR.NA);
		await doAfter(500, () => { createCellAt('A1', { formula: 'A1+1' }, sheet) });
		await doAfter(500, () => { machine.stop(); });
		expect(sheet.cellAt('A3').value).toBe(sheet.cellAt('A1').value);
	});
	describe.skip('no interval specified', () => {
		it('should aggregate over all received values and return result', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 4, 9)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(14);
		});
		it('should write all received values to target range', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9, , , B4:C9)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(4500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(6);
			expect(sheet.cellAt('A3').value).toBe(20);
			expect(sheet.cellAt('C4').value).toBe(2);
			expect(sheet.cellAt('C5').value).toBe(3);
			expect(sheet.cellAt('C6').value).toBe(4);
			expect(sheet.cellAt('C7').value).toBe(5);
			expect(sheet.cellAt('C8').value).toBe(6);
			expect(sheet.cellAt('C9')).toBeUndefined();
		});
		it('should not clear received values and store them consecutively removing oldest', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 3, 9, , , B4:C9)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(5500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(7);
			expect(sheet.cellAt('A3').value).toBe(18);
			// last 3 values should be in range
			expect(sheet.cellAt('C4').value).toBe(5);
			expect(sheet.cellAt('C5').value).toBe(6);
			expect(sheet.cellAt('C6').value).toBe(7);
			expect(sheet.cellAt('C7')).toBeUndefined();
			expect(sheet.cellAt('C8')).toBeUndefined();
			expect(sheet.cellAt('C9')).toBeUndefined();
		});
		it('should support an optional time-stamp', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9, 1234, , B4:C6)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(14);
			// check target range values and try to respect any timing variations...
			expect(sheet.cellAt('B4').value).toBe(1234);
			expect(sheet.cellAt('C4').value).toBe(2);
			expect(sheet.cellAt('B5').value).toBe(1234);
			expect(sheet.cellAt('C5').value).toBe(3);
			expect(sheet.cellAt('B6').value).toBe(1234);
			expect(sheet.cellAt('C6').value).toBe(4);
		});
		it('should support sorting', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9, 100-A1, , B4:C6, true)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop();	});
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(14);
			// aggregated result depends on timing...
			expect(sheet.cellAt('B4').value).toBe(95)
			expect(sheet.cellAt('C4').value).toBe(5);
			expect(sheet.cellAt('B5').value).toBe(96)
			expect(sheet.cellAt('C5').value).toBe(4);
			expect(sheet.cellAt('B6').value).toBe(97);
			expect(sheet.cellAt('C6').value).toBe(3);
		});
	});
	describe.skip('with interval specified', () => {
		it('should aggregate values at specified interval', async () => {
			// one source value which changes over time...
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 6, 9, , 2)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(6500, () => {	machine.stop();	});
			expect(sheet.cellAt('A1').value).toBe(8);
			// aggregated result depends on timing...
			expectAll(isGreatorOrEqual(30), isLessOrEqual(35))(sheet.cellAt('A3').value);
		});
		it('should fill an optional target range', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 6, 9, , 2, B4:C8)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(5500, () => { machine.stop();	});
			expect(sheet.cellAt('A1').value).toBe(7);
			expect(sheet.cellAt('A3').value).toBe(27);
			// aggregated result depends on timing...
			expectAll(isGreatorOrEqual(5), isLessOrEqual(9))(sheet.cellAt('C4').value);
			expectAll(isGreatorOrEqual(9), isLessOrEqual(15))(sheet.cellAt('C5').value);
			expect(sheet.cellAt('C6')).toBeUndefined();
			expect(sheet.cellAt('C7')).toBeUndefined();
			expect(sheet.cellAt('C8')).toBeUndefined();
		});
		it('should support an optional time-stamp', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9, 100-A1, 2, B4:C6)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(4500, () => { machine.stop();	});
			expect(sheet.cellAt('A1').value).toBe(6);
			expect(sheet.cellAt('A3').value).toBe(20);
			// aggregated result depends on timing...
			expect(sheet.cellAt('B4').value).toBe(96)
			expectAll(isGreatorOrEqual(5), isLessOrEqual(9))(sheet.cellAt('C4').value);
			expect(sheet.cellAt('B5').value).toBe(94)
			expectAll(isGreatorOrEqual(9), isLessOrEqual(15))(sheet.cellAt('C5').value);
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
		it('should support sorting', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9, 100-A1, 2, B4:C6, true)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(4500, () => { machine.stop();	});
			expect(sheet.cellAt('A1').value).toBe(6);
			expect(sheet.cellAt('A3').value).toBe(20);
			// aggregated result depends on timing...
			expect(sheet.cellAt('B4').value).toBe(94)
			expectAll(isGreatorOrEqual(9), isLessOrEqual(15))(sheet.cellAt('C4').value);
			expect(sheet.cellAt('B5').value).toBe(96)
			expectAll(isGreatorOrEqual(5), isLessOrEqual(9))(sheet.cellAt('C5').value);
			expect(sheet.cellAt('B6')).toBeUndefined();
			expect(sheet.cellAt('C6')).toBeUndefined();
		});
	});
	// DL-2777:
	describe.skip('changing parameter while machine runs', () => {
		it('should use changed data cell', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { formula: 'B1+100' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 6, 9, , 2)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(100);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1500, async () => {	
				await machine.pause();
				createCellAt('A1', { formula: 'B1' }, sheet);
				expect(sheet.cellAt('A1').formula).toBe('B1');
				await machine.start();
			});
			await doAfter(1250, async () => { await machine.stop() });
			expect(sheet.cellAt('A1').value).toBeGreaterThanOrEqual(500);
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(1000);
		});
		it('should reset timeaggregate function if period parameter changes', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { value: 10 }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, B1, 2, , 2)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(10);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				createCellAt('B1', { value: 4 }, sheet);
				expect(sheet.cellAt('B1').value).toBe(4);
				await machine.step();
				// changed period should reset timeaggregate function
				expect(sheet.cellAt('A3').value).toBe(1);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
			expect(sheet.cellAt('A3').value).toBeLessThanOrEqual(5);
		});
		it('should reset timeaggregate function if aggregation method changes', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { value: 2 }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, 4, B1, , 2)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(2);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				// switch to COUNTA method
				createCellAt('B1', { value: 3 }, sheet);
				expect(sheet.cellAt('B1').value).toBe(3);
				await machine.step();
				// changed period should reset timeaggregate function
				expect(sheet.cellAt('A3').value).toBe(1);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
			expect(sheet.cellAt('A3').value).toBeLessThanOrEqual(5);
		});
		it('should use changed time-stamp', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { value: 23 }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, 4, 2, B1, , B4:C10)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				expect(sheet.cellAt('B4').value).toBe(23);
				createCellAt('B1', { value: 42 }, sheet);
				expect(sheet.cellAt('B1').value).toBe(42);
				await machine.step();
				// NO RESET of timeaggregate function
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(4);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(7);
			expect(sheet.cellAt('B10').value).toBe(42);
		});
		it('should reset timeaggregate function if interval changes', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { value: 2 }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, 10, 2, , B1)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(2);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				createCellAt('B1', { value: 4 }, sheet);
				expect(sheet.cellAt('B1').value).toBe(4);
				await machine.step();
				// changed interval should reset timeaggregate function
				expect(sheet.cellAt('A3').value).toBe(1);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
			expect(sheet.cellAt('A3').value).toBeLessThanOrEqual(5);
		});
		it('should use changed target range', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { formula: 'B4:C6' }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, 4, 2, , , B1)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').formula).toBe('B4:C6');
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				createCellAt('B1', { formula: 'B10:C12' }, sheet);
				expect(sheet.cellAt('B1').formula).toBe('B10:C12');
				await machine.step();
				// NO RESET of timeaggregate function
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(4);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(7);
			expect(sheet.cellAt('B7')).toBeUndefined();	
			expect(sheet.cellAt('B10')).toBeDefined();	
			expect(sheet.cellAt('C12')).toBeDefined();	
		});
		it('should reset timeaggregate function if sorting changes', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			machine.cycletime = 500;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { value: true }, sheet);
			// we use COUNT method to check received values...
			createCellAt('A3', { formula: 'timeaggregate(A1, 10, 2, , , , B1)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(true);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(1750, async () => {	
				await machine.pause();
				expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
				createCellAt('B1', { value: false }, sheet);
				expect(sheet.cellAt('B1').value).toBe(false);
				await machine.step();
				// changed sorting should reset timeaggregate function
				expect(sheet.cellAt('A3').value).toBe(1);
				await machine.start();
			});
			await doAfter(1750, async () => { await	machine.stop() });
			expect(sheet.cellAt('A3').value).toBeGreaterThanOrEqual(3);
			expect(sheet.cellAt('A3').value).toBeLessThanOrEqual(5);
		});
	});
	describe('aggregate methods', () => {
		it('should use SUM as default aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(14);
		});
		it('should support AVG aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 1)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(4500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(6);
			expect(sheet.cellAt('A3').value).toBe(4);
		});
		it('should support number counter aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 2)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(4);
		});
		it('should support non zero counter aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 3)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(4);
		});
		it('should support MAX aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 4)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(5);
		});
		it('should support MIN aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 5)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(2);
		});
		it('should support PRODUCT aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 6)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(120);
		});
		it('should support SUM aggregation method', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 9)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(14);
		});
		it('should support NONE aggregation method', async () => {
			let sameValue = true;
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1, 5, 0)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A3').value).toBe(true);
			machine.on('update', (type) => {
				// ensure values are equal on each step:
				if (type === 'step') sameValue = sameValue && sheet.cellAt('A3').value === sheet.cellAt('A1').value;
			});
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sameValue).toBeTruthy();
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(sheet.cellAt('A1').value);
		});
	});
	// DL-3578:
	describe.skip('limit parameter', () => {
		it(`should return ${ERROR.LIMIT} if limit is reached`, async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1,5,9,,,,,2)' }, sheet);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('A3').value).toBe(ERROR.LIMIT);
		});
		it('should limit number of stored values', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1,5,9,,,,,2)' }, sheet);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			// check cell values
			const cell = sheet.cellAt('A3');
			expect(cell.info.values.value).toEqual([4, 5]);
			expect(cell.value).toBe(ERROR.LIMIT);
		});
		it('should limit number of aggregated values', async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1,5,0,,0.5,,,2)' }, sheet);
			await machine.start();
			await doAfter(3500, () => { machine.stop(); });
			expect(sheet.cellAt('A1').value).toBe(5);
			// check cell values
			const cell = sheet.cellAt('A3');
			expect(cell.info.values.value).toEqual([4, 5]);
			expect(cell.value).toBe(ERROR.LIMIT);
		});
		it(`should respect sort before applying limit`, async () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('B1', { formula: 'B1+1' }, sheet);
			createCellAt('C1', { formula: '100-B1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1,5,0,C1,,,true,2)' }, sheet);
			await machine.start();
			await doAfter(3500, () => machine.stop());
			expect(sheet.cellAt('A1').value).toBe(5);
			expect(sheet.cellAt('C1').value).toBe(95);
			const cell = sheet.cellAt('A3');
			expect(cell.info.values.time).toEqual([97, 98]);
			expect(cell.info.values.value).toEqual([3, 2]);
			expect(cell.value).toBe(ERROR.LIMIT);
		});
		it('should support optional limit parameter with 1000 as default', () => {
			const sheet = machine.getStreamSheetByName('T1').sheet;
			createCellAt('A1', { formula: 'A1+1' }, sheet);
			createCellAt('A3', { formula: 'timeaggregate(A1)' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(1);
			sheet.streamsheet.step();
			const cell = sheet.cellAt('A3');
			expect(cell).toBeDefined();
			const term = cell.term;
			expect(term).toBeDefined();
			expect(term._timeaggregator).toBeDefined();
			expect(term._timeaggregator.settings.limit).toBe(1000);
			expect(sheet.cellAt('A1').value).toBe(2);
		});
	});
});
