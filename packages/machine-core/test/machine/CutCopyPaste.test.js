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
const { functions } = require('../utils');
const { Machine, SheetIndex, SheetParser, SheetRange, StreamSheet } = require('../..');
const DEF_PROPS = require('../../defproperties.json');

beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
});


const setup = () => {
	const machine = new Machine();
	const t1 = new StreamSheet({ name: 'S1' });
	const t2 = new StreamSheet({ name: 'S2' });
	machine.addStreamSheet(t1);
	machine.addStreamSheet(t2);
	return t1.sheet;
};

const rangeFactory = (sheet) => (str) => {
	const range = SheetRange.fromRangeStr(str);
	if (range) range.sheet = sheet;
	return range;
};
const rowRangeFactory = (sheet) => (str) => {
	const range = SheetRange.fromRangeStr(str);
	const end = SheetIndex.create(range.end.row, sheet.settings.maxcol);
	const start = SheetIndex.create(range.start.row, sheet.settings.mincol);
	const rowRange = SheetRange.fromStartEnd(start, end);
	if (rowRange) rowRange.sheet = sheet;
	return rowRange;
};
const colRangeFactory = (sheet) => (str) => {
	const range = SheetRange.fromRangeStr(str);
	const end = SheetIndex.create(sheet.settings.maxrow, range.end.col);
	const start = SheetIndex.create(sheet.settings.minrow, range.start.col);
	const colRange = SheetRange.fromStartEnd(start, end);
	if (colRange) colRange.sheet = sheet;
	return colRange;
};

