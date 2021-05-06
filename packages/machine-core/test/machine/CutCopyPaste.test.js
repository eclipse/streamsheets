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
const { Machine, SheetIndex, SheetRange, StreamSheet } = require('../..');
const DEF_PROPS = require('../../defproperties.json');

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

describe.skip('cell paste', () => {
	describe('paste all', () => {
		it('should be possible to copy & paste cells from source range to target range', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			const descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'A2', value: 19 },
				{ reference: 'B2', value: 42 }
			];
			sheet.pasteCells(descriptors, range('D1:E2'));
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(19);
			expect(sheet.cellAt('E2').value).toBe(42);

			descriptors.push({ reference: 'C1' });
			descriptors.push({ reference: 'C2' });
			sheet.pasteCells(descriptors, range('B1:D2'), { action: 'all' });
			expect(sheet.cellAt('B1').value).toBe(13);
			expect(sheet.cellAt('C1').value).toBe(23);
			expect(sheet.cellAt('B2').value).toBe(19);
			expect(sheet.cellAt('C2').value).toBe(42);
			expect(sheet.cellAt('D1')).toBeUndefined();
			expect(sheet.cellAt('D2')).toBeUndefined();
		});
		it('should preserve order of copied cells', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			const descriptors = [{ reference: 'A1', value: 1 }, { reference: 'A2', value: 2 }];
			sheet.pasteCells(descriptors, range('D1:E2'));
			expect(sheet.cellAt('D1').value).toBe(1);
			expect(sheet.cellAt('E1').value).toBe(1);
			expect(sheet.cellAt('D2').value).toBe(2);
			expect(sheet.cellAt('E2').value).toBe(2);
		});
		it('should cut source cells if flag is specified', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42
				}
			});
			const descriptors = [
				{ reference: 'A1', value: 23 },
				{ reference: 'B1', value: 24 },
				{ reference: 'A2', value: 25 },
				{ reference: 'B2', value: 26 }
			];
			sheet.pasteCells(descriptors, range('D1:E2'), { action: 'all', cut: true });
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('A2')).toBeUndefined();
			expect(sheet.cellAt('B2')).toBeUndefined();
			expect(sheet.cellAt('D1').value).toBe(23);
			expect(sheet.cellAt('E1').value).toBe(24);
			expect(sheet.cellAt('D2').value).toBe(25);
			expect(sheet.cellAt('E2').value).toBe(26);
		});
		it('should be possible to paste cells to a different sheet', () => {
			const sheet1 = setup();
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range2 = rangeFactory(sheet2);
			const descriptors = [
				{ reference: 'A2', value: 23 },
				{ reference: 'A3', formula: 'A3+1' },
				{ reference: 'A4', formula: 'S1!A2+1', value: 24 }
			];
			sheet1.load({ cells: { A2: 42 } });
			sheet1.pasteCells(descriptors, range2('C5:C5'), { action: 'all' });
			expect(sheet2.cellAt('C5').value).toBe(23);
			expect(sheet2.cellAt('C6').value).toBe(1);
			expect(sheet2.cellAt('C6').formula).toBe('C6+1');
			expect(sheet2.cellAt('C7').value).toBe(24);
			expect(sheet2.cellAt('C7').formula).toBe('S1!C5+1');
		});
	});
	describe('paste with extend flag', () => {
		it('should extend target range', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [{ reference: 'A1', value: 13 }, { reference: 'B1', value: 23 }];
			sheet.pasteCells(descriptors, range('D1:F2'), { extend: true });
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('F1').value).toBe(13);
			expect(sheet.cellAt('G1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(13);
			expect(sheet.cellAt('E2').value).toBe(23);
			expect(sheet.cellAt('F2').value).toBe(13);
			expect(sheet.cellAt('G2').value).toBe(23);

			descriptors = [{ reference: 'A1', value: 45 }, { reference: 'A2', value: 54 }];
			sheet.pasteCells(descriptors, range('D1:D3'), { extend: true });
			expect(sheet.cellAt('D1').value).toBe(45);
			expect(sheet.cellAt('D2').value).toBe(54);
			expect(sheet.cellAt('D3').value).toBe(45);
			expect(sheet.cellAt('D4').value).toBe(54);
		});
		it('should extend in order of copied cells', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [{ reference: 'A1', value: 1 }, { reference: 'A2', value: 2 }];
			sheet.pasteCells(descriptors, range('D1:E1'), { extend: true });
			expect(sheet.cellAt('D1').value).toBe(1);
			expect(sheet.cellAt('E1').value).toBe(1);
			expect(sheet.cellAt('D2').value).toBe(2);
			expect(sheet.cellAt('E2').value).toBe(2);

			sheet.pasteCells(descriptors, range('D1:F5'), { extend: true });
			expect(sheet.cellAt('D1').value).toBe(1);
			expect(sheet.cellAt('E1').value).toBe(1);
			expect(sheet.cellAt('F1').value).toBe(1);
			expect(sheet.cellAt('D2').value).toBe(2);
			expect(sheet.cellAt('E2').value).toBe(2);
			expect(sheet.cellAt('F2').value).toBe(2);
			expect(sheet.cellAt('D3').value).toBe(1);
			expect(sheet.cellAt('E3').value).toBe(1);
			expect(sheet.cellAt('F3').value).toBe(1);
			expect(sheet.cellAt('D4').value).toBe(2);
			expect(sheet.cellAt('E4').value).toBe(2);
			expect(sheet.cellAt('F4').value).toBe(2);
			expect(sheet.cellAt('D5')).toBeUndefined();
			expect(sheet.cellAt('E5')).toBeUndefined();
			expect(sheet.cellAt('F5')).toBeUndefined();

			descriptors = [{ reference: 'A1', value: 1 }, { reference: 'B1', value: 2 }];
			sheet.pasteCells(descriptors, range('G1:I2'), { extend: true });
			expect(sheet.cellAt('G1').value).toBe(1);
			expect(sheet.cellAt('H1').value).toBe(2);
			expect(sheet.cellAt('I1').value).toBe(1);
			expect(sheet.cellAt('J1').value).toBe(2);
			expect(sheet.cellAt('G2').value).toBe(1);
			expect(sheet.cellAt('H2').value).toBe(2);
			expect(sheet.cellAt('I2').value).toBe(1);
			expect(sheet.cellAt('J2').value).toBe(2);
		});
		it('should not extend target range if flag is not set to true', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [{ reference: 'A1', value: 1 }, { reference: 'A2', value: 2 }];
			sheet.pasteCells(descriptors, range('D1:E3'));
			expect(sheet.cellAt('D1').value).toBe(1);
			expect(sheet.cellAt('E1').value).toBe(1);
			expect(sheet.cellAt('D2').value).toBe(2);
			expect(sheet.cellAt('E2').value).toBe(2);
			expect(sheet.cellAt('D3')).toBeUndefined();
			expect(sheet.cellAt('E3')).toBeUndefined();
			descriptors = [{ reference: 'A1', value: 1 }, { reference: 'B1', value: 2 }];
			sheet.pasteCells(descriptors, range('F1:H2'), { extend: false });
			expect(sheet.cellAt('F1').value).toBe(1);
			expect(sheet.cellAt('G1').value).toBe(2);
			expect(sheet.cellAt('H1')).toBeUndefined();
			expect(sheet.cellAt('F2').value).toBe(1);
			expect(sheet.cellAt('G2').value).toBe(2);
			expect(sheet.cellAt('H2')).toBeUndefined();
		});
		it('should work with extend and cut flags specified', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			const descriptors = [{ reference: 'A1', value: 13 }, { reference: 'B1', value: 23 }];
			sheet.load({ cells: { A1: 13, B1: 23 } });
			sheet.pasteCells(descriptors, range('D1:F2'), { cut: true, extend: true });
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('D1').value).toBe(13);
			expect(sheet.cellAt('E1').value).toBe(23);
			expect(sheet.cellAt('F1').value).toBe(13);
			expect(sheet.cellAt('G1').value).toBe(23);
			expect(sheet.cellAt('D2').value).toBe(13);
			expect(sheet.cellAt('E2').value).toBe(23);
			expect(sheet.cellAt('F2').value).toBe(13);
			expect(sheet.cellAt('G2').value).toBe(23);
		});
		it('should be possible to extend range of a different sheet', () => {
			const sheet1 = setup();
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range2 = rangeFactory(sheet2);
			const descriptors = [
				{ reference: 'A2', value: 23 },
				{ reference: 'A3' },
				{ reference: 'A4', formula: 'S1!A2+1', value: 24 }
			];
			sheet1.pasteCells(descriptors, range2('C5:C9'), { extend: true });
			expect(sheet2.cellAt('C5').value).toBe(23);
			expect(sheet2.cellAt('C6')).toBeUndefined();
			expect(sheet2.cellAt('C7').value).toBe(24);
			expect(sheet2.cellAt('C7').formula).toBe('S1!C5+1');
			expect(sheet2.cellAt('C8').value).toBe(23);
			expect(sheet2.cellAt('C9')).toBeUndefined();
			expect(sheet2.cellAt('C10').value).toBe(24);
			expect(sheet2.cellAt('C10').formula).toBe('S1!C5+1');
			expect(sheet2.cellAt('C11')).toBeUndefined();
		});
	});
	describe('paste formats only', () => {
		it('should be possible to paste formats only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			let descriptors = [
				{ reference: 'A1', properties: { formats: { styles: { fillcolor: 'red' } } } },
				{ reference: 'B1', properties: { formats: { styles: { fillcolor: 'yellow' } } } },
				{ reference: 'A2', properties: { formats: { styles: { linecolor: 'green' } } } },
				{ reference: 'B2', properties: { formats: { styles: { linecolor: 'blue' } } } }
			];
			sheet.load({ cells: { C5: 13, D5: { formula: 'D5+1' }, C6: 'hello', D6: 'world' } });
			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formats' });
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(6, 2, 'linecolor')).toBe('green');
			expect(pm.getCellStyleFormat(6, 3, 'linecolor')).toBe('blue');
			// content is kept:
			expect(sheet.cellAt('C5').value).toBe(13);
			expect(sheet.cellAt('D5').formula).toBe('D5+1');
			expect(sheet.cellAt('C6').value).toBe('hello');
			expect(sheet.cellAt('D6').value).toBe('world');

			// properties are replaced
			descriptors = [
				{ reference: 'C5', properties: { formats: { styles: { linecolor: 'blue' } } } },
				{ reference: 'D5', properties: { formats: { styles: { fillcolor: 'yellow' } } } }
			];
			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formats' });
			expect(pm.getCellStyleFormat(5, 2, 'linecolor')).toBe('blue');
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(5, 3, 'linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
			// content is kept:
			expect(sheet.cellAt('C5').value).toBe(13);
			expect(sheet.cellAt('D5').formula).toBe('D5+1');
			expect(sheet.cellAt('C6').value).toBe('hello');
			expect(sheet.cellAt('D6').value).toBe('world');
		});
	});
	describe('paste formulas only', () => {
		it('should be possible to paste formulas/content only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			const descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'A2', formula: 'sum(A1,B2)' },
				{ reference: 'B2', value: 'hello' }
			];
			// define some cell styles:
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(1, 'fillcolor', 'green');
			pm.setCellStyleFormat(2, 1, 'fillcolor', 'cyan');
			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(1, 1, 'fillcolor')).toBe('green');
			expect(pm.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('cyan');

			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formulas' });
			// check content
			expect(sheet.cellAt('C5')).toBeUndefined();
			expect(sheet.cellAt('D5')).toBeUndefined();
			expect(sheet.cellAt('C6').formula).toBe('SUM(C5,D6)');
			expect(sheet.cellAt('D6')).toBeUndefined();
			// check properties:
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);

			sheet.load({ cells: { C5: 42, D5: 17, C6: { formula: 'cos(0)' }, D6: 'world' } });
			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formulas' });
			// check content
			expect(sheet.cellAt('C5').value).toBe(42);
			expect(sheet.cellAt('D5').value).toBe(17);
			expect(sheet.cellAt('C6').formula).toBe('SUM(C5,D6)');
			expect(sheet.cellAt('D6').value).toBe('world');
			// check properties:
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
	});
	describe('paste values only', () => {
		it('should be possible to paste values only', () => {
			const sheet = setup();
			const pm = sheet.properties;
			const range = rangeFactory(sheet);
			const descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'A2', formula: 'sum(A1,B1)', value: 36 },
				{ reference: 'B2', value: 'hello' }
			];
			// define some cell styles:
			pm.setRowStyleFormat(1, 'fillcolor', 'red');
			pm.setRowStyleFormat(2, 'fillcolor', 'yellow');
			pm.setColumnStyleFormat(1, 'fillcolor', 'green');
			pm.setCellStyleFormat(2, 1, 'fillcolor', 'cyan');
			expect(pm.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
			expect(pm.getCellStyleFormat(1, 1, 'fillcolor')).toBe('green');
			expect(pm.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
			expect(pm.getCellStyleFormat(2, 1, 'fillcolor')).toBe('cyan');

			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'values' });
			// check content
			expect(sheet.cellAt('C5').value).toBe(13);
			expect(sheet.cellAt('D5').value).toBe(23);
			expect(sheet.cellAt('C6').value).toBe(36);
			expect(sheet.cellAt('C6').formula).toBeUndefined();
			expect(sheet.cellAt('D6').value).toBe('hello');
			// check properties:
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);

			sheet.load({ cells: { C5: 42, D5: 17, E5: 'hello', C6: { formula: 'cos(0)' }, D6: 'world', E6: 23 } });
			sheet.pasteCells(descriptors, range('C5:D6'), { action: 'values' });
			// check content
			expect(sheet.cellAt('C5').value).toBe(13);
			expect(sheet.cellAt('D5').value).toBe(23);
			expect(sheet.cellAt('E5').value).toBe('hello');
			expect(sheet.cellAt('C6').value).toBe(36);
			expect(sheet.cellAt('C6').formula).toBe('COS(0)');
			expect(sheet.cellAt('D6').value).toBe('hello');
			expect(sheet.cellAt('E6').value).toBe(23);
			// check properties:
			expect(pm.getCellStyleFormat(5, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(5, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
			expect(pm.getCellStyleFormat(6, 3, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		});
	});
	describe('returned changed object', () => {
		it('should contain a list of changed descriptors', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'A2', value: 19 },
				{ reference: 'B2', value: 42 }
			];
			let result = sheet.pasteCells(descriptors, range('D1:E2'));
			expect(result).toBeDefined();
			expect(result.cellsCut).toEqual([]);
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsReplaced[0]).toEqual({ reference: 'D1' });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'E1' });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'D2' });
			expect(result.cellsReplaced[3]).toEqual({ reference: 'E2' });
			descriptors = [
				{ reference: 'A1', value: 56 },
				{ reference: 'B1', value: 78 },
				{ reference: 'A2', value: 90 },
				{ reference: 'B2', value: 12 }
			];
			result = sheet.pasteCells(descriptors, range('D1:E2'));
			expect(result.cellsCut).toEqual([]);
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsReplaced[0]).toEqual({ reference: 'D1', value: 13 });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'E1', value: 23 });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'D2', value: 19 });
			expect(result.cellsReplaced[3]).toEqual({ reference: 'E2', value: 42 });
		});
		it('should contain descriptors of cut cells', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'C1', value: 19 }
			];
			sheet.load({ cells: { A1: 23, B1: 'hello', C1: { formula: 'cos(0)' } } });
			let result = sheet.pasteCells(descriptors, range('D1:D1'), { cut: true });
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsCut[0]).toEqual({ reference: 'A1', value: 23 });
			expect(result.cellsCut[1]).toEqual({ reference: 'B1', value: 'hello' });
			expect(result.cellsCut[2]).toEqual({ reference: 'C1', formula: 'COS(0)', value: 1 });
			expect(result.cellsReplaced[0]).toEqual({ reference: 'D1' });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'E1' });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'F1' });

			descriptors = [
				{ reference: 'A1', value: 13 },
				{ reference: 'B1', value: 23 },
				{ reference: 'C1', value: 19 }
			];
			result = sheet.pasteCells(descriptors, range('D1:D1'), { cut: true });
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsCut[0]).toEqual({ reference: 'A1' });
			expect(result.cellsCut[1]).toEqual({ reference: 'B1' });
			expect(result.cellsCut[2]).toEqual({ reference: 'C1' });
			expect(result.cellsReplaced[0]).toEqual({ reference: 'D1', value: 13 });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'E1', value: 23 });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'F1', value: 19 });
		});
		it('should contain target sheet id', () => {
			const sheet1 = setup();
			const sheet2 = sheet1.machine.getStreamSheetByName('S2').sheet;
			const range2 = rangeFactory(sheet2);
			const descriptors = [
				{ reference: 'A2', value: 23 },
				{ reference: 'A3', formula: 'A3+1' },
				{ reference: 'A4', formula: 'S1!A2+1', value: 24 }
			];
			sheet1.load({ cells: { A2: 23 } });
			let result = sheet1.pasteCells(descriptors, range2('C5:C5'), { action: 'all', cut: true });
			expect(result.targetsheetId).toBe(sheet2.streamsheet.id);
			expect(result.cellsCut[0]).toEqual({ reference: 'A2', value: 23 });
			expect(result.cellsCut[1]).toEqual({ reference: 'A3' });
			expect(result.cellsCut[2]).toEqual({ reference: 'A4' });
			expect(result.cellsReplaced[0]).toEqual({ reference: 'C5' });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'C6' });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'C7' });

			result = sheet1.pasteCells(descriptors, range2('C5:C5'), { action: 'all', cut: true });
			expect(result.targetsheetId).toBe(sheet2.streamsheet.id);
			expect(result.cellsCut[0]).toEqual({ reference: 'A2' });
			expect(result.cellsCut[1]).toEqual({ reference: 'A3' });
			expect(result.cellsCut[2]).toEqual({ reference: 'A4' });
			expect(result.cellsReplaced[0]).toEqual({ reference: 'C5', value: 23 });
			expect(result.cellsReplaced[1]).toEqual({ reference: 'C6', value: 1, formula: 'C6+1' });
			expect(result.cellsReplaced[2]).toEqual({ reference: 'C7', value: 24, formula: 'S1!C5+1' });
		});
		it('should contain properties of replaced cells', () => {
			const sheet = setup();
			const range = rangeFactory(sheet);
			let descriptors = [
				{ reference: 'A1', properties: { formats: { styles: { fillcolor: 'red' } } } },
				{ reference: 'B1', properties: { formats: { styles: { linecolor: 'cyan' } } } },
				{ reference: 'A2', properties: { formats: { styles: { fillcolor: 'green' } } } },
				{ reference: 'B2', properties: { formats: { styles: { linecolor: 'blue' } } } }
			];
			let result = sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formats' });
			expect(result.cellsCut).toEqual([]);
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsReplaced.length).toBe(4);
			expect(result.cellsReplaced[0].properties).toBeUndefined();
			expect(result.cellsReplaced[1].properties).toBeUndefined();
			expect(result.cellsReplaced[2].properties).toBeUndefined();
			expect(result.cellsReplaced[3].properties).toBeUndefined();
			// properties are replaced
			descriptors = [
				{ reference: 'C5', properties: { formats: { styles: { fillcolor: 'green' } } } },
				{ reference: 'D5', properties: { formats: { styles: { linecolor: 'yellow' } } } },
				{ reference: 'C6', properties: { formats: { styles: { fillcolor: 'red' } } } },
				{ reference: 'D6', properties: { formats: { styles: { linecolor: 'cyan' } } } }
			];
			result = sheet.pasteCells(descriptors, range('C5:D6'), { action: 'formats' });
			expect(result.cellsCut).toEqual([]);
			expect(result.targetsheetId).toBe(sheet.streamsheet.id);
			expect(result.cellsReplaced.length).toBe(4);
			expect(result.cellsReplaced[0]).toEqual({
				reference: 'C5',
				properties: { formats: { styles: { fillcolor: 'red' } } }
			});
			expect(result.cellsReplaced[1]).toEqual({
				reference: 'D5',
				properties: { formats: { styles: { linecolor: 'cyan' } } }
			});
			expect(result.cellsReplaced[2]).toEqual({
				reference: 'C6',
				properties: { formats: { styles: { fillcolor: 'green' } } }
			});
			expect(result.cellsReplaced[3]).toEqual({
				reference: 'D6',
				properties: { formats: { styles: { linecolor: 'blue' } } }
			});
		});
	});
});

