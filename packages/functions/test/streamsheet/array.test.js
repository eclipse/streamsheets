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
const { ARRAY } = require('../../src/functions');
const { createCellTerm, createCellRangeTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('array', () => {
	it('should create an array from specified single column cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:A3', sheet);
		const array = ARRAY(sheet, range);
		expect(array).toBeDefined();
		expect(array.length).toBe(3);
		expect(array).toEqual(['A1', 'A2', 'A3']);
	});

	it('should create an array from specified single row cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C1', sheet);
		const array = ARRAY(sheet, range);
		expect(array).toBeDefined();
		expect(array.length).toBe(3);
		expect(array).toEqual(['A1', 'B1', 'C1']);
	});

	it('should create a 2d array from specified cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const array = ARRAY(sheet, range);
		expect(array).toBeDefined();
		expect(array.length).toBe(3);
		expect(array[0].length).toBe(3);
		expect(array[0]).toEqual(['A1', 'B1', 'C1']);
		expect(array[1].length).toBe(3);
		expect(array[1]).toEqual(['A2', 'B2', 'C2']);
		expect(array[2].length).toBe(3);
		expect(array[2]).toEqual(['A3', 'B3', 'C3']);
	});

	it('should create a 2d array from specified cell range by row', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const array = ARRAY(sheet, range, Term.fromBoolean(true));
		expect(array).toBeDefined();
		expect(array.length).toBe(3);
		expect(array[0].length).toBe(3);
		expect(array[0]).toEqual(['A1', 'B1', 'C1']);
		expect(array[1].length).toBe(3);
		expect(array[1]).toEqual(['A2', 'B2', 'C2']);
		expect(array[2].length).toBe(3);
		expect(array[2]).toEqual(['A3', 'B3', 'C3']);
	});

	it('should create a 2d array from specified cell range by column', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const array = ARRAY(sheet, range, Term.fromBoolean(false));
		expect(array).toBeDefined();
		expect(array.length).toBe(3);
		expect(array[0].length).toBe(3);
		expect(array[0]).toEqual(['A1', 'A2', 'A3']);
		expect(array[1].length).toBe(3);
		expect(array[1]).toEqual(['B1', 'B2', 'B3']);
		expect(array[2].length).toBe(3);
		expect(array[2]).toEqual(['C1', 'C2', 'C3']);
	});
	// DL-1829:
	it('should treat non boolean values for nest parameter as true', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		expect(ARRAY(sheet, range, null)).toEqual([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2'], ['A3', 'B3', 'C3']]);
		expect(ARRAY(sheet, range, Term.fromString('asde'))).toEqual([
			['A1', 'B1', 'C1'],
			['A2', 'B2', 'C2'],
			['A3', 'B3', 'C3']
		]);
		expect(ARRAY(sheet, range, Term.fromString('true'))).toEqual([
			['A1', 'B1', 'C1'],
			['A2', 'B2', 'C2'],
			['A3', 'B3', 'C3']
		]);
	});

	it('should create a flat array from specified 2d cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const flatTerm = Term.fromString('flat');
		const array = ARRAY(sheet, range, null, flatTerm);
		expect(array).toBeDefined();
		expect(array.length).toBe(9);
		expect(array).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3']);
		// seems to ignore byrow parameter
		expect(ARRAY(sheet, range, true, flatTerm)).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3']);
		expect(ARRAY(sheet, range, false, flatTerm)).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3']);
	});

	it('should create a 2d array from specified single row range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C1', sheet);
		const flatTerm = Term.fromString('2d');
		const array = ARRAY(sheet, range, null, flatTerm);
		expect(array).toBeDefined();
		expect(array.length).toBe(1);
		expect(array[0].length).toBe(3);
		expect(array[0]).toEqual(['A1', 'B1', 'C1']);
	});

	it('should return error code if no cell is specified', () => {
		expect(ARRAY()).toBe(ERROR.ARGS);
		expect(ARRAY(new StreamSheet().sheet)).toBe(ERROR.ARGS);
	});

	// define how to handle cells without any value... => currently we create an empty string!
	it.skip('should return error code if specified cell is not valid', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		expect(ARRAY(sheet, createCellTerm('Z1', sheet))).toBe(ERROR.INVALID_PARAM);
	});
	it.skip('should return empty array if specified cells do not exist', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		expect(ARRAY(sheet, Term.fromString('D1:E1'))).toEqual([]);
	});
});
