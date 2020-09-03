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
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../../utilities');
const SHEET = require('../../_data/sheets.json');

const ERROR = FunctionErrors.code;

const setupSheet = () => {
	const machine = new Machine();
	const sheet = new StreamSheet().sheet;
	machine.removeAllStreamSheets();
	machine.addStreamSheet(sheet.streamsheet);
	sheet.load({ cells: SHEET.TABLEORDERCOL });
	return sheet;
};
describe('table.ordercolumn', () => {
	it('should order table column by criteria column', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col1', sheet);
		createCellAt('E4', 17, sheet);
		createCellAt('E5', 0, sheet);
		createCellAt('E6', -12, sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:E6)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe('Col1');
		expect(sheet.cellAt('A4').value).toBe(17);
		expect(sheet.cellAt('A5').value).toBe(0);
		expect(sheet.cellAt('A6').value).toBe(-12);
		expect(sheet.cellAt('A7').value).toBe(23);
		expect(sheet.cellAt('A8').value).toBe(43);
		// change criteria
		createCellAt('E3', 'Col2', sheet);
		createCellAt('E4', 'hi', sheet);
		createCellAt('E5', 'world', sheet);
		createCellAt('E6', null, sheet); // no cell!
		await machine.step();
		expect(sheet.cellAt('B3').value).toBe('Col2');
		expect(sheet.cellAt('B4').value).toBe('hi');
		expect(sheet.cellAt('B5').value).toBe('world');
		expect(sheet.cellAt('B6').value).toBe('hello');
		expect(sheet.cellAt('B7').value).toBe('');
		expect(sheet.cellAt('B8')).toBeUndefined();
	});
	it('should order multiple table columns by one or several criteria columns', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col1', sheet);
		createCellAt('E4', 17, sheet);
		createCellAt('E5', 0, sheet);
		createCellAt('E6', -12, sheet);
		createCellAt('F3', 'Col2', sheet);
		createCellAt('F4', 'hi', sheet);
		createCellAt('F5', 'world', sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:F6)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A3').value).toBe('Col1');
		expect(sheet.cellAt('A4').value).toBe(17);
		expect(sheet.cellAt('A5').value).toBe(0);
		expect(sheet.cellAt('A6').value).toBe(-12);
		expect(sheet.cellAt('A7').value).toBe(23);
		expect(sheet.cellAt('A8').value).toBe(43);
		expect(sheet.cellAt('B3').value).toBe('Col2');
		expect(sheet.cellAt('B4').value).toBe('hi');
		expect(sheet.cellAt('B5').value).toBe('world');
		expect(sheet.cellAt('B6').value).toBe('hello');
		expect(sheet.cellAt('B7').value).toBe('');
		expect(sheet.cellAt('B8')).toBeUndefined();
	});
	it('should ignore undefined cells', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col3', sheet);
		createCellAt('E4', '', sheet);
		createCellAt('E5', 0, sheet);
		createCellAt('E6', false, sheet);
		createCellAt('F3', 'Col2', sheet);
		createCellAt('F4', '', sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:F6)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('C3').value).toBe('Col3');
		expect(sheet.cellAt('C4').value).toBe('');
		expect(sheet.cellAt('C5').value).toBe(0);
		expect(sheet.cellAt('C6').value).toBe(false);
		expect(sheet.cellAt('C7').value).toBe(42);
		expect(sheet.cellAt('C8')).toBeUndefined();
		expect(sheet.cellAt('B3').value).toBe('Col2');
		expect(sheet.cellAt('B4').value).toBe('');
		expect(sheet.cellAt('B5').value).toBe('hello');
		expect(sheet.cellAt('B6').value).toBe('world');
		expect(sheet.cellAt('B7')).toBeUndefined();
		expect(sheet.cellAt('B8').value).toBe('hi');
	});
	it('should not change unknown columns!', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col123', sheet);
		createCellAt('E4', -12, sheet);
		createCellAt('F3', 'Col234', sheet);
		createCellAt('F4', 'hi', sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:F4)'}, sheet);
		await machine.step();
		// check columns unchanged:
		expect(sheet.cellAt('A3').value).toBe('Col1');
		expect(sheet.cellAt('A4').value).toBe(23);
		expect(sheet.cellAt('A5').value).toBe(43);
		expect(sheet.cellAt('A6').value).toBe(17);
		expect(sheet.cellAt('A7').value).toBe(-12);
		expect(sheet.cellAt('A8').value).toBe(0);
		expect(sheet.cellAt('B3').value).toBe('Col2');
		expect(sheet.cellAt('B4').value).toBe('hello');
		expect(sheet.cellAt('B5').value).toBe('world');
		expect(sheet.cellAt('B6').value).toBe('');
		expect(sheet.cellAt('B7')).toBeUndefined();
		expect(sheet.cellAt('B8').value).toBe('hi');
	});
	it('should not change columns if no corresponding values found', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col1', sheet);
		createCellAt('E4', -123, sheet);
		createCellAt('E5', 23.01, sheet);
		createCellAt('F3', 'Col2', sheet);
		createCellAt('F4', 'hi sir', sheet);
		createCellAt('F5', 'hello sir', sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:F5)'}, sheet);
		await machine.step();
		// check columns unchanged:
		expect(sheet.cellAt('A3').value).toBe('Col1');
		expect(sheet.cellAt('A4').value).toBe(23);
		expect(sheet.cellAt('A5').value).toBe(43);
		expect(sheet.cellAt('A6').value).toBe(17);
		expect(sheet.cellAt('A7').value).toBe(-12);
		expect(sheet.cellAt('A8').value).toBe(0);
		expect(sheet.cellAt('B3').value).toBe('Col2');
		expect(sheet.cellAt('B4').value).toBe('hello');
		expect(sheet.cellAt('B5').value).toBe('world');
		expect(sheet.cellAt('B6').value).toBe('');
		expect(sheet.cellAt('B7')).toBeUndefined();
		expect(sheet.cellAt('B8').value).toBe('hi');
	});
	it('should preserve formula of moved cell', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		createCellAt('A1', 'custom', sheet);
		// change column cell to reference A1
		createCellAt('A6', { formula: 'A1'}, sheet);
		// add criteria cells:
		createCellAt('E3', 'Col1', sheet);
		createCellAt('E4', 'custom', sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:E5)'}, sheet);
		await machine.step();
		// check columns
		expect(sheet.cellAt('A3').value).toBe('Col1');
		expect(sheet.cellAt('A4').value).toBe('custom');
		expect(sheet.cellAt('A5').value).toBe(23);
		expect(sheet.cellAt('A6').value).toBe(43);
		expect(sheet.cellAt('A7').value).toBe(-12);
		expect(sheet.cellAt('A8').value).toBe(0);
		// change A1
		createCellAt('A1', 'changed', sheet);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe('changed');
	});
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.ordercolumn()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('table.ordercolumn(,,)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUES} if no column range or reference range is given`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.ordercolumn(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('table.ordercolumn(0,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('table.ordercolumn(A1:B1,"hello")', sheet).value).toBe(ERROR.VALUE);
	});
});