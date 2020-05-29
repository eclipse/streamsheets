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
const DEF_PROPS = require('../../defproperties.json');
const { functions } = require('../utils');
const { Cell, Machine, Sheet, SheetParser,SheetRange, StreamSheet } = require('../..');
const { Term } = require('@cedalo/parser');

beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
});

const setup = () => {
	const machine = new Machine();
	const t1 = new StreamSheet();
	machine.addStreamSheet(t1);
	return t1.sheet;
};
const rangeFactory = (sheet) => (str) => {
	const range = SheetRange.fromRangeStr(str);
	range.sheet = sheet;
	return range;
};

describe('insert rows', () => {
	it('should be possible to insert single row', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, A1: { formula: 'A1+1' }, B1: { formula: 'row()' }, C1: { formula: 'row()+1' }
		} });
		// cannot insert at 0:
		expect(sheet.insertRowsAt(0)).toBeFalsy();
		expect(sheet.insertRowsAt(1)).toBeTruthy();
		// check that row is one below now:
		expect(sheet.cellAt('COMMENT1')).toBeUndefined();
		expect(sheet.cellAt('IF1')).toBeUndefined();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('COMMENT2').value).toBe('test');
		expect(sheet.cellAt('IF2').value).toBe(false);
		expect(sheet.cellAt('A2').value).toBe(1);
	});
	it('should be possible to insert multiple rows', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, A1: { formula: 'A1+1' }, B1: { formula: 'row()' }, C1: { formula: 'row()+1' }
		} });
		// cannot insert at 0:
		expect(sheet.insertRowsAt(0, 3)).toBeFalsy();
		expect(sheet.insertRowsAt(1, 5)).toBeTruthy();
		// check that row is one below now:
		expect(sheet.cellAt('COMMENT1')).toBeUndefined();
		expect(sheet.cellAt('IF1')).toBeUndefined();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('COMMENT6').value).toBe('test');
		expect(sheet.cellAt('IF6').value).toBe(false);
		expect(sheet.cellAt('A6').value).toBe(1);
	});
	it('should adjust references and functions in affected cells after inserting single row', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 42, C1: { formula: 'C4+2' }, D1: { formula: 'D1+1' },
			A2: { formula: 'A2+1' }, B2: { formula: 'row()' }, C2: { formula: 'row()+1' },
			A4: { formula: 'A2+1' }, B4: { formula: 'B1+3' }, C4: 23
		} });
		expect(sheet.insertRowsAt(2)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('B1').value).toBe(42);
		expect(sheet.cellAt('C1').value).toBe(2);
		expect(sheet.cellAt('C1').formula).toBe('C5+2');
		expect(sheet.cellAt('D1').value).toBe(1);
		expect(sheet.cellAt('D1').formula).toBe('D1+1');
		expect(sheet.cellAt('A3').value).toBe(1);
		expect(sheet.cellAt('A3').formula).toBe('A3+1');
		expect(sheet.cellAt('B3').value).toBe(2);	// <-- because its the prev. value! is it wrong behaviour?
		expect(sheet.cellAt('B3').formula).toBe('ROW()');
		expect(sheet.cellAt('C3').value).toBe(3);	// <-- because its the prev. value! is it wrong behaviour?
		expect(sheet.cellAt('C3').formula).toBe('ROW()+1');
		expect(sheet.cellAt('A5').value).toBe(2);
		expect(sheet.cellAt('A5').formula).toBe('A3+1');
		expect(sheet.cellAt('B5').value).toBe(45);
		expect(sheet.cellAt('B5').formula).toBe('B1+3');
	});
	it('should adjust sheet-range references in formulas of affected cells after inserting single row', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		// insert row before:
		expect(sheet.insertRowsAt(1)).toBeTruthy();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('A3').value).toBe(12);
		expect(sheet.cellAt('B3').value).toBe(12);
		expect(sheet.cellAt('A4').value).toBe(48);
		expect(sheet.cellAt('A4').formula).toBe('SUM(A2:B3)');
		// inbetween
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertRowsAt(2)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('A3').value).toBe(12);
		expect(sheet.cellAt('B3').value).toBe(12);
		expect(sheet.cellAt('A4').value).toBe(48);
		expect(sheet.cellAt('A4').formula).toBe('SUM(A1:B3)');
		// after
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertRowsAt(3)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('A4').value).toBe(48);
		expect(sheet.cellAt('A4').formula).toBe('SUM(A1:B2)');
	});
	it('should adjust references and functions in affected cells after inserting multiple rows', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 42, C1: { formula: 'C4+2' }, D1: { formula: 'D1+1' },
			A2: { formula: 'A2+1' }, B2: { formula: 'row()' }, C2: { formula: 'row()+1' },
			A4: { formula: 'A2+1' }, B4: { formula: 'B1+3' }, C4: 23
		} });
		expect(sheet.insertRowsAt(2, 4)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('B1').value).toBe(42);
		expect(sheet.cellAt('C1').value).toBe(2);
		expect(sheet.cellAt('C1').formula).toBe('C8+2');
		expect(sheet.cellAt('D1').value).toBe(1);
		expect(sheet.cellAt('D1').formula).toBe('D1+1');
		expect(sheet.cellAt('A6').value).toBe(1);
		expect(sheet.cellAt('A6').formula).toBe('A6+1');
		expect(sheet.cellAt('B6').value).toBe(2);	// <-- because its the prev. value! is it wrong behaviour?
		expect(sheet.cellAt('B6').formula).toBe('ROW()');
		expect(sheet.cellAt('C6').value).toBe(3);	// <-- because its the prev. value! is it wrong behaviour?
		expect(sheet.cellAt('C6').formula).toBe('ROW()+1');
		expect(sheet.cellAt('A8').value).toBe(2);
		expect(sheet.cellAt('A8').formula).toBe('A6+1');
		expect(sheet.cellAt('B8').value).toBe(45);
		expect(sheet.cellAt('B8').formula).toBe('B1+3');
	});
	it('should adjust sheet-range references in formulas of affected cells after inserting multiple rows', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		// insert row before:
		expect(sheet.insertRowsAt(1, 6)).toBeTruthy();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('A7').value).toBe(12);
		expect(sheet.cellAt('B7').value).toBe(12);
		expect(sheet.cellAt('A8').value).toBe(12);
		expect(sheet.cellAt('B8').value).toBe(12);
		expect(sheet.cellAt('A9').value).toBe(48);
		expect(sheet.cellAt('A9').formula).toBe('SUM(A7:B8)');
		// inbetween
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertRowsAt(2, 6)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('A8').value).toBe(12);
		expect(sheet.cellAt('B8').value).toBe(12);
		expect(sheet.cellAt('A9').value).toBe(48);
		expect(sheet.cellAt('A9').formula).toBe('SUM(A1:B8)');
		// after
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertRowsAt(3, 6)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('A9').value).toBe(48);
		expect(sheet.cellAt('A9').formula).toBe('SUM(A1:B2)');
	});
	it('should keep properties of moved rows after inserting single row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let rowprops = props.getRowProperties(0);
		expect(rowprops).toBeUndefined();
		rowprops = props.getRowProperties(1);
		expect(rowprops).toBeDefined();
		// check some props:
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some row  props:
		props.setRowAttribute(1, 'initialsection', 3);
		props.setRowTextFormat(1, 'fontsize', 23);
		props.setRowStyleFormat(1, 'linecolor', 'red');
		props.setRowAttribute(10, 'initialsection', 13);
		props.setRowTextFormat(10, 'fontsize', 42);
		props.setRowStyleFormat(10, 'linecolor', 'blue');
		// insert new row:
		sheet.insertRowsAt(1);
		// new row at 1 should have def props
		rowprops = props.getRowProperties(1);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		rowprops = props.getRowProperties(10);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// row at 2 should have our set props
		rowprops = props.getRowProperties(2);
		expect(rowprops.getAttribute('initialsection')).toBe(3);
		expect(rowprops.getTextFormat('fontsize')).toBe(23);
		expect(rowprops.getStyleFormat('linecolor')).toBe('red');
		rowprops = props.getRowProperties(11);
		expect(rowprops.getAttribute('initialsection')).toBe(13);
		expect(rowprops.getTextFormat('fontsize')).toBe(42);
		expect(rowprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved rows after inserting multiple rows', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let rowprops = props.getRowProperties(0);
		expect(rowprops).toBeUndefined();
		rowprops = props.getRowProperties(1);
		expect(rowprops).toBeDefined();
		// check some props:
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some row  props:
		props.setRowAttribute(1, 'initialsection', 3);
		props.setRowTextFormat(1, 'fontsize', 23);
		props.setRowStyleFormat(1, 'linecolor', 'red');
		props.setRowAttribute(10, 'initialsection', 13);
		props.setRowTextFormat(10, 'fontsize', 42);
		props.setRowStyleFormat(10, 'linecolor', 'blue');
		// insert new row:
		sheet.insertRowsAt(1, 4);
		// new rows at 1 & 10 should have def props
		rowprops = props.getRowProperties(1);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		rowprops = props.getRowProperties(10);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// rows at 5 & 14 should have our set props
		rowprops = props.getRowProperties(5);
		expect(rowprops.getAttribute('initialsection')).toBe(3);
		expect(rowprops.getTextFormat('fontsize')).toBe(23);
		expect(rowprops.getStyleFormat('linecolor')).toBe('red');
		rowprops = props.getRowProperties(14);
		expect(rowprops.getAttribute('initialsection')).toBe(13);
		expect(rowprops.getTextFormat('fontsize')).toBe(42);
		expect(rowprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved cells after inserting single row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 3, 'fillcolor', 'red');
		sheet.insertRowsAt(1);
		// row at 2 and cells at (2,2) & (2,3) should have default styles...
		expect(props.getRowProperties(2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,3).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// changed rows and cells should be one below now...
		expect(props.getRowProperties(3).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(3,2).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(3,3).getStyleFormat('fillcolor')).toBe('red');
	});
	it('should keep properties of moved cells after inserting multiple row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 3, 'fillcolor', 'red');
		sheet.insertRowsAt(1, 6);
		// row at 2 and cells at (2,2) & (2,3) should have default styles...
		expect(props.getRowProperties(2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,3).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// changed rows and cells should be one below now...
		expect(props.getRowProperties(8).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(8,2).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(8,3).getStyleFormat('fillcolor')).toBe('red');
	});
});
describe('insert columns', () => {
	it('should be possible to insert single column', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, A1: { formula: 'A1+1' }, B1: { formula: 'column()' }, C1: { formula: 'column()+1' }
		} });
		// cannot insert below 0:
		expect(sheet.insertColumnsAt(-1)).toBeFalsy();
		expect(sheet.insertColumnsAt(0)).toBeTruthy();
		// check that columns are moved to right:
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1').value).toBe(1);
		expect(sheet.cellAt('C1').value).toBe(2);
		expect(sheet.cellAt('D1').value).toBe(4);
	});
	it('should be possible to insert multiple columns', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, A1: { formula: 'A1+1' }, B1: { formula: 'column()' }, C1: { formula: 'column()+1' }
		} });
		expect(sheet.cellAt('B1').value).toBe(2);
		expect(sheet.cellAt('C1').value).toBe(4);
		expect(sheet.insertColumnsAt(0, 5)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('E1')).toBeUndefined();
		expect(sheet.cellAt('F1').value).toBe(1);
		expect(sheet.cellAt('G1').value).toBe(2);
		expect(sheet.cellAt('H1').value).toBe(4);
		expect(sheet.cellAt('I1')).toBeUndefined();
	});
	it('should adjust references and functions in affected cells after insert single column', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 13, C1: { formula: 'A2' }, D1: { formula: 'B1+1' },
			A2: 42,  B2: { formula: 'A2' }, C2: { formula: 'B2+1' }, D2: { formula: 'B4+1' },
			A3: { formula: 'C2+2' }, B3: { formula: 'A4' }, C3: { formula: 'B4' },
			A4: { formula: 'A2+1' }, B4: 23
		} });
		// check values before inserting
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('B1').value).toBe(13);
		expect(sheet.cellAt('B2').value).toBe(42);
		expect(sheet.cellAt('B3').value).toBe(0);
		expect(sheet.cellAt('B4').value).toBe(23);
		expect(sheet.cellAt('C1').value).toBe(0);
		expect(sheet.cellAt('C2').value).toBe(43);
		expect(sheet.cellAt('C3').value).toBe(0);
		expect(sheet.cellAt('C3').formula).toBe('B4');
		expect(sheet.cellAt('D1').value).toBe(14);
		expect(sheet.cellAt('D2').value).toBe(1);
		//
		expect(sheet.insertColumnsAt(1)).toBeTruthy();
		// A column:
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A3').formula).toBe('D2+2');
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('A4').formula).toBe('A2+1');
		// B column should be empty now:
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('B4')).toBeUndefined();
		// C column
		expect(sheet.cellAt('C1').value).toBe(13);
		expect(sheet.cellAt('C2').value).toBe(42);
		expect(sheet.cellAt('C2').formula).toBe('A2');
		expect(sheet.cellAt('C3').value).toBe(0);
		expect(sheet.cellAt('C3').formula).toBe('A4');
		expect(sheet.cellAt('C4').value).toBe(23);
		// D column
		expect(sheet.cellAt('D1').value).toBe(0);
		expect(sheet.cellAt('D1').formula).toBe('A2');
		expect(sheet.cellAt('D2').value).toBe(43);
		expect(sheet.cellAt('D2').formula).toBe('C2+1');
		expect(sheet.cellAt('D3').value).toBe(0);
		expect(sheet.cellAt('D3').formula).toBe('C4');
		// E column
		expect(sheet.cellAt('E1').value).toBe(14);
		expect(sheet.cellAt('E1').formula).toBe('C1+1');
		expect(sheet.cellAt('E2').value).toBe(1);
		expect(sheet.cellAt('E2').formula).toBe('C4+1');
	});
	it('should adjust sheet-range references in formulas of affected cells after inserting single column', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		// insert row before:
		expect(sheet.insertColumnsAt(0)).toBeTruthy();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('C1').value).toBe(12);
		expect(sheet.cellAt('C2').value).toBe(12);
		expect(sheet.cellAt('B3').value).toBe(48);
		expect(sheet.cellAt('B3').formula).toBe('SUM(B1:C2)');
		// inbetween
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertColumnsAt(1)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe(12);
		expect(sheet.cellAt('C2').value).toBe(12);
		expect(sheet.cellAt('A3').value).toBe(48);
		expect(sheet.cellAt('A3').formula).toBe('SUM(A1:C2)');
		// after
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertColumnsAt(2)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('A3').value).toBe(48);
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('A3').formula).toBe('SUM(A1:B2)');
	});

	it('should adjust references and functions in affected cells after inserting multiple columns', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 13, C1: { formula: 'A2' }, D1: { formula: 'B1+1' },
			A2: 42,  B2: { formula: 'A2' }, C2: { formula: 'B2+1' }, D2: { formula: 'B4+1' },
			A3: { formula: 'C2+2' }, B3: { formula: 'A4' }, C3: { formula: 'B4' },
			A4: { formula: 'A2+1' }, B4: 23
		} });
		expect(sheet.insertColumnsAt(1, 4)).toBeTruthy();
		// A column:
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A3').formula).toBe('G2+2');
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('A4').formula).toBe('A2+1');
		// B - E columns should be empty now:
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('B4')).toBeUndefined();
		expect(sheet.cellAt('E1')).toBeUndefined();
		expect(sheet.cellAt('E4')).toBeUndefined();
		// F column
		expect(sheet.cellAt('F1').value).toBe(13);
		expect(sheet.cellAt('F2').value).toBe(42);
		expect(sheet.cellAt('F2').formula).toBe('A2');
		expect(sheet.cellAt('F3').value).toBe(0);
		expect(sheet.cellAt('F3').formula).toBe('A4');
		expect(sheet.cellAt('F4').value).toBe(23);
		// G column
		expect(sheet.cellAt('G1').value).toBe(0);
		expect(sheet.cellAt('G1').formula).toBe('A2');
		expect(sheet.cellAt('G2').value).toBe(43);
		expect(sheet.cellAt('G2').formula).toBe('F2+1');
		expect(sheet.cellAt('G3').value).toBe(0);
		expect(sheet.cellAt('G3').formula).toBe('F4');
		// F column
		expect(sheet.cellAt('H1').value).toBe(14);
		expect(sheet.cellAt('H1').formula).toBe('F1+1');
		expect(sheet.cellAt('H2').value).toBe(1);
		expect(sheet.cellAt('H2').formula).toBe('F4+1');
	});
	it('should adjust sheet-range references in formulas of affected cells after inserting multiple columns', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		// insert row before:
		expect(sheet.insertColumnsAt(0, 6)).toBeTruthy();
		expect(sheet.cellAt('F1')).toBeUndefined();
		expect(sheet.cellAt('F2')).toBeUndefined();
		expect(sheet.cellAt('F3')).toBeUndefined();
		expect(sheet.cellAt('G1').value).toBe(12);
		expect(sheet.cellAt('G2').value).toBe(12);
		expect(sheet.cellAt('H1').value).toBe(12);
		expect(sheet.cellAt('H2').value).toBe(12);
		expect(sheet.cellAt('G3').value).toBe(48);
		expect(sheet.cellAt('G3').formula).toBe('SUM(G1:H2)');
		// inbetween
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertColumnsAt(1, 6)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('H1').value).toBe(12);
		expect(sheet.cellAt('H2').value).toBe(12);
		expect(sheet.cellAt('A3').value).toBe(48);
		expect(sheet.cellAt('A3').formula).toBe('SUM(A1:H2)');
		// after
		sheet.load({ cells: {
			A1: 12, B1: 12,
			A2: 12, B2: 12,
			A3: { formula: 'sum(A1:B2)' }
		} });
		expect(sheet.insertColumnsAt(2, 6)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('A2').value).toBe(12);
		expect(sheet.cellAt('B1').value).toBe(12);
		expect(sheet.cellAt('B2').value).toBe(12);
		expect(sheet.cellAt('A3').value).toBe(48);
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('A3').formula).toBe('SUM(A1:B2)');
	});
	it('should keep properties of moved columns after insert single column', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let colprops = props.getColumnProperties(0);
		expect(colprops).toBeDefined();
		// check some props:
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some col props:
		props.setColumnAttribute(1, 'initialsection', 3);
		props.setColumnTextFormat(1, 'fontsize', 23);
		props.setColumnStyleFormat(1, 'linecolor', 'red');
		props.setColumnAttribute(10, 'initialsection', 13);
		props.setColumnTextFormat(10, 'fontsize', 42);
		props.setColumnStyleFormat(10, 'linecolor', 'blue');
		// insert new column:
		sheet.insertColumnsAt(1);
		// new column at 1 should have def props
		colprops = props.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		colprops = props.getColumnProperties(10);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// columns at 2 & 11 should have our set props
		colprops = props.getColumnProperties(2);
		expect(colprops.getAttribute('initialsection')).toBe(3);
		expect(colprops.getTextFormat('fontsize')).toBe(23);
		expect(colprops.getStyleFormat('linecolor')).toBe('red');
		colprops = props.getColumnProperties(11);
		expect(colprops.getAttribute('initialsection')).toBe(13);
		expect(colprops.getTextFormat('fontsize')).toBe(42);
		expect(colprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved columns after inserting multiple columns', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let colprops = props.getColumnProperties(0);
		expect(colprops).toBeDefined();
		// check some props:
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some columns  props:
		props.setColumnAttribute(1, 'initialsection', 3);
		props.setColumnTextFormat(1, 'fontsize', 23);
		props.setColumnStyleFormat(1, 'linecolor', 'red');
		props.setColumnAttribute(10, 'initialsection', 13);
		props.setColumnTextFormat(10, 'fontsize', 42);
		props.setColumnStyleFormat(10, 'linecolor', 'blue');
		// insert new columns:
		sheet.insertColumnsAt(1, 4);
		// new columns at 1 & 10 should have def props
		colprops = props.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		colprops = props.getColumnProperties(10);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// columns at 5 & 14 should have our set props
		colprops = props.getColumnProperties(5);
		expect(colprops.getAttribute('initialsection')).toBe(3);
		expect(colprops.getTextFormat('fontsize')).toBe(23);
		expect(colprops.getStyleFormat('linecolor')).toBe('red');
		colprops = props.getColumnProperties(14);
		expect(colprops.getAttribute('initialsection')).toBe(13);
		expect(colprops.getTextFormat('fontsize')).toBe(42);
		expect(colprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved cells after inserting single column', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setColumnStyleFormat(2, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 4, 'fillcolor', 'red');
		sheet.insertColumnsAt(1);
		// column at 2 and cells at (2,2) & (2,4) should have default styles...
		expect(props.getColumnProperties(2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,4).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// changed column and cells should be one to right now...
		expect(props.getColumnProperties(3).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2,3).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(2,5).getStyleFormat('fillcolor')).toBe('red');
	});
	it('should keep properties of moved cells after inserting multiple columns', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setColumnStyleFormat(2, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 4, 'fillcolor', 'red');
		sheet.insertColumnsAt(1, 6);
		expect(props.getColumnProperties(2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,4).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getColumnProperties(8).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2, 8).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(2, 10).getStyleFormat('fillcolor')).toBe('red');
	});
});
describe('delete rows', () => {
	it('should be possible to delete single row', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT2: 'test', IF2: false, A2: { formula: 'A2+1' }, B2: { formula: 'row()' }, C2: { formula: 'row()+1' }
		} });
		// cannot delete at 0:
		expect(sheet.deleteRowsAt(0)).toBeFalsy();
		expect(sheet.deleteRowsAt(1)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(2);
		expect(sheet.cellAt('C1').value).toBe(3);
		expect(sheet.cellAt('COMMENT2')).toBeUndefined();
		expect(sheet.cellAt('IF2')).toBeUndefined();
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		// once again...
		expect(sheet.deleteRowsAt(1)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1')).toBeUndefined();
		expect(sheet.cellAt('IF1')).toBeUndefined();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.deleteRowsAt(1)).toBeTruthy();
	});
	it('should be possible to delete multiple rows', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT6: 'test', IF6: false, A6: { formula: 'A6+1' }, B6: { formula: 'row()' }, C6: { formula: 'row()+1' }
		} });
		expect(sheet.deleteRowsAt(1, 5)).toBeTruthy();
		expect(sheet.cellAt('COMMENT6')).toBeUndefined();
		expect(sheet.cellAt('IF6')).toBeUndefined();
		expect(sheet.cellAt('A6')).toBeUndefined();
		expect(sheet.cellAt('B6')).toBeUndefined();
		expect(sheet.cellAt('C6')).toBeUndefined();
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(6);
		expect(sheet.cellAt('C1').value).toBe(7);
		// once again...
		expect(sheet.deleteRowsAt(1, 5)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1')).toBeUndefined();
		expect(sheet.cellAt('IF1')).toBeUndefined();
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.deleteRowsAt(1, 5)).toBeTruthy();
	});
	it('should adjust references and functions in affected cells after deleting single row', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 42, C1: { formula: 'C4+2' }, D1: { formula: 'D1+1' },
			A3: { formula: 'A2+1' }, B3: 13, C3: { formula: 'row()' },
			A4: { formula: 'B1+1' }, B4: { formula: 'B3' }, C4: 23
		} });
		expect(sheet.deleteRowsAt(2)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('B1').value).toBe(42);
		expect(sheet.cellAt('C1').value).toBe(2);
		expect(sheet.cellAt('C1').formula).toBe('C3+2');
		expect(sheet.cellAt('D1').value).toBe(1);
		expect(sheet.cellAt('D1').formula).toBe('D1+1');
		expect(sheet.cellAt('A2').value).toBe(1);
		expect(sheet.cellAt('A2').formula).toBe('A1+1');
		expect(sheet.cellAt('B2').value).toBe(13);
		expect(sheet.cellAt('C2').value).toBe(3);
		expect(sheet.cellAt('C2').formula).toBe('ROW()');
		expect(sheet.cellAt('A3').value).toBe(43);
		expect(sheet.cellAt('A3').formula).toBe('B1+1');
		expect(sheet.cellAt('B3').value).toBe(13);
		expect(sheet.cellAt('B3').formula).toBe('B2');
	});
	it('should adjust references and functions in affected cells after inserting multiple rows', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', B1: 42, C1: { formula: 'C8+2' }, D1: { formula: 'D1+1' }, E1: { formula: 'A3' },
			A3: 3,
			A7: { formula: 'A7+1' }, B7: 13, C7: { formula: 'row()' },
			A8: { formula: 'B1+1' }, B8: { formula: 'B7' }, C8: 23
		} });
		expect(sheet.deleteRowsAt(2, 4)).toBeTruthy();
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('B1').value).toBe(42);
		expect(sheet.cellAt('C1').value).toBe(2);
		expect(sheet.cellAt('C1').formula).toBe('C4+2');
		expect(sheet.cellAt('D1').value).toBe(1);
		expect(sheet.cellAt('D1').formula).toBe('D1+1');
		expect(sheet.cellAt('E1').value).toBe(0);
		expect(sheet.cellAt('E1').formula).toBe('A-1');
		expect(sheet.cellAt('A3').value).toBe(1);
		expect(sheet.cellAt('A3').formula).toBe('A3+1');
		expect(sheet.cellAt('B3').value).toBe(13);
		expect(sheet.cellAt('C3').value).toBe(7);
		expect(sheet.cellAt('C3').formula).toBe('ROW()');
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('A4').formula).toBe('B1+1');
		expect(sheet.cellAt('B4').value).toBe(13);
		expect(sheet.cellAt('B4').formula).toBe('B3');
	});
	it('should keep properties of moved rows after deleting single row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let rowprops = props.getRowProperties(1);
		expect(rowprops).toBeDefined();
		// check some props:
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some row  props:
		props.setRowAttribute(2, 'initialsection', 3);
		props.setRowTextFormat(2, 'fontsize', 23);
		props.setRowStyleFormat(2, 'linecolor', 'red');
		props.setRowAttribute(10, 'initialsection', 13);
		props.setRowTextFormat(10, 'fontsize', 42);
		props.setRowStyleFormat(10, 'linecolor', 'blue');
		// delete new row:
		sheet.deleteRowsAt(1);
		// new row at 2 should have def props
		rowprops = props.getRowProperties(2);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		rowprops = props.getRowProperties(10);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// row at 9 should have our set props
		rowprops = props.getRowProperties(1);
		expect(rowprops.getAttribute('initialsection')).toBe(3);
		expect(rowprops.getTextFormat('fontsize')).toBe(23);
		expect(rowprops.getStyleFormat('linecolor')).toBe('red');
		rowprops = props.getRowProperties(9);
		expect(rowprops.getAttribute('initialsection')).toBe(13);
		expect(rowprops.getTextFormat('fontsize')).toBe(42);
		expect(rowprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved rows after deleting multiple rows', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let rowprops = props.getRowProperties(1);
		expect(rowprops).toBeDefined();
		// change some row  props:
		props.setRowAttribute(6, 'initialsection', 3);
		props.setRowTextFormat(6, 'fontsize', 23);
		props.setRowStyleFormat(6, 'linecolor', 'red');
		props.setRowAttribute(10, 'initialsection', 13);
		props.setRowTextFormat(10, 'fontsize', 42);
		props.setRowStyleFormat(10, 'linecolor', 'blue');
		// delete new row:
		sheet.deleteRowsAt(1, 4);
		// row at 10 should have def props:
		rowprops = props.getRowProperties(10);
		expect(rowprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(rowprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(rowprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// row at 2 should have props of 6
		rowprops = props.getRowProperties(2);
		expect(rowprops.getAttribute('initialsection')).toBe(3);
		expect(rowprops.getTextFormat('fontsize')).toBe(23);
		expect(rowprops.getStyleFormat('linecolor')).toBe('red');
		// row at 6 should have props of 10
		rowprops = props.getRowProperties(6);
		expect(rowprops.getAttribute('initialsection')).toBe(13);
		expect(rowprops.getTextFormat('fontsize')).toBe(42);
		expect(rowprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved cells after deleting single row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 3, 'fillcolor', 'red');
		sheet.deleteRowsAt(1);
		// row at 2 and cells at (2,2) & (2,3) should have default styles...
		expect(props.getRowProperties(2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,3).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// changed rows and cells should be one up now...
		expect(props.getRowProperties(1).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(1,2).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(1,3).getStyleFormat('fillcolor')).toBe('red');
	});
	it('should keep properties of moved cells after inserting multiple row', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setRowStyleFormat(8, 'fillcolor', 'yellow');
		props.setCellStyleFormat(8, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(8, 3, 'fillcolor', 'red');
		sheet.deleteRowsAt(1, 6);
		expect(props.getRowProperties(8).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(8,2).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(8,3).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getRowProperties(2).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2,2).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(2,3).getStyleFormat('fillcolor')).toBe('red');
	});
});
describe('delete columns', () => {
	it('should be possible to delete single column', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, A1: { formula: 'A1' }, B1: { formula: 'column()' }, C1: { formula: 'column()+1' }
		} });
		// cannot delete below 0:
		expect(sheet.deleteColumnsAt(-1)).toBeFalsy();
		expect(sheet.deleteColumnsAt(0)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B1').value).toBe(4);
	});
	it('should be possible to delete multiple columns', () => {
		const sheet = new Sheet().load({ cells: {
			COMMENT1: 'test', IF1: false, F1: { formula: 'A1+1' }, G1: { formula: 'column()' }, H1: { formula: 'column()+1' }
		} });
		expect(sheet.deleteColumnsAt(0, 5)).toBeTruthy();
		expect(sheet.cellAt('COMMENT1').value).toBe('test');
		expect(sheet.cellAt('IF1').value).toBe(false);
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(7);
		expect(sheet.cellAt('C1').value).toBe(9);
		expect(sheet.cellAt('D1')).toBeUndefined();
	});
	it('should adjust references and functions in affected cells after insert single column', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', C1: 13, D1: { formula: 'A2' }, E1: { formula: 'C1+1' },
			A2: 42,  C2: { formula: 'A2' }, D2: { formula: 'C2+1' }, E2: { formula: 'C4+1' },
			A3: { formula: 'D2+2' }, C3: { formula: 'A4' }, D3: { formula: 'C4' },
			A4: { formula: 'A2+1' }, C4: 23
		} });
		// check values before inserting
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('C1').value).toBe(13);
		expect(sheet.cellAt('C2').value).toBe(42);
		expect(sheet.cellAt('C3').value).toBe(0);
		expect(sheet.cellAt('C4').value).toBe(23);
		expect(sheet.cellAt('D1').value).toBe(0);
		expect(sheet.cellAt('D2').value).toBe(43);
		expect(sheet.cellAt('D3').value).toBe(0);
		expect(sheet.cellAt('D3').formula).toBe('C4');
		expect(sheet.cellAt('E1').value).toBe(14);
		expect(sheet.cellAt('E2').value).toBe(1);
		//
		expect(sheet.deleteColumnsAt(1)).toBeTruthy();
		// A column:
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A3').formula).toBe('C2+2');
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('A4').formula).toBe('A2+1');
		// B column:
		expect(sheet.cellAt('B1').value).toBe(13);
		expect(sheet.cellAt('B2').value).toBe(42);
		expect(sheet.cellAt('B2').formula).toBe('A2');
		expect(sheet.cellAt('B3').value).toBe(0);
		expect(sheet.cellAt('B3').formula).toBe('A4');
		expect(sheet.cellAt('B4').value).toBe(23);
		// C column
		expect(sheet.cellAt('C1').value).toBe(0);
		expect(sheet.cellAt('C1').formula).toBe('A2');
		expect(sheet.cellAt('C2').value).toBe(43);
		expect(sheet.cellAt('C2').formula).toBe('B2+1');
		expect(sheet.cellAt('C3').value).toBe(0);
		expect(sheet.cellAt('C3').formula).toBe('B4');
		// D column
		expect(sheet.cellAt('D1').value).toBe(14);
		expect(sheet.cellAt('D1').formula).toBe('B1+1');
		expect(sheet.cellAt('D2').value).toBe(1);
		expect(sheet.cellAt('D2').formula).toBe('B4+1');
		// E column is undefined now
		expect(sheet.cellAt('E1')).toBeUndefined();
		expect(sheet.cellAt('E2')).toBeUndefined();
		expect(sheet.cellAt('E3')).toBeUndefined();
		expect(sheet.cellAt('E4')).toBeUndefined();
	});
	it('should adjust references and functions in affected cells after inserting multiple rows', () => {
		const sheet = setup();
		sheet.load({ cells: {
			A1: 'Hi', E1: 13, F1: { formula: 'A2' }, G1: { formula: 'E1+1' },
			A2: 42,  E2: { formula: 'A2' }, F2: { formula: 'E2+1' }, G2: { formula: 'E4+1' },
			A3: { formula: 'F2+2' }, E3: { formula: 'A4' }, F3: { formula: 'E4' },
			A4: { formula: 'A2+1' }, E4: 23
		} });
		expect(sheet.deleteColumnsAt(1, 3)).toBeTruthy();
		// A column:
		expect(sheet.cellAt('A1').value).toBe('Hi');
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('A3').value).toBe(45);
		expect(sheet.cellAt('A3').formula).toBe('C2+2');
		expect(sheet.cellAt('A4').value).toBe(43);
		expect(sheet.cellAt('A4').formula).toBe('A2+1');
		// B
		expect(sheet.cellAt('B1').value).toBe(13);
		expect(sheet.cellAt('B2').value).toBe(42);
		expect(sheet.cellAt('B2').formula).toBe('A2');
		expect(sheet.cellAt('B3').value).toBe(0);
		expect(sheet.cellAt('B3').formula).toBe('A4');
		expect(sheet.cellAt('B4').value).toBe(23);
		// C column
		expect(sheet.cellAt('C1').value).toBe(0);
		expect(sheet.cellAt('C1').formula).toBe('A2');
		expect(sheet.cellAt('C2').value).toBe(43);
		expect(sheet.cellAt('C2').formula).toBe('B2+1');
		expect(sheet.cellAt('C3').value).toBe(0);
		expect(sheet.cellAt('C3').formula).toBe('B4');
		// D column
		expect(sheet.cellAt('D1').value).toBe(14);
		expect(sheet.cellAt('D1').formula).toBe('B1+1');
		expect(sheet.cellAt('D2').value).toBe(1);
		expect(sheet.cellAt('D2').formula).toBe('B4+1');
		// E - F
		expect(sheet.cellAt('E1')).toBeUndefined();
		expect(sheet.cellAt('E2')).toBeUndefined();
		expect(sheet.cellAt('F3')).toBeUndefined();
		expect(sheet.cellAt('F4')).toBeUndefined();
	});
	it('should keep properties of moved columns after deleting single column', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let colprops = props.getColumnProperties(0);
		expect(colprops).toBeDefined();
		// check some props:
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// change some col props:
		props.setColumnAttribute(2, 'initialsection', 3);
		props.setColumnTextFormat(2, 'fontsize', 23);
		props.setColumnStyleFormat(2, 'linecolor', 'red');
		props.setColumnAttribute(10, 'initialsection', 13);
		props.setColumnTextFormat(10, 'fontsize', 42);
		props.setColumnStyleFormat(10, 'linecolor', 'blue');
		// delete column:
		sheet.deleteColumnsAt(1);
		colprops = props.getColumnProperties(2);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		colprops = props.getColumnProperties(10);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// columns at 2 & 11 should have our set props
		colprops = props.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(3);
		expect(colprops.getTextFormat('fontsize')).toBe(23);
		expect(colprops.getStyleFormat('linecolor')).toBe('red');
		colprops = props.getColumnProperties(9);
		expect(colprops.getAttribute('initialsection')).toBe(13);
		expect(colprops.getTextFormat('fontsize')).toBe(42);
		expect(colprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved columns after deleting multiple columns', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		let colprops = props.getColumnProperties(0);
		expect(colprops).toBeDefined();
		// change some columns  props:
		props.setColumnAttribute(5, 'initialsection', 3);
		props.setColumnTextFormat(5, 'fontsize', 23);
		props.setColumnStyleFormat(5, 'linecolor', 'red');
		props.setColumnAttribute(10, 'initialsection', 13);
		props.setColumnTextFormat(10, 'fontsize', 42);
		props.setColumnStyleFormat(10, 'linecolor', 'blue');
		// delete columns:
		sheet.deleteColumnsAt(1, 4);
		// new columns at 5 & 10 should have def props
		colprops = props.getColumnProperties(5);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		colprops = props.getColumnProperties(10);
		expect(colprops.getAttribute('initialsection')).toBe(DEF_PROPS.attributes.sheet.initialsection);
		expect(colprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(colprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// columns at 1 & 6 should have our set props
		colprops = props.getColumnProperties(1);
		expect(colprops.getAttribute('initialsection')).toBe(3);
		expect(colprops.getTextFormat('fontsize')).toBe(23);
		expect(colprops.getStyleFormat('linecolor')).toBe('red');
		colprops = props.getColumnProperties(6);
		expect(colprops.getAttribute('initialsection')).toBe(13);
		expect(colprops.getTextFormat('fontsize')).toBe(42);
		expect(colprops.getStyleFormat('linecolor')).toBe('blue');
	});
	it('should keep properties of moved cells after deleting single column', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setCellStyleFormat(2, 2, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 4, 'fillcolor', 'red');
		props.setColumnStyleFormat(3, 'fillcolor', 'yellow');
		sheet.deleteColumnsAt(1);
		expect(props.getColumnProperties(3).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// this cell gets setting from moved column...
		expect(props.getCellProperties(2, 2).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2, 4).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		// changed column and cells should be one to left now...
		expect(props.getColumnProperties(2).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2, 1).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(2, 3).getStyleFormat('fillcolor')).toBe('red');
	});
	it('should keep properties of moved cells after deleting multiple columns', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		props.setColumnStyleFormat(12, 'fillcolor', 'yellow');
		props.setCellStyleFormat(2, 12, 'fillcolor', 'blue');
		props.setCellStyleFormat(2, 14, 'fillcolor', 'red');
		sheet.deleteColumnsAt(1, 6);
		expect(props.getColumnProperties(12).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,12).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellProperties(2,14).getStyleFormat('fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getColumnProperties(6).getStyleFormat('fillcolor')).toBe('yellow');
		expect(props.getCellProperties(2, 6).getStyleFormat('fillcolor')).toBe('blue');
		expect(props.getCellProperties(2, 8).getStyleFormat('fillcolor')).toBe('red');
	});
});

