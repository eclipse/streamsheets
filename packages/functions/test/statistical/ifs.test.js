// const { MAX } = require('../../src/functions');
// const SHEETS = require('../_data/sheets.json');
const { createTerm } = require('../utils');
// const { createCellTerm, createCellTerms, createCellRangeTerm } = require('../utils');
const { StreamSheet } = require('@cedalo/machine-core');

describe('countif', () => {
	it('should count number of cells which meet a criterion', () => {
		const sheet = new StreamSheet().sheet.loadCells({ 
			A2: "apples", B2: 32,
			A3: "oranges", B3: 54,
			A4: "peaches", B4: 75,
			A5: "apples", B5: 86,
		 });
		expect(createTerm('countif(A2:A5, "apples")', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, A5)', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, A4)', sheet).value).toBe(1);
		expect(createTerm('countif(A2:A5, A2)+countif(A2:A5,A3)', sheet).value).toBe(3);
		expect(createTerm('countif(B2:B5, ">55")', sheet).value).toBe(2);
		expect(createTerm('countif(B2:B5, "<>"&B4)', sheet).value).toBe(3);
		expect(createTerm('countif(B2:B5, ">=32") - countif(B2:B5, ">85")', sheet).value).toBe(3);
	});
	it.skip('should be case insensitive for text criteria', () => {

	});
	it.skip('should support wildcards "?" and "*" in text criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({ 
			A2: "apples", B2: 32,
			A3: "oranges", B3: 54,
			A4: "peaches", B4: 75,
			A5: "apples", B5: 86,
		 });
		expect(createTerm('countif(A2:A5, "*")', sheet).value).toBe(4);
		expect(createTerm('countif(A2:A5, "?????es")', sheet).value).toBe(2);
	});
	it.skip('should support wildcards escaping of "?" and "*" with "~"', () => {

	});
	it.skip('should return an error if not enough or too many parameters given', () => {

	});
	it.skip('should return an error if first parameter is not a range', () => {

	});
	it.skip('should return an error if second parameter is not a string', () => {

	});
});
