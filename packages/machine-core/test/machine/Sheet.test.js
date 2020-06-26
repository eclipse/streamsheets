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
const { celljson } = require('./utils');
const { createCellAt, createTerm } = require('../utils');
const { Cell, Sheet, SheetIndex } = require('../..');

const cellcount = (sheet) => {
	let count = 0;
	sheet.iterate((cell) => { if (cell) count += 1; });
	return count;
};
const isEmpty = (sheet) => cellcount(sheet) === 0;


describe('Sheet', () => {
	describe('creation', () => {
		it('should be defined', () => {
			const sheet = new Sheet();
			expect(sheet).toBeDefined();
			expect(isEmpty(sheet)).toBeTruthy();
		});
	});

	describe('IO', () => {
		it('should provide toJSON() function', () => {
			const sheet = new Sheet();
			expect(sheet.toJSON).toBeDefined();
			expect(typeof sheet.toJSON).toBe('function');
		});
		it('should store its definition to a JSON object', () => {
			const sheet = new Sheet();
			let json = sheet.toJSON();
			expect(json).toBeDefined();
			expect(json.cells).toBeDefined();
			expect(json.namedCells).toBeDefined();
			expect(Object.keys(json.cells).length).toBe(0);
			expect(Object.keys(json.namedCells).length).toBe(0);
			// add some cells:
			sheet.setCellAt(SheetIndex.create('A1'), new Cell('A1'));
			sheet.setCellAt(SheetIndex.create('IF1'), new Cell('-A1'));
			// add some names:
			sheet.namedCells.set('n1', new Cell('hello'));
			sheet.namedCells.set('n2', new Cell('world'));
			json = sheet.toJSON();
			expect(json).toBeDefined();
			expect(celljson(json.cells.A1).isEqualTo({ value: 'A1', type: 'string' })).toBeTruthy();
			expect(celljson(json.cells.IF1).isEqualTo({ value: '-A1', type: 'string' })).toBeTruthy();
			// check names
			expect(celljson(json.namedCells.n1).isEqualTo({ value: 'hello', type: 'string' })).toBeTruthy();
			expect(celljson(json.namedCells.n2).isEqualTo({ value: 'world', type: 'string' })).toBeTruthy();
		});
		it('should restore from a previous created JSON object', () => {
			const sheet = new Sheet();
			let sheet2 = new Sheet(sheet.toJSON());
			expect(sheet2).toBeDefined();
			expect(isEmpty(sheet2)).toBeTruthy();
			// add some cells:
			sheet.setCellAt(SheetIndex.create('A1'), new Cell('A1'));
			sheet.setCellAt(SheetIndex.create('A2'), new Cell('A2'));
			sheet.setCellAt(SheetIndex.create('IF1'), new Cell('-A1'));
			sheet.setCellAt(SheetIndex.create('IF2'), new Cell('-A2'));
			// add some names:
			sheet.namedCells.set('n1', new Cell('hello'));
			sheet.namedCells.set('n2', new Cell(42));
			sheet.namedCells.set('n3', new Cell(null, createTerm('A1', sheet)));
			sheet.namedCells.set('n4', new Cell(null, createTerm('A1:A2', sheet)));
			const sheetjson = sheet.toJSON();
			sheet2 = new Sheet();
			sheet2.load(sheetjson);
			expect(isEmpty(sheet2)).toBeFalsy();
			expect(cellcount(sheet2)).toBe(4);
			expect(sheet2.namedCells.isEmpty()).toBe(false);
			expect(sheet2.cellAt(SheetIndex.create('A1')).value).toBe('A1');
			expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe('A2');
			expect(sheet2.cellAt(SheetIndex.create('IF1')).value).toBe('-A1');
			expect(sheet2.cellAt(SheetIndex.create('IF2')).value).toBe('-A2');
			// check names
			expect(sheet2.namedCells.get('n1').value).toBe('hello');
			expect(sheet2.namedCells.get('n2').value).toBe(42);
			// NOTE: currently named cells are not evaluated!
			expect(sheet2.namedCells.get('n3').term.value).toBe('A1');
			expect(sheet2.namedCells.get('n4').value.toString()).toBe('A1:A2');
		});
	});

	describe('row handling', () => {
		it('should be possible to add a row', () => {
			const sheet = new Sheet();
			// insert at 0 is below default min row:
			expect(sheet.insertRowsAt(0)).toBeFalsy();
			expect(sheet.insertRowsAt(1)).toBeTruthy();
		});
		it('should not be possible to add a row with negative index', () => {
			const sheet = new Sheet();
			expect(sheet.insertRowsAt(-1)).toBeFalsy();
		});
		it('should be possible to delete a row', () => {
			const sheet = new Sheet();
			expect(sheet.insertRowsAt(0)).toBeFalsy();
			expect(sheet.insertRowsAt(1)).toBeTruthy();
			expect(sheet.insertRowsAt(2)).toBeTruthy();
			expect(sheet.deleteRowsAt(0)).toBeFalsy();
			expect(sheet.deleteRowsAt(1)).toBeTruthy();
			expect(sheet.deleteRowsAt(1)).toBeTruthy();
		});
		it('should not be possible to delete a row at invalid index', () => {
			const sheet = new Sheet();
			expect(sheet.deleteRowsAt(sheet.settings.minrow)).toBeTruthy();
			expect(sheet.deleteRowsAt(sheet.settings.maxrow)).toBeTruthy();
			expect(sheet.deleteRowsAt(sheet.settings.minrow - 1)).toBeFalsy();
			expect(sheet.deleteRowsAt(sheet.settings.maxrow + 1)).toBeFalsy();
		});
	});

	describe('column handling', () => {
		it('should be possible to add column(s)', () => {
			const sheet = new Sheet();
			sheet.setCellAt('A1', new Cell(42));
			expect(sheet.insertColumnsAt(0)).toBeTruthy();
			expect(sheet.cellAt('A1')).toBeUndefined();
			expect(sheet.cellAt('B1').value).toBe(42);
			expect(sheet.insertColumnsAt(1, 4)).toBeTruthy();
			expect(sheet.cellAt('B1')).toBeUndefined();
			expect(sheet.cellAt('F1').value).toBe(42);
		});
		it('should be possible to delete column(s)', () => {
			const sheet = new Sheet();
			sheet.setCellAt('A1', new Cell(42));
			expect(sheet.insertColumnsAt(0, 5)).toBeTruthy();
			expect(sheet.cellAt('F1').value).toBe(42);
			expect(sheet.deleteColumnsAt(2)).toBeTruthy();
			expect(sheet.cellAt('F1')).toBeUndefined();
			expect(sheet.cellAt('E1').value).toBe(42);
			expect(sheet.deleteColumnsAt(0, 4)).toBeTruthy();
			expect(sheet.cellAt('E1')).toBeUndefined();
			expect(sheet.cellAt('A1').value).toBe(42);
			expect(sheet.deleteColumnsAt(1, 4)).toBeTruthy();
			expect(sheet.cellAt('A1').value).toBe(42);
			expect(sheet.deleteColumnsAt(0, 4)).toBeTruthy();
			expect(sheet.cellAt('A1')).toBeUndefined();
		});
		it('should not be possible to delete column(s) at invalid index', () => {
			const sheet = new Sheet();
			// can only remove columns >= 0 to protect IF column...
			expect(sheet.deleteColumnsAt(0)).toBeTruthy();
			expect(sheet.deleteColumnsAt(sheet.settings.mincol)).toBeFalsy();
			expect(sheet.deleteColumnsAt(sheet.settings.maxcol)).toBeTruthy();
			expect(sheet.deleteColumnsAt(sheet.settings.maxcol + 1)).toBeFalsy();
		});
	});

	describe('process', () => {
		it('should skip row, if IF column is false', () => {
			const sheet = new Sheet().load({
				cells: {
					COMMENT1: 0,
					IF1: false,
					A1: { formula: '?(A1, A1+1, 1)' },
					IF2: true,
					A2: { formula: '?(A2, A2+1, 1)' }
				}
			});
			sheet.startProcessing();
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(2);
		});
		it('should skip rows until IF column is true', () => {
			/* eslint-disable */
			const sheetdef = {
				IF1: false, A1: { formula: 'A1+1' },
				IF2: { formula: 'IF1' }, A2: { formula: 'A2+1' },
				IF3: { formula: 'IF2' }, A3: { formula: 'A3+1' },
				IF4: true, A4: { formula: 'A4+1' },
				IF5: { formula: 'IF4' }, A5: { formula: 'A5+1' },
				IF6: { formula: 'IF3' }, A6: { formula: 'A6+1' }
			};
			/* eslint-enable */
			const sheet = new Sheet().load({ cells: sheetdef });
			sheet.startProcessing();
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('A4')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('A5')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('A6')).value).toBe(1);
		});
		it('should process row, if IF column is true', () => {
			const sheet = new Sheet().load({
				cells: { IF1: true, A1: { formula: '?(A1, A1+1, 1)' }, IF2: true, A2: { formula: '?(A2, A2+1, 1)' } }
			});
			sheet.startProcessing();
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(2);
		});
	});

	describe('cell reference', () => {
		it('should be possible to reference cells', () => {
			const sheet = new Sheet().load({ cells: { A1: 1, B1: 2, C1: 3, A2: 4, B2: 5, C2: 6 } });
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(3);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(4);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(5);
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(6);
		});
		it('should not be possible to reference undefined cells', () => {
			const sheet = new Sheet().load({ cells: { A1: '1', B1: '2', C1: '3' } });
			expect(sheet.cellAt(SheetIndex.create('A3'))).toBeUndefined();
			expect(sheet.cellAt(SheetIndex.create('B3'))).toBeUndefined();
			expect(sheet.cellAt(SheetIndex.create('C3'))).toBeUndefined();
			expect(sheet.cellAt(SheetIndex.create('D3'))).toBeUndefined();
		});
	});

	describe('cell handling', () => {
		it('should be possible to add cells', () => {
			const sheet = new Sheet();
			const cellA = new Cell('cell-a');
			const cellB = new Cell('cell-b');
			const cellC = new Cell('cell-c');
			sheet.setCellAt(SheetIndex.create('A2'), cellA);
			sheet.setCellAt(SheetIndex.create('B2'), cellB);
			sheet.setCellAt(SheetIndex.create('C2'), cellC);
			expect(cellcount(sheet)).toBe(3);
		});
		it('should be possible to add cells at neg. column', () => {
			const sheet = new Sheet(null);
			sheet.setCellAt('A1', new Cell('hallo'));
			sheet.setCellAt('COMMENT5', new Cell('test'));
			sheet.setCellAt(SheetIndex.create('IF3'), new Cell('yes'));
			sheet.setCellAt(SheetIndex.create(3, -2), new Cell('no'));
			expect(cellcount(sheet)).toBe(4);
			expect(sheet.cellAt('A1').value).toBe('hallo');
			expect(sheet.cellAt('COMMENT5').value).toBe('test');
			expect(sheet.cellAt('IF3').value).toBe('yes');
			expect(sheet.cellAt('COMMENT3').value).toBe('no');
		});
		it('should be possible to add cells in arbitrary order', () => {
			const sheet = new Sheet();
			const cellA = new Cell('cell-a');
			const cellB = new Cell('cell-b');
			const cellC = new Cell('cell-c');
			sheet.setCellAt(SheetIndex.create('F5'), cellB);
			sheet.setCellAt(SheetIndex.create('C1'), cellC);
			sheet.setCellAt(SheetIndex.create('G3'), cellA);
			expect(cellcount(sheet)).toBe(3);
		});
		it('should be possible to get cells', () => {
			const sheet = new Sheet();
			const cellA = new Cell('cell-a');
			const cellB = new Cell('cell-b');
			const cellC = new Cell('cell-c');
			sheet.setCellAt(SheetIndex.create('F5'), cellB);
			sheet.setCellAt(SheetIndex.create('C1'), cellC);
			sheet.setCellAt(SheetIndex.create('G3'), cellA);
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe('cell-c');
			expect(sheet.cellAt(SheetIndex.create('F5')).value).toBe('cell-b');
			expect(sheet.cellAt(SheetIndex.create('G3')).value).toBe('cell-a');
			expect(sheet.cellAt(SheetIndex.create('A1'))).toBeUndefined();
		});
		it('should be possible to iterate over all cells', () => {
			const celldefs = {
				A1: 'A1',
				B1: 'B1',
				C1: 'C1',
				A2: 'A2',
				B2: 'B2',
				C2: 'C2',
				// prerows:
				IF1: '-A1',
				COMMENT1: '-B1',
				// '-C1': '-C1',
				IF2: '-A2',
				COMMENT2: '-B2'
				// '-C2': '-C2'
			};
			const sheet = new Sheet(null).load({ cells: celldefs });
			expect(cellcount(sheet)).toBe(10);
		});
		it('should be possible to set cells', () => {
			const celldefs = {
				/* eslint-disable */
				COMMENT1: '-B1', IF1: '-A1', A1: 'A1', B1: 'B1', C1: 'C1',
				COMMENT2: '-B2', IF2: '-A2', A2: 'A2', B2: 'B2', C2: 'C2'
				/* eslint-ensable */
			};
			const newcelldefs = { 
				/* eslint-disable */
				COMMENT1: '-NEW_B1', IF1: '-NEW_A1', A1: 'NEW_A1', B1: 'B1', C1: 'NEW_C1',
				COMMENT2: '-NEW_B2', IF2: '-NEW_A2', B2: 'NEW_B2',
				COMMENT3: '-NEW_B3', IF3: '-NEW_A3', C3: 'NEW_C3'
				/* eslint-ensable */
			};

			const sheet = new Sheet(null).load({ cells: celldefs });
			// set new cells to replace and add...
			sheet.setCells(newcelldefs);
			expect(sheet.cellAt('COMMENT1').value).toBe('-NEW_B1');
			expect(sheet.cellAt('IF1').value).toBe('-NEW_A1');
			expect(sheet.cellAt('A1').value).toBe('NEW_A1');
			expect(sheet.cellAt('B1').value).toBe('B1');
			expect(sheet.cellAt('C1').value).toBe('NEW_C1');
			expect(sheet.cellAt('COMMENT2').value).toBe('-NEW_B2');
			expect(sheet.cellAt('IF2').value).toBe('-NEW_A2');
			expect(sheet.cellAt('A2').value).toBe('A2');
			expect(sheet.cellAt('B2').value).toBe('NEW_B2');
			expect(sheet.cellAt('C2').value).toBe('C2');
			expect(sheet.cellAt('COMMENT3').value).toBe('-NEW_B3');
			expect(sheet.cellAt('IF3').value).toBe('-NEW_A3');
			expect(sheet.cellAt('A3')).toBeUndefined();
			expect(sheet.cellAt('B3')).toBeUndefined();
			expect(sheet.cellAt('C3').value).toBe('NEW_C3');
		});
		it('should be possible to set cells with start value', () => {
			const sheet = new Sheet();
			createCellAt('A1', { formula: 'A1+1', value: 2 }, sheet);
			expect(sheet.cellAt('A1').value).toBe(2);
		});
	});

	describe('load', () => {
		it('should load cell definitions', () => {
			const celldefs = {
				A1: 'cell-a1',
				B1: 'cell-b1',
				C1: 'cell-c1',
				A2: 'cell-a2',
				B2: 'cell-b2',
				C2: 'cell-c2'
			};
			const sheet = new Sheet().load({ cells: celldefs });
			expect(isEmpty(sheet)).toBeFalsy();
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe('cell-a1');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('cell-b1');
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe('cell-c1');
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe('cell-a2');
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('cell-b2');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('cell-c2');
		});
		it('should load cell definitions with pre-rows', () => {
			const celldefs = {
				A1: 'A1',
				B1: 'B1',
				C1: 'C1',
				A2: 'A2',
				B2: 'B2',
				C2: 'C2',
				// prerows:
				IF1: '-A1',
				COMMENT1: '-B1',
				// '-C1': '-C1',
				IF2: '-A2',
				COMMENT2: '-B2'
				// '-C2': '-C2'
			};
			const sheet = new Sheet(null).load({ cells: celldefs });
			expect(isEmpty(sheet)).toBeFalsy();
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe('A1');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('B1');
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe('C1');
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe('A2');
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('B2');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('C2');
			// check pre-rows:
			expect(sheet.cellAt(SheetIndex.create('IF1')).value).toBe('-A1');
			expect(sheet.cellAt(SheetIndex.create('COMMENT1')).value).toBe('-B1');
			// expect(sheet.cellAt(SheetIndex.create('-C1')).value).toBe('-C1');
			expect(sheet.cellAt(SheetIndex.create('IF2')).value).toBe('-A2');
			expect(sheet.cellAt(SheetIndex.create('COMMENT2')).value).toBe('-B2');
			// expect(sheet.cellAt(SheetIndex.create('-C2')).value).toBe('-C2');
		});
		// DL-1876
		it('should preserve old values on cell load', () => {
			const celldefs = {
				A1: 42,
				A2: {formula: 'A3', value: 23},
				A3: {formula: 'A4', value: 13},
				A4: {formula: 'A1', value: 20}
			};
			const sheet = new Sheet(null).load({ cells: celldefs });
			expect(isEmpty(sheet)).toBeFalsy();
			expect(sheet.cellAt('A1').value).toBe(42);
			expect(sheet.cellAt('A2').value).toBe(23);
			expect(sheet.cellAt('A3').value).toBe(13);
			expect(sheet.cellAt('A4').value).toBe(20);
		});
	});

	describe('name handling', () => {
		it('should load name definitions', () => {
			const namedCells = {
				'n1': 'hello',
				'n2': 42,
				'n3': true,
				'n4': { formula: 'A1' },
				'n5': { formula: 'A1:C1' }
			};
			const sheet = new Sheet().load({ namedCells, cells: { A1: 23 } });
			expect(isEmpty(sheet)).toBe(false);
			expect(sheet.namedCells.isEmpty()).toBe(false);
			expect(sheet.namedCells.get('n1').value).toBe('hello');
			expect(sheet.namedCells.get('n2').value).toBe(42);
			expect(sheet.namedCells.get('n3').value).toBe(true);
			// NOTE: currently named cells are not evaluated!
			expect(sheet.namedCells.get('n4').term.value).toBe(23);
			// should be a cell range ref...
			expect(sheet.namedCells.get('n5').value).toBeDefined();
			expect(sheet.namedCells.get('n5').value.toString()).toBe('A1:C1');
		});
		it('should be possible to set, remove & replace named cells', () => {
			const sheet = new Sheet().load({ cells: { A1: 42 } });
			expect(isEmpty(sheet)).toBe(false);
			expect(sheet.namedCells.isEmpty()).toBe(true);
			sheet.namedCells.set('n1', new Cell(23));
			expect(sheet.namedCells.isEmpty()).toBe(false);
			expect(sheet.namedCells.get('n1').value).toBe(23);
			sheet.namedCells.set('n2', new Cell(null, createTerm('A1', sheet)));
			expect(sheet.namedCells.isEmpty()).toBe(false);
			expect(sheet.namedCells.get('n2').value).toBe(42);
			// replace
			sheet.namedCells.set('n1', new Cell('hello'));
			sheet.namedCells.set('n2', new Cell('world'));
			expect(sheet.namedCells.isEmpty()).toBe(false);
			expect(sheet.namedCells.get('n1').value).toBe('hello');
			expect(sheet.namedCells.get('n2').value).toBe('world');
			// remove:
			sheet.namedCells.set('n2', undefined);
			expect(sheet.namedCells.isEmpty()).toBe(false);
			expect(sheet.namedCells.get('n1').value).toBe('hello');
			expect(sheet.namedCells.get('n2')).toBeUndefined();
			sheet.namedCells.set('n1', undefined);
			expect(sheet.namedCells.isEmpty()).toBe(true);
			expect(sheet.namedCells.get('n1')).toBeUndefined();
		});
		it('should be possible to reference names in cells', () => {
			const sheet = new Sheet();
			sheet.namedCells.set('name', new Cell('hello'));
			sheet.setCellAt('A1', new Cell(null, createTerm('name', sheet)));
			expect(sheet.cellAt('A1').value).toBe('hello');
		});
	});
});
