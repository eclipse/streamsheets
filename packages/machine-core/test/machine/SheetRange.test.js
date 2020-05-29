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
const { createTerm, functions } = require('../utils');
const { Sheet, SheetIndex, SheetParser } = require('../..');
const SheetRange = require('../../src/machine/SheetRange');
const { FunctionErrors } = require('@cedalo/error-codes');

beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
});


describe('SheetRange', () => {
	describe('creation', () => {
		it('should create new range with a start and end index', () => {
			const start = SheetIndex.create('B1');
			const end = SheetIndex.create('D4');
			expect(SheetRange.fromStartEnd(start, end)).toBeDefined();
			// switching start/end should not be a problem...
			expect(SheetRange.fromStartEnd(end, start)).toBeDefined();
		});
		it('should create new range with a single cell index', () => {
			const start = SheetIndex.create('B1');
			expect(SheetRange.fromStartEnd(start, start)).toBeDefined();
		});
	});
	describe('creation from string', () => {
		it('should support creation form string', () => {
			expect(SheetRange.fromRangeStr('C3:C3')).toBeDefined();
			expect(SheetRange.fromRangeStr('A1:D5')).toBeDefined();
		});
		it('should support creation form string with only rows or columns', () => {
			expect(SheetRange.fromRangeStr('A:A')).toBeDefined();
			expect(SheetRange.fromRangeStr('A:D')).toBeDefined();
			expect(SheetRange.fromRangeStr('F:J')).toBeDefined();
			expect(SheetRange.fromRangeStr('1:1')).toBeDefined();
			expect(SheetRange.fromRangeStr('1:4')).toBeDefined();
			expect(SheetRange.fromRangeStr('8:20')).toBeDefined();
		});
		it('should return undefined if passed string is invalid range', () => {
			expect(SheetRange.fromRangeStr('P2!D5:P2!E6')).toBeUndefined();
			expect(SheetRange.fromRangeStr('_D5:E6')).toBeUndefined();
			expect(SheetRange.fromRangeStr('D5:°E6')).toBeUndefined();
			expect(SheetRange.fromRangeStr('^D5:E6')).toBeUndefined();
			expect(SheetRange.fromRangeStr('_5:5')).toBeUndefined();
			expect(SheetRange.fromRangeStr('5:~5')).toBeUndefined();
		});
	});
	describe('width & height', () => {
		it('should return relative number of rows as height', () => {
			expect(SheetRange.fromRangeStr('A1:B3').height).toBe(3);
			expect(SheetRange.fromRangeStr('IF1:C3').height).toBe(3);
			expect(SheetRange.fromRangeStr('$IF1:C$3').height).toBe(3);
			expect(SheetRange.fromRangeStr('B3:A1').height).toBe(3);
			expect(SheetRange.fromRangeStr('C$3:$IF1').height).toBe(3);
		});
		it('should return relative number of columns as width', () => {
			expect(SheetRange.fromRangeStr('A1:B3').width).toBe(2);
			expect(SheetRange.fromRangeStr('IF1:C3').width).toBe(4);
			expect(SheetRange.fromRangeStr('$IF1:C$3').width).toBe(4);
			expect(SheetRange.fromRangeStr('B3:A1').width).toBe(2);
			expect(SheetRange.fromRangeStr('C$3:$IF1').width).toBe(4);
		});
		it('should return 1 if start & end row are same', () => {
			expect(SheetRange.fromRangeStr('A1:A1').height).toBe(1);
			expect(SheetRange.fromRangeStr('IF1:IF1').height).toBe(1);
			expect(SheetRange.fromRangeStr('$IF1:$IF$1').height).toBe(1);
		});
		it('should return 1 if start & end column are same', () => {
			expect(SheetRange.fromRangeStr('A1:A1').width).toBe(1);
			expect(SheetRange.fromRangeStr('IF1:IF1').width).toBe(1);
			expect(SheetRange.fromRangeStr('$IF1:$IF$1').width).toBe(1);
		});
		it('should work with ranges based on rows or columns only', () => {
			expect(SheetRange.fromRangeStr('A:A').width).toBe(1);
			expect(SheetRange.fromRangeStr('A:A').height).toBe(1);
			expect(SheetRange.fromRangeStr('A:E').width).toBe(5);
			expect(SheetRange.fromRangeStr('A:E').height).toBe(1);
			expect(SheetRange.fromRangeStr('1:1').height).toBe(1);
			expect(SheetRange.fromRangeStr('1:1').width).toBe(1);
			expect(SheetRange.fromRangeStr('1:4').height).toBe(4);
			expect(SheetRange.fromRangeStr('1:4').width).toBe(1);
		});
	});
	describe('contains', () => {
		it('should return true if row index is in range', () => {
			let index = SheetRange.fromRangeStr('A1:C3');
			expect(index.containsRow(1)).toBeTruthy();
			expect(index.containsRow(2)).toBeTruthy();
			expect(index.containsRow(3)).toBeTruthy();
			index = SheetRange.fromRangeStr('IF3:C1');
			expect(index.containsRow(1)).toBeTruthy();
			expect(index.containsRow(2)).toBeTruthy();
			expect(index.containsRow(3)).toBeTruthy();
		});
		it('should return false if row index is not in range', () => {
			let index = SheetRange.fromRangeStr('A1:A1');
			expect(index.containsRow(0)).toBeFalsy();
			expect(index.containsRow(1)).toBeTruthy();
			expect(index.containsRow(2)).toBeFalsy();
			index = SheetRange.fromRangeStr('IF2:C1');
			expect(index.containsRow(0)).toBeFalsy();
			expect(index.containsRow(1)).toBeTruthy();
			expect(index.containsRow(2)).toBeTruthy();
			expect(index.containsRow(3)).toBeFalsy();
		});
		it('should return true if column index is in range', () => {
			let index = SheetRange.fromRangeStr('A1:C3');
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(1)).toBeTruthy();
			expect(index.containsCol(2)).toBeTruthy();
			index = SheetRange.fromRangeStr('IF3:C1');
			expect(index.containsCol(-1)).toBeTruthy();
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(1)).toBeTruthy();
			expect(index.containsCol(2)).toBeTruthy();
		});
		it('should return false if column index is not in range', () => {
			let index = SheetRange.fromRangeStr('A1:A1');
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(1)).toBeFalsy();
			expect(index.containsCol(-1)).toBeFalsy();
			index = SheetRange.fromRangeStr('IF2:A1');
			expect(index.containsCol(-2)).toBeFalsy();
			expect(index.containsCol(-1)).toBeTruthy();
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(1)).toBeFalsy();
		});
		it('should work with ranges based on rows or columns only', () => {
			let index = SheetRange.fromRangeStr('A:A');
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(1)).toBeFalsy();
			expect(index.containsCol(-1)).toBeFalsy();
			expect(index.containsRow(1)).toBeTruthy();
			expect(index.containsRow(2)).toBeFalsy();
			index = SheetRange.fromRangeStr('2:2');
			index.sheet = new Sheet();
			expect(index.containsCol(-2)).toBeTruthy();
			expect(index.containsCol(-1)).toBeTruthy();
			expect(index.containsCol(0)).toBeTruthy();
			expect(index.containsCol(index.sheet.settings.maxcol - 1)).toBeTruthy();
			expect(index.containsRow(1)).toBeFalsy();
			expect(index.containsRow(2)).toBeTruthy();
			expect(index.containsRow(3)).toBeFalsy();
		});
	});
	describe('iterate', () => {
		it('should be possible to iterate over range cells', () => {
			const end = SheetIndex.create('D4');
			const start = SheetIndex.create('B1');
			const expectedIndices = ['B1', 'C1', 'D1', 'B2', 'C2', 'D2', 'B3', 'C3', 'D3', 'B4', 'C4', 'D4'];
			const range = SheetRange.fromStartEnd(start, end);
			let counter = 0;
			range.sheet = new Sheet();
			range.iterate((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(12);
		});
		it('should be possible to iterate over row or column range', () => {
			const sheet = new Sheet().load({
				cells: {
					/* eslint-disable */
					A1: 'A1', B1: 'B1', C1: 'C1',
					A2: 'A2', B2: 'B2', C2: 'C2',
					A3: 'A3', B3: 'B3', C3: 'C3'
					/* eslint-ensable */
				}
			});
			let expectedIndices = ['B1', 'C1', 'B2', 'C2', 'B3', 'C3'];
			let range = SheetRange.fromRangeStr('B:D');
			let counter = 0;
			range.sheet = sheet;
			range.iterate((cell) => {
				if (cell) {
					expect(cell.value).toBe(expectedIndices[counter]);
					counter += 1;
				}
			});
			expect(counter).toBe(6);
			expectedIndices = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'];
			range = SheetRange.fromRangeStr('1:3');
			counter = 0;
			range.sheet = sheet;
			range.iterate((cell) => {
				if (cell) {
					expect(cell.value).toBe(expectedIndices[counter]);
					counter += 1;
				}
			});
			expect(counter).toBe(9);
		});
		it('should be ok if start index is behind end index', () => {
			const end = SheetIndex.create('D4');
			const start = SheetIndex.create('B1');
			const expectedIndices = ['B1', 'C1', 'D1', 'B2', 'C2', 'D2', 'B3', 'C3', 'D3', 'B4', 'C4', 'D4'];
			const range = SheetRange.fromStartEnd(end, start);
			let counter = 0;
			range.sheet = new Sheet();
			range.iterate((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(12);
		});
		it('should be possible to iterate a range of one cell', () => {
			const range = SheetRange.fromRangeStr('B1:B1');
			range.sheet = new Sheet();
			range.iterate((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe('B1');
			});
		});
		it('should be possible to iterate per row', () => {
			const sheet = new Sheet();
			const expectedIndices = ['B1', 'C1', 'D1'];
			let range = SheetRange.fromStartEnd(SheetIndex.create('B1'), SheetIndex.create('D4'));
			let counter = 0;
			range.sheet = sheet;
			range.iterateRowAt(1, (cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(3);
			// switch start end:
			range = SheetRange.fromStartEnd(SheetIndex.create('D4'), SheetIndex.create('B1'));
			range.sheet = sheet;
			counter = 0;
			range.iterateRowAt(1, (cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(3);
		});
		it('should be possible to iterate per column', () => {
			const sheet = new Sheet();
			const expectedIndices = ['B1', 'B2', 'B3', 'B4'];
			let range = SheetRange.fromStartEnd(SheetIndex.create('B1'), SheetIndex.create('D4'));
			let counter = 0;
			range.sheet = sheet;
			range.iterateColAt(1, (cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(4);
			// switch start end
			range = SheetRange.fromStartEnd(SheetIndex.create('D4'), SheetIndex.create('B1'));
			range.sheet = sheet;
			counter = 0;
			range.iterateColAt(1, (cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
			});
			expect(counter).toBe(4);
		});
	});
	describe('some', () => {
		it('should stop on first match', () => {
			const end = SheetIndex.create('D4');
			const start = SheetIndex.create('B1');
			const expectedIndices = ['B1', 'C1', 'D1', 'B2'];
			const range = SheetRange.fromStartEnd(start, end);
			let counter = 0;
			range.sheet = new Sheet();
			range.some((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
				return counter === expectedIndices.length;
			});
			expect(counter).toBe(expectedIndices.length);
		});
		it('should be ok if start index is behind end index', () => {
			const end = SheetIndex.create('D4');
			const start = SheetIndex.create('B1');
			const expectedIndices = ['B1', 'C1', 'D1', 'B2', 'C2', 'D2', 'B3', 'C3', 'D3', 'B4', 'C4'];
			const range = SheetRange.fromStartEnd(end, start);
			let counter = 0;
			range.sheet = new Sheet();
			range.some((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
				return counter === expectedIndices.length;
			});
			expect(counter).toBe(expectedIndices.length);
		});
		it('should support to iterate by column first', () => {
			const end = SheetIndex.create('D4');
			const start = SheetIndex.create('B1');
			const expectedIndices = ['B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3'];
			const range = SheetRange.fromStartEnd(end, start);
			let counter = 0;
			range.sheet = new Sheet();
			range.someByCol((cell, index) => {
				expect(cell).toBeUndefined();
				expect(index.toString()).toBe(expectedIndices[counter]);
				counter += 1;
				return counter === expectedIndices.length;
			});
			expect(counter).toBe(expectedIndices.length);
		});
	});
	describe('usage of column/row range as function parameter', () => {
		it('should work with SUM()', () => {
			let sheet = new Sheet().load({ cells: { A1: 1, A2: 2, A3: 3, A4: 4 } });
			expect(createTerm('sum(A:A)', sheet).value).toBe(10);
			expect(createTerm('sum(1:4)', sheet).value).toBe(10);
			sheet = new Sheet().load({ cells: { A1: 1, B1: 2, C1: 3, D1: 4 } });
			expect(createTerm('sum(1:1)', sheet).value).toBe(10);
			expect(createTerm('sum(A:D)', sheet).value).toBe(10);
		});
		it('should reflect changed max settings', () => {
			let sheet = new Sheet().load({ cells: { A1: 1, A2: 2, A3: 3, A4: 4 } });
			let colRange = createTerm('sum(A:A)', sheet);
			let rowRange = createTerm('sum(1:4)', sheet);
			expect(colRange.value).toBe(10);
			expect(rowRange.value).toBe(10);
			sheet.settings.maxrow = 2;
			expect(colRange.value).toBe(3);
			// this range is invalid now...
			expect(rowRange.value).toBe(FunctionErrors.code.REF);
			sheet = new Sheet().load({ cells: { A1: 1, B1: 2, C1: 3, D1: 4 } });
			colRange = createTerm('sum(A:D)', sheet);
			rowRange = createTerm('sum(1:1)', sheet);
			expect(colRange.value).toBe(10);
			expect(rowRange.value).toBe(10);
			sheet.settings.maxcol = 1;
			expect(rowRange.value).toBe(3);
			expect(colRange.value).toBe(FunctionErrors.code.REF);
		});
	});
	describe('isEqualTo', () => {
		it('should return TRUE if both ranges are equal', () => {
			expect(SheetRange.fromRangeStr('A1:Z10').isEqualTo(SheetRange.fromRangeStr('A1:Z10'))).toBe(true);
			expect(SheetRange.fromRangeStr('IF21:IF21').isEqualTo(SheetRange.fromRangeStr('IF21:IF21'))).toBe(true);
			expect(SheetRange.fromRangeStr('C1:C1').isEqualTo(SheetRange.fromRangeStr('C1:C1'))).toBe(true);
			expect(SheetRange.fromRangeStr('A:A').isEqualTo(SheetRange.fromRangeStr('A:A'))).toBe(true);
			expect(SheetRange.fromRangeStr('1:1').isEqualTo(SheetRange.fromRangeStr('1:1'))).toBe(true);
		});
		it('should return FALSE if both ranges are not equal', () => {
			expect(SheetRange.fromRangeStr('A1:Z10').isEqualTo(SheetRange.fromRangeStr('A1:Z11'))).toBe(false);
			expect(SheetRange.fromRangeStr('IF21:IF21').isEqualTo(SheetRange.fromRangeStr('IF21:IF22'))).toBe(false);
			expect(SheetRange.fromRangeStr('C1:C1').isEqualTo(SheetRange.fromRangeStr('D1:D1'))).toBe(false);
			expect(SheetRange.fromRangeStr('A:A').isEqualTo(SheetRange.fromRangeStr('A:B'))).toBe(false);
			expect(SheetRange.fromRangeStr('1:1').isEqualTo(SheetRange.fromRangeStr('1:2'))).toBe(false);
		});
	});
	describe('toString', () => {
		it('should return a string with capitalized columns', () => {
			expect(SheetRange.fromRangeStr('a1:a31').toString()).toBe('A1:A31');
			expect(SheetRange.fromRangeStr('aB1:Aw3').toString()).toBe('AB1:AW3');
			expect(SheetRange.fromRangeStr('if1:If3').toString()).toBe('IF1:IF3');
		});
		it('should support indices with $ characters', () => {
			expect(SheetRange.fromRangeStr('$A1:a31').toString()).toBe('$A1:A31');
			expect(SheetRange.fromRangeStr('A1:A$3').toString()).toBe('A1:A$3');
			expect(SheetRange.fromRangeStr('$B$2:$c$3').toString()).toBe('$B$2:$C$3');
		});
		it('should support row or column range', () => {
			expect(SheetRange.fromRangeStr('a:a').toString()).toBe('A:A');
			expect(SheetRange.fromRangeStr('1:1').toString()).toBe('1:1');
			expect(SheetRange.fromRangeStr('IF:if').toString()).toBe('IF:IF');
			expect(SheetRange.fromRangeStr('if:ZE').toString()).toBe('IF:ZE');
			expect(SheetRange.fromRangeStr('1:7').toString()).toBe('1:7');
		});
	});
});
