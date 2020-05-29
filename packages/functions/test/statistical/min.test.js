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
const { StreamSheet } = require('@cedalo/machine-core');
const { MIN } = require('../../src/functions');
const SHEETS = require('../_data/sheets.json');
const { createCellTerm, createCellTerms, createCellRangeTerm, createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

describe('min', () => {
	it('should return the minimum of given cells', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MIN(sheet, createCellTerm('B3', sheet))).toBe(8);
		expect(MIN(sheet, ...createCellTerms(sheet, 'B3', 'A1', 'C2'))).toBe(1);
	});
	it('should return the minimum of given cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MIN(sheet, createCellRangeTerm('A1:C1', sheet))).toBe(1);
		expect(MIN(sheet, createCellRangeTerm('C3:A1', sheet))).toBe(1);
	});
	it('should return the minimum of given cell range and cells', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MIN(sheet, createCellRangeTerm('A1:C1', sheet), ...createCellTerms(sheet, 'B3', 'A1', 'C2'))).toBe(1);
		expect(MIN(sheet,
			createCellTerm('C2', sheet),
			createCellRangeTerm('B2:B2', sheet),
			createCellTerm('B3', sheet)))
			.toBe(5);
	});
	it('should return 0 if referenced cells are undefined', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
		expect(MIN(sheet, createCellTerm('E6', sheet))).toBe(0);
		expect(MIN(sheet, createCellRangeTerm('D1:E4', sheet))).toBe(0);
		expect(MIN(sheet, createCellRangeTerm('C3:E5', sheet))).toBe(9);
		expect(MIN(sheet,
			createCellTerm('C2', sheet),
			createCellRangeTerm('B2:B2', sheet),
			createCellRangeTerm('D1:E4', sheet)))
			.toBe(5);
	});
});

describe('minifs', () => {
	it('should return minimum value of all cells which meet multiple criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 89, B2: 1,
			A3: 93, B3: 2,
			A4: 96, B4: 2,
			A5: 85, B5: 3,
			A6: 91, B6: 1,
			A7: 88, B7: 1,
		});
		expect(createTerm('minifs(A2:A7, B2:B7, 1)', sheet).value).toBe(88);
		sheet.loadCells({
			A2: 10,	B2: 'b', C2: 'Business', D2: 100,
			A3: 11, B3: 'a', C3: 'Technical', D3: 100,
			A4: 12, B4: 'a', C4: 'Business', D4: 200,
			A5: 13, B5: 'b', C5: 'Technical', D5: 300,
			A6: 14, B6: 'b', C6: 'Technical', D6: 300,
			A7: 15, B7: 'b', C7: 'Business', D7: 400,
		});
		expect(createTerm('minifs(A2:A7, B2:B7, "b", D2:D7, ">100")', sheet).value).toBe(13);
		expect(createTerm('minifs(A2:A6, B2:B6, "a", D2:D6, ">200")', sheet).value).toBe(0);
	});
	it('should support unaligned criteria and value ranges if they are of same height & width', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10, B2: 'b',
			A3: 11, B3: 'a',
			A4: 100, B4: 'a',
			A5: 111, B5: 'b',
			A6: 1, B6: 'a',
			A7: 1, B7: 'a',
		});
		expect(createTerm('minifs(A2:A5, B3:B6, "a")', sheet).value).toBe(10);
		expect(createTerm('minifs(A2:A5, B3:C6, "a")', sheet).value).toBe(ERROR.VALUE);
	});
	it('should treat empty cells as 0', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10,	B2: 'b', C2: 'Business', D2: 8,
			A3: 1, B3: 'a', C3: 'Technical', D3: 8,
			A4: 100, B4: 'a', C4: 'Business', D4: 8,
			A5: 11, B5: 'b', C5: 'Technical', D5: 0,
			A6: 1, B6: 'a', C6: 'Technical', D6: 8,
			A7: 1, B7: 'b', C7: 'Business', D7: 0,
		});
		expect(createTerm('minifs(A2:A7, B2:B7, "b", D2:D7, A8)', sheet).value).toBe(1);
	});

	it(`should return ${ERROR.VALUE} if criteria ranges has different rows or columns then sum range`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 1,	B2: 2, C2: 3, D2: 4,
			A3: 1,	B3: 2, C3: 3, D3: 4,
			A4: 1,	B4: 2, C4: 3, D4: 4,
			A5: 1,	B5: 2, C5: 3, D5: 4,
			A6: 1,	B6: 2, C6: 3, D6: 4
		});
		expect(createTerm('minifs(A2:A4, C2:C5, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('minifs(A2:B3, C2:D6, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('minifs(A2:B3, C2:C2, ">0")', sheet).value).toBe(ERROR.VALUE);
	});
});
