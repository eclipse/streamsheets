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

const expectRow = (sheet, ...cellrefs) => ({
	toEqual(list) {
		expect(cellrefs.length).toBe(list.length);
		cellrefs.forEach((ref, index) => {
			const cell = sheet.cellAt(ref);
			if (cell) expect(cell.value).toBe(list[index]);
			else expect(list[index] == null).toBeTruthy();
		});
	}
});
const setupSheet = () => {
	const machine = new Machine();
	const sheet = new StreamSheet().sheet;
	machine.removeAllStreamSheets();
	machine.addStreamSheet(sheet.streamsheet);
	sheet.load({ cells: SHEET.TABLEORDERCOL });
	return sheet;
};
describe('table.ordercolumn', () => {
	// DL-4641: sort complete row
	it('should order per table row', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		sheet.loadCells({
			C1: "Name", D1: "Kids",
			C2: "Mueller", D2: 2,
			C3: "Meier", D3: 3,
			C4: "Metzger", D4: 4,
			C6: "Name", D6: "Kids",
			C7: "Metzger", D7: 3
		})
		createCellAt('A9', { formula: 'table.ordercolumn(C1:D4, C6:C7)'}, sheet);
		await machine.step();
		expectRow(sheet, 'C1', 'D1').toEqual(['Name', 'Kids']);
		expectRow(sheet, 'C2', 'D2').toEqual(['Metzger', 4]);
		expectRow(sheet, 'C3', 'D3').toEqual(['Mueller', 2]);
		expectRow(sheet, 'C4', 'D4').toEqual(['Meier', 3]);
		createCellAt('A9', { formula: 'table.ordercolumn(C1:D4, D6:D7)'}, sheet);
		await machine.step();
		expectRow(sheet, 'C1', 'D1').toEqual(['Name', 'Kids']);
		expectRow(sheet, 'C2', 'D2').toEqual(['Meier', 3]);
		expectRow(sheet, 'C3', 'D3').toEqual(['Metzger', 4]);
		expectRow(sheet, 'C4', 'D4').toEqual(['Mueller', 2]);
	});
	it('should order per table row and with multiple criteria columns', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		sheet.loadCells({
			C1: "Name", D1: "Kids",
			C2: "Mueller", D2: 2,
			C3: "Meier", D3: 3,
			C4: "Metzger", D4: 4,
			E6: "Name", F6: "Kids",
			E7: "Metzger", F7: 3
		})
		createCellAt('A9', { formula: 'table.ordercolumn(C1:D4, E6:F7)'}, sheet);
		await machine.step();
		expectRow(sheet, 'C1', 'D1').toEqual(['Name', 'Kids']);
		expectRow(sheet, 'C2', 'D2').toEqual(['Meier', 3]);
		expectRow(sheet, 'C3', 'D3').toEqual(['Metzger', 4]);
		expectRow(sheet, 'C4', 'D4').toEqual(['Mueller', 2]);
	});
	it('should not require criteria columns in same order as table once', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		sheet.loadCells({
			A1: "Name", B1: "Kids",
			A2: "Mueller", B2: 2,
			A3: "Meier", B3: 3,
			A4: "Metzger", B4: 4,
			A6: "Kids", B6: "Name",
			A7: 3, B7: "Metzger"
		})
		createCellAt('A9', { formula: 'table.ordercolumn(A1:B4, A6:B7)'}, sheet);
		await machine.step();
		expectRow(sheet, 'A1', 'B1').toEqual(['Name', 'Kids']);
		expectRow(sheet, 'A2', 'B2').toEqual(['Metzger', 4]);
		expectRow(sheet, 'A3', 'B3').toEqual(['Meier', 3]);
		expectRow(sheet, 'A4', 'B4').toEqual(['Mueller', 2]);
	});
	it('should order table row by criteria column', async () => {
		const sheet = setupSheet();
		const machine = sheet.machine;
		// add criteria cells:
		createCellAt('E3', 'Col1', sheet);
		createCellAt('E4', 17, sheet);
		createCellAt('E5', 0, sheet);
		createCellAt('E6', -12, sheet);
		createCellAt('A9', { formula: 'table.ordercolumn(A3:C8, E3:E6)'}, sheet);
		await machine.step();
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([17, '', false]);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([0, 'hi', '']);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([-12, null, 0]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([23, 'hello', 42]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([43, 'world', null]);
		// change criteria
		createCellAt('E3', 'Col2', sheet);
		createCellAt('E4', 'hi', sheet);
		createCellAt('E5', 'world', sheet);
		createCellAt('E6', null, sheet); // no cell!
		await machine.step();
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([0, 'hi', '']);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([43, 'world', null]);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([17, '', false]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([-12, null, 0]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([23, 'hello', 42]);
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
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([0, 'hi', '']);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([43, 'world', null]);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([17, '', false]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([-12, null, 0]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([23, 'hello', 42]);
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
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([17, '', false]);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([0, 'hi', '']);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([-12, null, 0]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([23, 'hello', 42]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([43, 'world', null]);
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
		// check all columns unchanged:
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([23, 'hello', 42]);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([43, 'world', null]);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([17, '', false]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([-12, null, 0]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([0, 'hi', '']);
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
		// check all columns unchanged:
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual([23, 'hello', 42]);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([43, 'world', null]);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([17, '', false]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([-12, null, 0]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([0, 'hi', '']);
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
		expectRow(sheet, 'A3', 'B3', 'C3').toEqual(['Col1', 'Col2', 'Col3']);
		expectRow(sheet, 'A4', 'B4', 'C4').toEqual(['custom', '', false]);
		expectRow(sheet, 'A5', 'B5', 'C5').toEqual([23, 'hello', 42]);
		expectRow(sheet, 'A6', 'B6', 'C6').toEqual([43, 'world', null]);
		expectRow(sheet, 'A7', 'B7', 'C7').toEqual([-12, null, 0]);
		expectRow(sheet, 'A8', 'B8', 'C8').toEqual([0, 'hi', '']);
		// change A1 to check formula still works
		createCellAt('A1', 'changed', sheet);
		await machine.step();
		expect(sheet.cellAt('A4').value).toBe('changed');
	});
	it(`should return ${ERROR.ARGS} if called with too few or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.ordercolumn()', sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('table.ordercolumn(,,)', sheet).value.code).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUES} if no column range or reference range is given`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.ordercolumn(,)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('table.ordercolumn(0,)', sheet).value.code).toBe(ERROR.VALUE);
		expect(createTerm('table.ordercolumn(A1:B1,"hello")', sheet).value.code).toBe(ERROR.VALUE);
	});
});