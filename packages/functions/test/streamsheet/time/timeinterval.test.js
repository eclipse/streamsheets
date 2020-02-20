const { sleep } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { createCellAt } = require('../../utilities');
const { newMachine } = require('./utils');

const ERROR = FunctionErrors.code;


describe('time.interval', () => {
	it(`should return ${ERROR.ARGS} if used with too few or too many arguments or ${ERROR.VALUE} on wrong argument value`, () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
		createCellAt('A2', { formula: 'time.interval()' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.ARGS);
		createCellAt('A2', { formula: 'time.interval(A1)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.ARGS);
		createCellAt('A2', { formula: 'time.interval(A1,,)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		createCellAt('A2', { formula: 'time.interval(,,)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		// interval is less than minimum of 1ms
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 2, 1/10000)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 2, -1)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		createCellAt('A2', { formula: 'time.interval(A1,"v1",2,3,C1:E10,100,23,42)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.ARGS);
		createCellAt('A2', { formula: 'time.interval(A1, "v1")' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
	});
	it(`should return an ${ERROR.VALUE} if first parameter does not reference time.store`, () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('A4', { formula: 'time.interval(A1, "v1")' }, sheet);
		const cell = sheet.cellAt('A4');
		// const term = cell.term;
		expect(cell.value).toBe(ERROR.VALUE);
	});
	it('should use defaults values optional parameters', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
		createCellAt('A2', { formula: 'time.interval(A1, "v1")' }, sheet);
		const intervalcell = sheet.cellAt('A2');
		const intervalterm = intervalcell.term;
		await machine.step();
		expect(intervalterm._intervalstore.method).toBe(9);
		expect(intervalterm._intervalstore.limit).toBe(500);
		 // -1 signals that all values from time.store should be used
		expect(intervalterm._intervalstore.interval).toBe(-1);
	});
	it('should use specified parameters', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 2, 1, , 100)' }, sheet);
		const intervalcell = sheet.cellAt('A2');
		const intervalterm = intervalcell.term;
		await machine.step();
		expect(intervalterm._intervalstore.method).toBe(2);
		expect(intervalterm._intervalstore.limit).toBe(100);
		expect(intervalterm._intervalstore.interval).toBe(1);
	});
	it('should support only defined aggregate methods', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', { formula: 'time.store(JSON(B1:C1))' }, sheet);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 0)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 1)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 2)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 3)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 4)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 5)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 6)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 7)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 9)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(true);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 8)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", 10)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		createCellAt('A2', { formula: 'time.interval(A1, "v1", -1)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
	});
	it('should write values to cell info if no target specified', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		createCellAt('A2', { formula: 'time.store(JSON(A1:B1))' }, sheet);
		createCellAt('A3', { formula: 'time.interval(A2, "v1", 9, 5/1000)' }, sheet);
		const intervalcell = sheet.cellAt('A3');
		expect(intervalcell.value).toBe(true);
		// await sleep(10);
		await machine.step();
		expect(intervalcell.value).toBe(2);
		expect(intervalcell.info.values.length).toBe(0);
		await sleep(10);
		await machine.step();
		expect(intervalcell.value).toBe(5);
		expect(intervalcell.info.values.length).toBe(1);
		expect(intervalcell.info.values[0].value).toBe(3);
		await sleep(10);
		await machine.step();
		expect(intervalcell.value).toBe(9);
		expect(intervalcell.info.values.length).toBe(2);
		expect(intervalcell.info.values[1].value).toBe(4);
	});
	it('should write all time-store values to cell info if no interval is specified', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		createCellAt('A2', { formula: 'time.store(JSON(A1:B1))' }, sheet);
		createCellAt('A3', { formula: 'time.interval(A2, "v1", 9)' }, sheet);
		const intervalcell = sheet.cellAt('A3');
		expect(intervalcell.value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(intervalcell.info.values.length).toBe(3);
		expect(intervalcell.info.values[0].value).toBe(2);
		expect(intervalcell.info.values[1].value).toBe(3);
		expect(intervalcell.info.values[2].value).toBe(4);
		await machine.step();
		expect(intervalcell.info.values.length).toBe(4);
		expect(intervalcell.info.values[3].value).toBe(5);
	});
	it('should store maximum period/time or limit values', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		createCellAt('A2', { formula: 'time.store(JSON(A1:B1))' }, sheet);
		createCellAt('A3', { formula: 'time.interval(A2, "v1", 9, , , 2)' }, sheet);
		let intervalcell = sheet.cellAt('A3');
		expect(intervalcell.value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(intervalcell.value).toBe(9);
		expect(intervalcell.info.values.length).toBe(2);
		expect(intervalcell.info.values[0].value).toBe(3);
		expect(intervalcell.info.values[1].value).toBe(4);
		// now check with specified interval => TODO: should we limit by period/size? => different behaviour?
		createCellAt('A3', { formula: 'time.interval(A2, "v1", 9, 2/1000, , 2)' }, sheet);
		intervalcell = sheet.cellAt('A3');
		expect(intervalcell.value).toBe(true);
		await machine.step();
		await sleep(4);
		await machine.step();
		await sleep(4);
		await machine.step();
		await sleep(4);
		await machine.step();
		expect(intervalcell.info.values.length).toBe(2);
		expect(intervalcell.info.values[0].value).toBe(7);
		expect(intervalcell.info.values[1].value).toBe(8);
	});
	it('should write values to target range and cell info', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('A2', 'v2', sheet);
		createCellAt('A3', 'v3', sheet);
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		createCellAt('B2', { formula: 'B2+2' }, sheet);
		createCellAt('B3', { formula: 'B3+3' }, sheet);
		createCellAt('A5', { formula: 'time.store(JSON(A1:B3))' }, sheet);
		createCellAt('A6', { formula: 'time.interval(A5, "v2", 9, 2/1000, D5:E10)' }, sheet);
		const now = Date.now();
		const intervalcell = sheet.cellAt('A6');
		expect(intervalcell.value).toBe(true);
		await machine.step();
		await sleep(4);
		await machine.step();
		await sleep(4);
		await machine.step();
		await sleep(4);
		await machine.step();
		expect(intervalcell.value).toBe(28);
		expect(intervalcell.info.values.length).toBe(3);
		expect(intervalcell.info.values[0].value).toBe(6);
		expect(intervalcell.info.values[1].value).toBe(8);
		expect(intervalcell.info.values[2].value).toBe(10);
		expect(sheet.cellAt('D5').value).toBeGreaterThan(now);
		expect(sheet.cellAt('E5').value).toBe(6);
		expect(sheet.cellAt('D6').value).toBeGreaterThan(now + 0.002);
		expect(sheet.cellAt('E6').value).toBe(8);
		expect(sheet.cellAt('D7').value).toBeGreaterThan(now + 0.004);
		expect(sheet.cellAt('E7').value).toBe(10);
		expect(sheet.cellAt('D8')).toBeUndefined();
		expect(sheet.cellAt('E8')).toBeUndefined();
	});
	it('should ignore undefined values', async () => {
		const machine = newMachine({ cycletime: 1000 });
		const sheet = machine.getStreamSheetByName('T1').sheet;
		createCellAt('A1', 'v1', sheet);
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		createCellAt('A2', { formula: 'time.store(JSON(A1:B1))' }, sheet);
		createCellAt('A3', { formula: 'time.interval(A2, "v1", 9, 2/1000)' }, sheet);
		const intervalcell = sheet.cellAt('A3');
		expect(intervalcell.value).toBe(true);
		await machine.step();
		await sleep(4);
		await machine.step(); // 3
		createCellAt('B1', undefined, sheet);
		await sleep(4);
		await machine.step();
		createCellAt('B1', { formula: 'B1+1)' }, sheet);
		await sleep(4);
		await machine.step();
		expect(intervalcell.info.values.length).toBe(3);
		expect(intervalcell.info.values[0].value).toBe(3);
		expect(intervalcell.info.values[1].value).toBe(0);
		expect(intervalcell.info.values[2].value).toBe(2);
	});
	// TODO: should we really return this? we always want aggregated store value!!! Don't we?
	it.skip(`should return ${ERROR.LIMIT} if limit was reached`, () => {
		// set low limit, step until enough is stored => function should return error
	});
	// TODO: should we really return this? NA is returned already by time.store, isn't it?
	it.skip(`should return ${ERROR.NA} until first value is available`, async () => {
		// do not store something for several steps => we expect NA return
		// store something => step => expect value
	});
});
