const { CALC } = require('../../src/functions');
const { FunctionErrors } = require('@cedalo/error-codes');
const { StreamSheet } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

describe('calc', () => {
	it('should return an error if used in sheet directly', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: { formula: 'A1+1' }, B2: { formula: 'calc()' } } });
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B2').value).toBe(ERROR.INVALID);
	});
	it('should recalculate sheet without doing a step', () => {
		const sheet = new StreamSheet().sheet.load({ cells: { A1: { formula: 'A1+1' } } });
		CALC(sheet);
		expect(sheet.cellAt('A1').value).toBe(2);
		CALC(sheet);
		CALC(sheet);
		expect(sheet.cellAt('A1').value).toBe(4);
	});
});