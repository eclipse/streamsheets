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
const { Term } = require('@cedalo/parser');
const { StreamSheet } = require('@cedalo/machine-core');


describe('copyvalues', () => {
	it('should only execute if sheet is processed', () => {
		const sheet = new StreamSheet().sheet;
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1')).toBeUndefined();
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('copyvalues(A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(cell.value);
	});
	it('should copy a cell to specifed target range', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(cell.value);
		// change cell value
		cell.term = Term.fromString('morning');
		expect(cell.value).toBe('morning');
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	it('should work with single cell-reference too', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(cell.value);
		// change cell value
		cell.term = Term.fromString('morning');
		expect(cell.value).toBe('morning');
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	it('should copy a cell range to specifed target range', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'a1', sheet);
		createCellAt('B1', 'b1', sheet);
		expect(createTerm('copyvalues(A1:B1, C1:D1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('a1');
		expect(sheet.cellAt('D1').value).toBe('b1');
	});
	it('should not copy cells outside target range', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'a1', sheet);
		createCellAt('B1', 'b1', sheet);
		expect(createTerm('copyvalues(A1:B1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('a1');
		expect(sheet.cellAt('D1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('D2')).toBeUndefined();
	});
	it('should copy a value to specifed target range', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('copyvalues("a1", C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('a1');
		expect(createTerm('copyvalues(true, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(true);
		expect(createTerm('copyvalues(1234567, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(1234567);
	});
	it('should repeat copy a cell to target range until target is full', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, C1:D2)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(cell.value);
		expect(sheet.cellAt('D1').value).toBe(cell.value);
		expect(sheet.cellAt('C2').value).toBe(cell.value);
		expect(sheet.cellAt('D2').value).toBe(cell.value);
	});
	it('should repeat copy cell range to target range until target is full', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'a1', sheet);
		createCellAt('B1', 'b1', sheet);
		expect(createTerm('copyvalues(A1:B1, C1:C4)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('a1');
		expect(sheet.cellAt('C2').value).toBe('b1');
		expect(sheet.cellAt('C3').value).toBe('a1');
		expect(sheet.cellAt('C4').value).toBe('b1');
	});
	it('should repeat copy value to target range until target is full', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('copyvalues("a1", C1:D2)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('a1');
		expect(sheet.cellAt('D1').value).toBe('a1');
		expect(sheet.cellAt('C2').value).toBe('a1');
		expect(sheet.cellAt('D2').value).toBe('a1');
	});
	// DL-558
	it('should not copy references, just values', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'hello', sheet);
		createCellAt('B1', { formula: 'A1' }, sheet);
		expect(sheet.cellAt('A1').value).toBe('hello');
		expect(sheet.cellAt('B1').value).toBe('hello');
		expect(createTerm('copyvalues(B1, C1:C1)', sheet).value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('hello');
		// change referenced cell A1:
		createCellAt('A1', 'hi', sheet);
		// evaluate references B1 and C1, but latter should not be a reference ;-)
		sheet.cellAt('B1').evaluate();
		sheet.cellAt('C1').evaluate();
		expect(sheet.cellAt('A1').value).toBe('hi');
		expect(sheet.cellAt('B1').value).toBe('hi');
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	// DL-884
	it('should work with offset function as parameter', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
		// simulate sheet processing...
		sheet.forceExecution(true);
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, offset(B6, 1, 1, 1, 1))', sheet).value).toBe(true);
		expect(sheet.cellAt('C7').value).toBe(cell.value);
		expect(createTerm('copyvalues(A1, offset(B7, 1, 1))', sheet).value).toBe(true);
		expect(sheet.cellAt('C8').value).toBe(cell.value);
	});
	it('should work with index function as parameter', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
		// simulate sheet processing...
		sheet.forceExecution(true);
		const cell = createCellAt('A1', 'hello', sheet);
		expect(createTerm('copyvalues(A1, index(B6:C8, 1, 1))', sheet).value).toBe(true);
		expect(sheet.cellAt('B6').value).toBe(cell.value);
	});
});
