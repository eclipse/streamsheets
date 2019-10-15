const { Machine, StreamSheet } = require('../..');
const ERROR = require('../../src/functions/errors');
const { createCellAt, createTerm } = require('./utils');
const SHEETS = require('./data/sheets.json');

let machine;

const createStreamSheet = ({ name, cells }) => {
	const t = new StreamSheet({ name });
	machine.addStreamSheet(t);
	return cells ? t.sheet.load({ cells }) : t.sheet;
};

beforeEach(() => {
	machine = new Machine();
});

describe('sum', () => {
	it('should return the total value of given cells', () => {
		const sheet = createStreamSheet({ name: 'P1', cells: SHEETS.NUMBERS });
		expect(createTerm('sum(A1:C3)', sheet).value).toBe(45);
	});
	it('should return the total value of a single cell', () => {
		const sheet = createStreamSheet({ name: 'P1', cells: SHEETS.NUMBERS });
		expect(createTerm('sum(A1)', sheet).value).toBe(1);
		expect(createTerm('sum(C3)', sheet).value).toBe(9);
	});
	it('should return 0 if referenced cells are undefined', () => {
		const sheet = createStreamSheet({ name: 'P1' });
		expect(createTerm('sum(A1)', sheet).value).toBe(0);
		expect(createTerm('sum(C3)', sheet).value).toBe(0);
		expect(createTerm('sum(A1:C3)', sheet).value).toBe(0);
	});
	it('should work with external reference', () => {
		const sheet = createStreamSheet({ name: 'P1' });
		createStreamSheet({ name: 'P2', cells: SHEETS.NUMBERS });
		expect(createTerm('sum(P2!A1)', sheet).value).toBe(1);
		expect(createTerm('sum(P2!C3)', sheet).value).toBe(9);
		expect(createTerm('sum(P2!A1:C3)', sheet).value).toBe(45);
		expect(createTerm('sum(P2!C5)', sheet).value).toBe(0);
		expect(createTerm('sum(P2!A5:C8)', sheet).value).toBe(0);
	});
	it('should work with indirect external reference', () => {
		const sheet = createStreamSheet({ name: 'P1' });
		createStreamSheet({ name: 'P2', cells: SHEETS.NUMBERS });
		createCellAt('A1', { formula: 'P2!A1' }, sheet);
		createCellAt('B2', { formula: 'P2!C3' }, sheet);
		createCellAt('B1', { formula: 'B2' }, sheet);
		createCellAt('C1', { formula: 'P2!A1:C3' }, sheet);
		createCellAt('D2', { formula: 'P2!A1:C3' }, sheet);
		createCellAt('D1', { formula: 'D2' }, sheet);
		createCellAt('E1', { formula: 'P2!C5' }, sheet);
		createCellAt('F2', { formula: 'P2!A5:C8' }, sheet);
		createCellAt('F1', { formula: 'F2' }, sheet);
		expect(createTerm('sum(A1)', sheet).value).toBe(1);
		expect(createTerm('sum(B1)', sheet).value).toBe(9);
		expect(createTerm('sum(C1)', sheet).value).toBe(45);
		expect(createTerm('sum(D1)', sheet).value).toBe(45);
		expect(createTerm('sum(E1)', sheet).value).toBe(0);
		expect(createTerm('sum(F1)', sheet).value).toBe(0);
		expect(createTerm('sum(P2!C3)', sheet).value).toBe(9);
		expect(createTerm('sum(P2!A1:C3)', sheet).value).toBe(45);
		expect(createTerm('sum(P2!C5)', sheet).value).toBe(0);
		expect(createTerm('sum(P2!A5:C8)', sheet).value).toBe(0);
	});
	// DL-1752:
	it('should treat cell-references and static values differently', () => {
		const sheet = createStreamSheet({ name: 'P1' });
		sheet.loadCells({ A1: 'hallo', B1: 23, A2: true, B2: false });
		expect(createTerm('sum(A1)', sheet).value).toBe(0);
		expect(createTerm('sum(A1:B1)', sheet).value).toBe(23);
		expect(createTerm('sum(A2:B2)', sheet).value).toBe(0);
		// excel behaves differently for static values
		expect(createTerm('sum(true)', sheet).value).toBe(1);
		expect(createTerm('sum(false)', sheet).value).toBe(0);
		expect(createTerm('sum("123")', sheet).value).toBe(123);
		expect(createTerm('sum("asd","Asd")', sheet).value).toBe(ERROR.VALUE);
	});
});