describe.skip('row paste', () => {
	// row paste can be only formulas, values, properties or ALL...
	describe('general', () => {
		it('should paste all cells within row to specified target', () => {
			const sheet = setup();
			const range = rowRangeFactory(sheet);
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet1.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					A5: 'hello',
					B6: 'world'
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					A4: { formula: 'sum(A1:B2)' },
					B5: { formula: 'sum(21)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					A4: { formula: 'sum(A1:B2)' },
					B5: { formula: 'sum(21)' }
				}
			});
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
describe.skip('column paste', () => {
	// row paste can be only formulas, values, properties or ALL...
	describe('general', () => {
		it('should paste all cells within column to specified target', () => {
			const sheet = setup();
			const range = colRangeFactory(sheet);
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet1.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					A2: 19,
					B2: 42,
					C4: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					D1: 'hello',
					A2: 19,
					B2: 42,
					D2: 'world'
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					C1: 'hello',
					A2: 19,
					B2: 42,
					C2: 'world'
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					D1: { formula: 'sum(21)' },
					A2: 19,
					B2: 42,
					D2: { formula: 'sum(A1:B2)' }
				}
			});

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
			sheet.load({
				cells: {
					A1: 13,
					B1: { formula: 'sum(21)' },
					C2: { formula: 'sum(A1:B1)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: 23,
					D1: { formula: 'sum(21)' },
					A2: 19,
					B2: 42,
					D2: { formula: 'sum(A1:B2)' }
				}
			});
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
			sheet.load({
				cells: {
					A1: 13,
					B1: { formula: 'sum(21)' },
					C2: { formula: 'sum(A1:B1)' }
				}
			});
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