describe('cell paste', () => {
	describe('general', () => {
		it('should be possible to copy & paste cells from source range to target range', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13, B1: 23,
				A2: 19, B2: 42
			} });
			sheet.pasteCells(range('A1:B2'), range('D1:E2'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(42);
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(19);
			expect(sheet.cellAt('E2').value).toBe(42);
			sheet.pasteCells(range('D1:G2'), range('B1:D2'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(sheet.cellAt('C1').value).toBe(23);
			expect(sheet.cellAt('D1')).toBeUndefined();
			expect(sheet.cellAt('E1')).toBeUndefined();
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(19);
			expect(sheet.cellAt('C2').value).toBe(42);
			expect(sheet.cellAt('D2')).toBeUndefined();
			expect(sheet.cellAt('E2')).toBeUndefined();
		});
		it('should cut source cells if flag is specified', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13, B1: 23,
				A2: 19, B2: 42
			} });
			sheet.pasteCells(range('A1:B2'), range('D1:E2'), { cut: true });
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('A2')).toBeUndefined();
			expect(sheet.cellAt('B2')).toBeUndefined();
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(19);
			expect(sheet.cellAt('E2').value).toBe(42);
		});
		it('should be possible to paste cells to a different sheet', () => {
			const sheet1 = setup();
			const range1 = rangeFactory(sheet1);
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range2 = rangeFactory(sheet2);
			sheet1.load({ cells: {
				A2: 23,
				A5: { formula: 'A3+1' },
				A6: { formula: 'S1!A2+1' }
			}});
			sheet1.pasteCells(range1('A2:A6'), range2('C5:C5'));
			expect(sheet2.cellAt('C5').value).toBe(23);
			expect(sheet2.cellAt('C8').value).toBe(1);
			expect(sheet2.cellAt('C8').formula).toBe('C6+1');
			expect(sheet2.cellAt('C9').value).toBe(24);
			expect(sheet2.cellAt('C9').formula).toBe('S1!C5+1');
		});
	});
	describe('formats only', () => {
		it('should be possible to paste formats only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, B2: 23, C3: 42, F3: 'hello' } });
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(3, 'linecolor', 'cyan');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			pm.setCellStyleFormat(3, 2, 'fillcolor', 'green');

			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(1, 1, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
			expect(pm.getCellStyleFormat(3, 2, 'linecolor')).toBe('cyan');

			// normal paste should copy formats too:
			sheet.pasteCells(range('A1:C3'), range('D1:D1'), { action: 'formats' });
			// check no cells copied:
			expect(sheet.cellAt('D1')).toBeUndefined();
			expect(sheet.cellAt('E2')).toBeUndefined();
			expect(sheet.cellAt('F3').value).toBe('hello');
			// ...but formats are applied
			expect(pm.getCellStyleFormat(1, 3, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(2, 4, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(3, 5, 'fillcolor')).toBe('green');
			// check inherited property...
			expect(pm.getCellStyleFormat(3, 6, 'linecolor')).toBe('cyan');
			expect(pm.getCellStyleFormat(3, 5, 'linecolor')).toBe('cyan');
			// content is kept:
			expect(sheet.cellAt(SheetIndex.create(3, 5)).value).toBe('hello');
		});
		it('should use formats of source cell on paste', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: 23, A3: 42 } });
			pm.setCellStyleFormat(1, 0, 'fillcolor', 'red');
			pm.setCellStyleFormat(2, 0, 'fillcolor', 'yellow');
			pm.setCellStyleFormat(3, 0, 'fillcolor', 'green');
			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe('green');
			// we copy inside source range!
			sheet.pasteCells(range('A1:A3'), range('A2:A2'), { action: 'formats' });
			expect(pm.getCellStyleFormat(2, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(3, 0, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(4, 0, 'fillcolor')).toBe('green');
		});
	});
	describe('formulas only', () => {
		it('should be possible to paste formulas/content only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, B2: 23, C3: { formula: 'sum(A1,B2)' }, F3: 'hello' } });
			// define some styles:
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(5, 'fillcolor', 'magenta');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(3, 'fillcolor', 'cyan');
			pm.setCellStyleFormat(3, 2, 'fillcolor', 'green');
			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
			// check old value
			expect(sheet.cellAt('C3').value).toBe(36);
			// normal paste should copy formats too:
			sheet.pasteCells(range('B2:F3'), range('D4:D4'), { action: 'formulas' });

			expect(sheet.cellAt('D4').value).toBe(23);
			// check value not copied! => actual value is derived from formula only!!!
			expect(sheet.cellAt('E5').value).toBe(59);
			expect(sheet.cellAt('H5').value).toBe('hello');
			// check that no cells properties are copied:
			expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe('cyan');
			expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(5, 7, 'fillcolor')).toBe('magenta');

			sheet.pasteCells(range('C3:C3'), range('C8:C8'), { action: 'formulas' });
			expect(sheet.cellAt('C8').value).toBe(0);
			expect(pm.getCellStyleFormat(8, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
		it('should use formula of source cell on paste', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: { formula: 'sum(A1, 5)' }, A3: { formula: 'sum(A2,10)' } } });
			// check values before copy:
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('A2').value).toBe(18);
			expect(sheet.cellAt('A3').value).toBe(28);
			// we copy inside source range!
			sheet.pasteCells(range('A2:A3'), range('A3:A3'), { action: 'formulas' });
			expect(sheet.cellAt('A3').value).toBe(23);
			expect(sheet.cellAt('A3').formula).toBe('SUM(A2,5)');
			expect(sheet.cellAt('A4').value).toBe(33);
			expect(sheet.cellAt('A4').formula).toBe('SUM(A3,10)');
		});
	});
	describe('values only', () => {
		it('should be possible to paste values only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, B2: 23, C3: { formula: 'sum(A1,B2)' }, F3: 'hello' } });
			// define some styles:
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(5, 'fillcolor', 'magenta');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(3, 'fillcolor', 'cyan');
			pm.setCellStyleFormat(3, 2, 'fillcolor', 'green');
			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
			// normal paste should copy formats too:
			sheet.pasteCells(range('B2:F3'), range('D4:D4'), { action: 'values' });

			expect(sheet.cellAt('D4').value).toBe(23);
			expect(sheet.cellAt('E5').value).toBe(36);
			expect(sheet.cellAt('E5').formula).toBeUndefined();
			expect(sheet.cellAt('H5').value).toBe('hello');
			// check that no cells properties are copied:
			expect(pm.getCellStyleFormat(4, 3, 'fillcolor')).toBe('cyan');
			expect(pm.getCellStyleFormat(5, 4, 'fillcolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(5, 7, 'fillcolor')).toBe('magenta');

			sheet.pasteCells(range('C3:C3'), range('C8:C8'), { action: 'values' });
			expect(sheet.cellAt('C8').value).toBe(36);
			expect(sheet.cellAt('E5').formula).toBeUndefined();
			expect(pm.getCellStyleFormat(8, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
		it('should use value of source cell on paste', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: { formula: 'sum(A1, 5)' }, A3: { formula: 'sum(A2,10)' } } });
			// check values before copy:
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('A2').value).toBe(18);
			expect(sheet.cellAt('A3').value).toBe(28);
			// we copy inside source range!
			sheet.pasteCells(range('A1:A3'), range('A2:A2'), { action: 'values' });
			expect(sheet.cellAt('A2').value).toBe(13);
			expect(sheet.cellAt('A3').value).toBe(18);
			expect(sheet.cellAt('A3').formula).toBeUndefined();
			expect(sheet.cellAt('A4').value).toBe(28);
			expect(sheet.cellAt('A4').formula).toBeUndefined();
		});
	});
});

