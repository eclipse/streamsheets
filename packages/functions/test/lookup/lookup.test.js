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
const { createTerm } = require('../utilities');
const { Cell, Machine, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;


describe('lookup functions', () => {
	describe('choose', () => {
		it('should return the value at index from a list of values', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: '1st', B2: 'Nails',
					A3: '2nd', B3: 'Screws',
					A4: '3rd', B4: 'Nuts',
					A5: 'Done', B5: 'Bolts',
					A6: 23, A7: 45, A8: 12, A9: 10
				}
			});
			/* eslint-ensable */
			expect(createTerm('choose(2, A2, A3, A4, A5)', sheet).value).toBe('2nd');
			expect(createTerm('choose(4, B2, B3, B4, B5)', sheet).value).toBe('Bolts');
			expect(createTerm('choose(3, "Wide", 115, "world", 8)', sheet).value).toBe('world');
			expect(createTerm('choose(1.345,3,2,4)', sheet).value).toBe(3);
			expect(createTerm('choose("1",3,2,4)', sheet).value).toBe(3);
			expect(createTerm('sum(choose(2, A6:A7, A6:A8, A6:A9))', sheet).value).toBe(80);
			// expect(createTerm('sum(A6:choose(2, A7, A8, A9))', sheet).value).toBe(80);
		});
		// DL-1407
		it(`should return ${ERROR.VALUE} if index value is not a number or out of range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('choose("asd",3,2,4)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('choose(-1,3,2,4)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('choose(0,3,2,4)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('choose(5,3,2,4)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('choose("0",3,2,4)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('choose("5",3,2,4)', sheet).value).toBe(ERROR.VALUE);
		});
	});
	describe('column', () => {
		it('should return column number of given cell reference', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('column(B6)', sheet).value).toBe(2);
			expect(createTerm('column(D2)', sheet).value).toBe(4);
			// expect(createTerm('column(IF1)', sheet).value).toBe(0);
		});
		it('should return column number of leftmost column if a cell range is given', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('column(B6:C5)', sheet).value).toBe(2);
			expect(createTerm('column(A1:D4)', sheet).value).toBe(1);
		});
		it('should return column number of current cell if no cell reference is given', () => {
			const sheet = new StreamSheet().sheet;
			sheet.setCellAt('A1', new Cell(null, createTerm('column()', sheet)));
			sheet.setCellAt('T30', new Cell(null, createTerm('column()', sheet)));
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('T30').value).toBe(20);
		});
		it(`should return ${ERROR.NAME} if given parameter does not represent cell reference or range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('column(hello)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('column(A1D4)', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('index', () => {
		it('should return cell value inside specified cell range', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index(A1:B3, 1, 1)', sheet).value).toBe('A1');
			expect(createTerm('index(A1:B3, 2, 2)', sheet).value).toBe('B2');
			expect(createTerm('index(A1:B3, 2, 1)', sheet).value).toBe('A2');
			expect(createTerm('index(B2:C3, 1, 2)', sheet).value).toBe('C2');
			// excel doc example:
			sheet.load({ cells: { A2: 'Apples', B2: 'Lemons', A3: 'Bananas', B3: 'Pears' } });
			expect(createTerm('index(A2:B3, 2, 2)', sheet).value).toBe('Pears');
			expect(createTerm('index(A2:B3, 2, 1)', sheet).value).toBe('Bananas');
		});
		it('should return empty string if reference cell inside cell range is not defined', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index(C3:D4, 2, 2)', sheet).value).toBe('');
			expect(createTerm('index(D3:F6, 2, 1)', sheet).value).toBe('');
		});
		it('should return empty string if reference cell is outside specified cell range', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: null, B1: null, A2: null, B2: null } });
			expect(createTerm('index(A1:B2, 1, 2)', sheet).value).toBe('');
			expect(createTerm('index(A1:C3, 2, 1)', sheet).value).toBe('');
		});
		it('should work with boolean values', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 1, B1: 2, A2: 3, B2: 4 } });
			expect(createTerm('index(A1:B2, true, true)', sheet).value).toBe(1);
			expect(createTerm('index(A1:B2, 2, true)', sheet).value).toBe(3);
			expect(createTerm('index(A1:B2, true, 2)', sheet).value).toBe(2);
			expect(createTerm('index(A1:B2, 2, false)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('index(A1:B2, false, 1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('index(A1:B2, false, false)', sheet).value).toBe(ERROR.VALUE);
		});
		it('should support area number if used with range-list', () => {
			// if not given first range is used...
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: 1, B1: 2, A2: 3, B2: 4, C2: { formula: '[A1:B1,A2:B2]' } }
			});
			expect(createTerm('index(C2, 1,1,1)', sheet).value).toBe(1);
			expect(createTerm('index(C2, 1,2,1)', sheet).value).toBe(2);
			expect(createTerm('index(C2, 1,1,2)', sheet).value).toBe(3);
			expect(createTerm('index(C2, 1,2,2)', sheet).value).toBe(4);
			expect(createTerm('index(C2, 1,2,true)', sheet).value).toBe(2);
			// by default we use first index:
			expect(createTerm('index(C2, 1,1,)', sheet).value).toBe(1);
			expect(createTerm('index(C2, 1,2,)', sheet).value).toBe(2);
			expect(createTerm('index(C2, 1,1)', sheet).value).toBe(1);
			expect(createTerm('index(C2, 1,2)', sheet).value).toBe(2);
		});
		it(`should return ${ERROR.VALUE} if negative or zero offsets are used`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('index(A1:C3, 0, 0)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('index(A1:B3, -1, -1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('index(A1:C3, 1, -1)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('index(A1:C3, -1, 1)', sheet).value).toBe(ERROR.VALUE);
		});
		it(`should return ${ERROR.REF} if offsets are out of range`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 1, B1: 2, A2: 3, B2: 4 } });
			expect(createTerm('index(A1:B2, 3, 1)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('index(A1:B2, 1, 3)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('index(A1:B2, 3, 3)', sheet).value).toBe(ERROR.REF);
		});
		it(`should return ${ERROR.NAME} error if no cell range is specified`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index(A1, 1, 2)', sheet).value).toBe(ERROR.NAME);
		});
		it('should return #ARG_NUM error if not enough parameters are specified', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('index(A1:B3)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('index(A1:B3, 1)', sheet).value).toBe(ERROR.ARGS);
		});
	});
	describe('indirect', () => {
		it('should return referenced value specified by text string', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A1: 42, A2: 'B2', A3: 'B3', A4: 'George', A5: 5,
					B1: 23, B2: 1.333, B3: 45, B4: 10, B5: 62
				} 
			});
			expect(createTerm('indirect("A1")', sheet).value).toBe(42);
			// NOTE: cell references refers to cells which contain string!!
			expect(createTerm('indirect(A2)', sheet).value).toBe(1.333);
			expect(createTerm('indirect(A3)', sheet).value).toBe(45);
			expect(createTerm('indirect("$A$1")', sheet).value).toBe(42);
			expect(createTerm('indirect("B"&A5)', sheet).value).toBe(62);
		});
		it('should return referenced value specified by named-cell text string', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A4: 'George', B4: 10 } });
			sheet.namedCells.set('George', new Cell(23, createTerm('B4', sheet)));
			expect(createTerm('indirect(A4)', sheet).value).toBe(10);
		});
		it('should support referencing cells in another sheet', () => {
			const machine = new Machine();
			const s1 = new StreamSheet({ name: 'S1' });
			const s2 = new StreamSheet({ name: 'S2' });
			machine.removeAllStreamSheets();
			machine.addStreamSheet(s1);
			machine.addStreamSheet(s2);
			s1.sheet.load({ cells: { C1: 10 } });
			s2.sheet.load({ cells: { A1: 'George', B1: 42 } });
			s2.sheet.namedCells.set('George', new Cell(23, createTerm('S1!C1', s2.sheet)));
			expect(createTerm('indirect("S2!B1")', s1.sheet).value).toBe(42);
			// refs to cell content, because we pass a string to resolve
			expect(createTerm('indirect("S2!A1")', s1.sheet).value).toBe('George');
			// refs to named cell content, because we pass a cell-ref which resolves to name George
			expect(createTerm('indirect(S2!A1)', s1.sheet).value).toBe(10);
		});
		it('should support range strings', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
			expect(createTerm('indirect("A1:B2")', sheet)).toBeDefined();
			expect(createTerm('sum(indirect("A1:B2"))', sheet).value).toBe(12);
			expect(createTerm('sum(indirect("A1:B" & C1))', sheet).value).toBe(27);
		});
		it('should support reference style  string', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
			expect(createTerm('indirect("R1C1", false)', sheet).value).toBe(1);
			expect(createTerm('indirect("R1C3", false)', sheet).value).toBe(3);
			expect(createTerm('indirect("R2C2", false)', sheet).value).toBe(5);
			expect(createTerm('indirect("R3C3", false)', sheet).value).toBe(9);
		});
		it(`should return ${ERROR.REF} if no reference could be created`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
			expect(createTerm('indirect(A1:B2)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("R1C1")', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("R1C1", true)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("C1R1", false)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("R1CD1", false)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("RE1C1", false)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("R1C", false)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('indirect("RC1", false)', sheet).value).toBe(ERROR.REF);
		});
	});
	describe('match', () => {
		it('should return the relative position of a matching cell if found', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: 'Bananas', B2: 25,
					A3: 'Oranges', B3: 38,
					A4: 'Apples', B4: 40,
					A5: 'Pears', B5: 41
				}
			});
			/* eslint-ensable */
			// largest
			expect(createTerm('match(39, B2:B5, 1)', sheet).value).toBe(2);
			// smallest => not descending order
			expect(createTerm('match(40, B2:B5, -1)', sheet).value).toBe(ERROR.NA);
			// exact
			expect(createTerm('match(41, B2:B5, 0)', sheet).value).toBe(4);
		});
		it('should support strings with wildcards', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: 'Pears', B2: 25,
					A3: 'Oranges', B3: 38,
					A4: 'Bananas', B4: 40,
					A5: 'Apples', B5: 41,
					A6: 'An*heim',
					A7: 'Am?heim'
				}
			 });
			/* eslint-ensable */
			// largest: not ascending order
			expect(createTerm('match("Oranges", A2:A5, 1)', sheet).value).toBe(ERROR.NA);
			// smallest
			expect(createTerm('match("Or", A2:A5, -1)', sheet).value).toBe(2);
			// exact
			expect(createTerm('match("A*", A2:A7, 0)', sheet).value).toBe(4);
			expect(createTerm('match("An~**", A2:A7, 0)', sheet).value).toBe(5);
			expect(createTerm('match("Am~?*", A2:A7, 0)', sheet).value).toBe(6);
		});
		// DL-3336
		it(`should return ${ERROR.NA} if applied to an empty cell range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('MATCH(E14,G17:G41,TRUE)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(23,G17:G41,TRUE)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(E14,G17:G41,1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(23,G17:G41,1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(E14,G17:G41,0)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(23,G17:G41,0)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(E14,G17:G41,-1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(23,G17:G41,-1)', sheet).value).toBe(ERROR.NA);
		});
		it('should ignore empty or not matching cells in cell range', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: 'Bananas', B2: undefined,
					A3: 'Oranges', B3: 38,
					A4: 'Apples', B4: 'text',
					A5: 'Pears', B5: 41,
					A6: 'Pears', B6: 'world',
					A7: 'Pears', B7: 38,
					A8: 'Pears', B8: null
				}
			});
			/* eslint-ensable */
			expect(createTerm('match(39, B2:B5, 1)', sheet).value).toBe(2);
			expect(createTerm('match(41, B2:B5, 1)', sheet).value).toBe(4);
			expect(createTerm('match(42, B2:B5, 1)', sheet).value).toBe(4);
			expect(createTerm('match(4, B2:B5, 1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('match(38, B2:B5, 0)', sheet).value).toBe(2);
			expect(createTerm('match(41, B2:B5, 0)', sheet).value).toBe(4);
			expect(createTerm('match(42, B2:B5, 0)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('match(38, B5:B8, -1)', sheet).value).toBe(3);
			expect(createTerm('match(41, B5:B8, -1)', sheet).value).toBe(1);
			expect(createTerm('match(42, B5:B8, -1)', sheet).value).toBe(ERROR.NA);
		});
		it(`should return ${ERROR.NA} if cell range does not represent a list`, () => {
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: 'Bananas', B2: 29,
					A3: 'Oranges', B3: 38,
					A5: 'Pears', B4: 41,
					C2: 42, D2: 43, E2: 44
				}
			});
			expect(createTerm('MATCH(38,B2:C4,1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(38,B2:C4,0)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(38,B2:C4,-1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(42,B2:E3,1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(42,B2:E3,0)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('MATCH(42,B2:E3,-1)', sheet).value).toBe(ERROR.NA);
		});
	});
	describe('offset', () => {
		it('should return a CellRangeReference specified by given rows and columns from a start cell or range', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(D3,3,-2,1,1)', sheet)))
			let cell = sheet.cellAt('A10');
			let value = cell.value;
			expect(value).toBe(4);
			expect(value.height).toBeUndefined();
			expect(value.width).toBeUndefined();
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(D3,3,-2,3,3)', sheet)))
			cell = sheet.cellAt('A10');
			const range = cell.value;
			expect(range.height).toBe(3);
			expect(range.width).toBe(3);
			expect(sheet.cellAt(range.start).value).toBe(4);
			expect(sheet.cellAt(range.end)).toBeUndefined();
			expect(createTerm(`sum(${range.toString()})`, sheet).value).toBe(34);
			// from DL-884:
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(B6, 1, 1, 1, 1)', sheet)))
			cell = sheet.cellAt('A10');
			value = cell.value;
			expect(value).toBe(3);
			expect(value.height).toBeUndefined();
			expect(value.width).toBeUndefined();
		})
		it('should use given cell or range size if no height or with is given', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			let range = createTerm('offset(D3, 3, -2)', sheet).value;
			// one cell => range is value:
			expect(range).toBe(4);
			range = createTerm('offset(D3:E5, 3, -2)', sheet).value;
			expect(range.height).toBe(3);
			expect(range.width).toBe(2);
			range = createTerm('offset(D3:E5, 3, -2, 4)', sheet).value;
			expect(range.height).toBe(4);
			expect(range.width).toBe(2);
			range = createTerm('offset(D3:E5, 3, -2, , 3)', sheet).value;
			expect(range.height).toBe(3);
			expect(range.width).toBe(3);
		});
		it('should create a new cell range from specified range with given row & col offset and width & height', () => {
			const sheet = new StreamSheet().sheet;
			const range = createTerm('offset(A1:B3, 1, 1, 2, 2)', sheet).value;
			expect(range.height).toBe(2);
			expect(range.width).toBe(2);
			expect(range.toString()).toBe('B2:C3');
		});
		it('should not change original term (DL-783)', () => {
			const sheet = new StreamSheet().sheet;
			const term = createTerm('offset(H18,1,1,1,1)', sheet);
			const value = term.value;
			expect(value).toBeUndefined();
			expect(term.toString()).toBe('OFFSET(H18,1,1,1,1)');
		});
		it(`should return ${ERROR.REF} if new reference is not valid`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			expect(createTerm('offset(D3, -3, -3)', sheet).value).toBe(ERROR.REF);
		});
		it(`should return ${ERROR.ARGS} error if not enough parameters are specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('offset()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('offset(A1:B3)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('offset(A1:B3, 1)', sheet).value).toBe(ERROR.ARGS);
		});
		// DL-1425
		it(`should return cell value if new range reference only one cell or a ${ERROR.VALUE} error`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { D4: 1, E4: 2, D5: 3, E5: 4 } });
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(A1:A1,1,1)', sheet)))
			expect(sheet.cellAt('A8').value).toBeUndefined()
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(C3:C3,1,1)', sheet)))
			expect(sheet.cellAt('A8').value).toBe(1)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,1,1)', sheet)))
			expect(sheet.cellAt('A8').value).toBe(2)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,,1)', sheet)))
			expect(sheet.cellAt('A8').value).toBe(2)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,1)', sheet)))
			const range = sheet.cellAt('A8').value;
			expect(range).toBeDefined();
			expect(range.height).toBe(1);
			expect(range.width).toBe(2);
		});
		// DL-3383
		it('define test summary :-)', () => {
			const sheet = new StreamSheet().sheet.load({
				cells: { A1: 23, A2: { formula: 'OFFSET(A2, -1, 0)' }, A4: { formula: 'A2' } }
			});
			let cell = sheet.cellAt('A2');
			expect(cell.value).toBe(23);
		});
		it('it should return a single cell reference if its range covers only one cell', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { D4: 1, E4: 2, D5: 3, E5: 4 } });
			let term = createTerm('offset(D3,1,0)', sheet);
			expect(term.value).toBe(1);
			term = createTerm('D4', sheet);
			expect(term.value).toBe(1);
			term = createTerm('sum(offset(D4,0,0,2,1))', sheet);
			expect(term.value).toBe(4);
		});
	});
	describe('row', () => {
		it('should return row number of given cell reference', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('row(B6)', sheet).value).toBe(6);
			expect(createTerm('row(C10)', sheet).value).toBe(10);
			// expect(createTerm('row(IF1)', sheet).value).toBe(0);
		});
		it('should return row number of leftmost row if a cell range is given', () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('row(B6:C5)', sheet).value).toBe(5);
			expect(createTerm('row(A1:D4)', sheet).value).toBe(1);
			expect(createTerm('row(C8:B3)', sheet).value).toBe(3);
		});
		it('should return row number of current cell if no cell reference is given', () => {
			const sheet = new StreamSheet().sheet;
			sheet.setCellAt('A1', new Cell(null, createTerm('row()', sheet)));
			sheet.setCellAt('B1', new Cell(null, createTerm('row()+1', sheet)));
			sheet.setCellAt('T30', new Cell(null, createTerm('row()', sheet)));
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('B1').value).toBe(2);
			expect(sheet.cellAt('T30').value).toBe(30);
		});
		it(`should return ${ERROR.NAME} if given parameter does not represent cell reference or range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('row(hello)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('row(A1D4)', sheet).value).toBe(ERROR.NAME);
		});
	});
	describe('vlookup', () => {
		it('should find a cell within a range by row', () => {
			/* eslint-disable */
			const sheet = new StreamSheet().sheet.load({
				cells: {
					A2: 101, B2: 'Davis', C2: 'Sara', D2: '"Sales Rep"', E2: '"12/08/68"',
					A3: 102, B3: 'Fontana', C3: 'Olivier', D3: '"VP (Sales)"', E3: '"02/19/52"',
					A4: 103, B4: 'Leal', C4: 'Karina', D4: '"Sales Rep"', E4: '"08/30/63"',
					A5: 104, B5: 'Patten', C5: 'Michael', D5: '"Sales Rep"', E5: '"09/19/58"',
					A6: 105, B6: 'Burke', C6: 'Brian', D6: '"Sales Manager"', E6: '"03/04/55"',
					A7: 106, B7: 'Sousa', C7: 'Luis', D7: '"Sales Rep"', E7: '"07/02/63"'
				}
			});
			/* eslint-ensable */
			expect(createTerm('vlookup(B3, B2:E7, 2, false)', sheet).value).toBe('Olivier');
			expect(createTerm('vlookup(102, A2:C7, 2, false)', sheet).value).toBe('Fontana');
			expect(createTerm('vlookup(103, A2:E7, 2, false)', sheet).value).toBe('Leal');
		});
		it('should use approximate matching by default', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
			expect(createTerm('vlookup(0, A1:B3, 1)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('vlookup(1, A1:B3, 1)', sheet).value).toBe(1);
			expect(createTerm('vlookup(2, A1:B3, 1)', sheet).value).toBe(1);
			expect(createTerm('vlookup(3, A1:B3, 1)', sheet).value).toBe(1);
			expect(createTerm('vlookup(4, A1:B3, 1)', sheet).value).toBe(4);
			expect(createTerm('vlookup(5, A1:B3, 1)', sheet).value).toBe(4);
			expect(createTerm('vlookup(6, A1:B3, 1)', sheet).value).toBe(4);
			expect(createTerm('vlookup(7, A1:B3, 1)', sheet).value).toBe(7);
			expect(createTerm('vlookup(100, A1:B3, 1)', sheet).value).toBe(7);
		});
		it('should find another cell in range by search criteria number value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.NUMBERS });
			expect(createTerm('vlookup(1, A1:C3, 2)', sheet).value).toBe(2);
			expect(createTerm('vlookup(4, A1:C3, 1)', sheet).value).toBe(4);
			expect(createTerm('vlookup(7, A1:C3, 3)', sheet).value).toBe(9);
		});
		it('should find another cell in range by search criteria string value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('vlookup("A1", A1:C3, 2)', sheet).value).toBe('B1');
			expect(createTerm('vlookup("A2", A1:C3, 1)', sheet).value).toBe('A2');
			expect(createTerm('vlookup("A3", A1:C3, 3)', sheet).value).toBe('C3');
		});
		it('should find another cell in range by search criteria string wildcard value', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('vlookup("*2", A1:C3, 2, true)', sheet).value).toBe('B2');
			expect(createTerm('vlookup("A*", A1:C3, 1, true)', sheet).value).toBe('A1');
			expect(createTerm('vlookup("A3*", A1:C3, 3, true)', sheet).value).toBe('C3');
		});
		it('should return an empty string if referenced cell is not defined', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('vlookup("B*2", B1:d4, 3, true)', sheet).value).toBe('');
		});
		it(`should return ${ERROR.REF} if negative offset is used`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup("A3", A1:B3, 0)', sheet).value).toBe(ERROR.REF);
			expect(createTerm('vlookup("A3", A1:B3, -1)', sheet).value).toBe(ERROR.REF);
		});
		it(`should return ${ERROR.NA} if referenced cell is not in specified cell range`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('vlookup("B3", B1:B3, 2)', sheet).value).toBe(ERROR.NA);
			expect(createTerm('vlookup("B3", B3, 2)', sheet).value).toBe(ERROR.NA);
		});
		it(`should return ${ERROR.NAME} error if no cell range is specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup("B3", , 2)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('vlookup(-2, C22:E24, _3)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('vlookup(-2, C22:E24, ^3)', sheet).value).toBe(ERROR.NAME);
			expect(createTerm('vlookup(-2, C22:E24, ~3)', sheet).value).toBe(ERROR.NAME);
		});
		it(`should return ${ERROR.ARGS} error if not enough parameters are specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('vlookup("B3")', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('vlookup("B3", B1:B3)', sheet).value).toBe(ERROR.ARGS);
		});
	});
});
