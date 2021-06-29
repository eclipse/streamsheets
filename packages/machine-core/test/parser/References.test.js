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
const { createTerm, validate } = require('../utils');
const { Machine, Message, referenceFromString, StreamSheet, Sheet, SheetIndex } = require('../..');
const { FunctionErrors, ErrorInfo } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;
const ERROR_REF = ErrorInfo.create(ERROR.REF);
const ERROR_NAME = ErrorInfo.create(ERROR.NAME);

const createMachine = () => {
	const machine = new Machine();
	machine.removeAllStreamSheets();
	machine.addStreamSheet(new StreamSheet({ name: 'S1' }));
	machine.addStreamSheet(new StreamSheet({ name: 'S2' }));
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
			const [s1, s2] = machine.streamsheets;
			s2.sheet.load({ cells: { IF2: 42, Z2: 'hello' } });
			validate.term(createTerm('S2!Z2', s1.sheet))
				.hasOperandType('CellReference')
				.hasValue('hello')
				.hasDescription('S2!Z2');
			validate.term(createTerm('S2!IF2', s1.sheet))
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('S2!IF2');
			validate.term(createTerm('S2!if2', s1.sheet))
				.hasOperandType('CellReference')
				.hasValue(42)
				.hasDescription('S2!IF2');
		});
		// DL-1716
		it('should be possible to use cell from different sheet within arithmetic operation', () => {
			const machine = createMachine();
			const [s1, s2] = machine.streamsheets;
			s1.sheet.load({ cells: { B3: 2 } });
			s2.sheet.load({ cells: { B3: 23 } });
			expect(createTerm('B3*S2!B3', s1.sheet).value).toBe(46);
		});
		// DL-1958
		it('should return 0 as value for undefined cells', () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			const sheet = s1.sheet.loadCells({ 
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
			validate.term(createTerm('C1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF2', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('A2', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('C2', sheet)).hasValue(ERROR_NAME);
			sheet.updateSettings({ maxrow: 1, maxcol: 0, mincol: 0 });
			validate.term(createTerm('B1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF2', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('A2', sheet)).hasValue(ERROR_NAME);
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
			results = [23, ERROR_REF, ERROR_REF, ERROR_REF];
			cellrefs.forEach((cellref, index) => validate.term(cellref).hasValue(results[index]));
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet is invalid`, () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			validate.term(createTerm('S4!A1', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S3!A1', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('s2!A1', s1.sheet)).hasValue(ERROR_REF);
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet becomes invalid`, () => {
			const machine = createMachine();
			const [s1, s2] = machine.streamsheets;
			s2.sheet.load({ cells: { A2: 'hello' } });
			validate.term(createTerm('S2!A2', s1.sheet)).hasValue('hello');
			machine.removeStreamSheet(s2);
			validate.term(createTerm('S2!A2', s1.sheet)).hasValue(ERROR_REF);
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
			const [s1, s2] = machine.streamsheets;
			s2.sheet.load({ cells: { IF2: 42, A2: 'hello', Z2: 'world' } });
			validate.term(createTerm('S2!IF2:Z2', s1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('S2!IF2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('Z2')])
				.expect(rangeValues, [42, 'hello', 'world']);
			validate.term(createTerm('S2!IF2:IF2', s1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('S2!IF2:IF2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('IF2'), SheetIndex.create('IF2')])
				.expect(rangeValues, [42]);
			validate.term(createTerm('S2!a2:Z2', s1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('S2!A2:Z2')
				.validate('operand.range')
				.expect(rangeStartEnd, [SheetIndex.create('A2'), SheetIndex.create('Z2')])
				.expect(rangeValues, ['hello', 'world']);
			validate.term(createTerm('S2!Z2:z2', s1.sheet))
				.hasOperandType('CellRangeReference')
				.hasDescription('S2!Z2:Z2')
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
			validate.term(createTerm('IF1:C1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF2:B1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF2:A2', sheet)).hasValue(ERROR_NAME);
			// IF1 & B1 become invalid too
			sheet.updateSettings({ maxrow: 1, maxcol: 0, mincol: 0 });
			validate.term(createTerm('IF1:IF1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('IF1:B1', sheet)).hasValue(ERROR_NAME);
			validate.term(createTerm('A1:A1', sheet)).validate('operand.range').expect(rangeValues, [23]);
		});
		it(`should return ${ERROR.REF} if cell reference becomes invalid on usage`, () => {
			const ERROR_REF = ErrorInfo.create(ERROR.REF);
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
			results = [ERROR_REF, results[1], ERROR_REF, results[1], ERROR_REF, results[1], ERROR_REF];
			cellrefs.forEach((cellref, index) => 
				validate.term(cellref).validate('operand.range').expect(rangeValues, results[index]));
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet is invalid`, () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			validate.term(createTerm('S4!A1:A1', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S3!A1:A1', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('s2!A1:A1', s1.sheet)).hasValue(ERROR_REF);
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet becomes invalid`, () => {
			const machine = createMachine();
			const [s1, s2] = machine.streamsheets;
			s2.sheet.load({ cells: { A2: 'hello' } });
			validate.term(createTerm('S2!A2:A2', s1.sheet)).validate('operand.range').expect(rangeValues, ['hello']);
			machine.removeStreamSheet(s2);
			validate.term(createTerm('S2!A2:A2', s1.sheet)).hasValue(ERROR_REF);
		});
	});
});
describe('MessageBoxReference', () => {
	describe('creation', () => {
		it('should be possible to create a MessageReference term', () => {
			const machine = createMachine();
			const message = new Message();
			const [s1] = machine.streamsheets;
			s1.inbox.put(message);
			machine.outbox.put(message);
			validate.term(createTerm('INBOX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('INBOX');
			validate.term(createTerm('OUTBOX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('OUTBOX');
		});
		it('should be case insensitive', () => {
			const machine = createMachine();
			const message = new Message();
			const [s1] = machine.streamsheets;
			s1.inbox.put(message);
			machine.outbox.put(message);
			validate.term(createTerm('inBoX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('INBOX');
			validate.term(createTerm('OuTbOx', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('OUTBOX');
		});
		it('should return undefined if reference string is not supported', () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			expect(referenceFromString('hello', s1.sheet)).toBeUndefined();
			// NOTE: INBOX2 is a CellReference although invalid because too large
			expect(referenceFromString('INBOX_2', s1.sheet)).toBeUndefined();
			expect(referenceFromString('OUTBOXDATAA', s1.sheet)).toBeUndefined();
		});
	});
	describe('dispose', () => {
		it('should clear scope reference', () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			validate
				.term(createTerm('INBOX', s1.sheet))
				.validate('operand')
				.hasProperty('sheet')
				.done()
				.execute((term) => term.dispose())
				.validate('operand')
				.hasNoProperty('sheet');
			validate
				.term(createTerm('OUTBOX', s1.sheet))
				.validate('operand')
				.hasProperty('sheet')
				.done()
				.execute((term) => term.dispose())
				.validate('operand')
				.hasNoProperty('sheet');
		});
	});
	describe('usage', () => {
		it('should be possible to reference message via inbox, inboxmetadata and inboxdata', () => {
			const machine = createMachine();
			const msgdata = { customer: 'john does' };
			const message = new Message(msgdata);
			const [s1] = machine.streamsheets;
			s1.inbox.put(message);
			validate.term(createTerm('INBOX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('INBOX');
			validate.term(createTerm('INBOXDATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(msgdata)
				.hasDescription('INBOXDATA');
			validate.term(createTerm('INBOXMETADATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message.metadata)
				.hasDescription('INBOXMETADATA');
		});
		it('should be possible to reference message via oubox, ouboxmetadata and ouboxdata', () => {
			const machine = createMachine();
			const msgdata = { customer: 'john does' };
			const message = new Message(msgdata);
			const [s1] = machine.streamsheets;
			machine.outbox.put(message);
			validate.term(createTerm('OUTBOX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('OUTBOX');
			validate.term(createTerm('OUTBOXDATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(msgdata)
				.hasDescription('OUTBOXDATA');
			validate.term(createTerm('OUTBOXMETADATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message.metadata)
				.hasDescription('OUTBOXMETADATA');
		});
		it('should be possible to reference message in inbox of another sheets', () => {
			const machine = createMachine();
			const msgdata = { customer: 'john does' };
			const message = new Message(msgdata);
			const [s1, s2] = machine.streamsheets;
			s2.inbox.put(message);
			validate.term(createTerm('S2!INBOX', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('S2!INBOX');
			validate.term(createTerm('S2!INBOXDATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(msgdata)
				.hasDescription('S2!INBOXDATA');
			validate.term(createTerm('S2!INBOXMETADATA', s1.sheet))
				.hasOperandType('MessageBoxReference')
				.hasValue(message.metadata)
				.hasDescription('S2!INBOXMETADATA');
		});
		it('should be possible to copy a messagebox-reference', () => {
			const machine = createMachine();
			const msgdata = { customer: 'john does' };
			const message = new Message(msgdata);
			const [s1,s2] = machine.streamsheets;
			s2.inbox.put(message);
			machine.outbox.put(message);
			validate.term(createTerm('S2!INBOX', s1.sheet).copy())
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('S2!INBOX');
			validate.term(createTerm('OUTBOX', s1.sheet).copy())
				.hasOperandType('MessageBoxReference')
				.hasValue(message)
				.hasDescription('OUTBOX');
		});
		test('corresponding functions still work', async () => {
			const machine = createMachine();
			const msgdata = { customer: 'john does' };
			const message = new Message(msgdata);
			const [s1, s2] = machine.streamsheets;
			s2.inbox.put(message);
			machine.outbox.put(message);
			s1.sheet.loadCells({
				A1: { formula: 'S2!INBOX' },
				B1: { formula: 'S2!INBOXMETADATA' },
				C1: { formula: 'S2!INBOXDATA' },
				D1: { formula: 'S2!OUTBOX' },
				E1: { formula: 'S2!OUTBOXMETADATA' },
				F1: { formula: 'S2!OUTBOXDATA' }
			});
			s2.sheet.loadCells({
				A2: { formula: 'INBOX("S2")' },
				B2: { formula: 'INBOXMETADATA("S2")' },
				C2: { formula: 'INBOXDATA("S2")' },
				D2: { formula: `OUTBOX("${message.id}")` },
				E2: { formula: `OUTBOXMETADATA("${message.id}")` },
				F2: { formula: `OUTBOXDATA("${message.id}")` }
			});
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toEqual(message);
			expect(s1.sheet.cellAt('B1').value).toEqual(message.metadata);
			expect(s1.sheet.cellAt('C1').value).toEqual(msgdata);
			expect(s1.sheet.cellAt('D1').value).toEqual(message);
			expect(s1.sheet.cellAt('E1').value).toEqual(message.metadata);
			expect(s1.sheet.cellAt('F1').value).toEqual(msgdata);
			expect(s2.sheet.cellAt('A2').value).toBe('[S2][]');
			expect(s2.sheet.cellAt('B2').value).toBe('[S2][]');
			expect(s2.sheet.cellAt('C2').value).toBe('[S2][]');
			expect(s2.sheet.cellAt('D2').value).toBe(`[${message.id}]`);
			expect(s2.sheet.cellAt('E2').value).toBe(`[${message.id}]`);
			expect(s2.sheet.cellAt('F2').value).toBe(`[${message.id}]`);
		});
	});
	describe('message unavailable', () => {
		it('should return undefined if no message is available', () => {
			const machine = createMachine();
			const [s1] = machine.streamsheets;
			validate.term(createTerm('INBOX', s1.sheet)).hasValue(undefined);
			validate.term(createTerm('INBOXDATA', s1.sheet)).hasValue(undefined);
			validate.term(createTerm('INBOXMETADATA', s1.sheet)).hasValue(undefined);
			validate.term(createTerm('OUTBOX', s1.sheet)).hasValue(undefined);
			validate.term(createTerm('OUTBOXDATA', s1.sheet)).hasValue(undefined);
			validate.term(createTerm('OUTBOXMETADATA', s1.sheet)).hasValue(undefined);
		});
		it(`should return ${ERROR.REF} if referenced stream-sheet is invalid`, () => {
			const machine = createMachine();
			const message = new Message();
			const [s1] = machine.streamsheets;
			s1.inbox.put(message);
			validate.term(createTerm('S4!INBOX', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S4!INBOXDATA', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S4!INBOXMETADATA', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S4!OUTBOX', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S4!OUTBOXDATA', s1.sheet)).hasValue(ERROR_REF);
			validate.term(createTerm('S4!OUTBOXMETADATA', s1.sheet)).hasValue(ERROR_REF);
		});
	});
});