describe('row paste', () => {
	// row paste can be only formulas, values, properties or ALL...
	describe('general', () => {
		it('should paste all cells within row to specified target', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13, B1: 23,
				A2: 19, B2: 42
			} });
			sheet.pasteRows(range('A1:A1'), range('D4:D5'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(42);
			expect(sheet.cellAt('A4').value).toBe(13);
			expect(sheet.cellAt('B4').value).toBe(23);
			expect(sheet.cellAt('A5')).toBeUndefined();
			expect(sheet.cellAt('B5')).toBeUndefined();
			sheet.pasteRows(range('A4:A6'), range('A2:A2'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A2').value).toBe(13);
			expect(sheet.cellAt('B2').value).toBe(23);
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('B4')).toBeUndefined();
		});
		it('should be possible to paste multiple rows', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			sheet.pasteRows(range('A1:A4'), range('D5:D5'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(42);
			expect(sheet.cellAt('C4').value).toBe(97);
			expect(sheet.cellAt('A5').value).toBe(13);
			expect(sheet.cellAt('B5').value).toBe(23);
			expect(sheet.cellAt('A6').value).toBe(19);
			expect(sheet.cellAt('B6').value).toBe(42);
			expect(sheet.cellAt('A7')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			expect(sheet.cellAt('C8').value).toBe(97);
		});
		it('should be possible to paste rows to different sheet', () => {
			const sheet1 = setup();
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range1 = rowRangeFactory(sheet1);
			const range2 = rowRangeFactory(sheet2);
			sheet1.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			sheet1.pasteRows(range1('A1:A4'), range2('D4:D8'));
			expect(sheet1.cellAt('A1').value).toBe(13);
			expect(sheet1.cellAt('B1').value).toBe(23);
			expect(sheet1.cellAt('A2').value).toBe(19);
			expect(sheet1.cellAt('B2').value).toBe(42);
			expect(sheet1.cellAt('C4').value).toBe(97);
			expect(sheet2.cellAt('A4').value).toBe(13);
			expect(sheet2.cellAt('B4').value).toBe(23);
			expect(sheet2.cellAt('A5').value).toBe(19);
			expect(sheet2.cellAt('B5').value).toBe(42);
			expect(sheet2.cellAt('A6')).toBeUndefined();
			expect(sheet2.cellAt('B6')).toBeUndefined();
			expect(sheet2.cellAt('C7').value).toBe(97);
		});
		it('should paste rows properties', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			// set some row props:
			const pm = sheet.properties;
			pm.setRowStyleFormat(2, 'fillcolor', 'red');
			pm.setRowStyleFormat(4, 'linecolor', 'red');
			// target rows:
			pm.setRowStyleFormat(5, 'fillcolor', 'yellow');
			pm.setRowStyleFormat(6, 'fillcolor', 'green');
			pm.setRowStyleFormat(7, 'fillcolor', 'cyan');
			pm.setRowStyleFormat(8, 'linecolor', 'cyan');
			sheet.pasteRows(range('A1:A4'), range('D5:D8'));
			expect(sheet.cellAt('A5').value).toBe(13);
			expect(sheet.cellAt('B5').value).toBe(23);
			expect(sheet.cellAt('A6').value).toBe(19);
			expect(sheet.cellAt('B6').value).toBe(42);
			expect(sheet.cellAt('A7')).toBeUndefined();
			expect(sheet.cellAt('B7')).toBeUndefined();
			expect(sheet.cellAt('C8').value).toBe(97);
			// check properties:
			expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe('red');
			expect(pm.getRowStyleFormat(7, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(8, 'linecolor')).toBe('red');
			expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
	});
	describe('formats only', () => {
		it('should be possible to paste formats only', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				A5: 'hello',
				B6: 'world'
			} });
			// set some row props:
			const pm = sheet.properties;
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setCellStyleFormat(2, 1, 'linecolor', 'green');
			// target rows:
			pm.setRowStyleFormat(5, 'fillcolor', 'green');
			pm.setColumnStyleFormat(1, 'linecolor', 'magenta');
			pm.setCellStyleFormat(6, 1, 'fillcolor', 'cyan');

			sheet.pasteRows(range('A1:A2'), range('D5:D6'), { action: 'formats' });
			// content is kept:
			expect(sheet.cellAt('A5').value).toBe('hello');
			expect(sheet.cellAt('B5')).toBeUndefined();
			expect(sheet.cellAt('B6').value).toBe('world');
			expect(sheet.cellAt('A6')).toBeUndefined();
			// check properties:
			expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe('red');
			expect(pm.getRowStyleFormat(6, 'fillcolor')).toBe('yellow');
			expect(pm.getColumnStyleFormat(1, 'linecolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(6, 1, 'linecolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(6, 1, 'fillcolor')).toBe('yellow');
		});
		it('should use formats of source rows on paste', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: 23, A3: 42 } });
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setRowStyleFormat(3, 'fillcolor', 'green');
			// we copy inside source range!
			sheet.pasteRows(range('A1:A3'), range('A2:A2'), { action: 'formats' });
			expect(pm.getRowStyleFormat(2, 'fillcolor')).toBe('red');
			expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe('yellow');
			expect(pm.getRowStyleFormat(4, 'fillcolor')).toBe('green');
		});
	});
	describe('formulas only', () => {
		it('should be possible to paste formulas/content only', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				A4: {formula: 'sum(A1:B2)'},
				B5: {formula: 'sum(21)'},
			} });
			// set some row props:
			const pm = sheet.properties;
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setCellStyleFormat(2, 1, 'linecolor', 'green');
			// target rows:
			pm.setRowStyleFormat(8, 'fillcolor', 'green');
			pm.setColumnStyleFormat(1, 'linecolor', 'magenta');

			sheet.pasteRows(range('A2:A6'), range('D8:D8'), { action: 'formulas' });
			// check content:
			expect(sheet.cellAt('A8').value).toBe(19);
			expect(sheet.cellAt('B8').value).toBe(42);
			expect(sheet.cellAt('A9')).toBeUndefined();
			expect(sheet.cellAt('A10').value).toBe(61);
			expect(sheet.cellAt('A10').formula).toBe('SUM(A7:B8)');
			expect(sheet.cellAt('B11').value).toBe(21);
			expect(sheet.cellAt('B11').formula).toBe('SUM(21)');
			// check properties:
			expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe('green');
			expect(pm.getCellStyleFormat(8, 1, 'linecolor')).toBe('magenta');
		});
		it('should use formula of source rows on paste', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: { formula: 'sum(A1, 5)' }, A4: { formula: 'sum(A2,10)' } } });
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setRowStyleFormat(3, 'fillcolor', 'green');
			sheet.pasteRows(range('A1:A4'), range('A2:A2'), { action: 'formulas' });
			// check content
			expect(sheet.cellAt('A2').value).toBe(13);
			expect(sheet.cellAt('A3').value).toBe(18);
			expect(sheet.cellAt('A3').formula).toBe('SUM(A2,5)');
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('A5').value).toBe(28);
			expect(sheet.cellAt('A5').formula).toBe('SUM(A3,10)');
			// check properties
			expect(pm.getRowStyleFormat(2, 'fillcolor')).toBe('yellow');
			expect(pm.getRowStyleFormat(3, 'fillcolor')).toBe('green');
			expect(pm.getRowStyleFormat(4, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
	});
	describe('values only', () => {
		it('should be possible to paste values only', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				A4: {formula: 'sum(A1:B2)'},
				B5: {formula: 'sum(21)'},
			} });
			// set some row props:
			const pm = sheet.properties;
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(1, 'linecolor', 'magenta');
			pm.setCellStyleFormat(2, 1, 'linecolor', 'green');

			sheet.pasteRows(range('A2:A6'), range('D8:D8'), { action: 'values' });
			// check content:
			expect(sheet.cellAt('A8').value).toBe(19);
			expect(sheet.cellAt('B8').value).toBe(42);
			expect(sheet.cellAt('A9')).toBeUndefined();
			expect(sheet.cellAt('A10').value).toBe(97);
			expect(sheet.cellAt('A10').formula).toBeUndefined();
			expect(sheet.cellAt('B11').value).toBe(21);
			expect(sheet.cellAt('B11').formula).toBeUndefined();
			// check properties:
			expect(pm.getRowStyleFormat(8, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(9, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(10, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getRowStyleFormat(11, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getColumnStyleFormat(1, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getColumnStyleFormat(1, 'linecolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(8, 1, 'linecolor')).toBe('magenta');
		});
		it('should use values of source rows on paste', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({ cells: { A1: 13, A2: { formula: 'sum(A1, 5)' }, A4: { formula: 'sum(A2,10)' } } });
			// check values before copy:
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('A2').value).toBe(18);
			expect(sheet.cellAt('A4').value).toBe(28);
			// we copy inside source range!
			sheet.pasteRows(range('A1:A4'), range('A2:A2'), { action: 'values' });
			expect(sheet.cellAt('A2').value).toBe(13);
			expect(sheet.cellAt('A3').value).toBe(18);
			expect(sheet.cellAt('A3').formula).toBeUndefined();
			expect(sheet.cellAt('A4')).toBeUndefined();
			expect(sheet.cellAt('A5').value).toBe(28);
			expect(sheet.cellAt('A5').formula).toBeUndefined();
		});
	});
});
describe('column paste', () => {
	// row paste can be only formulas, values, properties or ALL...
	describe('general', () => {
		it('should paste all cells within column to specified target', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13, B1: 23,
				A2: 19, B2: 42
			} });
			sheet.pasteColumns(range('A1:A1'), range('D4:D4'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(23);
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(42);
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('D2').value).toBe(19);
			sheet.pasteColumns(range('D1:F1'), range('B1:B1'));
			expect(sheet.cellAt('A1').value).toBe(13);
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(sheet.cellAt('A2').value).toBe(19);
			expect(sheet.cellAt('B2').value).toBe(19);
			expect(sheet.cellAt('D1')).toBeUndefined();
			expect(sheet.cellAt('D2')).toBeUndefined();
		});
		it('should be possible to paste multiple columns', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			sheet.pasteColumns(range('A1:C4'), range('D4:D4'));
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(19);
			expect(sheet.cellAt('E2').value).toBe(42);
			expect(sheet.cellAt('D3')).toBeUndefined();
			expect(sheet.cellAt('E3')).toBeUndefined();
			expect(sheet.cellAt('F4').value).toBe(97);
		});
		it('should be possible to paste columns to different sheet', () => {
			const sheet1 = setup();
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range1 = colRangeFactory(sheet1);
			const range2 = colRangeFactory(sheet2);
			sheet1.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			sheet1.pasteColumns(range1('A1:C4'), range2('D4:D4'));
			expect(sheet1.cellAt('A1').value).toBe(13);
			expect(sheet1.cellAt('B1').value).toBe(23);
			expect(sheet1.cellAt('A2').value).toBe(19);
			expect(sheet1.cellAt('B2').value).toBe(42);
			expect(sheet1.cellAt('C4').value).toBe(97);
			expect(sheet2.cellAt('D1').value).toBe(13);
			expect(sheet2.cellAt('E1').value).toBe(23);
			expect(sheet2.cellAt('D2').value).toBe(19);
			expect(sheet2.cellAt('E2').value).toBe(42);
			expect(sheet2.cellAt('D3')).toBeUndefined();
			expect(sheet2.cellAt('E3')).toBeUndefined();
			expect(sheet2.cellAt('F4').value).toBe(97);
		});
		it('should paste columns properties', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23,
				A2: 19, B2: 42,
				C4: { formula: 'sum(A1:B2)' }
			} });
			// set some row props:
			const pm = sheet.properties;
			pm.setColumnStyleFormat(1, 'fillcolor', 'red');
			pm.setColumnStyleFormat(2, 'linecolor', 'red');
			// target rows:
			pm.setColumnStyleFormat(3, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(4, 'fillcolor', 'green');
			pm.setColumnStyleFormat(5, 'fillcolor', 'cyan');
			pm.setColumnStyleFormat(5, 'linecolor', 'cyan');
			sheet.pasteColumns(range('A1:C4'), range('D5:D5'));
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(19);
			expect(sheet.cellAt('E2').value).toBe(42);
			expect(sheet.cellAt('D3')).toBeUndefined();
			expect(sheet.cellAt('E3')).toBeUndefined();
			expect(sheet.cellAt('F4').value).toBe(97);
			// check properties:
			expect(pm.getColumnStyleFormat(3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('red');
			expect(pm.getColumnStyleFormat(5, 'linecolor')).toBe('red');
			expect(pm.getColumnStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
	});
	describe('formats only', () => {
		it('should be possible to paste formats only', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23, D1: 'hello',
				A2: 19, B2: 42, D2: 'world'
			} });
			// set some column props:
			const pm = sheet.properties;
			pm.setColumnStyleFormat(0, 'fillcolor', 'red');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(3, 'fillcolor', 'green');
			pm.setCellStyleFormat(2, 3, 'linecolor', 'magenta');
			// target rows:
			pm.setRowStyleFormat(2, 'linecolor', 'magenta');
			pm.setCellStyleFormat(2, 4, 'fillcolor', 'cyan');

			sheet.pasteColumns(range('A1:C2'), range('D1:D1'), { action: 'formats' });
			// content is kept:
			expect(sheet.cellAt('D1').value).toBe('hello');
			expect(sheet.cellAt('D2').value).toBe('world');
			expect(sheet.cellAt('E1')).toBeUndefined();
			expect(sheet.cellAt('E2')).toBeUndefined();
			expect(sheet.cellAt('F1')).toBeUndefined();
			expect(sheet.cellAt('F2')).toBeUndefined();
			// check properties:
			expect(pm.getColumnStyleFormat(3, 'fillcolor')).toBe('red');
			expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('yellow');
			expect(pm.getColumnStyleFormat(5, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getColumnStyleFormat(5, 'linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
			expect(pm.getCellStyleFormat(2, 4, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(2, 4, 'linecolor')).toBe('magenta');
		});
		it('should use formats of source columns on paste', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23, C1: 'hello',
				A2: 19, B2: 42, C2: 'world'
			} });
			pm.setColumnStyleFormat(0, 'fillcolor', 'red');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(2, 'fillcolor', 'green');
			// we copy inside source range!
			sheet.pasteColumns(range('A1:C1'), range('B2:B2'), { action: 'formats' });
			expect(pm.getColumnStyleFormat(1, 'fillcolor')).toBe('red');
			expect(pm.getColumnStyleFormat(2, 'fillcolor')).toBe('yellow');
			expect(pm.getColumnStyleFormat(3, 'fillcolor')).toBe('green');
		});
	});
	describe('formulas only', () => {
		it('should be possible to paste formulas/content only', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23, D1: {formula: 'sum(21)'},
				A2: 19, B2: 42, D2: {formula: 'sum(A1:B2)'}
			} });

			// set some props:
			const pm = sheet.properties;
			pm.setColumnStyleFormat(0, 'fillcolor', 'red');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			// target rows:
			pm.setColumnStyleFormat(4, 'fillcolor', 'green');
			pm.setColumnStyleFormat(5, 'linecolor', 'magenta');
			pm.setCellStyleFormat(2, 6, 'linecolor', 'cyan');

			sheet.pasteColumns(range('A2:D2'), range('E1:E1'), { action: 'formulas' });
			// check content:
			expect(sheet.cellAt('E1').value).toBe(13);
			expect(sheet.cellAt('F1').value).toBe(23);
			expect(sheet.cellAt('G1')).toBeUndefined();
			expect(sheet.cellAt('H1').value).toBe(21);
			expect(sheet.cellAt('H1').formula).toBe('SUM(21)');
			expect(sheet.cellAt('E2').value).toBe(19);
			expect(sheet.cellAt('F2').value).toBe(42);
			expect(sheet.cellAt('G2')).toBeUndefined();
			expect(sheet.cellAt('H2').value).toBe(97);
			expect(sheet.cellAt('H2').formula).toBe('SUM(E1:F2)');
			// check properties:
			expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('green');
			expect(pm.getColumnStyleFormat(5, 'linecolor')).toBe('magenta');
			expect(pm.getCellStyleFormat(2, 6, 'linecolor')).toBe('cyan');
		});
		it('should use formula of source columns on paste', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: {formula: 'sum(21)'},
				C2: {formula: 'sum(A1:B1)'}
			} });
			sheet.pasteColumns(range('A1:C3'), range('B2:B2'), { action: 'formulas' });
			// check content
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(sheet.cellAt('C1').value).toBe(21);
			expect(sheet.cellAt('C1').formula).toBe('SUM(21)');
			expect(sheet.cellAt('C2')).toBeUndefined();
			expect(sheet.cellAt('D2').value).toBe(34);
			expect(sheet.cellAt('D2').formula).toBe('SUM(B1:C1)');
		});
	});
	describe('values only', () => {
		it('should be possible to paste values only', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: 23, D1: {formula: 'sum(21)'},
				A2: 19, B2: 42, D2: {formula: 'sum(A1:B2)'}
			} });
			// set some props:
			const pm = sheet.properties;
			pm.setColumnStyleFormat(0, 'fillcolor', 'red');
			pm.setColumnStyleFormat(1, 'fillcolor', 'yellow');
			// target rows:
			pm.setColumnStyleFormat(4, 'fillcolor', 'green');
			pm.setColumnStyleFormat(5, 'linecolor', 'magenta');
			pm.setCellStyleFormat(2, 6, 'linecolor', 'cyan');

			sheet.pasteColumns(range('A2:D2'), range('E1:E1'), { action: 'values' });
			// check content:
			expect(sheet.cellAt('E1').value).toBe(13);
			expect(sheet.cellAt('F1').value).toBe(23);
			expect(sheet.cellAt('G1')).toBeUndefined();
			expect(sheet.cellAt('H1').value).toBe(21);
			expect(sheet.cellAt('H1').formula).toBeUndefined();
			expect(sheet.cellAt('E2').value).toBe(19);
			expect(sheet.cellAt('F2').value).toBe(42);
			expect(sheet.cellAt('G2')).toBeUndefined();
			expect(sheet.cellAt('H2').value).toBe(97);
			expect(sheet.cellAt('H2').formula).toBeUndefined();
			// check properties:
			expect(pm.getColumnStyleFormat(4, 'fillcolor')).toBe('green');
			expect(pm.getColumnStyleFormat(5, 'linecolor')).toBe('magenta');
			expect(pm.getColumnStyleFormat(6, 'linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
			expect(pm.getCellStyleFormat(2, 6, 'linecolor')).toBe('cyan');
		});
		it('should use values of source rows on paste', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({ cells: {
				A1: 13,	B1: {formula: 'sum(21)'},
				C2: {formula: 'sum(A1:B1)'}
			} });
			sheet.pasteColumns(range('A1:C3'), range('B2:B2'), { action: 'values' });
			// check content
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(sheet.cellAt('C1').value).toBe(21);
			expect(sheet.cellAt('C1').formula).toBeUndefined();
			expect(sheet.cellAt('C2')).toBeUndefined();
			expect(sheet.cellAt('D2').value).toBe(34);
			expect(sheet.cellAt('D2').formula).toBeUndefined();
		});
	});
});
