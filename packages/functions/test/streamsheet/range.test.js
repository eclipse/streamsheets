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
const { createCellAt, createTerm } = require('../utilities');
const SHEETS = require('../_data/sheets.json');

const ERROR = FunctionErrors.code;

describe('range', () => {
	it(`should return error ${ERROR.ARGS} if called with to few or to many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('range()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('range(,)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('range(A1:B1,C1:D1)', sheet).value).toBe(ERROR.ARGS);
	});
	it('should create an array from single cell', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: 42, B2: 'hello' } });
		expect(createTerm('range(A1)', sheet).value).toEqual([42]);
		expect(createTerm('range(B2)', sheet).value).toEqual(['hello']);
	});
	it('should create a flat array from given cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('range(A1:A1)', sheet).value).toEqual(['A1']);
		expect(createTerm('range(A1:C1)', sheet).value).toEqual(['A1', 'B1', 'C1']);
		expect(createTerm('range(A1:C3)', sheet).value).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3']);
	});
	it('should set undefined cells to null', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('range(E3)', sheet).value).toEqual([null]);
		expect(createTerm('range(E3:E3)', sheet).value).toEqual([null]);
		expect(createTerm('range(A1:D2)', sheet).value).toEqual(['A1', 'B1', 'C1', null, 'A2', 'B2', 'C2', null]);
		expect(createTerm('range(D2:E3)', sheet).value).toEqual([null, null, null, null]);
	});
});

describe('range & read', () => {
	test('read() should restore range values written to outbox', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		machine.addStreamSheet(sheet.streamsheet);
		createCellAt('A4', { formula: 'write(outboxdata("out1","range"),range(A1:C2),"Array")'}, sheet);
		createCellAt('A5', { formula: 'read(outboxdata("out1","range"), A6:C7, "Array")'}, sheet);
		expect(sheet.cellAt('A4').value).toBe('range');
		expect(sheet.cellAt('A5').value).toBe('range');
		await machine.step();
		expect(sheet.cellAt('A6').value).toBe('A1');
		expect(sheet.cellAt('B6').value).toBe('B1');
		expect(sheet.cellAt('C6').value).toBe('C1');
		expect(sheet.cellAt('D6')).toBeUndefined();
		// TODO: review after DL-4090 passed/rejected 
		expect(sheet.cellAt('A7')).toBeUndefined();
		// expect(sheet.cellAt('A7').value).toBe('A2');
		expect(sheet.cellAt('B7')).toBeUndefined();
		// expect(sheet.cellAt('B7').value).toBe('B2');
		expect(sheet.cellAt('C7')).toBeUndefined();
		// expect(sheet.cellAt('C7').value).toBe('C2');
	});
	test('read should restore values with null', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet.load({ cells: {
			A1: 'A1', C1: 'C1', E1: 'E1',
			B2: 'B2', D2: 'D2'
		} });
		machine.addStreamSheet(sheet.streamsheet);
		createCellAt('A4', { formula: 'write(outboxdata("out1","range"),range(A1:E2),"Array")'}, sheet);
		createCellAt('A5', { formula: 'read(outboxdata("out1","range"), A6:E7, "Array")'}, sheet);
		expect(sheet.cellAt('A4').value).toBe('range');
		expect(sheet.cellAt('A5').value).toBe('range');
		await machine.step();
		expect(sheet.cellAt('A6').value).toBe('A1');
		expect(sheet.cellAt('B6')).toBeUndefined();
		expect(sheet.cellAt('C6').value).toBe('C1');
		expect(sheet.cellAt('D6')).toBeUndefined();
		expect(sheet.cellAt('E6').value).toBe('E1');
		// TODO: review after DL-4090 passed/rejected 
		expect(sheet.cellAt('A7')).toBeUndefined();
		// expect(sheet.cellAt('B7').value).toBe('B2');
		// expect(sheet.cellAt('C7')).toBeUndefined();
		// expect(sheet.cellAt('D7').value).toBe('D2');
		// expect(sheet.cellAt('E7')).toBeUndefined();
	});
});
