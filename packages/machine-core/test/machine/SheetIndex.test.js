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
const { SheetIndex } = require('../..');

// a SheetIndex has always a row >=1!!
beforeEach(() => {
	SheetIndex.PRE_COLUMNS = [];
});

describe('SheetIndex', () => {
	describe('create', () => {
		it('should create an index object for positive or negative rows', () => {
			let index = SheetIndex.create('A2');
			expect(index).toBeDefined();
			expect(index.row).toBe(2);
			expect(index.col).toBe(0);
			expect(index.toString()).toBe('A2');
			index = SheetIndex.create('AAX56');
			expect(index.row).toBe(56);
			expect(index.col).toBe(725);
			expect(index.toString()).toBe('AAX56');
			index = SheetIndex.create('B-3');
			expect(index).toBeDefined();
			expect(index.row).toBe(-3);
			expect(index.col).toBe(1);
			expect(index.toString()).toBe('B-3');
			index = SheetIndex.create(-45, 0);
			expect(index).toBeDefined();
			expect(index.row).toBe(-45);
			expect(index.col).toBe(0);
			expect(index.toString()).toBe('A-45');
		});
		it('should create an index object with specified pre columns', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			let index = SheetIndex.create('IF1');
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('IF1');
			index = SheetIndex.create('COMMENT1');
			expect(index.row).toBe(1);
			expect(index.col).toBe(-2);
			expect(index.toString()).toBe('COMMENT1');
			index = SheetIndex.create('-D1');
			expect(index.row).toBe(1);
			expect(index.col).toBe(-4);
			expect(index.toString()).toBe('-D1');
			index = SheetIndex.create('-C-2');
			expect(index.row).toBe(-2);
			expect(index.col).toBe(-3);
			expect(index.toString()).toBe('-C-2');
		});
		it('should create an instance for any numbers', () => {
			let index = SheetIndex.create(1, 0);
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(0);
			expect(index.toString()).toBe('A1');
			index = SheetIndex.create(-231, 703);
			expect(index).toBeDefined();
			expect(index.row).toBe(-231);
			expect(index.col).toBe(703);
			expect(index.toString()).toBe('AAB-231');
			// no pre columns defined so IF will be positive IF column!!
			index = SheetIndex.create(1, 239);
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(239);
			expect(index.toString()).toBe('IF1');
			index = SheetIndex.create(1, -3);
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(-3);
			expect(index.toString()).toBe('-C1');
		});
		it('should create an index with neg. columns if defined', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			let index = SheetIndex.create(1, -1);
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('IF1');
			index = SheetIndex.create(231, -2);
			expect(index).toBeDefined();
			expect(index.row).toBe(231);
			expect(index.col).toBe(-2);
			expect(index.toString()).toBe('COMMENT231');
			index = SheetIndex.create(231, -3);
			expect(index).toBeDefined();
			expect(index.row).toBe(231);
			expect(index.col).toBe(-3);
			expect(index.toString()).toBe('-C231');
			index = SheetIndex.create(231, -42);
			expect(index).toBeDefined();
			expect(index.row).toBe(231);
			expect(index.col).toBe(-42);
			expect(index.toString()).toBe('-AP231');
		});
		it('should support $ characters', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			let index = SheetIndex.create('$A1');
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(0);
			expect(index.toString()).toBe('$A1');
			index = SheetIndex.create('d$42');
			expect(index).toBeDefined();
			expect(index.row).toBe(42);
			expect(index.col).toBe(3);
			expect(index.toString()).toBe('D$42');
			index = SheetIndex.create('$C$23');
			expect(index).toBeDefined();
			expect(index.row).toBe(23);
			expect(index.col).toBe(2);
			expect(index.toString()).toBe('$C$23');
			index = SheetIndex.create('$if$2');
			expect(index).toBeDefined();
			expect(index.row).toBe(2);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('$IF$2');
			index = SheetIndex.create('cOmmENt$2');
			expect(index).toBeDefined();
			expect(index.row).toBe(2);
			expect(index.col).toBe(-2);
			expect(index.toString()).toBe('COMMENT$2');
			index = SheetIndex.create('$If5');
			expect(index).toBeDefined();
			expect(index.row).toBe(5);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('$IF5');
			index = SheetIndex.create('$-D$-5');
			expect(index).toBeDefined();
			expect(index.row).toBe(-5);
			expect(index.col).toBe(-4);
			expect(index.toString()).toBe('$-D$-5');
			index = SheetIndex.create('$-D-5');
			expect(index).toBeDefined();
			expect(index.row).toBe(-5);
			expect(index.col).toBe(-4);
			expect(index.toString()).toBe('$-D-5');
			index = SheetIndex.create('-D-5');
			expect(index).toBeDefined();
			expect(index.row).toBe(-5);
			expect(index.col).toBe(-4);
			expect(index.toString()).toBe('-D-5');
		});
		it('should return undefined if dollar characters are not used correctly', () => {
			expect(SheetIndex.create('$$A1')).toBeUndefined();
			expect(SheetIndex.create('A1$$')).toBeUndefined();
			expect(SheetIndex.create('A$$1')).toBeUndefined();
			expect(SheetIndex.create('$$A$$1')).toBeUndefined();
			expect(SheetIndex.create('$A$$1')).toBeUndefined();
		});
		it('should return undefined if passed string is invalid index', () => {
			expect(SheetIndex.create('_D5')).toBeUndefined();
			expect(SheetIndex.create('°E6')).toBeUndefined();
			expect(SheetIndex.create('^D5')).toBeUndefined();
			expect(SheetIndex.create('_5')).toBeUndefined();
			expect(SheetIndex.create('~5')).toBeUndefined();
			expect(SheetIndex.create('A')).toBeUndefined();
			expect(SheetIndex.create('A -1')).toBeUndefined();
			expect(SheetIndex.create('B - 23')).toBeUndefined();
		});
	});
	describe('copy', () => {
		it('should return new instance but with same values', () => {
			SheetIndex.PRE_COLUMNS.push('IF');
			let index = SheetIndex.create('A1');
			let copy = index.copy();
			expect(index !== copy).toBeTruthy();
			expect(index.isEqualTo(copy)).toBeTruthy();
			index = SheetIndex.create('IF13');
			copy = index.copy();
			expect(index !== copy).toBeTruthy();
			expect(index.isEqualTo(copy)).toBeTruthy();
			index = SheetIndex.create('-D-13');
			copy = index.copy();
			expect(index !== copy).toBeTruthy();
			expect(index.isEqualTo(copy)).toBeTruthy();
		});
		it('should ignore any $ characters', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			let index = SheetIndex.create('$A1').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(1);
			expect(index.col).toBe(0);
			expect(index.toString()).toBe('$A1');
			index = SheetIndex.create('d$42').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(42);
			expect(index.col).toBe(3);
			expect(index.toString()).toBe('D$42');
			index = SheetIndex.create('$C$23').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(23);
			expect(index.col).toBe(2);
			expect(index.toString()).toBe('$C$23');
			index = SheetIndex.create('$if$2').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(2);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('$IF$2');
			index = SheetIndex.create('cOmmENt$2').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(2);
			expect(index.col).toBe(-2);
			expect(index.toString()).toBe('COMMENT$2');
			index = SheetIndex.create('$If5').copy();
			expect(index).toBeDefined();
			expect(index.row).toBe(5);
			expect(index.col).toBe(-1);
			expect(index.toString()).toBe('$IF5');
			index = SheetIndex.create('$-S$-5').copy();
			const copy = index.copy();
			expect(index !== copy).toBeTruthy();
			expect(index.isEqualTo(copy)).toBeTruthy();
		});
	});
	describe('isEqualTo', () => {
		it('should return true for same index instance', () => {
			SheetIndex.PRE_COLUMNS.push('IF');
			let index = SheetIndex.create('A1');
			expect(index.isEqualTo(index)).toBeTruthy();
			index = SheetIndex.create('IF1');
			expect(index.isEqualTo(index)).toBeTruthy();
		});
		it('should return true for different index instances but same values', () => {
			SheetIndex.PRE_COLUMNS.push('IF');
			let index1 = SheetIndex.create('A1');
			let index2 = SheetIndex.create('A1');
			expect(index1 !== index2).toBeTruthy();
			expect(index1.isEqualTo(index2)).toBeTruthy();
			index1 = SheetIndex.create('IF1');
			index2 = SheetIndex.create('IF1');
			expect(index1 !== index2).toBeTruthy();
			expect(index1.isEqualTo(index2)).toBeTruthy();
		});
		it('should return false for different index instances with different values', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			let index1 = SheetIndex.create('A1');
			let index2 = SheetIndex.create('A10');
			expect(index1 !== index2).toBeTruthy();
			expect(index1.isEqualTo(index2)).toBeFalsy();
			index1 = SheetIndex.create('IF1');
			index2 = SheetIndex.create('COMMENT1');
			expect(index1 !== index2).toBeTruthy();
			expect(index1.isEqualTo(index2)).toBeFalsy();
		});
	});
	describe('set', () => {
		it('should work with row and column numbers to change an index', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			const index = SheetIndex.create('A2');
			expect(index.set(3, 1)).toBeTruthy();
			expect(index.toString()).toBe('B3');
			expect(index.set(1, -1)).toBeTruthy();
			expect(index.toString()).toBe('IF1');
			expect(index.set(1, -2)).toBeTruthy();
			expect(index.toString()).toBe('COMMENT1');
			expect(index.set(1, -3)).toBeTruthy();
			expect(index.toString()).toBe('-C1');
		});
		it('should work with only row number to change an index', () => {
			const index = SheetIndex.create('B3');
			expect(index.set(1)).toBeTruthy();
			expect(index.toString()).toBe('B1');
			expect(index.set(6)).toBeTruthy();
			expect(index.toString()).toBe('B6');
			expect(index.set(-42)).toBeTruthy();
			expect(index.toString()).toBe('B-42');
		});
		it('should support a string parameter to change an index', () => {
			SheetIndex.PRE_COLUMNS.push('COMMENT');
			const index = SheetIndex.create('ZZ13');
			expect(index.set('A1')).toBeTruthy();
			expect(index.toString()).toBe('A1');
			expect(index.set('COMMENT1')).toBeTruthy();
			expect(index.toString()).toBe('COMMENT1');
			expect(index.set('-D-0')).toBeTruthy();
			expect(index.toString()).toBe('-D0');
		});
		it('should change an index if row or column is negative', () => {
			const index = SheetIndex.create('C23');
			expect(index.set(0)).toBeTruthy();
			expect(index.toString()).toBe('C0');
			expect(index.set(-1)).toBeTruthy();
			expect(index.toString()).toBe('C-1');
			expect(index.set(-1, -42)).toBeTruthy();
			expect(index.toString()).toBe('-AP-1');
			expect(index.set('A0')).toBeTruthy();
			expect(index.toString()).toBe('A0');
		});
	});
	describe('columnAsStr', () => {
		test('with pos. column numbers', () => {
			expect(SheetIndex.columnAsStr(0)).toBe('A');
			expect(SheetIndex.columnAsStr(25)).toBe('Z');
			expect(SheetIndex.columnAsStr(26)).toBe('AA');
			expect(SheetIndex.columnAsStr(27)).toBe('AB');
			expect(SheetIndex.columnAsStr(51)).toBe('AZ');
			expect(SheetIndex.columnAsStr(52)).toBe('BA');
			expect(SheetIndex.columnAsStr(77)).toBe('BZ');
			expect(SheetIndex.columnAsStr(676)).toBe('ZA');
			expect(SheetIndex.columnAsStr(701)).toBe('ZZ');
			expect(SheetIndex.columnAsStr(702)).toBe('AAA');
			expect(SheetIndex.columnAsStr(18252)).toBe('ZZA');
			expect(SheetIndex.columnAsStr(18277)).toBe('ZZZ');
		});
		test('with neg. column numbers', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'COMMENT'];
			expect(SheetIndex.columnAsStr(-1)).toBe('IF');
			expect(SheetIndex.columnAsStr(-2)).toBe('COMMENT');
			expect(SheetIndex.columnAsStr(-3)).toBe('-C');
			expect(SheetIndex.columnAsStr(-27)).toBe('-AA');
			expect(SheetIndex.columnAsStr(-28)).toBe('-AB');
			expect(SheetIndex.columnAsStr(-52)).toBe('-AZ');
			expect(SheetIndex.columnAsStr(-53)).toBe('-BA');
			expect(SheetIndex.columnAsStr(-78)).toBe('-BZ');
			expect(SheetIndex.columnAsStr(-677)).toBe('-ZA');
			expect(SheetIndex.columnAsStr(-702)).toBe('-ZZ');
			expect(SheetIndex.columnAsStr(-703)).toBe('-AAA');
			expect(SheetIndex.columnAsStr(-18253)).toBe('-ZZA');
			expect(SheetIndex.columnAsStr(-18278)).toBe('-ZZZ');
		});
		test('with custom neg. columns', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'MARKER'];
			expect(SheetIndex.columnAsStr(-1)).toBe('IF');
			expect(SheetIndex.columnAsStr(-2)).toBe('MARKER');
			expect(SheetIndex.columnAsStr(-3)).toBe('-C');
			expect(SheetIndex.columnAsStr(-18278)).toBe('-ZZZ');
		});
	});
	describe('columnAsNr', () => {
		test('with pos. columns', () => {
			expect(SheetIndex.columnAsNr('A')).toBe(0);
			expect(SheetIndex.columnAsNr('Z')).toBe(25);
			expect(SheetIndex.columnAsNr('AA')).toBe(26);
			expect(SheetIndex.columnAsNr('AB')).toBe(27);
			expect(SheetIndex.columnAsNr('AZ')).toBe(51);
			expect(SheetIndex.columnAsNr('BA')).toBe(52);
			expect(SheetIndex.columnAsNr('BZ')).toBe(77);
			expect(SheetIndex.columnAsNr('ZA')).toBe(676);
			expect(SheetIndex.columnAsNr('ZZ')).toBe(701);
			expect(SheetIndex.columnAsNr('AAA')).toBe(702);
			expect(SheetIndex.columnAsNr('ZZA')).toBe(18252);
			expect(SheetIndex.columnAsNr('ZZZ')).toBe(18277);
		});
		test('with neg. column numbers', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'MARKER'];
			expect(SheetIndex.columnAsNr('IF')).toBe(-1);
			expect(SheetIndex.columnAsNr('MARKER')).toBe(-2);
			expect(SheetIndex.columnAsNr('-AA')).toBe(-27);
			expect(SheetIndex.columnAsNr('-AB')).toBe(-28);
			expect(SheetIndex.columnAsNr('-AZ')).toBe(-52);
			expect(SheetIndex.columnAsNr('-BA')).toBe(-53);
			expect(SheetIndex.columnAsNr('-BZ')).toBe(-78);
			expect(SheetIndex.columnAsNr('-ZA')).toBe(-677);
			expect(SheetIndex.columnAsNr('-ZZ')).toBe(-702);
			expect(SheetIndex.columnAsNr('-AAA')).toBe(-703);
			expect(SheetIndex.columnAsNr('-ZZA')).toBe(-18253);
			expect(SheetIndex.columnAsNr('-ZZZ')).toBe(-18278);
		});
		test('with custom neg. columns', () => {
			SheetIndex.PRE_COLUMNS = ['IF', 'MARKER'];
			expect(SheetIndex.columnAsNr('IF')).toBe(-1);
			expect(SheetIndex.columnAsNr('If')).toBe(-1);
			expect(SheetIndex.columnAsNr('MARKER')).toBe(-2);
			expect(SheetIndex.columnAsNr('MarkER')).toBe(-2);
			expect(SheetIndex.columnAsNr('-C')).toBe(-3);
			expect(SheetIndex.columnAsNr('-ZZZ')).toBe(-18278);
		});
	});
	describe('absolute index', () => {
		it('should be possible to create an absolute index', () => {
			let index = SheetIndex.create('$B$1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(true);
			expect(index.isRowAbsolute).toBe(true);
			expect(index.col).toBe(1);
			expect(index.row).toBe(1);
			expect(index.toString()).toBe('$B$1');
			index = SheetIndex.create('$-B$-1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(true);
			expect(index.isRowAbsolute).toBe(true);
			expect(index.col).toBe(-2);
			expect(index.row).toBe(-1);
			expect(index.toString()).toBe('$-B$-1');
		});
		it('should be possible to combine absolute row and/or column', () => {
			let index = SheetIndex.create('$B1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(true);
			expect(index.isRowAbsolute).toBe(false);
			expect(index.col).toBe(1);
			expect(index.row).toBe(1);
			expect(index.toString()).toBe('$B1');
			index = SheetIndex.create('B$1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(false);
			expect(index.isRowAbsolute).toBe(true);
			expect(index.col).toBe(1);
			expect(index.row).toBe(1);
			expect(index.toString()).toBe('B$1');
			index = SheetIndex.create('$-B1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(true);
			expect(index.isRowAbsolute).toBe(false);
			expect(index.col).toBe(-2);
			expect(index.row).toBe(1);
			expect(index.toString()).toBe('$-B1');
			index = SheetIndex.create('B$-1');
			expect(index).toBeDefined();
			expect(index.isColAbsolute).toBe(false);
			expect(index.isRowAbsolute).toBe(true);
			expect(index.col).toBe(1);
			expect(index.row).toBe(-1);
			expect(index.toString()).toBe('B$-1');
		});
	});
});
