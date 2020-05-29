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
const { createTerm, functions, validate } = require('../utils');
const { Machine, StreamSheet, Sheet, SheetIndex, SheetParser } = require('../..');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
});

const createMachine = () => {
	const machine = new Machine();
	machine.removeAllStreamSheets();
	machine.addStreamSheet(new StreamSheet({ name: 'T1' }));
	machine.addStreamSheet(new StreamSheet({ name: 'T2' }));
	return machine;
};

const rangeValues = (range) => {
	if (FunctionErrors.isError(range)) {
		return range;
	}
	const vals = [];
	range.iterate(cell => cell && vals.push(cell.value));
	return vals;
};
const rangeStartEnd = range => [range.start, range.end];

describe('CellReference', () => {
	describe('creation', () => {
		it('should be possible to create a CellReference term', () => {
			const sheet = new Sheet().load({ cells: { IF1: 'test', A1: 'hello' } });
			validate.term(createTerm('A1', sheet))
				.hasOperandType('CellReference')
				.hasValue('hello')
				.hasDescription('A1');
			validate.term(createTerm('IF1', sheet))
				.hasOperandType('CellReference')
				.hasValue('test')
				.hasDescription('IF1');
		});
		it('should recognize columns IF and COMMENT', () => {
			const sheet = new Sheet().load({ cells: { COMMENT2: 'skip', IF2: 42, Z1: 'hello' } });
			validate.term(createTerm('Z1', sheet))
				.hasOperandType('CellReference')
				.hasValue('hello')
				.hasDescription('Z1');
			validate.term(createTerm('IF2', sheet))
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('IF2');
			validate.term(createTerm('COMMENT2', sheet))
				.hasOperandType('CellReference')
				.hasValue('skip')
				.hasDescription('COMMENT2');
		});
		it('should be case-insensitive', () => {
			const sheet = new Sheet().load({ cells: { IF1: 'test', A1: 'hello' } });
			validate.term(createTerm('a1', sheet))
				.hasOperandType('CellReference')
				.hasValue('hello')
				.hasDescription('A1');
			validate.term(createTerm('If1', sheet))
				.hasOperandType('CellReference')
				.hasValue('test')
				.hasDescription('IF1');
			validate.term(createTerm('iF1', sheet))
				.hasOperandType('CellReference')
				.hasValue('test')
				.hasDescription('IF1');
			validate.term(createTerm('commENt1', sheet))
				.hasOperandType('CellReference')
				.hasDescription('COMMENT1');
		});
	});
	describe('usage', () => {
		it('should be possible to negate CellReference value', () => {
			const sheet = new Sheet().load({ cells: { A1: 23, C1: 42 } });
			let term = createTerm('-A1', sheet);
			validate.term(term).hasValue(-23).hasDescription('-A1');
			validate.term(term.left)
				.hasOperandType('CellReference')
				.hasValue(23)
				.hasDescription('A1');
			term = createTerm('-C1', sheet);
			validate.term(term).hasValue(-42).hasDescription('-C1');
			validate.term(term.left)
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('C1');
		});
		it('should be possible to reference cell from different stream-sheet', () => {
			// only works via machine...
			const machine = createMachine();
			const [t1, t2] = machine.streamsheets;
			t2.sheet.load({ cells: { IF2: 42, Z2: 'hello' } });
			validate.term(createTerm('T2!Z2', t1.sheet))
				.hasOperandType('CellReference')
				.hasValue('hello')
				.hasDescription('T2!Z2');
			validate.term(createTerm('T2!IF2', t1.sheet))
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('T2!IF2');
			validate.term(createTerm('T2!if2', t1.sheet))
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('T2!IF2');
		});
		// DL-1716
		it('should be possible to use cell from different sheet within arithmetic operation', () => {
			const machine = createMachine();
			const [t1, t2] = machine.streamsheets;
			t1.sheet.load({ cells: { B3: 2 } });
			t2.sheet.load({ cells: { B3: 23 } });
			expect(createTerm('B3*T2!B3', t1.sheet).value).toBe(46);
		});
		// DL-1958
		it('should return 0 as value for undefined cells', () => {
			const machine = createMachine();
			const [t1] = machine.streamsheets;
			const sheet = t1.sheet.loadCells({ 
				A1: { formula: 'A3' }, B1: {formula: 'A1'},
				C1: {formula: 'concat(A3,"text")'}, D1: {formula: 'concat(A1,"text")'}
			});
			expect(sheet.cellAt('A1').value).toBe(0);
			expect(sheet.cellAt('B1').value).toBe(0);
			expect(sheet.cellAt('C1').value).toBe('text');
			expect(sheet.cellAt('D1').value).toBe('0text');
			expect(sheet.cellAt('A3')).toBeUndefined();
		});
	});
	describe('error handling', () => {
		it(`should return ${ERROR.NAME} if cell reference is invalid on creation`, () => {
			const sheet = new Sheet().load({ cells: { A1: 23, B1: 17 } });
			sheet.updateSettings({ maxrow: 1, maxcol: 1 });
			validate.term(createTerm('IF1', sheet)).hasValue(undefined);
			validate.term(createTerm('A1', sheet)).hasValue(23);
			validate.term(createTerm('B1', sheet)).hasValue(17);
			validate.term(createTerm('C1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF2', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('A2', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('C2', sheet)).hasValue(ERROR.NAME);
			sheet.updateSettings({ maxrow: 1, maxcol: 0, mincol: 0 });
			validate.term(createTerm('B1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF2', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('A2', sheet)).hasValue(ERROR.NAME);
		});
		it(`should return ${ERROR.REF} if cell reference becomes invalid on usage`, () => {
			const sheet = new Sheet().load({ cells: { A1: 23, B1: 17, A2: 42, B2: 9 } });
			sheet.updateSettings({ maxrow: 2, maxcol: 1 });
			const cellrefs = [
				createTerm('A1', sheet),
				createTerm('B1', sheet),
				createTerm('A2', sheet),
				createTerm('B2', sheet)
			];
			let results = [23, 17, 42, 9];
			cellrefs.forEach((cellref, index) => validate.term(cellref).hasValue(results[index]));
			// update sheet
			sheet.updateSettings({ maxrow: 1, maxcol: 0 });
			results = [23, ERROR.REF, ERROR.REF, ERROR.REF];
			cellrefs.forEach((cellref, index) => validate.term(cellref).hasValue(results[index]));
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet is invalid`, () => {
			const machine = createMachine();
			const [t1] = machine.streamsheets;
			validate.term(createTerm('T4!A1', t1.sheet)).hasValue(ERROR.REF);
			validate.term(createTerm('T3!A1', t1.sheet)).hasValue(ERROR.REF);
			validate.term(createTerm('t2!A1', t1.sheet)).hasValue(ERROR.REF);
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet becomes invalid`, () => {
			const machine = createMachine();
			const [t1, t2] = machine.streamsheets;
			t2.sheet.load({ cells: { A2: 'hello' } });
			validate.term(createTerm('T2!A2', t1.sheet)).hasValue('hello');
			machine.removeStreamSheet(t2);
			validate.term(createTerm('T2!A2', t1.sheet)).hasValue(ERROR.REF);
		});
	});
});
describe('CellRangeReference', () => {
	describe('creation', () => {
		it('should be possible to create a CellRangeReference term', () => {
			const sheet = new Sheet().load({ cells: { A1: 'hello', C1: 'world' } });
			validate.term(createTerm('A1:C1', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('A1:C1')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('A1'), SheetIndex.create('C1')])
				.expect(rangeValues, ['hello', 'world']);
			validate.term(createTerm('A1:A1', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('A1:A1')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('A1'), SheetIndex.create('A1')])
				.expect(rangeValues, ['hello']);
		});
		it('should recognize columns IF and COMMENT', () => {
			const sheet = new Sheet().load({ cells: { COMMENT2: 'skip', IF2: 42, Z2: 'hello' } });
			validate.term(createTerm('IF2:Z2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('IF2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('Z2')])
				.expect(rangeValues, [42, 'hello']);
			validate.term(createTerm('COMMENT2:Z2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('COMMENT2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('COMMENT2'), SheetIndex.create('Z2')])
				.expect(rangeValues, ['skip', 42, 'hello']);
			validate.term(createTerm('COMMENT2:IF2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('COMMENT2:IF2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('COMMENT2'), SheetIndex.create('IF2')])
				.expect(rangeValues, ['skip', 42]);
		});
		it('should be case-insensitive', () => {
			const sheet = new Sheet().load({ cells: { COMMENT2: 'skip', IF2: 42, Z2: 'hello' } });
			validate.term(createTerm('if2:z2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('IF2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('Z2')])
				.expect(rangeValues, [42, 'hello']);
			validate.term(createTerm('coMMent2:Z2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('COMMENT2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('COMMENT2'), SheetIndex.create('Z2')])
				.expect(rangeValues, ['skip', 42, 'hello']);
			validate.term(createTerm('comment2:If2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('COMMENT2:IF2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('COMMENT2'), SheetIndex.create('IF2')])
				.expect(rangeValues, ['skip', 42]);
		});
		it('should support single row and column range', () => {
			const sheet = new Sheet().load({
				/* eslint-disable */
				cells: {
					IF1: 23, A1: 'hello', C1: 'world',
					COMMENT2: 'skip', IF2: 42, Z2: 'hello'
				}
				/* eslint-ensable */
			});
			validate.term(createTerm('1:1', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('1:1')
				.validate('operand.range')
				.expect(rangeValues, [23, 'hello', 'world']);
			validate.term(createTerm('2:2', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('2:2')
				.validate('operand.range')
				.expect(rangeValues, ['skip', 42, 'hello']);
			validate.term(createTerm('A:A', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('A:A')
				.validate('operand.range')
				.expect(rangeValues, ['hello']);
			validate.term(createTerm('C:C', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('C:C')
				.validate('operand.range')
				.expect(rangeValues, ['world']);
			validate.term(createTerm('Z:Z', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('Z:Z')
				.validate('operand.range')
				.expect(rangeValues, ['hello']);
			validate.term(createTerm('IF:IF', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('IF:IF')
				.validate('operand.range')
				.expect(rangeValues, [23, 42]);
			validate.term(createTerm('COMMENT:COMMENT', sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('COMMENT:COMMENT')
				.validate('operand.range')
				.expect(rangeValues, ['skip']);
		});
	});
	describe('dispose', () => {
		it('should clear scope reference', () => {
			const sheet = new Sheet();
			validate.term(createTerm('A1:C3', sheet))
				.validate('operand')
				.hasProperty('sheet')
				.done()
				.execute((term) => term.dispose())
				.validate('operand')
				.hasNoProperty('sheet');
			validate.term(createTerm('A:A', sheet))
				.validate('operand')
				.hasProperty('sheet')
				.done()
				.execute((term) => term.dispose())
				.validate('operand')
				.hasNoProperty('sheet');
			validate.term(createTerm('1:1', sheet))
				.validate('operand')
				.hasProperty('sheet')
				.done()
				.execute((term) => term.dispose())
				.validate('operand')
				.hasNoProperty('sheet');
		});
	});
	describe('usage', () => {
		it('should be possible to reference a cell range from different stream-sheet', () => {
			// only works via machine...
			const machine = createMachine();
			const [t1, t2] = machine.streamsheets;
			t2.sheet.load({ cells: { IF2: 42, A2: 'hello', Z2: 'world' } });
			validate.term(createTerm('T2!IF2:Z2', t1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('T2!IF2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('Z2')])
				.expect(rangeValues, [42, 'hello', 'world']);
			validate.term(createTerm('T2!IF2:IF2', t1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('T2!IF2:IF2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('IF2')])
				.expect(rangeValues, [42]);
			validate.term(createTerm('T2!a2:Z2', t1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('T2!A2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('A2'), SheetIndex.create('Z2')])
				.expect(rangeValues, ['hello', 'world']);
			validate.term(createTerm('T2!Z2:z2', t1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('T2!Z2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('Z2'), SheetIndex.create('Z2')])
				.expect(rangeValues, ['world']);
		});
	});
	describe('error handling', () => {
		it(`should return ${ERROR.NAME} if cell range reference is invalid on creation`, () => {
			const sheet = new Sheet().load({ cells: { A1: 23, B1: 17 } });
			sheet.updateSettings({ maxrow: 1, maxcol: 1 });
			validate.term(createTerm('IF1:IF1', sheet)).validate('operand.range').expect(rangeValues, []);
			validate.term(createTerm('A1:A1', sheet)).validate('operand.range').expect(rangeValues, [23]);
			validate.term(createTerm('IF1:B1', sheet)).validate('operand.range').expect(rangeValues, [23, 17]);
			validate.term(createTerm('IF1:C1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF2:B1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF2:A2', sheet)).hasValue(ERROR.NAME);
			// IF1 & B1 become invalid too
			sheet.updateSettings({ maxrow: 1, maxcol: 0, mincol: 0 });
			validate.term(createTerm('IF1:IF1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('IF1:B1', sheet)).hasValue(ERROR.NAME);
			validate.term(createTerm('A1:A1', sheet)).validate('operand.range').expect(rangeValues, [23]);
		});
		it(`should return ${ERROR.REF} if cell reference becomes invalid on usage`, () => {
			const sheet = new Sheet().load({ cells: { A1: 23, B1: 17, A2: 42, B2: 9 } });
			sheet.updateSettings({ maxrow: 2, maxcol: 1 });
			const cellrefs = [
				createTerm('IF1:B2', sheet),
				createTerm('A1:A1', sheet),
				createTerm('B2:B2', sheet),
				createTerm('A:A', sheet),
				createTerm('B:B', sheet),
				createTerm('1:1', sheet),
				createTerm('2:2', sheet)
			];
			let results = [
				[23, 17, 42, 9],
				[23],
				[9],
				[23, 42],
				[17, 9],
				[23, 17],
				[42, 9]
			];
			cellrefs.forEach((cellref, index) =>
				validate.term(cellref).validate('operand.range').expect(rangeValues, results[index]));
			// update sheet
			sheet.updateSettings({ maxrow: 1, maxcol: 0 });
			results = [ERROR.REF, results[1], ERROR.REF, results[1], ERROR.REF, results[1], ERROR.REF];
			cellrefs.forEach((cellref, index) => 
				validate.term(cellref).validate('operand.range').expect(rangeValues, results[index]));
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet is invalid`, () => {
			const machine = createMachine();
			const [t1] = machine.streamsheets;
			validate.term(createTerm('T4!A1:A1', t1.sheet)).hasValue(ERROR.REF);
			validate.term(createTerm('T3!A1:A1', t1.sheet)).hasValue(ERROR.REF);
			validate.term(createTerm('t2!A1:A1', t1.sheet)).hasValue(ERROR.REF);
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet becomes invalid`, () => {
			const machine = createMachine();
			const [t1, t2] = machine.streamsheets;
			t2.sheet.load({ cells: { A2: 'hello' } });
			validate.term(createTerm('T2!A2:A2', t1.sheet)).validate('operand.range').expect(rangeValues, ['hello']);
			machine.removeStreamSheet(t2);
			validate.term(createTerm('T2!A2:A2', t1.sheet)).hasValue(ERROR.REF);
		});
	});
});
