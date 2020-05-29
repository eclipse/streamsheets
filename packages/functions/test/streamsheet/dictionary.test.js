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
const { DICTIONARY } = require('../../src/functions');
const { createCellRangeTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('dictionary', () => {
	it('should create a single json object from specified 2 rows cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C2', sheet);
		const dict = DICTIONARY(sheet, range, Term.fromBoolean(true));
		expect(dict).toBeDefined();
		expect(dict.A1).toBe('A2');
		expect(dict.B1).toBe('B2');
		expect(dict.C1).toBe('C2');
	});

	it('should create a single json object from specified 2 columns cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:B2', sheet);
		const dict = DICTIONARY(sheet, range);
		expect(dict).toBeDefined();
		expect(dict.A1).toBe('B1');
		expect(dict.A2).toBe('B2');
	});

	// DL-756
	it('should be allowed to use boolean as key', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: {
				A1: true,
				B1: 'TRUE',
				A2: false,
				B2: { value: 'FALSE', type: 'bool' }
			}
		});
		const range = createCellRangeTerm('A1:B2', sheet);
		const dict = DICTIONARY(sheet, range); // , Term.fromBoolean(false));
		expect(dict).toBeDefined();
		expect(dict.true).toBe('TRUE');
		expect(dict.false).toBe(false);
	});

	it('should create a list of json objects from specified cell range', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const dict = DICTIONARY(sheet, range, Term.fromBoolean(true));
		expect(dict).toBeDefined();
		expect(dict.length).toBe(2);
		expect(dict[0].A1).toBe('A2');
		expect(dict[0].B1).toBe('B2');
		expect(dict[0].C1).toBe('C2');
		expect(dict[1].A1).toBe('A3');
		expect(dict[1].B1).toBe('B3');
		expect(dict[1].C1).toBe('C3');
	});

	it('should create a list of json objects from specified cell range with column keys', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const range = createCellRangeTerm('A1:C3', sheet);
		const dict = DICTIONARY(sheet, range, Term.fromBoolean(false));
		expect(dict).toBeDefined();
		expect(dict.length).toBe(2);
		expect(dict[0].A1).toBe('B1');
		expect(dict[0].A2).toBe('B2');
		expect(dict[0].A3).toBe('B3');
		expect(dict[1].A1).toBe('C1');
		expect(dict[1].A2).toBe('C2');
		expect(dict[1].A3).toBe('C3');
	});

	it('should return error code if no sheet or range is specified', () => {
		expect(DICTIONARY()).toBe(ERROR.ARGS);
		expect(DICTIONARY(new StreamSheet().sheet)).toBe(ERROR.ARGS);
	});

	it('should return error code if range is not valid', () => {
		const sheet = new StreamSheet().sheet;
		const range = createCellRangeTerm('12:B2', sheet);
		expect(DICTIONARY(sheet, range)).toBe(ERROR.INVALID_PARAM);
	});

	// define how to handle cells without any value...
	it('should return empty object if specified cells do not exist', () => {
		const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
		const dict = DICTIONARY(sheet, createCellRangeTerm('D1:F4', sheet));
		expect(dict).toBeDefined(); 
		expect(dict).toEqual([{ '': '' }, { '': '' }]);
	});
});
