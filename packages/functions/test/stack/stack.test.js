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
const { functions: { pipe } } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, Machine, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../utilities');
const SHEET = require('../_data/sheets.json');

const ERROR = FunctionErrors.code;
const STACKRANGE_SHEET = SHEET.STACKRANGE;

let sheet;
beforeEach(() => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	sheet = streamsheet.sheet;
	sheet.settings.maxrow = 100;
	sheet.load({ cells: STACKRANGE_SHEET });
});


const insert = (index, formula, expected = true) => (_sheet) => {
	createCellAt(index, { formula }, _sheet);
	expect(_sheet.cellAt(index).value).toBe(expected);
	return _sheet;
};
const remove = (...indices) => (_sheet) => {
	indices.forEach(index => _sheet.setCellAt(index, undefined));
	return _sheet;
};
const step = (_sheet) => {
	_sheet.streamsheet.step();
	return _sheet;
};
const expectAt = (index, expected) => (_sheet) => {
	expect(_sheet.cellAt(index).value).toBe(expected);
	return _sheet;
};


describe('stack functions', () => {
	// DL-1340: new requirement!!
	describe('stack add', () => {
		describe('stack add at bottom', () => {
			it('should append new rows at bottom by default or direction is set to true', () => {
				pipe(insert('K1', 'stackadd(A10:C12,A1:C2)'), step)(sheet);
				// check if row was added at last position:
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				// once again:
				sheet.streamsheet.step();
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// once again with different values
				sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
				sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
				sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
				sheet.streamsheet.step();
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
				// once again with different values
				sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A2));
				sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B2));
				sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C2));
				sheet.streamsheet.step();
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// finally check that stack labels and rows below range are not moved or changed!!
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A13')).toBeUndefined();
				expect(sheet.cellAt('B13')).toBeUndefined();
				expect(sheet.cellAt('C13')).toBeUndefined();
			});
			it('should not exceed range if adding multiple rows', () => {
				pipe(insert('K1', 'stackadd(A10:C13,A1:C3)'), step)(sheet);
				// check header:
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				// check if row was added at last position:
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
				// add once again:
				sheet.streamsheet.step();
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C3);
				// row after range must be untouched...
				expect(sheet.cellAt('A14')).toBeUndefined();
				expect(sheet.cellAt('B14')).toBeUndefined();
				expect(sheet.cellAt('C14')).toBeUndefined();
			});
			it('should drop rows from the top if stack is full and new rows are added at bottom by default', () => {
				pipe(insert('K1', 'stackadd(A10:C12,A1:C3)'), step)(sheet);
				// check stackrange is filled as expected:
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
				// now add one row again => first row must be dropped
				pipe(insert('K1', 'stackadd(A10:C12,A1:C2)'), step)(sheet);
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// add one row again => first row must be dropped
				sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
				sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
				sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
				sheet.streamsheet.step();
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
				// finally check that rows below range are not moved or changed!!
				expect(sheet.cellAt('A30').value).toBe('A30');
				expect(sheet.cellAt('B30').value).toBe('B30');
				expect(sheet.cellAt('C30').value).toBe('C30');
			});
			it('should be possible to add rows with different sorting', () => {
				pipe(insert('K1', 'stackadd(A10:C12,A5:C8)'), step)(sheet);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.C7);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.A7);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.B7);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.C8);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.A8);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.B8);
			});
		});
		describe('stack add at top', () => {
			it('should append new rows at top if direction is set to false', () => {
				pipe(insert('K1', 'stackadd(A10:C12,A1:C2,false)'), step)(sheet);
				// ensure labels are not changed:
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				// check if row was added at last position:
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				// add next row:
				sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
				sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
				sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
				sheet.streamsheet.step();
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				// check if row was added:
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// finally check that rows below range are not moved or changed!!
				expect(sheet.cellAt('A30').value).toBe('A30');
				expect(sheet.cellAt('B30').value).toBe('B30');
				expect(sheet.cellAt('C30').value).toBe('C30');
			});
			it('should drop rows from the bottom if stack is full and new rows are added at top', () => {
				pipe(insert('K1', 'stackadd(A10:C12,A1:C3,false)'), step)(sheet);
				// check stackrange is filled as expected:
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// now add one row again => first row must be dropped
				pipe(insert('K1', 'stackadd(A10:C12,A1:C2,false)'), step)(sheet);
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
				// add one row again => first row must be dropped
				sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
				sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
				sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
				sheet.streamsheet.step();
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// finally check that rows below range are not moved or changed!!
				expect(sheet.cellAt('A30').value).toBe('A30');
				expect(sheet.cellAt('B30').value).toBe('B30');
				expect(sheet.cellAt('C30').value).toBe('C30');
			});
			// DL-2960
			it(`should return ${ERROR.VALUE} if direction parameter is not a boolean`, () => {
				expect(createTerm('stackadd(A10:C12, A1:C2, 0)', sheet).value).toBe(ERROR.VALUE);
				expect(createTerm('stackadd(A10:C12, A1:C2, 1)', sheet).value).toBe(ERROR.VALUE);
				expect(createTerm('stackadd(A10:C12, A1:C2, "")', sheet).value).toBe(ERROR.VALUE);
				expect(createTerm('stackadd(A10:C12, A1:C2, "false")', sheet).value).toBe(ERROR.VALUE);
				expect(createTerm('stackadd(A10:C12, A1:C2, "true")', sheet).value).toBe(ERROR.VALUE);
				// none given => default value
				pipe(insert('K1', 'stackadd(A10:C12, A1:C2)'), step, expectAt('K1', true))(sheet);
				pipe(insert('K1', 'stackadd(A10:C12, A1:C2, )'), step, expectAt('K1', true))(sheet);
			});
		});
		describe('stack add with drop to target', () => {
			it('should copy dropped row to a specified target', () => {
				// fill stackrange:
				pipe(insert('K1', 'stackadd(A10:C12, A1:C3, true)'), step, expectAt('K1', true), remove('K1'))(sheet);
				// now add another row, with specified target range
				pipe(insert('K1', 'stackadd(A10:C12, A1:C2, true, A31:C33)'), step, expectAt('K1', true), remove('K1'))(sheet);
				sheet.streamsheet.step();
				expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
				expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
				expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
				// check target range:
				expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
				// finally check that rows below range are not moved or changed!!
				expect(sheet.cellAt('A30').value).toBe('A30');
				expect(sheet.cellAt('B30').value).toBe('B30');
				expect(sheet.cellAt('C30').value).toBe('C30');
			});
			it('should leave not matching target cells undefined', () => {
				// fill stackrange:
				pipe(insert('K1', 'stackadd(A10:C12, A1:C3, true)'), step, expectAt('K1', true), remove('K1'))(sheet);
				// now add another row, with specified target range
				pipe(insert('K1', 'stackadd(A10:C12, A1:C2, true, A40:F43)'), step, expectAt('K1', true), remove('K1'))(sheet);
				sheet.streamsheet.step();
				// check target range:
				expect(sheet.cellAt('A40').value).toBe(STACKRANGE_SHEET.A40);
				expect(sheet.cellAt('B40')).toBeUndefined();
				expect(sheet.cellAt('C40').value).toBe(STACKRANGE_SHEET.C40);
				expect(sheet.cellAt('D40')).toBeUndefined();
				expect(sheet.cellAt('E40')).toBeUndefined();
				expect(sheet.cellAt('F40').value).toBe(STACKRANGE_SHEET.F40);
				expect(sheet.cellAt('A41').value).toBe(STACKRANGE_SHEET.C2);
				expect(sheet.cellAt('B41')).toBeUndefined();
				expect(sheet.cellAt('C41').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('D41')).toBeUndefined();
				expect(sheet.cellAt('E41')).toBeUndefined();
				expect(sheet.cellAt('F41').value).toBe(STACKRANGE_SHEET.B2);
			});
			it('should be possible to add rows with different sorting and drop if full', () => {
				// insertAt(sheet, 'K1', 'stackadd', 'A10:C12', 'A5:C8', true, 'A31:C33');
				pipe(insert('K1', 'stackadd(A10:C12, A5:C8, true, A31:C33)'), step, expectAt('K1', true))(sheet);
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.C7);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.A7);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.B7);
				expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.C8);
				expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.A8);
				expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.B8);
				expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.B6);
				expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.C6);
				expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.A6);
			});
		});
		describe('stack add errors', () => {
			// DL-1285
			it(`should return ${ERROR.NAME} for invalid ranges`, () => {
				const ERR = ERROR.NAME;
				pipe(insert('K1', 'stackadd(P2!A10:P2!C12, A2:C2)', ERR), step, expectAt('K1', ERR))(sheet);
				pipe(insert('K1', 'stackadd(A10:C12, P2!A2:P2!C2)', ERR), step, expectAt('K1', ERR))(sheet);
			});
		});
	});
	describe('stack drop', () => {
		it('should drop row at specified position', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C12, A1:C3)'), step, remove('K1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			// drop second row
			pipe(insert('L1', 'stackdrop(A10:C12, 2)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C12, 1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should move rows below dropped row up', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop second row
			pipe(insert('L1', 'stackdrop(A10:C13, 2)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C13, 1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should drop first row if position is 1 or not defined', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			pipe(insert('L1', 'stackdrop(A10:C13)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C13, 1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C13)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should drop last row if position is 0', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should copy dropped row to specified target', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop first row:
			pipe(insert('L1', 'stackdrop(A10:C13, 1, A31:C32)'), step, expectAt('L1', true))(sheet);
			// check target range:
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			// drop again:
			pipe(insert('L1', 'stackdrop(A10:C13, 1, A31:C32)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B3);
			// drop again without target, leaving target unchanged:
			pipe(insert('L1', 'stackdrop(A10:C13, 1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B3);
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		// DL-1021: drop all rows on -1
		it('should drop alls rows if -1 is specified', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop all rows:
			pipe(insert('L1', 'stackdrop(A10:C13, -1)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// drop again => should not remove header
			pipe(insert('L1', 'stackdrop(A10:C13, -1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should drop alls rows if -1 is specified even if range is larger', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop all rows:
			pipe(insert('L1', 'stackdrop(A10:C15, -1)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// drop again => should not remove header
			pipe(insert('L1', 'stackdrop(A10:C15, -1)'), step, expectAt('L1', true))(sheet);
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should copy all dropped rows to specified target', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop all rows:
			pipe(insert('L1', 'stackdrop(A10:C13, -1, A31:C34)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// check target...
			expect(sheet.cellAt('A31').value).toBe(STACKRANGE_SHEET.A31);
			expect(sheet.cellAt('B31').value).toBe(STACKRANGE_SHEET.B31);
			expect(sheet.cellAt('C31').value).toBe(STACKRANGE_SHEET.C31);
			// note that cells are inserted accourding to defined header
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B33').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C33').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('A34').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B34').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C34').value).toBe(STACKRANGE_SHEET.B2);
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		// DL-1021: keep header row on consecutive drops with 0
		it('should not drop header row on consecutive drops with 0', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C2)'), step, remove('K1'))(sheet);
			// drop last row:
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// drop 2x last row:
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// drop 2x again:
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackdrop(A10:C13, 0)'), step, expectAt('L1', true))(sheet);
			// first row should be untouched
			expect(sheet.cellAt('A10').value).toBe(STACKRANGE_SHEET.A10);
			expect(sheet.cellAt('B10').value).toBe(STACKRANGE_SHEET.B10);
			expect(sheet.cellAt('C10').value).toBe(STACKRANGE_SHEET.C10);
		});
		// DL-1440
		it('should return an error if defined target range is invalid', () => {
			expect(createTerm('stackdrop(A10:C13, B16:C17, false)', sheet).value).toBe(ERROR.VALUE);
		});
		// DL-2026
		it('should not dispose moved cells', () => {
			const t1 = new StreamSheet();
			const aSheet = t1.sheet;
			const machine = new Machine();
			machine.addStreamSheet(t1);
			aSheet.loadCells({
				A1: 'Part', B1: 'Quantity', C1: 'Total',
				A2: 2, B2: 5, C2: { formula: 'A2*B2' },
				A3: 3, B3: 6, C3: { formula: 'A3*B3' },
				A4: 4, B4: 7, C4: { formula: 'A4*B4' },
				A5: 5, B5: 8, C5: { formula: 'A5*B5' },
				A6: { formula: 'stackdrop(A1:C5, 1)' }
			});
			t1.step();
			// one row is dropped after cell load, due to A6
			expect(aSheet.cellAt('C2').value).toBe(18);
			expect(aSheet.cellAt('C3').value).toBe(28);
			expect(aSheet.cellAt('C4').value).toBe(40);
			expect(aSheet.cellAt('C5')).toBeUndefined();
			// IMPORTANT: use step to evaluate cell values!!!
			t1.step();
			// formula are not touched so...
			expect(aSheet.cellAt('C2').value).toBe(40);
			expect(aSheet.cellAt('C3').value).toBe(0);
			expect(aSheet.cellAt('C4')).toBeUndefined();
			t1.step();
			expect(aSheet.cellAt('C2').value).toBe(0);
			expect(aSheet.cellAt('C3')).toBeUndefined();
			t1.step();
			expect(aSheet.cellAt('C2')).toBeUndefined();
		});
	});
	describe('stack find', () => {
		it('should find a row in stackrange depending on criteriarange', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C12, A1:C3)'), step, remove('K1'))(sheet);
			// find at least one row with clicktype
			pipe(insert('L1', 'stackfind(A10:C12, A60:A61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C12, A60:A62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C12, B60:B61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C12, B60:B62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C12, C60:C61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C12, C60:C62)'), step, expectAt('L1', true))(sheet);
			// no match...
			pipe(insert('L1', 'stackfind(A10:C12, A64:C65)'), step, expectAt('L1', false))(sheet);
		});
		it('should treat values on same criteriarange row as an AND condition', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C11, A1:C2)'), step, remove('K1'))(sheet);
			// should find at least one row...
			pipe(insert('L1', 'stackfind(A10:C11, A60:A61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:B61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C61)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:A62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:B62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C62)'), step, expectAt('L1', true))(sheet);
			// fill stackrange:
			sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
			sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
			sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
			pipe(insert('K1', 'stackadd(A10:C11, A1:C2)'), step, remove('K1'))(sheet);
			// should find at least one row...
			pipe(insert('L1', 'stackfind(A10:C11, A60:A62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:B62)'), step, expectAt('L1', true))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C62)'), step, expectAt('L1', true))(sheet);
			// no match:
			pipe(insert('L1', 'stackfind(A10:C11, A60:A61)'), step, expectAt('L1', false))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:B61)'), step, expectAt('L1', false))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C61)'), step, expectAt('L1', false))(sheet);
		});
		it('should treat values on different criteriarange rows as an OR condition', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C11, A1:C2)'), step, remove('K1'))(sheet);
			// match:
			pipe(insert('L1', 'stackfind(A10:C11, A60:C62)'), step, expectAt('L1', true))(sheet);
			// fill stackrange:
			sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
			sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
			sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
			pipe(insert('K1', 'stackadd(A10:C11, A1:C2)'), step, remove('K1'))(sheet);
			// match:
			expect(createTerm('stackfind(A10:C11, A60:C62)', sheet).value).toBe(true);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C62)'), step, expectAt('L1', true))(sheet);
			// no match:
			pipe(insert('L1', 'stackfind(A10:C11, A60:A61)'), step, expectAt('L1', false))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:B61)'), step, expectAt('L1', false))(sheet);
			pipe(insert('L1', 'stackfind(A10:C11, A60:C61)'), step, expectAt('L1', false))(sheet);
		});
		it('should copy matching row from stackrange to target range if set', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C12, A1:C3)'), step, remove('K1'))(sheet);
			// should copy a single row to target
			pipe(insert('L1', 'stackfind(A10:C12, A60:A61, A31:C33)'), step, expectAt('L1', true))(sheet);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
			// should copy only first of two rows to target
			pipe(insert('L1', 'stackfind(A10:C12, A60:C62, A31:C32)'), step, expectAt('L1', true))(sheet);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
			// should copy two rows to target
			pipe(insert('L1', 'stackfind(A10:C12, A60:C62, A31:C33)'), step, expectAt('L1', true))(sheet);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B33').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C33').value).toBe(STACKRANGE_SHEET.B3);
			// no match => target is cleared
			pipe(insert('L1', 'stackfind(A10:C12, A64:C65, A31:C33)'), step, expectAt('L1', false))(sheet);
			expect(sheet.cellAt('A32')).toBeUndefined();
			expect(sheet.cellAt('B32')).toBeUndefined();
			expect(sheet.cellAt('C32')).toBeUndefined();
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
		});
		it('should drop matching row from stackrange if drop parameter is set', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13, A1:C4)'), step, remove('K1'))(sheet);
			// should drop a single row
			pipe(insert('L1', 'stackfind(A10:C13, A60:A61,, true)'), step, expectAt('L1', true))(sheet);
			// check stack range -> below rows must move up
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B4);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C4);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// should drop a single row
			pipe(insert('L1', 'stackfind(A10:C13, C60:C62,, true)'), step, expectAt('L1', true))(sheet);
			// check stack range
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B4);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C4);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			pipe(insert('L1', 'stackfind(A10:C13,A60:A62,,true)'), step, expectAt('L1', true))(sheet);
			// check stack range
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// fill stackrange again:
			pipe(remove('L1'), insert('K1', 'stackadd(A10:C13, A1:C4)'), step, remove('K1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop two first rows
			pipe(insert('L1', 'stackfind(A10:C13,A60:C62,,true)'), step, expectAt('L1', true))(sheet);
			// check stack range
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B4);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C4);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// fill stackrange again:
			pipe(remove('L1'), insert('K1', 'stackadd(A10:C13, A1:C4)'), step, remove('K1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop all rows
			pipe(insert('L1', 'stackfind(A10:C13,A60:A62,,true)'), step, expectAt('L1', true))(sheet);
			// check stack range
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// fill stackrange again:
			// expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			pipe(remove('L1'), insert('K1', 'stackadd(A10:C13,A1:C4)'), step, remove('K1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop no rows
			// expect(createTerm('stackfind(A10:C13, A64:C65,, true)', sheet).value).toBe(false);
			pipe(insert('L1', 'stackfind(A10:C13,A64:C65,,true)'), step, expectAt('L1', false))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B4);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
		});
		it('should copy dropped matching row to specified target', () => {
			// fill stackrange:
			// expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			pipe(insert('K1', 'stackadd(A10:C13, A1:C4)'), step, remove('K1'))(sheet);
			// should drop a single row to target range:
			// expect(createTerm('stackfind(A10:C13, A60:A61, A40:F41, true)', sheet).value).toBe(true);
			pipe(insert('L1', 'stackfind(A10:C13, A60:A61, A40:F41, true)'), step, expectAt('L1', true))(sheet);
			// check stack range -> below rows must move up
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B4);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C4);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// check target range:
			expect(sheet.cellAt('A41').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B41')).toBeUndefined();
			expect(sheet.cellAt('C41').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('D41')).toBeUndefined();
			expect(sheet.cellAt('E41')).toBeUndefined();
			expect(sheet.cellAt('F41').value).toBe(STACKRANGE_SHEET.B2);
			// expect(createTerm('stackfind(A10:C13, A60:A62, A40:F42, true)', sheet).value).toBe(true);
			pipe(insert('L1', 'stackfind(A10:C13, A60:A62, A40:F42, true)'), step, expectAt('L1', true))(sheet);
			// check stack range
			expect(sheet.cellAt('A11')).toBeUndefined();
			expect(sheet.cellAt('B11')).toBeUndefined();
			expect(sheet.cellAt('C11')).toBeUndefined();
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			// check target range:
			expect(sheet.cellAt('A41').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B41')).toBeUndefined();
			expect(sheet.cellAt('C41').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('D41')).toBeUndefined();
			expect(sheet.cellAt('E41')).toBeUndefined();
			expect(sheet.cellAt('F41').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('A42').value).toBe(STACKRANGE_SHEET.C4);
			expect(sheet.cellAt('B42')).toBeUndefined();
			expect(sheet.cellAt('C42').value).toBe(STACKRANGE_SHEET.A4);
			expect(sheet.cellAt('D42')).toBeUndefined();
			expect(sheet.cellAt('E42')).toBeUndefined();
			expect(sheet.cellAt('F42').value).toBe(STACKRANGE_SHEET.B4);
		});
		describe('unique parameter', () => {			
			it('should copy only first matching row', () => {
				// fill stackrange:
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				// find all with single clicktype:
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71, A90:B99)'), step, expectAt('L1', true), remove('L1'))(sheet);
				// check target range:
				expect(sheet.cellAt('A91').value).toBe(STACKRANGE_SHEET.B71);
				expect(sheet.cellAt('B91').value).toBe(STACKRANGE_SHEET.A71);
				expect(sheet.cellAt('A92').value).toBe(STACKRANGE_SHEET.B74);
				expect(sheet.cellAt('B92').value).toBe(STACKRANGE_SHEET.A74);
				expect(sheet.cellAt('A93').value).toBe(STACKRANGE_SHEET.B75);
				expect(sheet.cellAt('B93').value).toBe(STACKRANGE_SHEET.A75);
				expect(sheet.cellAt('A94').value).toBe(STACKRANGE_SHEET.B76);
				expect(sheet.cellAt('B94').value).toBe(STACKRANGE_SHEET.A76);
				expect(sheet.cellAt('A95')).toBeUndefined();
				expect(sheet.cellAt('B95')).toBeUndefined();
				// fill stack again and copy only unique ones...
				pipe(insert('K1', 'stackdrop(A80:B89, -1)'), step, remove('K1'))(sheet);
				pipe(insert('K1', 'stackdrop(A90:B99, -1)'), step, remove('K1'))(sheet);
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71, A90:B99,,true)'), step, expectAt('L1', true))(sheet);
				// check target range:
				expect(sheet.cellAt('A91').value).toBe(STACKRANGE_SHEET.B71);
				expect(sheet.cellAt('B91').value).toBe(STACKRANGE_SHEET.A71);
				expect(sheet.cellAt('A92').value).toBe(STACKRANGE_SHEET.B75);
				expect(sheet.cellAt('B92').value).toBe(STACKRANGE_SHEET.A75);
				expect(sheet.cellAt('A93')).toBeUndefined();
				expect(sheet.cellAt('B93')).toBeUndefined();
				expect(sheet.cellAt('A94')).toBeUndefined();
				expect(sheet.cellAt('B94')).toBeUndefined();
			});
			it('should drop only first matching row', () => {
				// fill stackrange:
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				// find and drop all with single clicktype:
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71,,true)'), step, expectAt('L1', true), remove('L1'))(sheet);
				// check stack range:
				expect(sheet.cellAt('A81').value).toBe(STACKRANGE_SHEET.A72);
				expect(sheet.cellAt('B81').value).toBe(STACKRANGE_SHEET.B72);
				expect(sheet.cellAt('A82').value).toBe(STACKRANGE_SHEET.A73);
				expect(sheet.cellAt('B82').value).toBe(STACKRANGE_SHEET.B73);
				expect(sheet.cellAt('A83')).toBeUndefined();
				expect(sheet.cellAt('B83')).toBeUndefined();
				expect(sheet.cellAt('A84')).toBeUndefined();
				expect(sheet.cellAt('B84')).toBeUndefined();
				expect(sheet.cellAt('A85')).toBeUndefined();
				expect(sheet.cellAt('B85')).toBeUndefined();
				// fill stack again and drop only unique ones...
				pipe(insert('K1', 'stackdrop(A80:B89, -1)'), step, remove('K1'))(sheet);
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71,,true,true)'), step, expectAt('L1', true), remove('L1'))(sheet);
				expect(sheet.cellAt('A81').value).toBe(STACKRANGE_SHEET.A72);
				expect(sheet.cellAt('B81').value).toBe(STACKRANGE_SHEET.B72);
				expect(sheet.cellAt('A82').value).toBe(STACKRANGE_SHEET.A73);
				expect(sheet.cellAt('B82').value).toBe(STACKRANGE_SHEET.B73);
				expect(sheet.cellAt('A83').value).toBe(STACKRANGE_SHEET.A74);
				expect(sheet.cellAt('B83').value).toBe(STACKRANGE_SHEET.B74);
				expect(sheet.cellAt('A84').value).toBe(STACKRANGE_SHEET.A76);
				expect(sheet.cellAt('B84').value).toBe(STACKRANGE_SHEET.B76);
				expect(sheet.cellAt('A85')).toBeUndefined();
				expect(sheet.cellAt('B85')).toBeUndefined();
				expect(sheet.cellAt('A86')).toBeUndefined();
				expect(sheet.cellAt('B86')).toBeUndefined();
			});
			it('should copy and drop only first matching row', () => {
				// fill stackrange:
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				// find and drop all with single clicktype:
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71, A90:B99,true)'), step, expectAt('L1', true), remove('L1'))(sheet);
				// check stack range:
				expect(sheet.cellAt('A81').value).toBe(STACKRANGE_SHEET.A72);
				expect(sheet.cellAt('B81').value).toBe(STACKRANGE_SHEET.B72);
				expect(sheet.cellAt('A82').value).toBe(STACKRANGE_SHEET.A73);
				expect(sheet.cellAt('B82').value).toBe(STACKRANGE_SHEET.B73);
				expect(sheet.cellAt('A83')).toBeUndefined();
				expect(sheet.cellAt('B83')).toBeUndefined();
				// check target range:
				expect(sheet.cellAt('A91').value).toBe(STACKRANGE_SHEET.B71);
				expect(sheet.cellAt('B91').value).toBe(STACKRANGE_SHEET.A71);
				expect(sheet.cellAt('A92').value).toBe(STACKRANGE_SHEET.B74);
				expect(sheet.cellAt('B92').value).toBe(STACKRANGE_SHEET.A74);
				expect(sheet.cellAt('A93').value).toBe(STACKRANGE_SHEET.B75);
				expect(sheet.cellAt('B93').value).toBe(STACKRANGE_SHEET.A75);
				expect(sheet.cellAt('A94').value).toBe(STACKRANGE_SHEET.B76);
				expect(sheet.cellAt('B94').value).toBe(STACKRANGE_SHEET.A76);
				expect(sheet.cellAt('A95')).toBeUndefined();
				expect(sheet.cellAt('B95')).toBeUndefined();
				// fill stack again and drop only unique ones...
				pipe(insert('K1', 'stackdrop(A80:B89, -1)'), step, remove('K1'))(sheet);
				pipe(insert('K1', 'stackdrop(A90:B99, -1)'), step, remove('K1'))(sheet);
				pipe(insert('K1', 'stackadd(A80:B89, A70:B79)'), step, remove('K1'))(sheet);
				pipe(insert('L1', 'stackfind(A80:B89, B70:B71, A90:B99,true, true)'), step, expectAt('L1', true))(sheet);
				expect(sheet.cellAt('A81').value).toBe(STACKRANGE_SHEET.A72);
				expect(sheet.cellAt('B81').value).toBe(STACKRANGE_SHEET.B72);
				expect(sheet.cellAt('A82').value).toBe(STACKRANGE_SHEET.A73);
				expect(sheet.cellAt('B82').value).toBe(STACKRANGE_SHEET.B73);
				expect(sheet.cellAt('A83').value).toBe(STACKRANGE_SHEET.A74);
				expect(sheet.cellAt('B83').value).toBe(STACKRANGE_SHEET.B74);
				expect(sheet.cellAt('A84').value).toBe(STACKRANGE_SHEET.A76);
				expect(sheet.cellAt('B84').value).toBe(STACKRANGE_SHEET.B76);
				expect(sheet.cellAt('A85')).toBeUndefined();
				expect(sheet.cellAt('B85')).toBeUndefined();
				// check target range:
				expect(sheet.cellAt('A91').value).toBe(STACKRANGE_SHEET.B71);
				expect(sheet.cellAt('B91').value).toBe(STACKRANGE_SHEET.A71);
				expect(sheet.cellAt('A92').value).toBe(STACKRANGE_SHEET.B75);
				expect(sheet.cellAt('B92').value).toBe(STACKRANGE_SHEET.A75);
				expect(sheet.cellAt('A93')).toBeUndefined();
				expect(sheet.cellAt('B93')).toBeUndefined();
				expect(sheet.cellAt('A94')).toBeUndefined();
				expect(sheet.cellAt('B94')).toBeUndefined();
			});
			it('should handle empty cells in source range', () => {
				sheet.load({ cells: SHEET.STACKFIND });
				// expect(createTerm('stackfind(C1:D16, A1:B2, E1:F16, true, true)', _sheet).value).toBe(true);
				pipe(insert('L1', 'stackfind(C1:D16, A1:B2, E1:F16, true, true)'), step, expectAt('L1', true))(sheet);
				// check stack
				expect(sheet.cellAt('C2').value).toBe(10);
				expect(sheet.cellAt('D2').value).toBe(2);
				expect(sheet.cellAt('C3').value).toBe(7);
				expect(sheet.cellAt('D3').value).toBe(1);
				expect(sheet.cellAt('C4').value).toBe(7);
				expect(sheet.cellAt('D4').value).toBe(1);
				// keep empty rows?
				expect(sheet.cellAt('C5')).toBeUndefined();
				expect(sheet.cellAt('D5')).toBeUndefined();
				expect(sheet.cellAt('C6').value).toBe(8);
				expect(sheet.cellAt('D6').value).toBe(2);
				expect(sheet.cellAt('C7').value).toBe(1);
				expect(sheet.cellAt('D7').value).toBe(1);
				expect(sheet.cellAt('C8').value).toBe(3);
				expect(sheet.cellAt('D8').value).toBe(1);
				expect(sheet.cellAt('C9').value).toBe(5);
				expect(sheet.cellAt('D9').value).toBe(1);
				expect(sheet.cellAt('C10').value).toBe(7);
				expect(sheet.cellAt('D10').value).toBe(1);
				expect(sheet.cellAt('C11')).toBeUndefined();
				expect(sheet.cellAt('D11')).toBeUndefined();
				expect(sheet.cellAt('C12').value).toBe(9);
				expect(sheet.cellAt('D12').value).toBe(1);
				expect(sheet.cellAt('C13').value).toBe(9);
				expect(sheet.cellAt('D13').value).toBe(1);
				expect(sheet.cellAt('C14').value).toBe(9);
				expect(sheet.cellAt('D14').value).toBe(1);
				expect(sheet.cellAt('C15').value).toBe(9);
				expect(sheet.cellAt('D15').value).toBe(1);
				expect(sheet.cellAt('C16')).toBeUndefined();
				expect(sheet.cellAt('D16')).toBeUndefined();
				// check target
				expect(sheet.cellAt('E2').value).toBe(9);
				expect(sheet.cellAt('F2').value).toBe(1);
				expect(sheet.cellAt('E3')).toBeUndefined();
				expect(sheet.cellAt('F3')).toBeUndefined();

				// expect(createTerm('stackdrop(E1:F16, -1)', sheet).value).toBe(true);
				pipe(insert('K1', 'stackdrop(E1:F16, -1)'), step, remove('K1'))(sheet);
				sheet.load({ cells: SHEET.STACKFIND });
				// expect(createTerm('stackfind(C1:D16, A1:B2, E1:F16, true, false)', sheet).value).toBe(true);
				pipe(insert('L1', 'stackfind(C1:D16, A1:B2, E1:F16, true, false)'), step, expectAt('L1', true))(sheet);
				// check stack
				expect(sheet.cellAt('C2').value).toBe(10);
				expect(sheet.cellAt('D2').value).toBe(2);
				expect(sheet.cellAt('C3').value).toBe(7);
				expect(sheet.cellAt('D3').value).toBe(1);
				expect(sheet.cellAt('C4').value).toBe(7);
				expect(sheet.cellAt('D4').value).toBe(1);
				// keep empty rows?
				expect(sheet.cellAt('C5')).toBeUndefined();
				expect(sheet.cellAt('D5')).toBeUndefined();
				expect(sheet.cellAt('C6').value).toBe(8);
				expect(sheet.cellAt('D6').value).toBe(2);
				expect(sheet.cellAt('C7').value).toBe(1);
				expect(sheet.cellAt('D7').value).toBe(1);
				expect(sheet.cellAt('C8').value).toBe(3);
				expect(sheet.cellAt('D8').value).toBe(1);
				expect(sheet.cellAt('C9').value).toBe(5);
				expect(sheet.cellAt('D9').value).toBe(1);
				expect(sheet.cellAt('C10').value).toBe(7);
				expect(sheet.cellAt('D10').value).toBe(1);
				expect(sheet.cellAt('C11')).toBeUndefined();
				expect(sheet.cellAt('D11')).toBeUndefined();
				expect(sheet.cellAt('C12')).toBeUndefined();
				expect(sheet.cellAt('D12')).toBeUndefined();
				// check target range:
				expect(sheet.cellAt('E2').value).toBe(9);
				expect(sheet.cellAt('F2').value).toBe(1);
				expect(sheet.cellAt('E3').value).toBe(9);
				expect(sheet.cellAt('F3').value).toBe(1);
				expect(sheet.cellAt('E4').value).toBe(9);
				expect(sheet.cellAt('F4').value).toBe(1);
				expect(sheet.cellAt('E5').value).toBe(9);
				expect(sheet.cellAt('F5').value).toBe(1);
				expect(sheet.cellAt('E6').value).toBe(9);
				expect(sheet.cellAt('F6').value).toBe(1);
				expect(sheet.cellAt('E7')).toBeUndefined();
				expect(sheet.cellAt('F7')).toBeUndefined();
			});
		});
	});
	describe('stack rotate', () => {
		it('should move all rows up if position is greater 0', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13,A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13,A1:C2)'), step, remove('K1'))(sheet);
			// rotate with omitted pos. parameter to check default 1
			pipe(insert('L1', 'stackrotate(A10:C13)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C2);
			// rotate again
			pipe(insert('L1', 'stackrotate(A10:C13, 2)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C2);
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should move all rows down if position is less 0', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13,A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13,A1:C2)'), step, remove('K1'))(sheet);
			pipe(insert('L1', 'stackrotate(A10:C13, -1)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C3);
			// rotate once again...
			pipe(insert('L1', 'stackrotate(A10:C13, -2)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C2);
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
		it('should do nothing if position equals 0', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13,A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13,A1:C2)'), step, remove('K1'))(sheet);
			pipe(insert('L1', 'stackrotate(A10:C13, 0)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B13').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C2);
		});
		it('should copy first row after rotation to specified target', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C13,A1:C3)'), step, remove('K1'))(sheet);
			pipe(insert('K1', 'stackadd(A10:C13,A1:C2)'), step, remove('K1'))(sheet);
			pipe(insert('L1', 'stackrotate(A10:C13, 1, A31:C32)'), step, remove('L1'))(sheet);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B3);
			// rotate once again, to check default...
			pipe(insert('L1', 'stackrotate(A10:C13, 1, A31:C32)'), step, remove('L1'))(sheet);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			// check that target is a copy:
			sheet.cellAt('A32').term = createTerm('42');
			expect(sheet.cellAt('A32').value).toBe(42);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			// finally check that rows below range are not moved or changed!!
			expect(sheet.cellAt('A30').value).toBe('A30');
			expect(sheet.cellAt('B30').value).toBe('B30');
			expect(sheet.cellAt('C30').value).toBe('C30');
		});
	});
	describe('stack sort', () => {
		it('should sort stack range by row in ascending order (depends on first set cell in sort range)', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C12,A1:C3)'), step, remove('K1'))(sheet);
			// sort ascending serial number:
			pipe(insert('L1', 'stacksort(A10:C12, A50:C51)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
		});
		it('should sort stack range in descending order', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:C12,A1:C3)'), step, remove('K1'))(sheet);
			// sort ascending serial number:
			pipe(insert('L1', 'stacksort(A10:C12, A52:C53)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
		});
		// DL-1233
		it('should skip cells with formula', () => {
			// fill stackrange:
			pipe(insert('K1', 'stackadd(A10:D12,A1:D3)'), step, remove('K1'))(sheet);
			// add formula to stack:
			sheet.setCellAt('D12', new Cell(null, createTerm('A12', sheet)));
			expect(sheet.cellAt('D12').value).toBe(42);
			// sort ascending serial number:
			pipe(insert('L1', 'stacksort(A10:D12, B50:C51)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			// last formula value (new requirement. see below)
			expect(sheet.cellAt('D11').value).toBe(42);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			// have to evaluate cell to get correct value!!
			expect(sheet.cellAt('D12').evaluate().value).toBe(56);
			// once again with 2 formula cells
			pipe(insert('K1', 'stackadd(A10:D12,A1:D3)'), step, remove('K1'))(sheet);
			// add formula to stack:
			sheet.setCellAt('D11', new Cell(null, createTerm('A11', sheet)));
			sheet.setCellAt('D12', new Cell(null, createTerm('A12', sheet)));
			expect(sheet.cellAt('D11').value).toBe(56);
			expect(sheet.cellAt('D12').value).toBe(42);
			// sort descending battery voltage:
			pipe(insert('L1', 'stacksort(A10:C12, A52:C53)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('D11').evaluate().value).toBe(42);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('D12').evaluate().value).toBe(56);
			// sort descending serial number:
			sheet.setCellAt('B51', new Cell(false));
			pipe(insert('L1', 'stacksort(A10:C12, A50:C51)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('D11').evaluate().value).toBe(56);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('D12').evaluate().value).toBe(42);
		});
		// DL-1233
		it('should be allowed to use formula column as sort criteria', () => {
			// create example sheet from DL-1233 description
			sheet.load({
				/* eslint-disable */
				cells: {
					A3: 'ABC', B3: 'EFG', C3: 'FFF',
					A4:    23, B4: 12,    C4: { formula: 'A4+B4' }, // 35
					A5:    23, B5: 43,    C5: { formula: 'A5+B5' }, // 66
					A6:    23, B6: 43,    C6: { formula: 'A6+B6' }, // 66
					A7:    23, B7:  1,    C7: { formula: 'A7+B7' }, // 24
					A8:    23, B8:  2,    C8: { formula: 'A8+B8' }, // 25
					A9:    23, B9: 43,    C9: { formula: 'A9+B9' }, // 66
					A10:   54, B10:  4,    C10: { formula: 'A10+B10' }, // 58
					// sort criteria is FFF column:
					D13: 'FFF',
					D14: true
				}
				/* eslint-enable */
			});
			pipe(insert('L1', 'stacksort(A3:C10, D13:D14)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A4').value).toBe(23);
			expect(sheet.cellAt('B4').value).toBe(1);
			expect(sheet.cellAt('C4').description().formula).toBe('A4+B4');
			expect(sheet.cellAt('A5').value).toBe(23);
			expect(sheet.cellAt('B5').value).toBe(2);
			expect(sheet.cellAt('C5').description().formula).toBe('A5+B5');
			expect(sheet.cellAt('A6').value).toBe(23);
			expect(sheet.cellAt('B6').value).toBe(12);
			expect(sheet.cellAt('C6').description().formula).toBe('A6+B6');
			expect(sheet.cellAt('A7').value).toBe(54);
			expect(sheet.cellAt('B7').value).toBe(4);
			expect(sheet.cellAt('C7').description().formula).toBe('A7+B7');
			expect(sheet.cellAt('A8').value).toBe(23);
			expect(sheet.cellAt('B8').value).toBe(43);
			expect(sheet.cellAt('C8').description().formula).toBe('A8+B8');
			expect(sheet.cellAt('A9').value).toBe(23);
			expect(sheet.cellAt('B9').value).toBe(43);
			expect(sheet.cellAt('C9').description().formula).toBe('A9+B9');
			expect(sheet.cellAt('A10').value).toBe(23);
			expect(sheet.cellAt('B10').value).toBe(43);
			expect(sheet.cellAt('C10').description().formula).toBe('A10+B10');
		});
		// email 18.09.2018
		it('should be not swap values, instead use last formula value', () => {
			// create example sheet from DL-1233 description
			sheet.load({
				/* eslint-disable */
				cells: {
					A3: 'ABC', B3: 'EFG', C3: 'FFF',
					A4:    23, B4: 45,    C4: { formula: 'A4+B4' }, // 68
					A5:    12, B5: 36,    C5: 48,
					A7: 'ABC',
					A8: true
				}
				/* eslint-enable */
			});
			pipe(insert('L1', 'stacksort(A3:C5, A7:A8)'), step, remove('L1'))(sheet);
			expect(sheet.cellAt('A4').value).toBe(12);
			expect(sheet.cellAt('B4').value).toBe(36);
			expect(sheet.cellAt('C4').description().formula).toBe('A4+B4');
			expect(sheet.cellAt('A5').value).toBe(23);
			expect(sheet.cellAt('B5').value).toBe(45);
			expect(sheet.cellAt('C5').value).toBe(68);
		});
		// DL-2026
		it('should not dispose moved cells', () => {
			const t1 = new StreamSheet();
			const aSheet = t1.sheet;
			const machine = new Machine();
			machine.addStreamSheet(t1);
			aSheet.loadCells({
				A1: 'Part', B1: 'Quantity', C1: 'Total',
				A2: 2, B2: { formula: 'A2' }, C2: { formula: 'A2*B2' },		// 4
				A3: 3, B3: { formula: 'A3' }, C3: { formula: 'A3*B3' },		// 9
				A4: 4, B4: { formula: 'A4' }, C4: { formula: 'A4*B4' },		// 16
				A5: 5, B5: { formula: 'A5' }, C5: { formula: 'A5*B5' },		// 25
				A6: 'Total', A7: false,
				A8: { formula: 'stacksort(A1:C5, A6:A7)' }
			});
			expect(aSheet.cellAt('C2').value).toBe(4);
			expect(aSheet.cellAt('C3').value).toBe(9);
			expect(aSheet.cellAt('C4').value).toBe(16);
			expect(aSheet.cellAt('C5').value).toBe(25);
			// evaluate all cells 2x because stack sort comes at last => values in C column not evaluated again
			t1.step();
			t1.step();
			expect(aSheet.cellAt('C2').value).toBe(25);
			expect(aSheet.cellAt('C3').value).toBe(16);
			expect(aSheet.cellAt('C4').value).toBe(9);
			expect(aSheet.cellAt('C5').value).toBe(4);
			aSheet.setCellAt('A7', new Cell(true));
			// evaluate 2x because stack sort comes at last => values in C column not evaluated again
			t1.step();
			t1.step();
			expect(aSheet.cellAt('C2').value).toBe(4);
			expect(aSheet.cellAt('C3').value).toBe(9);
			expect(aSheet.cellAt('C4').value).toBe(16);
			expect(aSheet.cellAt('C5').value).toBe(25);
		});
	});
	describe('stack upsert', () => {
		it(`should return ${ERROR.ARGS}if called with to few or to many arguments`, () => {
			expect(createTerm('stackupsert()', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,true,true,true,A4:B4,true)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,,,,,true)', sheet).value).toBe(ERROR.ARGS);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,,,,)', sheet).value).toBe(true);
		});
		it(`should return ${ERROR.VALUE}if called with wrong arguments`, () => {
			expect(createTerm('stackupsert(,,)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(42,A2:B2,A3:B3)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,"hello",A3:B3)', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,A2:B2,"world")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,"world")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,true,"world")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,true,true,"world")', sheet).value).toBe(ERROR.VALUE);
			expect(createTerm('stackupsert(A1:B1,A2:B2,A3:B3,true,true,true,"world")', sheet).value).toBe(ERROR.VALUE);
		});
		it('should add values from source range to stack range if not exist', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			expect(sheet.cellAt('K1')).toBeUndefined();
			expect(sheet.cellAt('A14')).toBeUndefined();
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// next row should be empty!
			expect(sheet.cellAt('A32')).toBeUndefined();
		});
		it('should add values from source range to top of stack range if not exist', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// add one row to stack range:
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			// add another row before 
			pipe(insert('K1', 'stackupsert(A30:E32,C15:G16,D25:D26,true,false)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('A32').value).toBe(23);
		});
		it('should not add source row to stack range if addNotFound parameter is false', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// add one row to stack range:
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26, false)'), step)(sheet);
			expect(sheet.cellAt('A31')).toBeUndefined();
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26, true)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A32')).toBeUndefined();
			pipe(insert('K1', 'stackupsert(A30:E32,C15:G16,D25:D26,false,false)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A32')).toBeUndefined();
			// add another row before 
			pipe(insert('K1', 'stackupsert(A30:E32,C15:G16,D25:D26,true,false)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('A32').value).toBe(23);
			expect(sheet.cellAt('A33')).toBeUndefined();
		});
		it('should add multiple rows if not exist', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// add all rows with same "Mwst"
			pipe(insert('K1', 'stackupsert(A30:E33,C15:G17,A25:A26)'), step)(sheet);
			expect(sheet.cellAt('B31').value).toBe("1234-B");
			expect(sheet.cellAt('B32').value).toBe(1234);
			expect(sheet.cellAt('A33')).toBeUndefined();
		});
		it('should update multiple rows', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// add all rows with same "Mwst"
			pipe(insert('K1', 'stackupsert(A30:E33,C15:G17,A25:A26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('B31').value).toBe("1234-B");
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			expect(sheet.cellAt('A32').value).toBe(23);
			expect(sheet.cellAt('B32').value).toBe(1234);
			expect(sheet.cellAt('C32').value).toBe(2);
			expect(sheet.cellAt('D32').value).toBe(23);
			expect(sheet.cellAt('E32').value).toBe(0.19);
			expect(sheet.cellAt('A33')).toBeUndefined();
			// doing this again should update all added rows and overwrite certain cell values!
			step(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(4);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			expect(sheet.cellAt('A32').value).toBe(23);
			expect(sheet.cellAt('B32').value).toBe(1234);
			expect(sheet.cellAt('C32').value).toBe(5);
			expect(sheet.cellAt('D32').value).toBe(23);
			expect(sheet.cellAt('E32').value).toBe(0.19);
			expect(sheet.cellAt('A33')).toBeUndefined();
		});
		it('should update only cells specified in source range', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init
			pipe(insert('K1', 'stackupsert(A30:E33,C15:G17,A25:A26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('B31').value).toBe("1234-B");
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			expect(sheet.cellAt('A32').value).toBe(23);
			expect(sheet.cellAt('B32').value).toBe(1234);
			expect(sheet.cellAt('C32').value).toBe(2);
			expect(sheet.cellAt('D32').value).toBe(23);
			expect(sheet.cellAt('E32').value).toBe(0.19);
			expect(sheet.cellAt('A33')).toBeUndefined();
			// update using  a smaller source-range
			pipe(insert('K1', 'stackupsert(A30:E33,E15:F17,A25:A26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('B31').value).toBe("1234-B");
			expect(sheet.cellAt('C31').value).toBe(4);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			expect(sheet.cellAt('A32').value).toBe(23);
			expect(sheet.cellAt('B32').value).toBe(1234);
			expect(sheet.cellAt('C32').value).toBe(5);
			expect(sheet.cellAt('D32').value).toBe(23);
			expect(sheet.cellAt('E32').value).toBe(0.19);
			expect(sheet.cellAt('A33')).toBeUndefined();
		});
		it('should not add values from source range to stack range if they exist already ', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			// step should not add again
			step(sheet);
			expect(createTerm('getstep()', sheet).value).toBe(2);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A32')).toBeUndefined();
			step(sheet);
			step(sheet);
			step(sheet);
			expect(createTerm('getstep()', sheet).value).toBe(5);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A32')).toBeUndefined();
		});
		it('should be possible to increase existing values in stack range', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack:
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			// increase "Anzahl"
			pipe(insert('K1', 'stackupsert(A30:E32,C3:G4,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(2);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// once again
			step(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(3);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should be possible to decrease existing values in stack range', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack:
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			// decrease "Preis"
			pipe(insert('K1', 'stackupsert(A30:E32,C5:G6,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(41);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// once again
			step(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(40);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should be possible initialize non existing values in stack range', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack:
			pipe(insert('K1', 'stackupsert(A30:E32,C7:G8,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// overwrite with other source row:
			pipe(insert('K1', 'stackupsert(A30:E32,C1:G2,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// re-init should not change "Preis"
			pipe(insert('K1', 'stackupsert(A30:E32,C7:G8,A25:B26)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(42);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should be possible to apply values from formula', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack with formula source row:
			pipe(insert('K1', 'stackupsert(A30:E32,C9:G10,A25:B26)'), step)(sheet);
			// apply formula source row:
			expect(sheet.cellAt('A31').value.toFixed(2)).toBe('27.37');
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// once again
			step(sheet);
			expect(sheet.cellAt('A31').value.toFixed(2)).toBe('54.74');
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(2);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should respect order of reference cells in formula', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack with formula source row:
			pipe(insert('K1', 'stackupsert(A30:E32,C11:G12,A25:B26)'), step)(sheet);
			// apply formula source row:
			expect(sheet.cellAt('A31').value).toBe(0);
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// once again
			step(sheet);
			expect(sheet.cellAt('A31').value.toFixed(2)).toBe('27.37');
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(2);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should be allowed to reference cells outside source range in formula', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init stack with formula source row:
			pipe(insert('K1', 'stackupsert(A30:E32,C13:G14,A25:B26)'), step)(sheet);
			// apply formula source row:
			expect(sheet.cellAt('A31').value.toFixed(2)).toBe('40.37');
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(1);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
			// once again
			step(sheet);
			expect(sheet.cellAt('A31').value.toFixed(2)).toBe('67.74');
			expect(sheet.cellAt('B31').value).toBe(1234);
			expect(sheet.cellAt('C31').value).toBe(2);
			expect(sheet.cellAt('D31').value).toBe(23);
			expect(sheet.cellAt('E31').value).toBe(0.19);
		});
		it('should copy dropped rows to target range if specified', () => {
			sheet.load({ cells: SHEET.STACKUPSERT });
			// init
			pipe(insert('K1', 'stackupsert(A30:E31,C1:G2,B25:B26)'), step)(sheet);
			expect(sheet.cellAt('K1').value).toBe(true);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A32')).toBeUndefined();
			// add another row => should dropped old one...
			pipe(insert('K1', 'stackupsert(A30:E31,C15:G16,D25:D26,,,,A40:E42)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(13);
			expect(sheet.cellAt('A41').value).toBe(1234);
			expect(sheet.cellAt('B41').value).toBe(23);
			expect(sheet.cellAt('C41').value).toBe(1);
			expect(sheet.cellAt('D41').value).toBe(42);
			expect(sheet.cellAt('E41').value).toBe(0.19);
			expect(sheet.cellAt('A42')).toBeUndefined();
			// add another row => should dropped old one...
			pipe(insert('K1', 'stackupsert(A30:E31,C1:G2,B25:B26,true,false,,A40:E42)'), step)(sheet);
			expect(sheet.cellAt('A31').value).toBe(23);
			expect(sheet.cellAt('A41').value).toBe('1234-B');
			expect(sheet.cellAt('B41').value).toBe(13);
			expect(sheet.cellAt('C41').value).toBe(1);
			expect(sheet.cellAt('D41').value).toBe(42);
			expect(sheet.cellAt('E41').value).toBe(0.19);
			expect(sheet.cellAt('A42')).toBeUndefined();
		});
		it('should not fail if source and target range do not start at A', () => {
			sheet.load({ cells: SHEET.STACKUPSERT_BUG });
			// init stack with formula source row:
			pipe(insert('J7', 'stackupsert(L20:P22,C7:G8,C7:C8)'), step)(sheet);
			expect(sheet.cellAt('L21').value).toBe(1234);
			expect(sheet.cellAt('M21').value).toBe(1);
			expect(sheet.cellAt('N21').value).toBe(23);
			expect(sheet.cellAt('O21').value).toBe(0.19);
			expect(sheet.cellAt('P21').value.toFixed(2)).toBe('27.37');
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('P22')).toBeUndefined();
			// once again
			step(sheet);
			expect(sheet.cellAt('L21').value).toBe(1234);
			expect(sheet.cellAt('M21').value).toBe(2);
			expect(sheet.cellAt('N21').value).toBe(23);
			expect(sheet.cellAt('O21').value).toBe(0.19);
			expect(sheet.cellAt('P21').value.toFixed(2)).toBe('54.74');
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('P22')).toBeUndefined();
		});
		// additional requirement:
		it('should support operator values created via formula', () => {
			sheet.load({ cells: SHEET.STACKUPSERT_FORMULA_OPS });
			// init stack with formula source row:
			pipe(insert('J7', 'stackupsert(L20:P22,C7:G8,C7:C8)'), step)(sheet);
			expect(sheet.cellAt('L21').value).toBe(1234);
			expect(sheet.cellAt('M21').value).toBe(1);
			expect(sheet.cellAt('N21').value).toBe(23);
			expect(sheet.cellAt('O21').value).toBe(0.19);
			expect(sheet.cellAt('P21').value.toFixed(2)).toBe('27.37');
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('P22')).toBeUndefined();
			// once again
			step(sheet);
			expect(sheet.cellAt('L21').value).toBe(1234);
			expect(sheet.cellAt('M21').value).toBe(2);
			expect(sheet.cellAt('N21').value).toBe(23);
			expect(sheet.cellAt('O21').value).toBe(0.19);
			expect(sheet.cellAt('P21').value.toFixed(2)).toBe('54.74');
			expect(sheet.cellAt('L22')).toBeUndefined();
			expect(sheet.cellAt('P22')).toBeUndefined();
		});
	});
});
