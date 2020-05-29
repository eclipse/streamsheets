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
const { createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

describe('averageif', () => {
	it('should return average of all cells in a range that meet a given criterion', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000
		});
		expect(createTerm('averageif(A2:A5, "<250000")', sheet).value).toBe(150000);
		expect(createTerm('averageif(B2:B5, "<23000")', sheet).value).toBe(14000);
	});
	it('should support an average_range parameter', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000
		});
		expect(createTerm('averageif(A2:A5, ">250000", B2:B5)', sheet).value).toBe(24500);
		sheet.loadCells({
			A2: "East", B2: 45678,
			A3: "West", B3: 23789,
			A4: "North", B4: -4789,
			A5: "South (New Office)", B5: 0,
			A6: "MidWest", B6: 9678
		});
		expect(createTerm('averageif(A2:A6, "=*West", B2:B6)', sheet).value).toBe(16733.5);
		expect(createTerm('averageif(A2:A6, "<>*(New Office)", B2:B6)', sheet).value).toBe(18589);
		// range with height and with...
		sheet.loadCells({
			A2: "East", B2: "West", C2: 45678, D2: 23789,
			A3: "North", B3: "South (New Office)", C3: -4789, D3: 0,
			A4: "South (New Office)", B4: "MidWest", C4: 0, D4: 9678
		});
		expect(createTerm('averageif(A2:B4, "=*West", C2:D4)', sheet).value).toBe(16733.5);
		expect(createTerm('averageif(A2:B4, "<>*(New Office)", C2:D4)', sheet).value).toBe(18589);
	});
	it('should not require average_range of same size as range parameter', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: "East", B2: "West", C2: 45678, D2: 23789,
			A3: "North", B3: "South (New Office)", C3: -4789, D3: 0,
			A4: "South (New Office)", B4: "MidWest", C4: 0, D4: 9678
		});
		expect(createTerm('averageif(A2:B4, "=*West", C2:C2)', sheet).value).toBe(16733.5);
		expect(createTerm('averageif(A2:B4, "=*West", C2:F2)', sheet).value).toBe(16733.5);
		expect(createTerm('averageif(A2:B4, "<>*(New Office)", C2:D8)', sheet).value).toBe(18589);
	});
	it('should ignore cells with true/false values', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10, B2: true,
			A3: 20, B3: false,
			A4: 30, B4: 2,
			A5: 40, B5: 4
		});
		expect(createTerm('averageif(A2:A5, ">1", B2:B5)', sheet).value).toBe(3);
		expect(createTerm('averageif(A2:A5, ">10", B2:B5)', sheet).value).toBe(3);
	});
	it('should treat empty cells as 0', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 10,
			A3: 20,
			A4: 30, B4: 2,
			A5: 40, B5: 4
		});
		expect(createTerm('averageif(A2:A5, ">1", B2:B5)', sheet).value).toBe(3);
		expect(createTerm('averageif(A2:A5, ">10", B2:B5)', sheet).value).toBe(3);
	});
	it('should support wildcards ? and *', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: "East", B2: 2,
			A3: "*West", B3: 4,
			A4: "*North?", B4: 6,
			A5: "South (New Office)", B5: 8,
			A6: "MidWest", B6: 10
		});
		expect(createTerm('averageif(A2:A6, "=~**", B2:B6)', sheet).value).toBe(5);
		expect(createTerm('averageif(A2:A6, "=~*West", B2:B6)', sheet).value).toBe(4);
		expect(createTerm('averageif(A2:A6, "??st", B2:B6)', sheet).value).toBe(2);
		expect(createTerm('averageif(A2:A6, "*~?", B2:B6)', sheet).value).toBe(6);
	});
	it(`should return ${ERROR.DIV0} error if no cell in range meets given criterion`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 100000, B2: 7000,
			A3: 200000, B3: 14000,
			A4: 300000, B4: 21000,
			A5: 400000, B5: 28000,
			A6: 10, B6: true,
			A7: 20, B7: false,
			A8: 30, B8: 2
		});
		expect(createTerm('averageif(A2:A5, "<95000")', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageif(A6:A8, "<30", B6:B8)', sheet).value).toBe(ERROR.DIV0);
	});
	it(`should return ${ERROR.DIV0} error if a cell in range is blank or has a text value`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: "East", B2: "",
			A3: "West", B3: "Hello",
			A4: "North", B4: "42"
		});
		expect(createTerm('averageif(A2:A4, "East", B2:B4)', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageif(A2:A4, "West", B2:B4)', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageif(A2:A4, "<>*st", B2:B4)', sheet).value).toBe(ERROR.DIV0);
	});
	it('should return an error if not enough or too many parameters given', () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('averageif()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('averageif(,)', sheet).value).toBe(ERROR.INVALID_PARAM);
		expect(createTerm('averageif(,,)', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageif(,,,)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('averageif(A2:A4)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('averageif(A2:A4, "*", A2:A3, "*")', sheet).value).toBe(ERROR.ARGS);
	});
});
describe('averageifs', () => {
	it('should return average value of all cells which meet multiple criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: '',	B2: 'Quiz', C2: 'Quiz', D2: 'Exam',
			A3: '', B3: 'Grade', C3: 'Grade', D3: 'Grade',
			A4: 'Emilio', B4: 75, C4: 85, D4: 87,
			A5: 'Julie', B5: 94, C5: 80, D5: 88,
			A6: 'Hans', B6: 86, C6: 93, D6: 'Incomplete',
			A7: 'Frederique', B7: 'Incomplete', C7: 75, D7: 75,
		});
		expect(createTerm('averageifs(B2:B5, B2:B5, ">70", B2:B5, "<90")', sheet).value).toBe(75);
		expect(createTerm('averageifs(D2:D5, D2:D5, "<>Incomplete", D2:D5, ">80")', sheet).value).toBe(87.5);
		sheet.loadCells({
			A2: 'Cozy Rambler',	B2: 230000, C2: 'Issaquah', D2: 3, E2: 'No',
			A3: 'Snug Bungalow', B3: 197000, C3: 'Bellevue', D3: 2, E3: 'Yes',
			A4: 'Cool Cape Codder', B4: 345678, C4: 'Bellevue', D4: 4, E4: 'Yes',
			A5: 'Splendid Split Level', B5: 321900, C5: 'Issaquah', D5: 2, E5: 'Yes',
			A6: 'Exclusive Tudor', B6: 450000, C6: 'Bellevue', D6: 5, E6: 'Yes',
			A7: 'Classy Colonial', B7: 395000, C7: 'Bellevue', D7: 4, E7: 'No',
		});
		expect(createTerm('averageifs(B2:B7, C2:C7, "Bellevue", D2:D7, ">2", E2:E7, "Yes")', sheet).value).toBe(397839);
		expect(createTerm('averageifs(B2:B7, C2:C7, "Issaquah", D2:D7, "<=3", E2:E7, "No")', sheet).value).toBe(230000);
	});
	it(`should return ${ERROR.DIV0} if average_range is empty or a text value`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('averageifs(, C2:C5, ">95")', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageifs("", C2:C5, ">95")', sheet).value).toBe(ERROR.DIV0);
		expect(createTerm('averageifs("A2:A5", C2:C5, ">95")', sheet).value).toBe(ERROR.DIV0);
	});
	it(`should return ${ERROR.DIV0} if no cell match given criteria`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: '',	B2: 'Quiz', C2: 'Quiz', D2: 'Exam',
			A3: '', B3: 'Grade', C3: 'Grade', D3: 'Grade',
			A4: 'Emilio', B4: 75, C4: 85, D4: 87,
			A5: 'Julie', B5: 94, C5: 80, D5: 88,
			A6: 'Hans', B6: 86, C6: 93, D6: 'Incomplete',
			A7: 'Frederique', B7: 'Incomplete', C7: 75, D7: 75,
		});
		expect(createTerm('averageifs(C2:C5, C2:C5, ">95")', sheet).value).toBe(ERROR.DIV0);
	});
	it(`should return ${ERROR.VALUE} error if a criteria range differs in size or shape from average_range`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 1,	B2: 2, C2: 3, D2: 4,
			A3: 1,	B3: 2, C3: 3, D3: 4,
			A4: 1,	B4: 2, C4: 3, D4: 4,
			A5: 1,	B5: 2, C5: 3, D5: 4,
			A6: 1,	B6: 2, C6: 3, D6: 4
		});
		expect(createTerm('averageifs(A2:A4, C2:C5, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('averageifs(A2:B3, C2:D6, ">0")', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('averageifs(A2:B3, C2:C2, ">0")', sheet).value).toBe(ERROR.VALUE);
	});
	it(`should ignore cells which cannot be converted to number`, () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: '', B2: 2,
			A3: '42', B3: 2,
			A4: 'hello', B4: 2,
			B5: 2,
			A6: 23, B6: 2
		});
		expect(createTerm('averageifs(A2:A6, B2:B6, ">0")', sheet).value).toBe(23);
	});
	// it(`should return ${ERROR.DIV0} if a cell in average_range is cannot be converted to number value`, () => {
	// 	const sheet = new StreamSheet().sheet.loadCells({
	// 		A2: '', B2: 2,
	// 		A3: '42', B3: 2,
	// 		A4: 'hello', B4: 2,
	// 		A5: 23, B5: 2
	// 	});
	// 	expect(createTerm('averageifs(A2:A5, B2:B5, ">0")', sheet).value).toBe(ERROR.DIV0);
	// });
	// it(`should handle TRUE as 1 and FALSE as 0 in average_range`, () => {
	// 	const sheet = new StreamSheet().sheet.loadCells({
	// 		A2: 1,	B2: 2, C2: 3, D2: 4,
	// 		A3: 1,	B3: 2, C3: 3, D3: 4,
	// 		A4: 1,	B4: 2, C4: 3, D4: 4,
	// 		A5: 1,	B5: 2, C5: 3, D5: 4,
	// 		A6: 1,	B6: 2, C6: 3, D6: 4
	// 	});
	// 	expect(createTerm('averageifs(A2:A4, C2:C5, ">0")', sheet).value).toBe(ERROR.INVALID_PARAM);
	// 	expect(createTerm('averageifs(A2:B3, C2:D6, ">0")', sheet).value).toBe(ERROR.INVALID_PARAM);
	// 	expect(createTerm('averageifs(A2:B3, C2:C2, ">0")', sheet).value).toBe(ERROR.INVALID_PARAM);
	// });
});
describe('countif', () => {
	it('should count number of cells which meet a criterion', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'apples',
			B2: 32,
			A3: 'oranges',
			B3: 54,
			A4: 'peaches',
			B4: 75,
			A5: 'apples',
			B5: 86
		});
		expect(createTerm('countif(A3, "oranges")', sheet).value).toBe(1);
		expect(createTerm('countif(A2:A2, "apples")', sheet).value).toBe(1);
		expect(createTerm('countif(A2:A5, "apples")', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, A5)', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, A4)', sheet).value).toBe(1);
		expect(createTerm('countif(A2:A5, A2)+countif(A2:A5,A3)', sheet).value).toBe(3);
		expect(createTerm('countif(B2:B5, ">55")', sheet).value).toBe(2);
		expect(createTerm('countif(B2:B5, "<>"&B4)', sheet).value).toBe(3);
		expect(createTerm('countif(B2:B5, ">=32") - countif(B2:B5, ">85")', sheet).value).toBe(3);
	});
	it('should be case insensitive for text criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'apples',
			B2: 32,
			A3: 'oranges',
			B3: 54,
			A4: 'peaches',
			B4: 75,
			A5: 'apples',
			B5: 86
		});
		expect(createTerm('countif(A2:A5, "APPLES")', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, "aPPleS")', sheet).value).toBe(2);
	});
	it('should support wildcards "?" and "*" in text criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'apples',
			B2: 32,
			A3: 'oranges',
			B3: 54,
			A4: 'peaches',
			B4: 75,
			A5: 'apples',
			B5: 86
		});
		expect(createTerm('countif(A2:A5, "*")', sheet).value).toBe(4);
		expect(createTerm('countif(A2:A5, "????es")', sheet).value).toBe(2);
	});
	it('should support wildcards escaping of "?" and "*" with "~"', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'apples',
			B2: 32,
			A3: 'oranges?',
			B3: 54,
			A4: '?*?es',
			B4: 75,
			A5: 'apples?',
			B5: 86
		});
		expect(createTerm('countif(A2:A5, "~*")', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, "???~?es")', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, "*~?")', sheet).value).toBe(2);
		expect(createTerm('countif(A2:A5, "~?~**")', sheet).value).toBe(1);
		expect(createTerm('countif(A2:A5, "*~*~?*")', sheet).value).toBe(1);
	});
	it('should ignore criterion if it is not a string', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'apples',
			B2: 32,
			A3: 'oranges',
			B3: 54,
			A4: 'peaches',
			B4: 75,
			A5: 'apples',
			B5: 86,
			A6: true,
			B6: false,
			C6: 42,
			D6: 'apples'
		});
		expect(createTerm('countif(A2:A5, A6)', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, B6)', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, C6)', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, 23)', sheet).value).toBe(0);
		expect(createTerm('countif(A2:A5, D6)', sheet).value).toBe(2);
	});
	it(`should return ${ERROR.ARGS} error if not enough or too many parameters given`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('countif()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('countif(,,)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('countif(A2:A5)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('countif(A2:A5, "*", "?")', sheet).value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.INVALID_PARAM} or ${ERROR.NAME} error if first parameter is not a range`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('countif(,)', sheet).value).toBe(ERROR.INVALID_PARAM);
		expect(createTerm('countif(XYZ200,"*")', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('countif(,"*")', sheet).value).toBe(ERROR.INVALID_PARAM);
		expect(createTerm('countif(A2:A5:A3)', sheet).value).toBe(ERROR.NAME);
		expect(createTerm('countif("", "*")', sheet).value).toBe(ERROR.INVALID_PARAM);
	});
});
describe('countifs', () => {
	it('should return average value of all cells which meet multiple criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 'Davidoski', B2: 'Yes', C2: 'No', D2: 'No',
			A3: 'Burke', B3: 'Yes', C3: 'Yes', D3: 'No',
			A4: 'Sundaram', B4: 'Yes', C4: 'Yes', D4: 'Yes',
			A5: 'Levitan', B5: 'No', C5: 'Yes', D5: 'Yes'
		});
		expect(createTerm('countifs(B2:D2, "=Yes")', sheet).value).toBe(1);
		expect(createTerm('countifs(B2:B5, "=Yes", C2:C5, "=Yes")', sheet).value).toBe(2);
		expect(createTerm('countifs(B5:D5, "=Yes", B3:D3, "=Yes")', sheet).value).toBe(1);
		sheet.loadCells({
			A2: 1, B2: '5/1/2011',
			A3: 2, B3: '5/2/2011',
			A4: 3, B4: '5/3/2011',
			A5: 4, B5: '5/4/2011',
			A6: 5, B6: '5/5/2011',
			A7: 6, B7: '5/6/2011',
		});
		expect(createTerm('countifs(A2:A7, "<6", A2:A7, ">1")', sheet).value).toBe(4);
		expect(createTerm('countifs(A2:A7, "<5", B2:B7, "5/*/2011")', sheet).value).toBe(4);
		expect(createTerm('countifs(A2:A7, "<"&A6, B2:B7, "="&B4)', sheet).value).toBe(1);
	});
	it('should handle criteria with a reference to an empty cell as 0', () => {
		const sheet = new StreamSheet().sheet.loadCells({ A2: 1, A3: 0 });
		expect(createTerm('countifs(A2:A3, P2)', sheet).value).toBe(1);
	});

	it('should return 0 if no cell match given criteria', () => {
		const sheet = new StreamSheet().sheet.loadCells({
			A2: 1, B2: 2,
			A3: 3, B3: 4
		});
		expect(createTerm('countifs(A2:A3, ">5")', sheet).value).toBe(0);
		expect(createTerm('countifs(A2:A3, "<5", B2:B3, "<2")', sheet).value).toBe(0);
	});
});