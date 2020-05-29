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
const SHEETS = require('../_data/sheets.json');
const { createCellAt, createTerm } = require('../utilities');
const { StreamSheet } = require('@cedalo/machine-core');

const evaluate = sheet => sheet.iterate(cell => cell.evaluate());

describe('swapvalues', () => {
	it('should only execute if sheet is processed', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('swapvalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A1');
		expect(sheet.cellAt('C1').value).toBe('C1');
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('C1');
		expect(sheet.cellAt('C1').value).toBe('A1');
	});
	it('should swap cells from specified ranges', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('C1');
		expect(sheet.cellAt('C1').value).toBe('A1');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('swapvalues(A1:C1, A3:C3)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A3');
		expect(sheet.cellAt('B1').value).toBe('B3');
		expect(sheet.cellAt('C1').value).toBe('C3');
		expect(sheet.cellAt('A3').value).toBe('A1');
		expect(sheet.cellAt('B3').value).toBe('B1');
		expect(sheet.cellAt('C3').value).toBe('C1');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('swapvalues(B1:B3, C1:C3)', sheet).value).toBe(true);
		expect(sheet.cellAt('B1').value).toBe('C1');
		expect(sheet.cellAt('B2').value).toBe('C2');
		expect(sheet.cellAt('B3').value).toBe('C3');
		expect(sheet.cellAt('C1').value).toBe('B1');
		expect(sheet.cellAt('C2').value).toBe('B2');
		expect(sheet.cellAt('C3').value).toBe('B3');
	});
	it('should swap single source with target cell', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1, C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('C1');
		expect(sheet.cellAt('C1').value).toBe('A1');
	});
	it('should swap cell range with single cell', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1:C1, B2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('B2');
		expect(sheet.cellAt('B1').value).toBe('B1');
		expect(sheet.cellAt('C1').value).toBe('C1');
		expect(sheet.cellAt('A2').value).toBe('A2');
		expect(sheet.cellAt('B2').value).toBe('A1');
	});
	it('should swap singe cell with range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1, A2:C2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A2');
		expect(sheet.cellAt('A2').value).toBe('A1');
		expect(sheet.cellAt('B2').value).toBe('B2');
		expect(sheet.cellAt('C2').value).toBe('C2');
	});
	it('should swap cells even if source and target ranges are of different size', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(A1:C1, A2:B2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A2');
		expect(sheet.cellAt('B1').value).toBe('B2');
		expect(sheet.cellAt('C1').value).toBe('C1');
		expect(sheet.cellAt('A2').value).toBe('A1');
		expect(sheet.cellAt('B2').value).toBe('B1');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('swapvalues(A1:B2, A3:C3)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A3');
		expect(sheet.cellAt('B1').value).toBe('B3');
		expect(sheet.cellAt('A2').value).toBe('C3');
		expect(sheet.cellAt('B2').value).toBe('B2');
		expect(sheet.cellAt('A3').value).toBe('A1');
		expect(sheet.cellAt('B3').value).toBe('B1');
		expect(sheet.cellAt('C3').value).toBe('A2');
		sheet.load({ cells: SHEETS.SIMPLE });
		expect(createTerm('swapvalues(A1:A2, A3:C3)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('A3');
		expect(sheet.cellAt('A2').value).toBe('B3');
		expect(sheet.cellAt('A3').value).toBe('A1');
		expect(sheet.cellAt('B3').value).toBe('A2');
		expect(sheet.cellAt('C3').value).toBe('C3');
	});
	// DL-558
	it('should turn reference to static values', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', { formula: 'B1' }, sheet);
		createCellAt('B1', 'hello', sheet);
		createCellAt('C1', { formula: 'B1' }, sheet);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(sheet.cellAt('C1').value).toBe('hello');
		expect(createTerm('swapvalues(A1:A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(sheet.cellAt('C1').value).toBe('hello');
		createCellAt('B1', 'hi', sheet);
		expect(sheet.cellAt('B1').value).toBe('hi');
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	// DL-558
	it('should not update any reference to swapped cells', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', { formula: 'B1' }, sheet);
		createCellAt('B1', 'B1', sheet);
		createCellAt('C1', 'C1', sheet);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe('B1');
		expect(createTerm('swapvalues(B1:B1, C1:C1)', sheet).value).toBe(true);
		evaluate(sheet);
		expect(sheet.cellAt('A1').value).toBe('C1');
		expect(sheet.cellAt('B1').value).toBe('C1');
		expect(sheet.cellAt('C1').value).toBe('B1');
	});
	// changed due to DL-4088: IF col always returns true/false
	it('should be possible to swap with negative columns', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('swapvalues(IF1:IF1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('IF1').value).toBe('C1');
		expect(sheet.cellAt('C1').value).toBe('IF1');
		expect(createTerm('swapvalues(B2:C2, IF2:IF3)', sheet).value).toBe(true);
		expect(sheet.cellAt('B2').value).toBe('IF2');
		expect(sheet.cellAt('C2').value).toBe('IF3');
		expect(sheet.cellAt('IF2').value).toBe('B2');
		expect(sheet.cellAt('IF3').value).toBe('C2');
	});
});
