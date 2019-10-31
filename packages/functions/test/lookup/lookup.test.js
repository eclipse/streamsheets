const SHEETS = require('../_data/sheets.json');
const { createTerm } = require('../utils');
const { Cell, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

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
		it(`should return ${Error.code.VALUE} if index value is not a number or out of range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('choose("asd",3,2,4)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('choose(-1,3,2,4)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('choose(0,3,2,4)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('choose(5,3,2,4)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('choose("0",3,2,4)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('choose("5",3,2,4)', sheet).value).toBe(Error.code.VALUE);
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
		it(`should return ${Error.code.NAME} if given parameter does not represent cell reference or range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('column(hello)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('column(A1D4)', sheet).value).toBe(Error.code.NAME);
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
			expect(createTerm('index(A1:B2, 2, false)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('index(A1:B2, false, 1)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('index(A1:B2, false, false)', sheet).value).toBe(Error.code.VALUE);
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
		it(`should return ${Error.code.VALUE} if negative or zero offsets are used`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('index(A1:C3, 0, 0)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('index(A1:B3, -1, -1)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('index(A1:C3, 1, -1)', sheet).value).toBe(Error.code.VALUE);
			expect(createTerm('index(A1:C3, -1, 1)', sheet).value).toBe(Error.code.VALUE);
		});
		it(`should return ${Error.code.REF} if offsets are out of range`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { A1: 1, B1: 2, A2: 3, B2: 4 } });
			expect(createTerm('index(A1:B2, 3, 1)', sheet).value).toBe(Error.code.REF);
			expect(createTerm('index(A1:B2, 1, 3)', sheet).value).toBe(Error.code.REF);
			expect(createTerm('index(A1:B2, 3, 3)', sheet).value).toBe(Error.code.REF);
		});
		it(`should return ${Error.code.NAME} error if no cell range is specified`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index(A1, 1, 2)', sheet).value).toBe(Error.code.NAME);
		});
		it('should return #ARG_NUM error if not enough parameters are specified', () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('index()', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('index(A1:B3)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('index(A1:B3, 1)', sheet).value).toBe(Error.code.ARGS);
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
			expect(createTerm('match(40, B2:B5, -1)', sheet).value).toBe(Error.code.NA);
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
			expect(createTerm('match("Oranges", A2:A5, 1)', sheet).value).toBe(Error.code.NA);
			// smallest
			expect(createTerm('match("Or", A2:A5, -1)', sheet).value).toBe(2);
			// exact
			expect(createTerm('match("A*", A2:A7, 0)', sheet).value).toBe(4);
			expect(createTerm('match("An~**", A2:A7, 0)', sheet).value).toBe(5);
			expect(createTerm('match("Am~?*", A2:A7, 0)', sheet).value).toBe(6);
		});
	});
	describe('offset', () => {
		it('should return a CellRangeReference specified by given rows and columns from a start cell or range', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(D3,3,-2,1,1)', sheet)))
			let cell = sheet.cellAt('A10');
			let range = cell.value;
			let descr = cell.description();
			expect(range.height).toBe(1);
			expect(range.width).toBe(1);
			expect(descr.value).toBe(4);
			expect(sheet.cellAt(range.start).value).toBe(4);
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(D3,3,-2,3,3)', sheet)))
			cell = sheet.cellAt('A10');
			range = cell.value;
			descr = cell.description();
			expect(range.height).toBe(3);
			expect(range.width).toBe(3);
			expect(descr.value).toBe(Error.code.VALUE); // 'B6:D8');
			expect(sheet.cellAt(range.start).value).toBe(4);
			expect(sheet.cellAt(range.end)).toBeUndefined();
			expect(createTerm(`sum(${range.toString()})`, sheet).value).toBe(34);
			// from DL-884:
			sheet.setCellAt('A10', new Cell(null, createTerm('offset(B6, 1, 1, 1, 1)', sheet)))
			cell = sheet.cellAt('A10');
			range = cell.value;
			descr = cell.description();
			expect(range.height).toBe(1);
			expect(range.width).toBe(1);
			expect(descr.value).toBe(3);
			expect(sheet.cellAt(range.start).value).toBe(3);
		})
		it('should use given cell or range size if no height or with is given', () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			let range = createTerm('offset(D3, 3, -2)', sheet).value;
			expect(range.height).toBe(1);
			expect(range.width).toBe(1);
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
			const range = term.value;
			expect(range.height).toBe(1);
			expect(range.width).toBe(1);
			expect(range.toString()).toBe('I19:I19');
			expect(term.toString()).toBe('OFFSET(H18,1,1,1,1)');
		});
		it(`should return ${Error.code.REF} if new reference is not valid`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { B6: 4, C6: 10, B7: 8, C7: 3, B8: 3, C8: 6 } });
			expect(createTerm('offset(D3, -3, -3)', sheet).value).toBe(Error.code.REF);
		});
		it(`should return ${Error.code.ARGS} error if not enough parameters are specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('offset()', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('offset(A1:B3)', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('offset(A1:B3, 1)', sheet).value).toBe(Error.code.ARGS);
		});
		// DL-1425
		it(`should return cell value if new range reference only one cell or a ${Error.code.VALUE} error`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: { D4: 1, E4: 2, D5: 3, E5: 4 } });
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(A1:A1,1,1)', sheet)))
			expect(sheet.cellAt('A8').cellValue).toBe(0)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(C3:C3,1,1)', sheet)))
			expect(sheet.cellAt('A8').cellValue).toBe(1)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,1,1)', sheet)))
			expect(sheet.cellAt('A8').cellValue).toBe(2)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,,1)', sheet)))
			expect(sheet.cellAt('A8').cellValue).toBe(2)
			sheet.setCellAt('A8', new Cell(null, createTerm('offset(B2:C2,2,3,1)', sheet)))
			expect(sheet.cellAt('A8').cellValue).toBe(Error.code.VALUE)
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
		it(`should return ${Error.code.NAME} if given parameter does not represent cell reference or range`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('row(hello)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('row(A1D4)', sheet).value).toBe(Error.code.NAME);
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
		it(`should return ${Error.code.REF} if negative offset is used`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup("A3", A1:B3, 0)', sheet).value).toBe(Error.code.REF);
			expect(createTerm('vlookup("A3", A1:B3, -1)', sheet).value).toBe(Error.code.REF);
		});
		it(`should return ${Error.code.NV} if referenced cell is not in specified cell range`, () => {
			const sheet = new StreamSheet().sheet.load({ cells: SHEETS.SIMPLE });
			expect(createTerm('vlookup("B3", B1:B3, 2)', sheet).value).toBe(Error.code.NV);
			expect(createTerm('vlookup("B3", B3, 2)', sheet).value).toBe(Error.code.NV);
		});
		it(`should return ${Error.code.NAME} error if no cell range is specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup("B3", , 2)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('vlookup(-2, C22:E24, _3)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('vlookup(-2, C22:E24, ^3)', sheet).value).toBe(Error.code.NAME);
			expect(createTerm('vlookup(-2, C22:E24, ~3)', sheet).value).toBe(Error.code.NAME);
		});
		it(`should return ${Error.code.ARGS} error if not enough parameters are specified`, () => {
			const sheet = new StreamSheet().sheet;
			expect(createTerm('vlookup()', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('vlookup("B3")', sheet).value).toBe(Error.code.ARGS);
			expect(createTerm('vlookup("B3", B1:B3)', sheet).value).toBe(Error.code.ARGS);
		});
	});
});