describe('insert cells', () => {
	it('should not create format on cell add', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		sheet.setCellAt('A1', new Cell(42, Term.fromNumber(42)));
		expect(sheet.cellAt('A1').value).toBe(42);
		const cellprops = props.getCellProperties(1, 0);
		expect(cellprops).toBeDefined();
		expect(cellprops.getAttribute('visible')).toBe(DEF_PROPS.attributes.cell.visible);
		expect(cellprops.getTextFormat('fontsize')).toBe(DEF_PROPS.formats.text.fontsize);
		expect(cellprops.getStyleFormat('linecolor')).toBe(DEF_PROPS.formats.styles.linecolor);
		// cellprops itself and its base props should be empty...
		expect(cellprops.isEmpty()).toBe(true);
		expect(cellprops.base.isEmpty()).toBe(true);
	});
	it('should move bellow cells down', () => {
		const sheet = setup().load({ cells: {
			A1: 10, B1: 11, C1: 12,
			A2: 20, B2: 21, C2: 22,
			A3: 30, B3: 31, C3: { formula: 'B3+1' },
			A26: 260, B26: 261, C26: 262,
		} });
		const range = rangeFactory(sheet);
		const props = sheet.properties;
		props.setRowStyleFormat(1, 'fillcolor', 'red');
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setRowStyleFormat(3, 'fillcolor', 'green');
		props.setRowStyleFormat(26, 'fillcolor', 'blue');
		props.setCellStyleFormat(26, 1, 'fillcolor', 'yellow');
		props.setCellStyleFormat(1, 2, 'fillcolor', 'cyan');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'black');
		props.setCellStyleFormat(3, 2, 'fillcolor', 'orange');

		sheet.insertCells(range('A1:B2'), 'down');
		// check cells moved down...
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe(12);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C2').value).toBe(22);
		expect(sheet.cellAt('A3').value).toBe(10);
		expect(sheet.cellAt('B3').value).toBe(11);
		expect(sheet.cellAt('C3').value).toBe(32);
		expect(sheet.cellAt('C3').formula).toBe('B5+1');
		expect(sheet.cellAt('A26')).toBeUndefined();
		expect(sheet.cellAt('B26')).toBeUndefined();
		expect(sheet.cellAt('C26').value).toBe(262);
		expect(sheet.cellAt('A27')).toBeUndefined();
		expect(sheet.cellAt('B27')).toBeUndefined();
		expect(sheet.cellAt('C27')).toBeUndefined();
		expect(sheet.cellAt('A28').value).toBe(260);
		expect(sheet.cellAt('B28').value).toBe(261);
		expect(sheet.cellAt('C28')).toBeUndefined();

		// check properties
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(3, 0, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(3, 1, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(3, 2, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(3, 3, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(4, 0, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(4, 1, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(4, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);
		expect(props.getCellStyleFormat(26, 0, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(26, 1, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(28, 0, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(28, 1, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(28, 2, 'fillcolor')).toBe(DEF_PROPS.formats.styles.fillcolor);

		// insert single cells...
		sheet.insertCells(range('C1:C1'), 'down');
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('C2').value).toBe(12);
		expect(sheet.cellAt('C3').value).toBe(22);
		expect(sheet.cellAt('C4').value).toBe(32);
		expect(sheet.cellAt('C4').formula).toBe('B5+1');
		expect(sheet.cellAt('C26')).toBeUndefined();
		expect(sheet.cellAt('C27').value).toBe(262);
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(2, 2, 'fillcolor')).toBe('cyan');
		expect(props.getCellStyleFormat(3, 2, 'fillcolor')).toBe('black');
		expect(props.getCellStyleFormat(4, 2, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(26, 2, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(27, 2, 'fillcolor')).toBe('blue');

		sheet.insertCells(range('C1:C1'), 'down');
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('C3').value).toBe(12);
		expect(sheet.cellAt('C4').value).toBe(22);
		expect(sheet.cellAt('C5').value).toBe(32);
		expect(sheet.cellAt('C5').formula).toBe('B5+1');
		expect(sheet.cellAt('C26')).toBeUndefined();
		expect(sheet.cellAt('C27')).toBeUndefined();
		expect(sheet.cellAt('C28').value).toBe(262);
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(2, 2, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(3, 2, 'fillcolor')).toBe('cyan');
		expect(props.getCellStyleFormat(4, 2, 'fillcolor')).toBe('black');
		expect(props.getCellStyleFormat(5, 2, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(27, 2, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(28, 2, 'fillcolor')).toBe('blue');
	});
	it('should move following cells to the right', () => {
		const sheet = setup().load({ cells: {
			A1: 10, B1: 11, C1: 12, Z1: 125,
			A2: 20, B2: 21, C2: 22, Z2: 225,
			A3: 30, B3: 31, C3: { formula: 'B3+1' }, Z3: 325
		} });
		const range = rangeFactory(sheet);
		const props = sheet.properties;
		props.setRowStyleFormat(1, 'fillcolor', 'red');
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setRowStyleFormat(3, 'fillcolor', 'green');
		props.setCellStyleFormat(1, 2, 'fillcolor', 'cyan');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'black');
		props.setCellStyleFormat(3, 2, 'fillcolor', 'orange');

		sheet.insertCells(range('A1:B3'), 'right');
		// check cells moved...
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('C1').value).toBe(10);
		expect(sheet.cellAt('D1').value).toBe(11);
		expect(sheet.cellAt('E1').value).toBe(12);
		expect(sheet.cellAt('AB1').value).toBe(125);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C2').value).toBe(20);
		expect(sheet.cellAt('D2').value).toBe(21);
		expect(sheet.cellAt('E2').value).toBe(22);
		expect(sheet.cellAt('AB2').value).toBe(225);
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('C3').value).toBe(30);
		expect(sheet.cellAt('D3').value).toBe(31);
		expect(sheet.cellAt('E3').value).toBe(32);
		expect(sheet.cellAt('E3').formula).toBe('D3+1');
		expect(sheet.cellAt('AB3').value).toBe(325);
		// check properties:
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 1, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 3, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 4, 'fillcolor')).toBe('cyan');
		expect(props.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 2, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 3, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 4, 'fillcolor')).toBe('black');
		expect(props.getCellStyleFormat(3, 0, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 1, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 3, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 4, 'fillcolor')).toBe('orange');

		// insert single cells...
		sheet.insertCells(range('C1:C1'), 'right');
		expect(sheet.cellAt('C1')).toBeUndefined();
		expect(sheet.cellAt('D1').value).toBe(10);
		expect(sheet.cellAt('E1').value).toBe(11);
		expect(sheet.cellAt('F1').value).toBe(12);
		expect(sheet.cellAt('AC1').value).toBe(125);
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 4, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 5, 'fillcolor')).toBe('cyan');
		sheet.insertCells(range('C2:C2'), 'right');
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('D2').value).toBe(20);
		expect(sheet.cellAt('E2').value).toBe(21);
		expect(sheet.cellAt('F2').value).toBe(22);
		expect(sheet.cellAt('AC2').value).toBe(225);
		expect(props.getCellStyleFormat(2, 2, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 4, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 5, 'fillcolor')).toBe('black');
		sheet.insertCells(range('C3:C3'), 'right');
		expect(sheet.cellAt('C3')).toBeUndefined();
		expect(sheet.cellAt('D3').value).toBe(30);
		expect(sheet.cellAt('E3').value).toBe(31);
		expect(sheet.cellAt('F3').value).toBe(32);
		expect(sheet.cellAt('F3').formula).toBe('E3+1');
		expect(sheet.cellAt('AC3').value).toBe(325);
		expect(props.getCellStyleFormat(3, 2, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 4, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 5, 'fillcolor')).toBe('orange');
	});
});
describe('delete cells', () => {
	it('should not remove properties on cell delete', () => {
		const sheet = new Sheet();
		const props = sheet.properties;
		sheet.setCellAt('A1', new Cell(42, Term.fromNumber(42)));
		expect(sheet.cellAt('A1').value).toBe(42);
		// set some properties
		props.setCellAttribute(1, 0, 'visible', false);
		props.setCellTextFormat(1, 0, 'fontcolor', 'red');
		props.setCellStyleFormat(1, 0, 'fillcolor', 'yellow');
		expect(props.getCellAttribute(1, 0, 'visible')).toBe(false);
		expect(props.getCellTextFormat(1, 0, 'fontcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
		// delete cell
		sheet.setCellAt('A1', undefined);
		expect(sheet.cellAt('A1')).toBeUndefined();
		// formats still available:
		expect(props.getCellAttribute(1, 0, 'visible')).toBe(false);
		expect(props.getCellTextFormat(1, 0, 'fontcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('yellow');
	});
	it('should move cells bellow up', () => {
		const sheet = setup().load({ cells: {
			A1: 10, B1: 11, C1: 12,
			A2: 20, B2: 21, C2: 22,
			A3: 30, B3: 31, C3: { formula: 'B3+1' },
			A26: 260, B26: 261, C26: 262,
		} });
		const range = rangeFactory(sheet);
		const props = sheet.properties;
		props.setRowStyleFormat(1, 'fillcolor', 'red');
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setRowStyleFormat(3, 'fillcolor', 'green');
		props.setRowStyleFormat(26, 'fillcolor', 'blue');
		props.setCellStyleFormat(26, 1, 'fillcolor', 'yellow');
		props.setCellStyleFormat(1, 2, 'fillcolor', 'cyan');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'black');
		props.setCellStyleFormat(3, 2, 'fillcolor', 'orange');

		sheet.deleteCells(range('A1:B2'), 'up');
		// check cells moved up...
		expect(sheet.cellAt('A1').value).toBe(30);
		expect(sheet.cellAt('B1').value).toBe(31);
		expect(sheet.cellAt('C1').value).toBe(12);
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('C2').value).toBe(22);
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('C3').value).toBe(32);
		expect(sheet.cellAt('C3').formula).toBe('B1+1');
		expect(sheet.cellAt('A24').value).toBe(260);
		expect(sheet.cellAt('B24').value).toBe(261);
		expect(sheet.cellAt('C24')).toBeUndefined();
		expect(sheet.cellAt('A25')).toBeUndefined();
		expect(sheet.cellAt('B25')).toBeUndefined();
		expect(sheet.cellAt('C25')).toBeUndefined();
		expect(sheet.cellAt('A26')).toBeUndefined();
		expect(sheet.cellAt('B26')).toBeUndefined();
		expect(sheet.cellAt('C26').value).toBe(262);
		// check properties
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(1, 1, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(24, 0, 'fillcolor')).toBe('blue');
		expect(props.getCellStyleFormat(24, 1, 'fillcolor')).toBe('yellow');

		// delete single cells...
		sheet.deleteCells(range('C1:C1'), 'up');
		expect(sheet.cellAt('C1').value).toBe(22);
		expect(sheet.cellAt('C2').value).toBe(32);
		expect(sheet.cellAt('C2').formula).toBe('B1+1');
		expect(sheet.cellAt('C3')).toBeUndefined();
		expect(sheet.cellAt('C24')).toBeUndefined();
		expect(sheet.cellAt('C25').value).toBe(262);
		expect(sheet.cellAt('C26')).toBeUndefined();
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('black');
		expect(props.getCellStyleFormat(2, 2, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(25, 2, 'fillcolor')).toBe('blue');

		sheet.deleteCells(range('C1:C1'), 'up');
		expect(sheet.cellAt('C1').value).toBe(32);
		expect(sheet.cellAt('C1').formula).toBe('B1+1');
		expect(sheet.cellAt('C2')).toBeUndefined();
		expect(sheet.cellAt('C3')).toBeUndefined();
		expect(sheet.cellAt('C24').value).toBe(262);
		expect(sheet.cellAt('C25')).toBeUndefined();
		expect(props.getCellStyleFormat(1, 2, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(24, 2, 'fillcolor')).toBe('blue');
	});
	it('should move following cells to the left', () => {
		const sheet = setup().load({ cells: {
			A1: 10, B1: 11, C1: 12, Z1: 125,
			A2: 20, B2: 21, C2: 22, Z2: 225,
			A3: 30, B3: 31, C3: { formula: 'B3+1' }, Z3: 325
		} });
		const range = rangeFactory(sheet);
		const props = sheet.properties;
		props.setRowStyleFormat(1, 'fillcolor', 'red');
		props.setRowStyleFormat(2, 'fillcolor', 'yellow');
		props.setRowStyleFormat(3, 'fillcolor', 'green');
		props.setCellStyleFormat(1, 2, 'fillcolor', 'cyan');
		props.setCellStyleFormat(2, 2, 'fillcolor', 'black');
		props.setCellStyleFormat(3, 2, 'fillcolor', 'orange');

		sheet.deleteCells(range('A1:B3'), 'left');
		// check cells moved up...
		expect(sheet.cellAt('A1').value).toBe(12);
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('X1').value).toBe(125);
		expect(sheet.cellAt('Z1')).toBeUndefined();
		expect(sheet.cellAt('A2').value).toBe(22);
		expect(sheet.cellAt('B2')).toBeUndefined();
		expect(sheet.cellAt('X2').value).toBe(225);
		expect(sheet.cellAt('Z2')).toBeUndefined();
		expect(sheet.cellAt('A3').value).toBe(32);
		expect(sheet.cellAt('A3').formula).toBe('IF3+1');
		expect(sheet.cellAt('B3')).toBeUndefined();
		expect(sheet.cellAt('X3').value).toBe(325);
		expect(sheet.cellAt('Z3')).toBeUndefined();

		// check properties:
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('cyan');
		expect(props.getCellStyleFormat(1, 1, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(1, 23, 'fillcolor')).toBe('red');
		expect(props.getCellStyleFormat(2, 0, 'fillcolor')).toBe('black');
		expect(props.getCellStyleFormat(2, 1, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(2, 23, 'fillcolor')).toBe('yellow');
		expect(props.getCellStyleFormat(3, 0, 'fillcolor')).toBe('orange');
		expect(props.getCellStyleFormat(3, 1, 'fillcolor')).toBe('green');
		expect(props.getCellStyleFormat(3, 23, 'fillcolor')).toBe('green');

		// delete single cells...
		sheet.deleteCells(range('A1:A1'), 'left');
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('W1').value).toBe(125);
		expect(props.getCellStyleFormat(1, 0, 'fillcolor')).toBe('red');
		sheet.deleteCells(range('A2:A2'), 'left');
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('W2').value).toBe(225);
		expect(props.getCellStyleFormat(2, 0, 'fillcolor')).toBe('yellow');
		sheet.deleteCells(range('A3:A3'), 'left');
		expect(sheet.cellAt('A3')).toBeUndefined();
		expect(sheet.cellAt('W3').value).toBe(325);
		expect(props.getCellStyleFormat(3, 0, 'fillcolor')).toBe('green');
	});
});
