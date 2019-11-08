const { MAX } = require('../../src/functions').functions;
const SHEETS = require('../_data/sheets.json');
const { createCellTerm, createCellTerms, createCellRangeTerm } = require('../utils');
const { StreamSheet } = require('@cedalo/machine-core');


describe('max', () => {
	it('should return the maximum of given cells', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MAX(sheet, createCellTerm('B3', sheet))).toBe(8);
		expect(MAX(sheet, ...createCellTerms(sheet, 'B3', 'A1', 'C2'))).toBe(8);
	});
	it('should return the maximum of given cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MAX(sheet, createCellRangeTerm('A1:C1', sheet))).toBe(3);
		expect(MAX(sheet, createCellRangeTerm('C3:A1', sheet))).toBe(9);
	});
	it('should return the maximum of given cell range and cells', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MAX(sheet, createCellRangeTerm('A1:C1', sheet), ...createCellTerms(sheet, 'B3', 'A1', 'C2'))).toBe(8);
		expect(MAX(sheet,
			createCellTerm('C2', sheet),
			createCellRangeTerm('B2:B2', sheet),
			createCellTerm('B3', sheet)))
			.toBe(8);
	});
	it('should return 0 if referenced cells are undefined', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MAX(sheet, createCellTerm('E6', sheet))).toBe(0);
		expect(MAX(sheet, createCellRangeTerm('D1:E4', sheet))).toBe(0);
		expect(MAX(sheet, createCellRangeTerm('C3:E5', sheet))).toBe(9);
		expect(MAX(sheet,
			createCellTerm('C2', sheet),
			createCellRangeTerm('B2:B2', sheet),
			createCellRangeTerm('D1:E4', sheet)))
			.toBe(6);
	});
});
