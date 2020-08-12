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


describe('table.get', () => {
	it.skip(`should return ${ERROR.ARGS} error if called without any or too many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('table.get()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('table.get(,,,)', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if passed values are invalid`, async () => {
		const sheet = new StreamSheet().sheet;
		// first param must be a cell range, so:
		expect(createTerm('table.get(A1,42,"hello")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should return the value from specified table cell', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEGET });
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993370, "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(41);
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993360, "Turbine 2")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe('world');
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993350, "Turbine 2")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(false);
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993340, "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe('');
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993330, "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(0); // default cell value...
	});
	it(`should return ${ERROR.NA} if referenced cell is not in table`, async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.removeAllStreamSheets();
		machine.addStreamSheet(sheet.streamsheet);
		sheet.load({ cells: SHEET.TABLEGET });
		createCellAt('A1', { formula: 'table.get(A3:C8, 42, "Turbine 1")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		createCellAt('A1', { formula: 'table.get(A3:C8, 1594993370, "Turbine 23")'}, sheet);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
	});
});