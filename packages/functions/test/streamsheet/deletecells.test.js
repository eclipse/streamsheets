const { createCellAt, createTerm } = require('../utils');
const { StreamSheet } = require('@cedalo/machine-core');


describe('deletecells', () => {
	it('should only execute if sheet is processed', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', 'hello', sheet);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeDefined();
		// simulate shsset processing...
		sheet.forceExecution(true);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
	});
	it('should delete a single cell', () => {
		const sheet = new StreamSheet().sheet;
		// simulate shsset processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'hello', sheet);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
	});
	it('should delete cells specified by range', () => {
		const sheet = new StreamSheet().sheet;
		// simulate shsset processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'a1', sheet);
		createCellAt('B1', 'b1', sheet);
		createCellAt('C2', 'c2', sheet);
		expect(createTerm('deletecells(A1:B1)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C2').value).toBe('c2');
		expect(createTerm('deletecells(A1:C2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
	});
	it('should accept cells and cell-ranges', () => {
		const sheet = new StreamSheet().sheet;
		// simulate shsset processing...
		sheet.forceExecution(true);
		createCellAt('A1', 'a1', sheet);
		createCellAt('B1', 'b1', sheet);
		createCellAt('C2', 'c2', sheet);
		createCellAt('D2', 'd2', sheet);
		expect(createTerm('deletecells(A1:B1, C2, C2:D2)', sheet).value).toBe(true);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('D2')).toBeUndefined();
	});
	it('should do nothing if specified cell does not exist', () => {
		const sheet = new StreamSheet().sheet;
		// simulate shsset processing...
		sheet.forceExecution(true);
		expect(createTerm('deletecells(A1)', sheet).value).toBe(true);
	});
	it('should do nothing if no cells are specified', () => {
		const sheet = new StreamSheet().sheet;
		// simulate shsset processing...
		sheet.forceExecution(true);
		expect(createTerm('deletecells()', sheet).value).toBe(true);
	});
});
