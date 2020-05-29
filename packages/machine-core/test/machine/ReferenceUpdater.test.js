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
const { Machine, SheetParser, SheetRange, StreamSheet } = require('../..');

beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
});

const createMachine = () => ({
	machine: new Machine(),
	createSheet(name) {
		const t = new StreamSheet({ name });
		this.machine.addStreamSheet(t);
		return t.sheet;
	},
	createNamedCell(name, cell) {
		this.machine.namedCells.set(name, cell);
	},
	getNamedCell(name) {
		return this.machine.namedCells.get(name);
	}
});

const rangeFactory = (sheet) => (str) => {
	const range = SheetRange.fromRangeStr(str);
	if (range) range.sheet = sheet;
	return range;
};


describe('ReferenceUpdater', () => {
	describe('handle insertion and deletion of rows & columns', () => {
		it('should update references in formulas after row and/or column insert and delete', () => {
			const sheet = createMachine().createSheet();
			sheet.load({
				cells: {
					A1: 12,
					B1: 12,
					A3: { formula: 'sum(A1:B1)' },
					B3: { formula: 'A1' }
				}
			});
			// add a row
			expect(sheet.insertRowsAt(1)).toBeTruthy();
			expect(sheet.cellAt('A4').value).toBe(24);
			expect(sheet.cellAt('A4').formula).toBe('SUM(A2:B2)');
			expect(sheet.cellAt('B4').value).toBe(12);
			expect(sheet.cellAt('B4').formula).toBe('A2');
			// add column
			expect(sheet.insertColumnsAt(0)).toBeTruthy();
			expect(sheet.cellAt('B4').value).toBe(24);
			expect(sheet.cellAt('B4').formula).toBe('SUM(B2:C2)');
			expect(sheet.cellAt('C4').value).toBe(12);
			expect(sheet.cellAt('C4').formula).toBe('B2');
			// add column between
			expect(sheet.insertColumnsAt(2)).toBeTruthy();
			expect(sheet.cellAt('B4').value).toBe(24);
			expect(sheet.cellAt('B4').formula).toBe('SUM(B2:D2)');
			expect(sheet.cellAt('D4').value).toBe(12);
			expect(sheet.cellAt('D4').formula).toBe('B2');
			// add row between
			expect(sheet.insertRowsAt(3)).toBeTruthy();
			expect(sheet.cellAt('B5').value).toBe(24);
			expect(sheet.cellAt('B5').formula).toBe('SUM(B2:D2)');
			expect(sheet.cellAt('D5').value).toBe(12);
			expect(sheet.cellAt('D5').formula).toBe('B2');
			// delete added columns & rows:
			expect(sheet.deleteRowsAt(3)).toBeTruthy();
			expect(sheet.deleteColumnsAt(2)).toBeTruthy();
			expect(sheet.deleteColumnsAt(0)).toBeTruthy();
			expect(sheet.deleteRowsAt(1)).toBeTruthy();
			expect(sheet.cellAt('A3').value).toBe(24);
			expect(sheet.cellAt('A3').formula).toBe('SUM(A1:B1)');
			expect(sheet.cellAt('B3').value).toBe(12);
			expect(sheet.cellAt('B3').formula).toBe('A1');
		});
		it('should update references in formulas of other sheets after row and/or column insert and delete', () => {
			const machine = createMachine();
			const sheet1 = machine.createSheet('S1');
			const sheet2 = machine.createSheet('S2');
			sheet1.load({ cells: { A1: 12, B1: 12 } });
			sheet2.load({ cells: { A1: { formula: 'sum(S1!A1:B1)' }, B1: { formula: 'S1!A1' } } });
			// insert rows & columns in sheet1
			expect(sheet1.insertRowsAt(1, 2)).toBeTruthy();
			expect(sheet1.insertColumnsAt(1, 5)).toBeTruthy();
			// check refs in sheet2
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!A3:G3)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!A3');
			// delete row & column again
			expect(sheet1.deleteColumnsAt(1, 5)).toBeTruthy();
			expect(sheet1.deleteRowsAt(1, 2)).toBeTruthy();
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!A1:B1)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!A1');
		});
		it('should update references in named cells in formulas after row and/or column insert and delete', () => {
			const machine = createMachine();
			const sheet1 = machine.createSheet('S1');
			const sheet2 = machine.createSheet('S2');
			sheet1.load({ cells: { A1: 12, B1: 23 } });
			sheet2.load({ cells: { A1: 'hello', B1: 'world' } });
			machine.createNamedCell('S1A1', SheetParser.createCell({ formula: 'S1!A1' }, sheet1));
			machine.createNamedCell('S1B1', SheetParser.createCell({ formula: 'S1!B1' }, sheet1));
			machine.createNamedCell('S2A1', SheetParser.createCell({ formula: 'S2!A1' }, sheet1));
			machine.createNamedCell('S2B1', SheetParser.createCell({ formula: 'S2!B1' }, sheet1));
			expect(machine.getNamedCell('S1A1').value).toBe(12);
			expect(machine.getNamedCell('S1B1').value).toBe(23);
			expect(machine.getNamedCell('S2A1').value).toBe('hello');
			expect(machine.getNamedCell('S2B1').value).toBe('world');
			// insert row and column
			expect(sheet1.insertColumnsAt(1)).toBeTruthy();
			expect(sheet1.insertRowsAt(1)).toBeTruthy();
			expect(sheet2.insertColumnsAt(1)).toBeTruthy();
			expect(sheet2.insertRowsAt(1)).toBeTruthy();
			// evaluate all named cells
			machine.getNamedCell('S1A1').evaluate();
			machine.getNamedCell('S1B1').evaluate();
			machine.getNamedCell('S2A1').evaluate();
			machine.getNamedCell('S2B1').evaluate();
			// value should be same
			expect(machine.getNamedCell('S1A1').value).toBe(12);
			expect(machine.getNamedCell('S1B1').value).toBe(23);
			expect(machine.getNamedCell('S2A1').value).toBe('hello');
			expect(machine.getNamedCell('S2B1').value).toBe('world');
			// and formula updated
			expect(machine.getNamedCell('S1A1').formula).toBe('S1!A2');
			expect(machine.getNamedCell('S1B1').formula).toBe('S1!C2');
			expect(machine.getNamedCell('S2A1').formula).toBe('S2!A2');
			expect(machine.getNamedCell('S2B1').formula).toBe('S2!C2');
			// delete again
			expect(sheet1.deleteRowsAt(1)).toBeTruthy();
			expect(sheet1.deleteColumnsAt(1)).toBeTruthy();
			expect(sheet2.deleteRowsAt(1)).toBeTruthy();
			expect(sheet2.deleteColumnsAt(1)).toBeTruthy();
			// evaluate all named cells
			machine.getNamedCell('S1A1').evaluate();
			machine.getNamedCell('S1B1').evaluate();
			machine.getNamedCell('S2A1').evaluate();
			machine.getNamedCell('S2B1').evaluate();
			// value should be same
			expect(machine.getNamedCell('S1A1').value).toBe(12);
			expect(machine.getNamedCell('S1B1').value).toBe(23);
			expect(machine.getNamedCell('S2A1').value).toBe('hello');
			expect(machine.getNamedCell('S2B1').value).toBe('world');
			// and formula updated
			expect(machine.getNamedCell('S1A1').formula).toBe('S1!A1');
			expect(machine.getNamedCell('S1B1').formula).toBe('S1!B1');
			expect(machine.getNamedCell('S2A1').formula).toBe('S2!A1');
			expect(machine.getNamedCell('S2B1').formula).toBe('S2!B1');
		});
		it('should not update absolute row and/or column references', () => {
			const machine = createMachine();
			const sheet1 = machine.createSheet('S1');
			const sheet2 = machine.createSheet('S2');
			sheet1.load({
				cells: {
					A1: 12,
					B1: 12,
					A2: { formula: '$A$1' },
					B2: { formula: '$A1' },
					C2: { formula: 'A$1' }
				}
			});
			sheet2.load({
				cells: {
					A1: { formula: 'sum(S1!$A$1:B$1)' },
					B1: { formula: 'S1!$A1' },
					C1: { formula: 'S1!A$1' }
				}
			});
			// insert ROWs in sheet1
			expect(sheet1.insertRowsAt(1, 2)).toBeTruthy();
			expect(sheet1.cellAt('A4').value).toBe(12); // <-- old value ;-)
			expect(sheet1.cellAt('A4').formula).toBe('$A$1');
			expect(sheet1.cellAt('B4').value).toBe(12);
			expect(sheet1.cellAt('B4').formula).toBe('$A3');
			expect(sheet1.cellAt('C4').value).toBe(12);
			expect(sheet1.cellAt('C4').formula).toBe('A$1');
			// check sheet2
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!$A$1:B$1)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!$A3');
			expect(sheet2.cellAt('C1').value).toBe(12);
			expect(sheet2.cellAt('C1').formula).toBe('S1!A$1');
			// insert COLUMNs in sheet1
			expect(sheet1.insertColumnsAt(1, 5)).toBeTruthy();
			expect(sheet1.cellAt('A4').value).toBe(12);
			expect(sheet1.cellAt('A4').formula).toBe('$A$1');
			expect(sheet1.cellAt('G4').value).toBe(12);
			expect(sheet1.cellAt('G4').formula).toBe('$A3');
			expect(sheet1.cellAt('H4').value).toBe(12);
			expect(sheet1.cellAt('H4').formula).toBe('A$1');
			// check sheet2
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!$A$1:G$1)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!$A3');
			expect(sheet2.cellAt('C1').value).toBe(12);
			expect(sheet2.cellAt('C1').formula).toBe('S1!A$1');
			expect(sheet1.insertColumnsAt(0)).toBeTruthy();
			expect(sheet1.cellAt('B4').value).toBe(12);
			expect(sheet1.cellAt('B4').formula).toBe('$A$1');
			expect(sheet1.cellAt('H4').value).toBe(12);
			expect(sheet1.cellAt('H4').formula).toBe('$A3');
			expect(sheet1.cellAt('I4').value).toBe(12);
			expect(sheet1.cellAt('I4').formula).toBe('B$1');
			// check sheet2
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!$A$1:H$1)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!$A3');
			expect(sheet2.cellAt('C1').value).toBe(12);
			expect(sheet2.cellAt('C1').formula).toBe('S1!B$1');
			// DELETE columns & rows again
			expect(sheet1.deleteColumnsAt(0)).toBeTruthy();
			expect(sheet1.deleteColumnsAt(1, 5)).toBeTruthy();
			expect(sheet1.deleteRowsAt(1, 2)).toBeTruthy();
			expect(sheet1.cellAt('A2').value).toBe(12);
			expect(sheet1.cellAt('A2').formula).toBe('$A$1');
			expect(sheet1.cellAt('B2').value).toBe(12);
			expect(sheet1.cellAt('B2').formula).toBe('$A1');
			expect(sheet1.cellAt('C2').value).toBe(12);
			expect(sheet1.cellAt('C2').formula).toBe('A$1');
			// check sheet2
			expect(sheet2.cellAt('A1').value).toBe(24);
			expect(sheet2.cellAt('A1').formula).toBe('SUM(S1!$A$1:B$1)');
			expect(sheet2.cellAt('B1').value).toBe(12);
			expect(sheet2.cellAt('B1').formula).toBe('S1!$A1');
			expect(sheet2.cellAt('C1').value).toBe(12);
			expect(sheet2.cellAt('C1').formula).toBe('S1!A$1');
		});
	});

	describe('handle paste of cells', () => {
		it('should adjust formulas of pasted cells', () => {
			const machine = createMachine();
			const sheet = machine.createSheet('S1');
			const range = rangeFactory(sheet);
			sheet.load({ cells: {
				A5: { formula: 'A3+1' },
				A6: { formula: 'A1:C4' },
			} });
			sheet.pasteCells(range('A5:A5'), range('C5:C5'));
			expect(sheet.cellAt('A5').value).toBe(1);
			expect(sheet.cellAt('C5').value).toBe(1);
			expect(sheet.cellAt('C5').formula).toBe('C3+1');
			sheet.pasteCells(range('A6:A6'), range('D7:D7'));
			expect(sheet.cellAt('D7').formula).toBe('D2:F5');
		});
		it('should adjust formulas within functions of pasted cell ranges', () => {
			const machine = createMachine();
			const sheet = machine.createSheet('S1');
			const range = rangeFactory(sheet);
			sheet.load({ cells: {
				A5: { formula: 'sum(A3,1)' },
				A6: { formula: 'sum(A1:C4, 42)' },
			} });
			sheet.pasteCells(range('A5:A6'), range('D7:E9'));
			expect(sheet.cellAt('A5').value).toBe(1);
			expect(sheet.cellAt('D7').value).toBe(1);
			expect(sheet.cellAt('D7').formula).toBe('SUM(D5,1)');
			expect(sheet.cellAt('E7')).toBeUndefined();
			expect(sheet.cellAt('D8').formula).toBe('SUM(D3:F6,42)');
			expect(sheet.cellAt('E8')).toBeUndefined();
			expect(sheet.cellAt('D9')).toBeUndefined();
			expect(sheet.cellAt('E9')).toBeUndefined();
		});
		it('should adjust formulas of pasted cells to other sheet', () => {
			const machine = createMachine();
			const sheet1 = machine.createSheet('S1');
			const sheet2 = machine.createSheet('S2');
			const range1 = rangeFactory(sheet1);
			const range2 = rangeFactory(sheet2);
			sheet1.load({
				cells: {
					A1: 23,
					A2: { formula: 'A1+1' },
					A3: { formula: 'sum(A1,1)' },
					A4: { formula: 'S1!A1' }
				}
			});
			sheet1.pasteCells(range1('A1:A4'), range2('C3:C6'));
			expect(sheet2.cellAt('C3').value).toBe(23);
			expect(sheet2.cellAt('C4').value).toBe(24);
			expect(sheet2.cellAt('C4').formula).toBe('C3+1');
			expect(sheet2.cellAt('C5').formula).toBe('SUM(C3,1)');
			expect(sheet2.cellAt('C6').formula).toBe('S1!C3');
		});
		it('should not update absolute references of pasted cells', () => {
			const machine = createMachine();
			const sheet1 = machine.createSheet('S1');
			const range1 = rangeFactory(sheet1);
			const sheet2 = machine.createSheet('S2');
			const range2 = rangeFactory(sheet2);
			sheet1.load({
				cells: {
					A1: 23, B1:42,
					A2: { formula: '$A1+1' },
					A3: { formula: 'A$1+2' },
					A4: { formula: '$A$1+3' },
					A5: { formula: 'S1!$A1' },
					A6: { formula: 'S1!A$1' },
					A7: { formula: 'S1!A1' },
					A8: { formula: 'sum(S1!$A$1:B$1)' },
				}
			});
			sheet1.pasteCells(range1('A1:B8'), range2('C3:C3'));
			expect(sheet2.cellAt('C3').value).toBe(23);
			expect(sheet2.cellAt('D3').value).toBe(42);
			expect(sheet2.cellAt('C4').formula).toBe('$A3+1');
			expect(sheet2.cellAt('C5').formula).toBe('C$1+2');
			expect(sheet2.cellAt('C6').formula).toBe('$A$1+3');
			expect(sheet2.cellAt('C7').formula).toBe('S1!$A3');
			expect(sheet2.cellAt('C8').formula).toBe('S1!C$1');
			expect(sheet2.cellAt('C9').formula).toBe('S1!C3');
			expect(sheet2.cellAt('C10').formula).toBe('SUM(S1!$A$1:D$1)');
		});
	});
});
