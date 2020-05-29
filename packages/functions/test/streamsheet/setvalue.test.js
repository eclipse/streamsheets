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
const { createTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Cell, Machine, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

const setup = (transconfig) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet(transconfig);
	machine.addStreamSheet(streamsheet);
	return streamsheet;
};

describe('setvalue', () => {
	it('should set a cell value', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		let setvalue = createTerm('setvalue(1==1, "hello", C1)', sheet);
		sheet.setCellAt('A1', new Cell(null, setvalue));
		sheet.setCellAt('C1', new Cell(null, Term.fromString('world')));
		expect(sheet.cellAt('C1').value).toBe('world');
		t1.step();
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('hello');
		setvalue = createTerm('setvalue(D1=D1, "yes", F1)', sheet);
		sheet.setCellAt('A1', new Cell(null, setvalue));
		t1.step();
		expect(sheet.cellAt('F1').value).toBe('yes');
	});
	it('should create corresponding cell if it did not exists before', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const setvalue = createTerm('setvalue(TRUE, "hello", C1)', sheet);
		expect(sheet.cellAt('C1')).toBeUndefined();
		// NOTE: setvalue is applied directly...
		sheet.setCellAt('A1', new Cell(null, setvalue));
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('hello');
	});

	it('should keep formula of target cell if last parameter is FALSE or not given', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const setvalue = createTerm('setvalue(1==1, "hello", C1)', sheet);
		sheet.setCellAt('D1', new Cell(null, setvalue));
		sheet.setCellAt('C1', new Cell(null, createTerm('2 * 21')));
		expect(sheet.cellAt('C1').value).toBe(42);
		t1.step();
		expect(sheet.cellAt('D1').value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('hello');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('D1', null);
		t1.step();
		expect(sheet.cellAt('C1').value).toBe(42);
	});
	it('can be used to reset a cell value', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const resetvalue = createTerm('setvalue(C1>1, 0, C1)', sheet);
		sheet.setCellAt('A1', new Cell(null, resetvalue));
		sheet.setCellAt('C1', new Cell(null, createTerm('C1 + 1', sheet)));
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe(1);
		t1.step();
		expect(sheet.cellAt('C1').value).toBe(2);
		t1.step();
		expect(sheet.cellAt('C1').value).toBe(1);
		t1.step();
		expect(sheet.cellAt('C1').value).toBe(2);
		t1.step();
		expect(sheet.cellAt('C1').value).toBe(1);
	});
	it('should overwrite formula of target cell if last parameter is TRUE', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const setvalue = createTerm('setvalue(1==1, "hello", C1, TRUE)', sheet);
		sheet.setCellAt('D1', new Cell(null, setvalue));
		sheet.setCellAt('C1', new Cell(null, createTerm('2 * 21')));
		expect(sheet.cellAt('C1').value).toBe(42);
		t1.step();
		expect(sheet.cellAt('D1').value).toBe(true);
		expect(sheet.cellAt('C1').value).toBe('hello');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('D1', null);
		t1.step();
		// expect formula to be overwritten
		expect(sheet.cellAt('C1').value).toBe('hello');
	});
	it('should set the values of a cell range', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet.load({
			cells: {
				A1: { formula: '11 + 12' },
				B1: 'hello',
				A2: { formula: '2 * 21' },
				B2: 'world'
			}
		});
		const setvalue = createTerm('setvalue(1==1, "yes", A1:B2)', sheet);
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('hello');
		expect(sheet.cellAt('B2').value).toBe('world');
		sheet.setCellAt('C2', new Cell(null, setvalue));
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('C2', null);
		t1.step();
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
	});
	it('should create cells of range before setting values if they do not exists', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const setvalue = createTerm('setvalue(1==1, "yes", A1:B2)', sheet);
		expect(sheet.cellAt('A1')).toBeUndefined();
		expect(sheet.cellAt('A2')).toBeUndefined();
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(sheet.cellAt('B2')).toBeUndefined();
		sheet.setCellAt('C2', new Cell(null, setvalue));

		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
	});
	it('should overwrite formula of cells in range', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet.load({
			cells: {
				A1: { formula: '11 + 12' },
				B1: 'hello',
				A2: { formula: '2 * 21' },
				B2: 'world'
			}
		});
		const setvalue = createTerm('setvalue(1==1, "yes", A1:B2, TRUE)', sheet);
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('hello');
		expect(sheet.cellAt('B2').value).toBe('world');
		sheet.setCellAt('C2', new Cell(null, setvalue));
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('C2', null);
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
	});
	it('should set the values of a cell list', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet.load({
			cells: {
				A1: { formula: '11 + 12' },
				B1: 'hello',
				A2: { formula: '2 * 21' },
				B2: 'world'
			}
		});
		const setvalue = createTerm('setvalue(TRUE, "yes", [A2,B2,B1,A1])', sheet);
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('hello');
		expect(sheet.cellAt('B2').value).toBe('world');
		sheet.setCellAt('C2', new Cell(null, setvalue));
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('C2', null);
		t1.step();
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
	});
	it('should overwrite formula of cells within list', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet.load({
			cells: {
				A1: { formula: '11 + 12' },
				B1: 'hello',
				A2: { formula: '2 * 21' },
				B2: 'world'
			}
		});
		const setvalue = createTerm('setvalue(1==1, "yes", [A2,B2,B1,A1], TRUE)', sheet);
		expect(sheet.cellAt('A1').value).toBe(23);
		expect(sheet.cellAt('A2').value).toBe(42);
		expect(sheet.cellAt('B1').value).toBe('hello');
		expect(sheet.cellAt('B2').value).toBe('world');
		sheet.setCellAt('C2', new Cell(null, setvalue));
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
		// clear D1 or it will be evaluated again
		sheet.setCellAt('C2', null);
		t1.step();
		expect(sheet.cellAt('A1').value).toBe('yes');
		expect(sheet.cellAt('A2').value).toBe('yes');
		expect(sheet.cellAt('B1').value).toBe('yes');
		expect(sheet.cellAt('B2').value).toBe('yes');
	});
	it('should not set value if no condition is specified', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet;
		const setvalue1 = createTerm('setvalue(, "hello", E2)', sheet);
		const setvalue2 = createTerm('setvalue(, "world", E2:F2, TRUE)', sheet);
		const setvalue3 = createTerm('setvalue(, "yes", [E2,F2])', sheet);
		sheet.setCellAt('A1', new Cell(null, setvalue1));
		sheet.setCellAt('B1', new Cell(null, setvalue2));
		sheet.setCellAt('C1', new Cell(null, setvalue3));
		sheet.setCellAt('E2', new Cell('fix'));
		sheet.setCellAt('F2', new Cell('keep'));
		t1.step();
		expect(sheet.cellAt('E2').value).toBe('fix');
		expect(sheet.cellAt('F2').value).toBe('keep');
	});
});
