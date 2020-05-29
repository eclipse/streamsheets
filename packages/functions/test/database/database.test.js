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
const { createTerm } = require('../utilities');
const { StreamSheet } = require('@cedalo/machine-core');

/* eslint-disable */
const CELLS = {
	A1: 'Tree',		B1: 'Height',	C1: 'Age',	D1: 'Yield',	E1: 'Profit',	F1: 'Height',
	A2: 'Apple',	B2: '>10',		C2: null,	D2: null,		E2: null,		F2: '<16',
	A3: 'Pear',		B3: null,		C3: null,	D3: null,		E3: null,		F3: null,
	A4: 'Tree',		B4: 'Height',	C4: 'Age',	D4: 'Yield',	E4: 'Profit',	F4: 'Height',
	A5: 'Apple',	B5: 18,			C5: 20,		D5: 14,			E5: 105,		F5: null,
	A6: 'Pear',		B6: 12,			C6: 12,		D6: 10,			E6: 96,			F6: null,
	A7: 'Cherry',	B7: 13, 		C7: 14,		D7: 9,			E7: 105,		F7: null,
	A8: 'Apple',	B8: 14,			C8: 15,		D8: 10,			E8: 75,			F8: null,
	A9: 'Pear',		B9: 9,			C9: 8,		D9: 8,			E9: 77,			F9: null,
	A10: 'Apple',	B10: 8,			C10: 9,		D10: 6,			E10: 45,		F10: null,
	A11: 'Tree',	B11: 'Height',	C11: 'Age',	D11: 'Yield',	E11: 'Profit',	F11: 'Height',
};
/* eslint-enable */

describe('datebase functions', () => {
	describe('daverage', () => {
		it('should return the average value of all cells in a defined range that match a specified condition', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('daverage(A4:E10, "Yield", A1:B2)', sheet).value).toBe(12);
			expect(createTerm('daverage(A4:E10, 3, A4:E10)', sheet).value).toBe(13);
		});
		it('should ignore empty strings as condition', () => {
			const sheet = new StreamSheet().sheet.loadCells({
				A1: 'Name', B1: 'Age', C1: 'City',
				A2: '', C2: 'Berlin',
				A4: 'Name', B4: 'Age', C4: 'City',
				A5: 'Miller', B5: 24, C5: 'Berlin',
				A6: 'Mayer', B6: 30, C6: 'Oslo',
				A7: 'Smith', B7: 26, C7: 'Munich',
				A8: 'Jonas', B8: 16, C8: 'Berlin'
			});
			expect(createTerm('daverage(A4:C8, "Age", A1:C2)', sheet).value).toBe(20);
		});
	});
	describe('dcount', () => {
		it('should count all cells which contain a number in a defined range that match a specified condition', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('dcount(A4:E10, "Age", A1:F2)', sheet).value).toBe(1);
		});
	});
	describe('dmax', () => {
		it('should return the largest number in a defined cell range that match a specified condition', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('dmax(A4:E10, "Profit", A1:F3)', sheet).value).toBe(96);
		});
		// DL-1324
		it('should return 0 if source range has no input or pivot index is undefined', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('dmax(A4:E10, 8, A1:F3)', sheet).value).toBe(0);
			expect(createTerm('dmax(A11:F12, "Profit", A1:F3)', sheet).value).toBe(0);
			expect(createTerm('dmax(A11:F12, "Profit", A11:F12)', sheet).value).toBe(0);
		});
	});
	describe('dmin', () => {
		it('should return the smallest number in a defined cell range that match a specified condition', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('dmin(A4:E10, "Profit", A1:F3)', sheet).value).toBe(75);
		});
	});
	describe('dsum', () => {
		it('should sum up all numbers in a defined cell range that match a specified condition', () => {
			const sheet = new StreamSheet().sheet.load({ cells: CELLS });
			expect(createTerm('dsum(A4:E10, "Profit", A1:A2)', sheet).value).toBe(225);
			expect(createTerm('dsum(A4:E10, "Profit", A1:F3)', sheet).value).toBe(248);
		});
	});
});
