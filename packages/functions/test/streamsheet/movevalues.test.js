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
const { createCellAt, createTerm } = require('../utilities');
const SHEETS = require('../_data/sheets.json');
const { StreamSheet } = require('@cedalo/machine-core');

const evaluate = sheet => sheet.iterate(cell => cell.evaluate());

describe('movevalues', () => {
	it('should only execute if sheet is processed', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 'hello', sheet);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeDefined();
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
	});
	it('should move cells from source range to specifed target range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('movevalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('A1');
		expect(createTerm('movevalues(A2:B2, A3:B3)', sheet).value).toBe(true);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('A3').value).toBe('A2');
		expect(sheet.cellAt('B3').value).toBe('B2');
	});
	it('should move single source cell to specifed target cell', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('movevalues(A1, C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('A1');
	});
	it('should move single source cell to specifed target range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('movevalues(A1, C1:C3)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('A1');
		// all other target cells are not affected
		expect(sheet.cellAt('C2').value).toBe('C2');
		expect(sheet.cellAt('C3').value).toBe('C3');
	});
	it('should move range to single cell', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('movevalues(A1:C1, B2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1').value).toBe('B1');
		expect(sheet.cellAt('C1').value).toBe('C1');
		expect(sheet.cellAt('B2').value).toBe('A1');
	});
	it('should move only those cells until target is full', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('movevalues(A1:C1, A2:B2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('C1');
		expect(sheet.cellAt('A2').value).toBe('A1');
		expect(sheet.cellAt('B2').value).toBe('B1');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('movevalues(A1:C2, A3:B4)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2').value).toBe('B2');
		expect(sheet.cellAt('C2').value).toBe('C2');
		expect(sheet.cellAt('A3').value).toBe('A1');
		expect(sheet.cellAt('B3').value).toBe('B1');
		expect(sheet.cellAt('A4').value).toBe('C1');
		expect(sheet.cellAt('B4').value).toBe('A2');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('movevalues(A1:C2, C3:C5)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('A2').value).toBe('A2');
		expect(sheet.cellAt('B2').value).toBe('B2');
		expect(sheet.cellAt('C2').value).toBe('C2');
		expect(sheet.cellAt('C3').value).toBe('A1');
		expect(sheet.cellAt('C4').value).toBe('B1');
		expect(sheet.cellAt('C5').value).toBe('C1');
	});
	it('target cells should have static values, no reference', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', { formula: 'B1' }, sheet);
		createCellAt('B1', 'hello', sheet);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(createTerm('movevalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('hello');
		createCellAt('B1', 'hi', sheet);
		expect(sheet.cellAt('B1').value).toBe('hi');
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	// DL-558
	it('any references to moved cells are not updated', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', { formula: 'B1' }, sheet);
		createCellAt('B1', 'hello', sheet);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(createTerm('movevalues(B1:B1, C1:C1)', sheet).value).toBe(true);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe(0); // reference to a non existing cell results in 0 (DL-1958)
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	it('should be possible to move from and to negative columns', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		// move from neg. column
		expect(createTerm('movevalues(IF1:IF1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('IF1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe('IF1');
		// move to neg. columns
		expect(createTerm('movevalues(B2:C2, IF2:IF3)', sheet).value).toBe(true);
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('IF2').value).toBe('B2');
		expect(sheet.cellAt('IF3').value).toBe('C2');
	});
});
