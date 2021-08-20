/********************************************************************************
 * Copyright (c) 2021 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt, createTerm } = require('../utilities');

const ERROR = FunctionErrors.code;

class Validator {
	constructor(cell) {
		this.cell = cell;
	}
	hasValue(value) {
		expect(this.cell.value).toBe(value);
		return this;
	}
	hasFormula(formula) {
		expect(this.cell.formula).toBe(formula);
		return this;
	}
}

const setup = () => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
	const s2 = new StreamSheet({ name: 'S2' });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.addStreamSheet(s2);
	return { s1, s2 };
};
const createFuncAt = (str, formula, sheet) => createCellAt(str, createTerm(formula, sheet), sheet);
const expectCell = (cell) => new Validator(cell);

// TODO: support formats...
describe('clearcells', () => {
	it('should delete only value of cells in given range by default', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A2:A2)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(1)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(1)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(null)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(B2)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(2)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(2)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(null)
			.hasFormula(undefined);
	});
	it('should delete only value of cells in given range of different sheet', () => {
		const { s1, s2 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		// clear from S2...
		createFuncAt('A10', 'clearcells(S1!A1:B1)', s2.sheet);
		s2.step();
		expect(s2.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(2)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(S1!A2:A2)', s2.sheet);
		s2.step();
		expect(s2.sheet.cellAt('A10').value).toBe(true);
		// still null, because only S2 is calculated
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(null)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(S1!B2)', s2.sheet);
		s2.step();
		expect(s2.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(null)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(null)
			.hasFormula(undefined);
	});

	it('should delete only value of cells in given range if value-type is specified', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1, 1)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A2:A2, 1)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(1)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(1)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(null)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(B2, 1)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(2)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(2)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(null)
			.hasFormula(undefined);
	});
	it('should delete only formula of cells in given range if formula-type is specified', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1, 2)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(2)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(2)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A2:B2, 2)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(2)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(2)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
	});
	it('should delete value and formula of cells in given range if both types are specified', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1, 3)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A2:B2, 3)', s1.sheet);
		s1.step();
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(null)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(null)
			.hasFormula(undefined);
	});

	it('should currently ignore format type', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1, 4)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(2)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(2)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A1:B1, 5)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(null)
			.hasFormula('A1+1');
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(null)
			.hasFormula('A1');
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(6)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A1:B2, 6)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A10').value).toBe(true);
		expectCell(s1.sheet.cellAt('A1'))
			.hasValue(1)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B1'))
			.hasValue(1)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(2)
			.hasFormula(undefined);
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
	});
	it('should delete cells in given range if a combination of all types is specified', () => {
		const { s1 } = setup();
		s1.sheet.loadCells({
			A1: { formula: 'A1+1' },
			B1: { formula: 'A1' },
			A2: { formula: 'sum(A1:B1)' },
			B2: 23
		});
		createFuncAt('A10', 'clearcells(A1:B1, 7)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A1')).toBeUndefined();
		expect(s1.sheet.cellAt('B1')).toBeUndefined();
		expectCell(s1.sheet.cellAt('A2'))
			.hasValue(4)
			.hasFormula('SUM(A1:B1)');
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(A2:A2, 7)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A1')).toBeUndefined();
		expect(s1.sheet.cellAt('B1')).toBeUndefined();
		expect(s1.sheet.cellAt('A2')).toBeUndefined();
		expectCell(s1.sheet.cellAt('B2'))
			.hasValue(23)
			.hasFormula(undefined);
		createFuncAt('A10', 'clearcells(B2, 7)', s1.sheet);
		s1.step();
		expect(s1.sheet.cellAt('A1')).toBeUndefined();
		expect(s1.sheet.cellAt('B1')).toBeUndefined();
		expect(s1.sheet.cellAt('A2')).toBeUndefined();
		expect(s1.sheet.cellAt('B2')).toBeUndefined();
	});

	it(`should return ${ERROR.ARGS} if called with to few or many arguments`, () => {
		const { s1 } = setup();
		expect(createTerm('clearcells()', s1.sheet).value.code).toBe(ERROR.ARGS);
		expect(createTerm('clearcells(A1,B1,3)', s1.sheet).value.code).toBe(ERROR.ARGS);
	});
});
