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
const SHEETS = require('../_data/sheets.json');
const { createCellAt, createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

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
		expect(createTerm('sum(1,2,3,4)', sheet).value).toBe(10);
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

describe('sumif', () => {
	it('should return sum of all cells in a range that meet a given criterion', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000
		});
		expect(createTerm('sumif(B2:B5, ">20000")', sheet).value).toBe(49000);
		expect(createTerm('sumif(A2:A5, ">160000")', sheet).value).toBe(900000);
	});
	it('should support a sum_range parameter', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000, C2: 250000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000
		});
		expect(createTerm('sumif(A2:A5, ">160000", B2:B5)', sheet).value).toBe(63000);
		expect(createTerm('sumif(A2:A5, 300000, B2:B5)', sheet).value).toBe(21000);
		expect(createTerm('sumif(A2:A5, ">"&C2, B2:B5)', sheet).value).toBe(49000);
		sheet.loadCells({
			A2: "Vegetables",	B2: "Tomatoes",	C2: 2300,
			A3: "Vegetables",	B3: "Celery",	C3: 5500,
			A4: "Fruits",		B4: "Oranges",	C4: 800,
			A5: "",				B5: "Butter",	C5: 400,
			A6: "Vegetables",	B6: "Carrots",	C6: 4200,
			A7: "Fruits",		B7: "Apples",	C7: 1200
		});
		expect(createTerm('sumif(A2:A7, "Fruits", C2:C7)', sheet).value).toBe(2000);
		expect(createTerm('sumif(A2:A7, "Vegetables", C2:C7)', sheet).value).toBe(12000);
		expect(createTerm('sumif(B2:B7, "*es", C2:C7)', sheet).value).toBe(4300);
		expect(createTerm('sumif(A2:A7, "", C2:C7)', sheet).value).toBe(400);
	});
	it('should not require a sum_range of same size as range parameter', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: "Fruits",		B2: "Oranges",	C2: 800,
			A3: "Vegetables",	B3: "Carrots",	C3: 4200,
			A4: "Fruits",		B4: "Apples",	C4: 1200
		});
		expect(createTerm('sumif(A2:B4, "Oranges", C2:C2)', sheet).value).toBe(0);
		expect(createTerm('sumif(A2:B4, "Fruits", C2:C2)', sheet).value).toBe(2000);
		expect(createTerm('sumif(A2:B4, "*es", C2:C2)', sheet).value).toBe(4200);
	});
	it('should ignore cells with true/false values', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10, B2: true,
			A3: 20, B3: false,
			A4: 30, B4: 2,
			A5: 40, B5: 4
		});
		expect(createTerm('sumif(A2:A5, ">1", B2:B5)', sheet).value).toBe(6);
		expect(createTerm('sumif(A2:A5, ">10", B2:B5)', sheet).value).toBe(6);
	});
	it('should ignore empty or text cells', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10, B2: '42',
			A3: 20, B3: 'hello',
			A4: 30, B4: 2,
			A5: 50, B5: '',
			A6: 40, B6: 4,
			A7: 60
		});
		expect(createTerm('sumif(A2:A7, ">1", B2:B5)', sheet).value).toBe(6);
		expect(createTerm('sumif(A2:A7, ">50", B2:B5)', sheet).value).toBe(0);
	});
	it('should return 0 if no cell in range meets given criterion', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000,
			A6: 10, B6: true,
			A7: 20, B7: false,
			A8: 30, B8: 2
		});
		expect(createTerm('sumif(A2:A5, "<95000")', sheet).value).toBe(0);
		expect(createTerm('sumif(A6:A8, "<30", B6:B8)', sheet).value).toBe(0);
	});

	it(`should return ${ERROR.ARGS} or ${ERROR.INVALID_PARAM} error if not enough or too many parameters given`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('sumif()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('sumif(,)', sheet).value).toBe(ERROR.INVALID_PARAM);
		expect(createTerm('sumif(,,)', sheet).value).toBe(ERROR.INVALID_PARAM);
		expect(createTerm('sumif(,,,)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('sumif(A2:A4)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('sumif(A2:A4, "*", A2:A3, "*")', sheet).value).toBe(ERROR.ARGS);
	});
});
describe('sumifs', () => {
	it('should return sum of all cells which meet multiple criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 5, B2: 'Apples', C2: 'Tom',
			A3: 4, B3: 'Apples', C3: 'Sarah',
			A4: 15, B4: 'Artichokes', C4: 'Tom',
			A5: 3, B5: 'Artichokes', C5: 'Sarah',
			A6: 22, B6: 'Bananas', C6: 'Tom',
			A7: 12, B7: 'Bananas', C7: 'Sarah',
			A8: 10, B8: 'Carrots', C8: 'Tom',
			A9: 33, B9: 'Carrots', C9: 'Sarah'
		});
		expect(createTerm('sumifs(A2:A9, B2:B9, "=A*", C2:C9, "Tom")', sheet).value).toBe(20);
		expect(createTerm('sumifs(A2:A9, B2:B9, "<>Bananas", C2:C9, "Tom")', sheet).value).toBe(30);
	});
	it(`should return ${ERROR.VALUE} if criteria ranges has different rows or columns then sum range`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 1,	B2: 2, C2: 3, D2: 4,
			A3: 1,	B3: 2, C3: 3, D3: 4,
			A4: 1,	B4: 2, C4: 3, D4: 4,
			A5: 1,	B5: 2, C5: 3, D5: 4,
			A6: 1,	B6: 2, C6: 3, D6: 4
		});
		expect(createTerm('sumifs(A2:A4, C2:C5, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sumifs(A2:B3, C2:D6, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('sumifs(A2:B3, C2:C2, ">0")', sheet).value).toBe(ERROR.VALUE);
	});
});
