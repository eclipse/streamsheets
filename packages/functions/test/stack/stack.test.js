const STACKRANGE_SHEET = require('../_data/sheets.json').STACKRANGE;
const { createTerm } = require('../utils');
const { Cell, Machine, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

let sheet;
beforeEach(() => {
	sheet = new StreamSheet().sheet;
	sheet.settings.maxrow = 100;
	sheet.load({ cells: STACKRANGE_SHEET });
});

describe('stack functions', () => {
	// DL-1340: new requirement!!
	describe('stack add', () => {
		describe('stack add at bottom', () => {
			it('should append new rows at bottom by default or direction is set to true', () => {
				expect(createTerm('stackadd(A10:C12, A1:C2)', sheet).value).toBe(true);
				// check if row was added at last position:
				expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
				expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
				expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
				// once again:
				expect(createTerm('stackadd(A10:C12, A1:C2,)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2,,)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C3, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A5:C8)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, false)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, false)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C3, false)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, false)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2, false)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C2)', sheet).value).toBe(true);
				expect(createTerm('stackadd(A10:C12, A1:C2, )', sheet).value).toBe(true);
			});
		});
		describe('stack add with drop to target', () => {
			it('should copy dropped row to a specified target', () => {
				// fill stackrange:
				expect(createTerm('stackadd(A10:C12, A1:C3, true)', sheet).value).toBe(true);
				// now add another row, with specified target range
				expect(createTerm('stackadd(A10:C12, A1:C2, true, A31:C33)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A1:C3, true)', sheet).value).toBe(true);
				// now add another row, with specified target range
				expect(createTerm('stackadd(A10:C12, A1:C2, true, A40:F43)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A10:C12, A5:C8, true, A31:C33)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(P2!A10:P2!C12, A2:C2)', sheet).value).toBe(ERROR.NAME);
				expect(createTerm('stackadd(A10:C12, P2!A2:P2!C2)', sheet).value).toBe(ERROR.NAME);
			});
		});
	});
	describe('stack drop', () => {
		it('should drop row at specified position', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C12, A1:C3)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			// drop second row
			expect(createTerm('stackdrop(A10:C12, 2)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C12, 1)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop second row
			expect(createTerm('stackdrop(A10:C13, 2)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C13, 1)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			expect(createTerm('stackdrop(A10:C13)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C13, 1)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C13)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			expect(createTerm('stackdrop(A10:C13, 0)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C13, 0)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('A12')).toBeUndefined();
			expect(sheet.cellAt('B12')).toBeUndefined();
			expect(sheet.cellAt('C12')).toBeUndefined();
			expect(sheet.cellAt('A13')).toBeUndefined();
			expect(sheet.cellAt('B13')).toBeUndefined();
			expect(sheet.cellAt('C13')).toBeUndefined();
			expect(createTerm('stackdrop(A10:C13, 0)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop first row:
			expect(createTerm('stackdrop(A10:C13, 1, A31:C32)', sheet).value).toBe(true);
			// check target range:
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			// drop again:
			expect(createTerm('stackdrop(A10:C13, 1, A31:C32)', sheet).value).toBe(true);
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B3);
			// drop again without target, leaving target unchanged:
			expect(createTerm('stackdrop(A10:C13, 1)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop all rows:
			expect(createTerm('stackdrop(A10:C13, -1)', sheet).value).toBe(true);
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
			expect(createTerm('stackdrop(A10:C13, -1)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop all rows:
			expect(createTerm('stackdrop(A10:C15, -1)', sheet).value).toBe(true);
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
			expect(createTerm('stackdrop(A10:C15, -1)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop all rows:
			expect(createTerm('stackdrop(A10:C13, -1, A31:C34)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// drop last row:
			expect(createTerm('stackdrop(A10:C13, 0,)', sheet).value).toBe(true);
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
			expect(createTerm('stackdrop(A10:C13, 0,)', sheet).value).toBe(true);
			expect(createTerm('stackdrop(A10:C13, 0,)', sheet).value).toBe(true);
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
			expect(createTerm('stackdrop(A10:C13, 0,)', sheet).value).toBe(true);
			expect(createTerm('stackdrop(A10:C13, 0,)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C12, A1:C3)', sheet).value).toBe(true);
			// find at least one row with clicktype
			expect(createTerm('stackfind(A10:C12, A60:A61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C12, A60:A62)', sheet).value).toBe(true);
			// find at least one row with serialnumber
			expect(createTerm('stackfind(A10:C12, B60:B61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C12, B60:B62)', sheet).value).toBe(true);
			// find at least one row with batteryvoltage
			expect(createTerm('stackfind(A10:C12, C60:C61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C12, C60:C62)', sheet).value).toBe(true);
			// no match...
			expect(createTerm('stackfind(A10:C12, A64:C65)', sheet).value).toBe(false);
		});
		it('should treat values on same criteriarange row as an AND condition', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C11, A1:C2)', sheet).value).toBe(true);
			// should find at least one row...
			expect(createTerm('stackfind(A10:C11, A60:A61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:B61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:C61)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:A62)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:B62)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:C62)', sheet).value).toBe(true);
			// fill stackrange:
			sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
			sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
			sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
			expect(createTerm('stackadd(A10:C11, A1:C2)', sheet).value).toBe(true);
			// should find at least one row...
			expect(createTerm('stackfind(A10:C11, A60:A62)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:B62)', sheet).value).toBe(true);
			expect(createTerm('stackfind(A10:C11, A60:C62)', sheet).value).toBe(true);
			// no match:
			expect(createTerm('stackfind(A10:C11, A60:A61)', sheet).value).toBe(false);
			expect(createTerm('stackfind(A10:C11, A60:B61)', sheet).value).toBe(false);
			expect(createTerm('stackfind(A10:C11, A60:C61)', sheet).value).toBe(false);
		});
		it('should treat values on different criteriarange rows as an OR condition', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C11, A1:C2)', sheet).value).toBe(true);
			// match:
			expect(createTerm('stackfind(A10:C11, A60:C62)', sheet).value).toBe(true);
			// fill stackrange:
			sheet.setCellAt('A2', new Cell(STACKRANGE_SHEET.A3));
			sheet.setCellAt('B2', new Cell(STACKRANGE_SHEET.B3));
			sheet.setCellAt('C2', new Cell(STACKRANGE_SHEET.C3));
			expect(createTerm('stackadd(A10:C11, A1:C2)', sheet).value).toBe(true);
			// match:
			expect(createTerm('stackfind(A10:C11, A60:C62)', sheet).value).toBe(true);
			// no match:
			expect(createTerm('stackfind(A10:C11, A60:A61)', sheet).value).toBe(false);
			expect(createTerm('stackfind(A10:C11, A60:B61)', sheet).value).toBe(false);
			expect(createTerm('stackfind(A10:C11, A60:C61)', sheet).value).toBe(false);
		});
		it('should copy matching row from stackrange to target range if set', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C12, A1:C3)', sheet).value).toBe(true);
			// should copy a single row to target
			expect(createTerm('stackfind(A10:C12, A60:A61, A31:C33)', sheet).value).toBe(true);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
			// should copy only first of two rows to target
			expect(createTerm('stackfind(A10:C12, A60:C62, A31:C32)', sheet).value).toBe(true);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
			// should copy two rows to target
			expect(createTerm('stackfind(A10:C12, A60:C62, A31:C33)', sheet).value).toBe(true);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C2);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('A33').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B33').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C33').value).toBe(STACKRANGE_SHEET.B3);
			// no match => target is cleared
			expect(createTerm('stackfind(A10:C12, A64:C65, A31:C33)', sheet).value).toBe(false);
			expect(sheet.cellAt('A32')).toBeUndefined();
			expect(sheet.cellAt('B32')).toBeUndefined();
			expect(sheet.cellAt('C32')).toBeUndefined();
			expect(sheet.cellAt('A33')).toBeUndefined();
			expect(sheet.cellAt('B33')).toBeUndefined();
			expect(sheet.cellAt('C33')).toBeUndefined();
		});
		it('should drop matching row from stackrange if drop parameter is set', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			// should drop a single row
			expect(createTerm('stackfind(A10:C13, A60:A61,, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackfind(A10:C13, C60:C62,, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackfind(A10:C13, A60:A62,, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop two first rows
			expect(createTerm('stackfind(A10:C13, A60:C62,, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop all rows
			expect(createTerm('stackfind(A10:C13, A60:A62,, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('C13').value).toBe(STACKRANGE_SHEET.C4);
			// should drop no rows
			expect(createTerm('stackfind(A10:C13, A64:C65,, true)', sheet).value).toBe(false);
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
			expect(createTerm('stackadd(A10:C13, A1:C4)', sheet).value).toBe(true);
			// should drop a single row to target range:
			expect(createTerm('stackfind(A10:C13, A60:A61, A40:F41, true)', sheet).value).toBe(true);
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
			expect(createTerm('stackfind(A10:C13, A60:A62, A40:F42, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);
				// find all with single clicktype:
				expect(createTerm('stackfind(A80:B89, B70:B71, A90:B99)', sheet).value).toBe(true);
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
				expect(createTerm('stackdrop(A80:B89, -1)', sheet).value).toBe(true);
				expect(createTerm('stackdrop(A90:B99, -1)', sheet).value).toBe(true);
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);				
				expect(createTerm('stackfind(A70:B79, B70:B71, A90:B99, , true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);
				// find and drop all with single clicktype:
				expect(createTerm('stackfind(A80:B89, B70:B71, , true)', sheet).value).toBe(true);
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
				expect(createTerm('stackdrop(A80:B89, -1)', sheet).value).toBe(true);
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);
				expect(createTerm('stackfind(A80:B89, B70:B71, , true, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);
				// find and drop all with single clicktype:
				expect(createTerm('stackfind(A80:B89, B70:B71, A90:B99, true)', sheet).value).toBe(true);
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
				expect(createTerm('stackdrop(A80:B89, -1)', sheet).value).toBe(true);
				expect(createTerm('stackdrop(A90:B99, -1)', sheet).value).toBe(true);
				expect(createTerm('stackadd(A80:B89, A70:B79)', sheet).value).toBe(true);
				expect(createTerm('stackfind(A80:B89, B70:B71, A90:B99, true, true)', sheet).value).toBe(true);
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
		});
	});
	describe('stack rotate', () => {
		it('should move all rows up if position is greater 0', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			// rotate with ommitted pos. parameter to check default 1
			expect(createTerm('stackrotate(A10:C13)', sheet).value).toBe(true);
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
			expect(createTerm('stackrotate(A10:C13, 2)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			expect(createTerm('stackrotate(A10:C13, -1)', sheet).value).toBe(true);
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
			expect(createTerm('stackrotate(A10:C13, -2)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			expect(createTerm('stackrotate(A10:C13, 0)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C13, A1:C3)', sheet).value).toBe(true);
			expect(createTerm('stackadd(A10:C13, A1:C2)', sheet).value).toBe(true);
			expect(createTerm('stackrotate(A10:C13, 1, A31:C32)', sheet).value).toBe(true);
			// check target
			expect(sheet.cellAt('A32').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('B32').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('C32').value).toBe(STACKRANGE_SHEET.B3);
			// rotate once again, to check default...
			expect(createTerm('stackrotate(A10:C13, 1, A31:C32)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:C12, A1:C3)', sheet).value).toBe(true);
			// sort ascending serial number:
			expect(createTerm('stacksort(A10:C12, A50:C51)', sheet).value).toBe(true);
			expect(sheet.cellAt('A11').value).toBe(STACKRANGE_SHEET.A3);
			expect(sheet.cellAt('B11').value).toBe(STACKRANGE_SHEET.B3);
			expect(sheet.cellAt('C11').value).toBe(STACKRANGE_SHEET.C3);
			expect(sheet.cellAt('A12').value).toBe(STACKRANGE_SHEET.A2);
			expect(sheet.cellAt('B12').value).toBe(STACKRANGE_SHEET.B2);
			expect(sheet.cellAt('C12').value).toBe(STACKRANGE_SHEET.C2);
		});
		it('should sort stack range in descending order', () => {
			// fill stackrange:
			expect(createTerm('stackadd(A10:C12, A1:C3)', sheet).value).toBe(true);
			// sort descending battery voltage:
			expect(createTerm('stacksort(A10:C12, A52:C53)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:D12, A1:D3)', sheet).value).toBe(true);
			// add formula to stack:
			sheet.setCellAt('D12', new Cell(null, createTerm('A12', sheet)));
			expect(sheet.cellAt('D12').value).toBe(42);
			// sort ascending serial number:
			expect(createTerm('stacksort(A10:D12, B50:C51)', sheet).value).toBe(true);
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
			expect(createTerm('stackadd(A10:D12, A1:D3)', sheet).value).toBe(true);
			// add formula to stack:
			sheet.setCellAt('D11', new Cell(null, createTerm('A11', sheet)));
			sheet.setCellAt('D12', new Cell(null, createTerm('A12', sheet)));
			expect(sheet.cellAt('D11').value).toBe(56);
			expect(sheet.cellAt('D12').value).toBe(42);
			// sort descending battery voltage:
			expect(createTerm('stacksort(A10:C12, A52:C53)', sheet).value).toBe(true);
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
			expect(createTerm('stacksort(A10:C12, A50:C51)', sheet).value).toBe(true);
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
			const t1 = new StreamSheet();
			const _sheet = t1.sheet.load({
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
			expect(createTerm('stacksort(A3:C10, D13:D14)', _sheet).value).toBe(true);
			expect(_sheet.cellAt('A4').value).toBe(23);
			expect(_sheet.cellAt('B4').value).toBe(1);
			expect(_sheet.cellAt('C4').description().formula).toBe('A4+B4');
			expect(_sheet.cellAt('A5').value).toBe(23);
			expect(_sheet.cellAt('B5').value).toBe(2);
			expect(_sheet.cellAt('C5').description().formula).toBe('A5+B5');
			expect(_sheet.cellAt('A6').value).toBe(23);
			expect(_sheet.cellAt('B6').value).toBe(12);
			expect(_sheet.cellAt('C6').description().formula).toBe('A6+B6');
			expect(_sheet.cellAt('A7').value).toBe(54);
			expect(_sheet.cellAt('B7').value).toBe(4);
			expect(_sheet.cellAt('C7').description().formula).toBe('A7+B7');
			expect(_sheet.cellAt('A8').value).toBe(23);
			expect(_sheet.cellAt('B8').value).toBe(43);
			expect(_sheet.cellAt('C8').description().formula).toBe('A8+B8');
			expect(_sheet.cellAt('A9').value).toBe(23);
			expect(_sheet.cellAt('B9').value).toBe(43);
			expect(_sheet.cellAt('C9').description().formula).toBe('A9+B9');
			expect(_sheet.cellAt('A10').value).toBe(23);
			expect(_sheet.cellAt('B10').value).toBe(43);
			expect(_sheet.cellAt('C10').description().formula).toBe('A10+B10');
		});		
		// email 18.09.2018
		it('should be not swap values, instead use last formula value', () => {
			// create example sheet from DL-1233 description
			const t1 = new StreamSheet();
			const _sheet = t1.sheet.load({
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
			expect(createTerm('stacksort(A3:C5, A7:A8)', _sheet).value).toBe(true);
			expect(_sheet.cellAt('A4').value).toBe(12);
			expect(_sheet.cellAt('B4').value).toBe(36);
			expect(_sheet.cellAt('C4').description().formula).toBe('A4+B4');
			expect(_sheet.cellAt('A5').value).toBe(23);
			expect(_sheet.cellAt('B5').value).toBe(45);
			expect(_sheet.cellAt('C5').value).toBe(68);
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
			// evaluate all cells:
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
});
