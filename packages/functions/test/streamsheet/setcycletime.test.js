const { SETCYCLETIME } = require('../../src/functions');
const { Term } = require('@cedalo/parser');
const { Machine, SheetIndex, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const setup = (cycletime = 1000) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.cycletime = cycletime;
	machine.addStreamSheet(streamsheet);
	return { sheet: streamsheet.sheet, machine };
};

describe('setcycletime', () => {
	it('should set machine cycletime to use', () => {
		const { sheet, machine } = setup();
		expect(SETCYCLETIME(sheet, Term.fromNumber(500))).toBe(true);
		expect(machine.cycletime).toBe(500);
		expect(SETCYCLETIME(sheet, Term.fromNumber(2500))).toBe(true);
		expect(machine.cycletime).toBe(2500);
	});
	it('should not be possible to set a cycletime < 1', () => {
		const { sheet } = setup();
		expect(SETCYCLETIME(sheet, Term.fromNumber(0))).toBe(Error.code.VALUE);
		expect(SETCYCLETIME(sheet, Term.fromNumber(-1))).toBe(Error.code.VALUE);
	});
	it('should work inside a sheet', () => {
		const cells = { A1: { formula: 'A1+1' }, B1: { formula: 'getcycletime()' } };
		const { sheet, machine } = setup();
		sheet.load({ cells });
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1000);
		machine.cycletime = 50;
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(50);
	});
	it('should return error if no valid parameters are provided', () => {
		const { sheet } = setup();
		const invalidSheet = new StreamSheet().sheet;
		expect(SETCYCLETIME()).toBe(Error.code.ARGS);
		expect(SETCYCLETIME(sheet)).toBe(Error.code.ARGS);
		expect(SETCYCLETIME(invalidSheet, Term.fromNumber(4000))).toBe(Error.code.NO_MACHINE);
		expect(SETCYCLETIME(sheet, Term.fromString('abc'))).toBe(Error.code.VALUE);
	});
});
