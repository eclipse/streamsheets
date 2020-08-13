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
const { Machine, SheetIndex, SheetRange, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../../utilities');
const SHEET = require('../../_data/sheets.json');

const ERROR = FunctionErrors.code;

const validateRowAt = (index, range, values) => {
	let valid = true;
	range.iterateRowAt(index, (cell) => {
		const expectedValue = values.shift();
		const receivedValue = cell ? cell.value : null;
		valid = valid && (receivedValue === expectedValue || (receivedValue == null && expectedValue == null));
	});
	return valid;
};
const rangeFromCellsDefinition = (cells) => {
	const sheet = new StreamSheet().sheet;
	const end = SheetIndex.create(1,0);
	const start = SheetIndex.create(1,0);
	sheet.loadCells(cells);
	sheet.iterate((cell, row, col) => {
		if (cell) {
			end.set(Math.max(row, end.row), Math.max(col, end.col));
			start.set(Math.min(row, start.row), Math.min(col, start.col));
		}
	});
	return SheetRange.fromStartEnd(start, end, sheet);
};
const rangeValues = (range) =>
	range.reduce((values, cell) => {
		if (cell) values.push(cell.value);
		return values;
	}, []);



describe('table.update', () => {
	it(`should return ${ERROR.ARGS} error if called without any or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.update()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('table.update(,,,,,,,,)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if passed values are invalid`, async () => {
		const sheet = new StreamSheet().sheet;
		// first param must be a cell range, so:
		expect(createTerm('table.update(A1,42)', sheet).value).toBe(ERROR.VALUE);
		// row index must be text or empty
		expect(createTerm('table.update(A1:B1,,42)', sheet).value).toBe(ERROR.VALUE);
		// column index must be text or empty
		expect(createTerm('table.update(A1:B1,,,42)', sheet).value).toBe(ERROR.VALUE);
		// push row must be a number or empty
		expect(createTerm('table.update(A1:B1,,,,"hello")', sheet).value).toBe(ERROR.VALUE);
		// push column must be a number or empty
		expect(createTerm('table.update(A1:B1,,,,,"hello")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should update a cell range with given value at specified row and column index', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('B4').value).toBe('hello');
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 4")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('E8').value).toBe(123456);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993350, "Turbine 2")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C6').value).toBe(false);
	});
	it('should not set value if neither row index nor column index is found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "1594993370", "Turbine 12")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "12", "Turbine 2")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});
	it('should never change value of top-left cell of range', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "Time", "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "1594993360", "Time")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});

	it('should ignore pushrow if rowindex is found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 1", 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('B4').value).toBe('hello');
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 4", -1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('E8').value).toBe(123456);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993350, "Turbine 2", 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C6').value).toBe(false);
	});
	it('should ignore pushrow if rowindex is null or empty', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "", "Turbine 1", 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, , "Turbine 4", -1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});
	it('should add new indices at row bottom for pushrow = 1 and rowindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993320, "Turbine 1", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(5, range, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(6, range, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(7, range, [1594993330, 81, 82, 83, 84])).toBe(true);
		expect(validateRowAt(8, range, [1594993320, 'hello'])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993310, "Turbine 4", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(5, range, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(6, range, [1594993330, 81, 82, 83, 84])).toBe(true);
		expect(validateRowAt(7, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(8, range, [1594993310, null, null, null, 123456])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993300, "Turbine 2", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(5, range, [1594993330, 81, 82, 83, 84])).toBe(true);
		expect(validateRowAt(6, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(7, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(8, range, [1594993300, null, false, null, null])).toBe(true);
	});
	it('should add new indices at row top for pushrow = -1 and rowindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993320, "Turbine 1", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(6, range, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(7, range, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(8, range, [1594993340, 71, 72, 73, 74])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993310, "Turbine 4", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(5, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(6, range, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(7, range, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(8, range, [1594993350, 61, 62, 63, 64])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993300, "Turbine 2", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993300, null, false, null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(7, range, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(8, range, [1594993360, 51, 52, 53, 54])).toBe(true);
	});
	it('should append to first non empty bottom row', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({
			cells: { A3: 'Time', B3: 'Turbine 1', C3: 'Turbine 2', D3: 'Turbine 3', E3: 'Turbine 4' }
		});
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993320, "Turbine 1", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [])).toBe(true);
		expect(validateRowAt(6, range, [])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993310, "Turbine 4", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993300, "Turbine 2", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [1594993300, null, false, null, null])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
	});
	it('should append to first non empty top row', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({
			cells: { A3: 'Time', B3: 'Turbine 1', C3: 'Turbine 2', D3: 'Turbine 3', E3: 'Turbine 4' }
		});
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993320, "Turbine 1", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [])).toBe(true);
		expect(validateRowAt(6, range, [])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993310, "Turbine 4", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(5, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(6, range, [])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993300, "Turbine 2", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993300, null, false, null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993310, null, null, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [1594993320, 'hello'])).toBe(true);
		expect(validateRowAt(7, range, [])).toBe(true);
		expect(validateRowAt(8, range, [])).toBe(true);
	});
	it('should not add new indices to rows for pushrow = 0 and rowindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", "index1", "Turbine 1", 0)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, "index2", "Turbine 4", 0)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});
	it('should ignore value and only add row indices to bottom if cell range has width = 1', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:A8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:A8, "hello", 1594993320, "Turbine 1", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993360])).toBe(true);
		expect(validateRowAt(5, range, [1594993350])).toBe(true);
		expect(validateRowAt(6, range, [1594993340])).toBe(true);
		expect(validateRowAt(7, range, [1594993330])).toBe(true);
		expect(validateRowAt(8, range, [1594993320])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:A8, 123456, 1594993310, "Turbine 4", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993350])).toBe(true);
		expect(validateRowAt(5, range, [1594993340])).toBe(true);
		expect(validateRowAt(6, range, [1594993330])).toBe(true);
		expect(validateRowAt(7, range, [1594993320])).toBe(true);
		expect(validateRowAt(8, range, [1594993310])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:A8, false, 1594993300, "Turbine 2", 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993340])).toBe(true);
		expect(validateRowAt(5, range, [1594993330])).toBe(true);
		expect(validateRowAt(6, range, [1594993320])).toBe(true);
		expect(validateRowAt(7, range, [1594993310])).toBe(true);
		expect(validateRowAt(8, range, [1594993300])).toBe(true);
	});
	it('should ignore value and only add row indices to top if cell range has width = 1', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:A8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:A8, "hello", 1594993320, "Turbine 1", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993320])).toBe(true);
		expect(validateRowAt(5, range, [1594993370])).toBe(true);
		expect(validateRowAt(6, range, [1594993360])).toBe(true);
		expect(validateRowAt(7, range, [1594993350])).toBe(true);
		expect(validateRowAt(8, range, [1594993340])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:A8, 123456, 1594993310, "Turbine 4", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993310])).toBe(true);
		expect(validateRowAt(5, range, [1594993320])).toBe(true);
		expect(validateRowAt(6, range, [1594993370])).toBe(true);
		expect(validateRowAt(7, range, [1594993360])).toBe(true);
		expect(validateRowAt(8, range, [1594993350])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:A8, false, 1594993300, "Turbine 2", -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time'])).toBe(true);
		expect(validateRowAt(4, range, [1594993300])).toBe(true);
		expect(validateRowAt(5, range, [1594993310])).toBe(true);
		expect(validateRowAt(6, range, [1594993320])).toBe(true);
		expect(validateRowAt(7, range, [1594993370])).toBe(true);
		expect(validateRowAt(8, range, [1594993360])).toBe(true);
	});
	
	it('should ignore pushcolumn if columnindex is found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 1", 1, 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('B4').value).toBe('hello');
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 4", 1, -1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('E8').value).toBe(123456);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993350, "Turbine 2", 1, 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C6').value).toBe(false);
	});
	it('should ignore pushcolumn if columnindex is null or empty', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "", 1, 1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, , 1, -1)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});
	it('should add new indices at column end for pushcolumn = 1 and columnindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 12",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 2', 'Turbine 3', 'Turbine 4', 'Turbine 12'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 42, 43, 44, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, 52, 53, 54])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, 62, 63, 64])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, 72, 73, 74])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, 82, 83, 84])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993360, "Turbine 42",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 3', 'Turbine 4', 'Turbine 12', 'Turbine 42'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 43, 44, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, 53, 54, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, 63, 64])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, 73, 74])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, 83, 84])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993330, "Turbine 23",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 4', 'Turbine 12', 'Turbine 42', 'Turbine 23'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 44, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, 54, null, 123456])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, 64])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, 74])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, 84, null, null, false])).toBe(true);
	});
	it('should add new indices at column start for pushcolumn = -1 and columnindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993350, "Turbine 13",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 13', 'Turbine 1', 'Turbine 2', 'Turbine 3'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, null, 41, 42, 43])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, 51, 52, 53])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, 'hello', 61, 62, 63])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, 71, 72, 73])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, null, 81, 82, 83])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 14",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 14', 'Turbine 13', 'Turbine 1', 'Turbine 2'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, null, null, 41, 42])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null, 51, 52])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, 'hello', 61, 62])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null, 71, 72])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, 123456, null, 81, 82])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993370, "Turbine 15",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 15', 'Turbine 14', 'Turbine 13', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, false, null, null, 41])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null, null, 51])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null, 'hello', 61])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null, null, 71])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, null, 123456, null, 81])).toBe(true);
	});
	it('should append to first non empty right column', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({
			cells: {
				A3: 'Time',
				A4: 1594993370,
				A5: 1594993360,
				A6: 1594993350,
				A7: 1594993340,
				A8: 1594993330
			}
		});
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 1",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360])).toBe(true);
		expect(validateRowAt(6, range, [1594993350])).toBe(true);
		expect(validateRowAt(7, range, [1594993340])).toBe(true);
		expect(validateRowAt(8, range, [1594993330])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 2",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello', null])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, null, 123456])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993340, "Turbine 3",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello', null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null, null])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null, false])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, null, 123456, null])).toBe(true);
	});
	it('should append to first non empty left column', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({
			cells: {
				A3: 'Time',
				A4: 1594993370,
				A5: 1594993360,
				A6: 1594993350,
				A7: 1594993340,
				A8: 1594993330
			}
		});
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine 1",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360])).toBe(true);
		expect(validateRowAt(6, range, [1594993350])).toBe(true);
		expect(validateRowAt(7, range, [1594993340])).toBe(true);
		expect(validateRowAt(8, range, [1594993330])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993330, "Turbine 2",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 2', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, null, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, 123456, null])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, false, 1594993340, "Turbine 3",, -1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 3', 'Turbine 2', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, null, null, 'hello'])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null, null])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, false, null, null])).toBe(true);
		expect(validateRowAt(8, range, [1594993330, null, 123456, null])).toBe(true);
	});
	it('should not add new indices to columns for pushcolumn = 0 and columnindex not found', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const TABLE_VALUES = rangeValues(rangeFromCellsDefinition(SHEET.TABLEUPDATE));
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello", 1594993370, "Turbine NEW",, 0)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
		createCellAt('A1', { formula: 'table.update(A3:E8, 123456, 1594993370, "Turbine NEW2",,)'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(rangeValues(SheetRange.fromRangeStr('A3:E8', sheet))).toEqual(TABLE_VALUES);
	});		
	it('should only add column indices if cell range has height = 1', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E3', sheet);
		const valueRange = SheetRange.fromRangeStr('A4:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEUPDATE });
		createCellAt('A1', { formula: 'table.update(A3:E3, "hello", 1594993370, "Turbine 42",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 2', 'Turbine 3', 'Turbine 4', 'Turbine 42'])).toBe(true);
		expect(validateRowAt(4, valueRange, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(5, valueRange, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(6, valueRange, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(7, valueRange, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(8, valueRange, [1594993330, 81, 82, 83, 84])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E3, 123456, 1594993370, "Turbine 43",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 3', 'Turbine 4', 'Turbine 42', 'Turbine 43'])).toBe(true);
		expect(validateRowAt(4, valueRange, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(5, valueRange, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(6, valueRange, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(7, valueRange, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(8, valueRange, [1594993330, 81, 82, 83, 84])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E3, false, 1594993370, "Turbine 44",, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 4', 'Turbine 42', 'Turbine 43', 'Turbine 44'])).toBe(true);
		expect(validateRowAt(4, valueRange, [1594993370, 41, 42, 43, 44])).toBe(true);
		expect(validateRowAt(5, valueRange, [1594993360, 51, 52, 53, 54])).toBe(true);
		expect(validateRowAt(6, valueRange, [1594993350, 61, 62, 63, 64])).toBe(true);
		expect(validateRowAt(7, valueRange, [1594993340, 71, 72, 73, 74])).toBe(true);
		expect(validateRowAt(8, valueRange, [1594993330, 81, 82, 83, 84])).toBe(true);
	});

	it('should push both indices if not present', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A3:E8', sheet);
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		createCellAt('A3', 'Time', sheet);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello1", 1594993370, "Turbine 1", 1, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', null, null, null])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello1', null, null, null])).toBe(true);
		expect(validateRowAt(5, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(6, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(7, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(8, range, [null, null, null, null, null])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello2", 1594993360, "Turbine 2", 1, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', null, null])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello1', null, null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, 'hello2', null, null])).toBe(true);
		expect(validateRowAt(6, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(7, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(8, range, [null, null, null, null, null])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello3", 1594993350, "Turbine 3", 1, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', null])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello1', null, null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, 'hello2', null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null, 'hello3', null])).toBe(true);
		expect(validateRowAt(7, range, [null, null, null, null, null])).toBe(true);
		expect(validateRowAt(8, range, [null, null, null, null, null])).toBe(true);
		createCellAt('A1', { formula: 'table.update(A3:E8, "hello4", 1594993340, "Turbine 4", 1, 1)'}, sheet);
		await machine.step();
		expect(validateRowAt(3, range, ['Time', 'Turbine 1', 'Turbine 2', 'Turbine 3', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(4, range, [1594993370, 'hello1', null, null, null])).toBe(true);
		expect(validateRowAt(5, range, [1594993360, null, 'hello2', null, null])).toBe(true);
		expect(validateRowAt(6, range, [1594993350, null, null, 'hello3', null])).toBe(true);
		expect(validateRowAt(7, range, [1594993340, null, null, null, 'hello4'])).toBe(true);
		expect(validateRowAt(8, range, [null, null, null, null, null])).toBe(true);
	});

	// form loom video in DL-
	it('should move values and column indices to right if insert new column index at left', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A12:D15', sheet);
		sheet.loadCells({
			B3: 1595361360,
			B4: 'Turbine 1',
			B7: 1507.2,
			B10: { formula: 'table.update(A12:D15,B7,B3,B4,-1,-1)' },
			// predefine table range:
								B12: 'Turbine 2',	C12:'Turbine 4',	D12: 'Turbine 3',
			A13: 1595361360,	B13: 1004.8,							D13: 502.4,
			A14: 1595361340,	B14: 1004.8,		C14: 1507.2,
			A15: 1595361330,											D15: 1004.8,
		});
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		await machine.step();
		expect(validateRowAt(12, range, [null, 'Turbine 1', 'Turbine 2', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(13, range, [1595361360, 1507.2, 1004.8, null])).toBe(true);
		expect(validateRowAt(14, range, [1595361340, null, 1004.8, 1507.2])).toBe(true);
		expect(validateRowAt(15, range, [1595361330, null, null, null])).toBe(true);
		expect(validateRowAt(16, range, [null, null, null, null])).toBe(true);
	});
	it('should move values and column indices to left if insert new column index at right', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A12:D15', sheet);
		sheet.loadCells({
			B3: 1595361360,
			B4: 'Turbine 1',
			B7: 1507.2,
			B10: { formula: 'table.update(A12:D15,B7,B3,B4,1,1)' },
			// predefine table range:
								B12: 'Turbine 2',	C12:'Turbine 4',	D12: 'Turbine 3',
			A13: 1595361360,	B13: 1004.8,							D13: 502.4,
			A14: 1595361340,	B14: 1004.8,		C14: 1507.2,
			A15: 1595361330,											D15: 1004.8,
		});
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		await machine.step();
		expect(validateRowAt(12, range, [null, 'Turbine 4', 'Turbine 3', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(13, range, [1595361360, null, 502.4, 1507.2])).toBe(true);
		expect(validateRowAt(14, range, [1595361340, 1507.2, null, null])).toBe(true);
		expect(validateRowAt(15, range, [1595361330, null, 1004.8, null])).toBe(true);
	});
	it('should move values and row indices to top if insert new row index at bottom', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A12:D15', sheet);
		sheet.loadCells({
			B3: 1595361320,
			B4: 'Turbine 1',
			B7: 1507.2,
			B10: { formula: 'table.update(A12:D15,B7,B3,B4,1,-1)' },
			// predefine table range:
								B12: 'Turbine 2',	C12:'Turbine 4',	D12: 'Turbine 3',
			A13: 1595361360,	B13: 1004.8,							D13: 502.4,
			A14: 1595361340,	B14: 1004.8,		C14: 1507.2,
			A15: 1595361330,											D15: 1004.8,
		});
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		await machine.step();
		expect(validateRowAt(12, range, [null, 'Turbine 1', 'Turbine 2', 'Turbine 4'])).toBe(true);
		expect(validateRowAt(13, range, [1595361340, null, 1004.8, 1507.2])).toBe(true);
		expect(validateRowAt(14, range, [1595361330, null, null, null])).toBe(true);
		expect(validateRowAt(15, range, [1595361320, 1507.2, null, null])).toBe(true);
	});
	it('should move values and row indices to bottom if insert new row index at top', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		const range = SheetRange.fromRangeStr('A12:D15', sheet);
		sheet.loadCells({
			B3: 1595361320,
			B4: 'Turbine 1',
			B7: 1507.2,
			B10: { formula: 'table.update(A12:D15,B7,B3,B4,-1,1)' },
			// predefine table range:
								B12: 'Turbine 2',	C12:'Turbine 4',	D12: 'Turbine 3',
			A13: 1595361360,	B13: 1004.8,							D13: 502.4,
			A14: 1595361340,	B14: 1004.8,		C14: 1507.2,
			A15: 1595361330,											D15: 1004.8,
		});
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		await machine.step();
		expect(validateRowAt(12, range, [null, 'Turbine 4', 'Turbine 3', 'Turbine 1'])).toBe(true);
		expect(validateRowAt(13, range, [1595361320, null, null, 1507.2])).toBe(true);
		expect(validateRowAt(14, range, [1595361360, null, 502.4, null])).toBe(true);
		expect(validateRowAt(15, range, [1595361340, 1507.2, null, null])).toBe(true);
	});

	describe('aggregation', () => {
		test('none', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 'hello', sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,0)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe('hello');
			createCellAt('A1', 123456, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(123456);
			createCellAt('A1', false, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(false);
		});
		test('average', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,1)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 4, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(3);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B4').value.toFixed(1)).toBe('3.6');
		});
		test('count', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 23, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,2)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(1);
			createCellAt('A1', 1234, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 42, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(3);
		});
		test('counta', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 0, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,3)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(0);
			createCellAt('A1', 1234, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(1);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(1);
			createCellAt('A1', 42, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(2);
		});
		test('max', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,4)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 1234, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(1234);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(1234);
			createCellAt('A1', 42, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(1234);
		});
		test('min', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 23, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,5)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(23);
			createCellAt('A1', 1234, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(23);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(23);
			createCellAt('A1', -42, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(-42);
		});
		test('product', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,6)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 3, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(6);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(6);
			createCellAt('A1', -2, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(-12);
		});
		test('stdev.s', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,7)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(0);
			createCellAt('A1', 2, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(0);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(0);
			createCellAt('A1', 2, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(0);
		});
		test('stdev.p', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,8)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		});
		test('sum', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, 1594993370, "Turbine 1",,,9)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 3, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(5);
			createCellAt('A1', 'hello', sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(5);
			createCellAt('A1', -2, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(3);
		});
		it('should reset aggregation if row or column index change', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 1594993370, sheet);
			createCellAt('B1', 'Turbine 1', sheet);
			createCellAt('C1', 11, sheet);
			// sum aggregation:
			createCellAt('A2', { formula: 'table.update(A3:E8, C1, A1, B1,,,9)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(11);
			// change row index:
			createCellAt('A1', 1594993360, sheet);
			createCellAt('C1', 21, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(11);
			expect(sheet.cellAt('B5').value).toBe(21);
			// change column index:
			createCellAt('B1', 'Turbine 3', sheet);
			createCellAt('C1', 23, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(11);
			expect(sheet.cellAt('B5').value).toBe(21);
			expect(sheet.cellAt('D5').value).toBe(23);
			// change row & column:
			createCellAt('A1', 1594993340, sheet);
			createCellAt('B1', 'Turbine 2', sheet);
			createCellAt('C1', 42, sheet);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(11);
			expect(sheet.cellAt('B5').value).toBe(21);
			expect(sheet.cellAt('D5').value).toBe(23);
			expect(sheet.cellAt('C7').value).toBe(42);
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(11);
			expect(sheet.cellAt('B5').value).toBe(21);
			expect(sheet.cellAt('D5').value).toBe(23);
			expect(sheet.cellAt('C7').value).toBe(84);
		});
		it('should keep aggregation if specified cell moves due to insertion of row or column', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A2', { formula: 'table.update(A3:E8, 12, 1594993370, "Turbine 1",,,9)'}, sheet);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe(24);
			// insert new row:
			createCellAt('A1', { formula: 'table.update(A3:E8, "new row", 1594993380, "Turbine 1",-1)'}, sheet);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe('new row');
			expect(sheet.cellAt('B5').value).toBe(48);
			// insert new column:
			createCellAt('A1', { formula: 'table.update(A3:E8, "new column", 1594993370, "Turbine 13",,-1)'}, sheet);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B5').value).toBe('new column');
			expect(sheet.cellAt('C5').value).toBe(72);
			// insert new row and column:
			createCellAt(
				'A1',
				{ formula: 'table.update(A3:E8, "new row & column", 1594993390, "Turbine 113",-1,-1)' },
				sheet
			);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('B4').value).toBe('new row & column');
			expect(sheet.cellAt('D6').value).toBe(96);
			// insert new row and column at end
			createCellAt('A1', { formula: 'table.update(A3:E8, "end", 1594993320, "Turbine End",1,1)' }, sheet);
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('E8').value).toBe('end');
			expect(sheet.cellAt('C5').value).toBe(120);
		});
		it('should aggregate values for each cell separately', async () => {
			const machine = new Machine();
			const sheet = new StreamSheet().sheet;
			machine.removeAllStreamSheets();
			machine.addStreamSheet(sheet.streamsheet);
			sheet.load({ cells: SHEET.TABLEUPDATE });
			createCellAt('A1', 2, sheet);
			createCellAt('B1', 1594993370, sheet);
			createCellAt('A2', { formula: 'table.update(A3:E8, A1, B1, "Turbine 1",,,9)'}, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			createCellAt('A1', 20, sheet);
			createCellAt('B1', 1594993360, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(2);
			expect(sheet.cellAt('B5').value).toBe(20);
			createCellAt('A1', 40, sheet);
			createCellAt('B1', 1594993370, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(42);
			expect(sheet.cellAt('B5').value).toBe(20);
			createCellAt('A1', 20, sheet);
			createCellAt('B1', 1594993360, sheet);
			await machine.step();
			expect(sheet.cellAt('A2').value).toBe(true);
			expect(sheet.cellAt('B4').value).toBe(42);
			expect(sheet.cellAt('B5').value).toBe(40);
		})
	});
});
