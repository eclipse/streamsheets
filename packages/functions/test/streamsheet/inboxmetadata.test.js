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
const SHEETS = require('../_data/sheets.json');
const MESSAGES = require('../_data/messages.json');
const { INBOXMETADATA } = require('../../src/functions/streamsheet').functions;
const { createCellTerm, createCellRangeTerm, createParamTerms } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const createCellTerms = (strings, sheet) => strings.map(str => createCellTerm(str, sheet));

const setup = (config) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	streamsheet.name = config.streamsheetName;
	machine.addStreamSheet(streamsheet);
	streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE.data), 'msg-simple'));
	streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE2.data), 'msg-simple2'));
	return streamsheet.sheet;
};

describe('inboxmetadata', () => {
	describe('referencing inbox message metadata', () => {
		it('should return a string denoting json path', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(INBOXMETADATA(sheet, ...createParamTerms('T1', '', 'sender'))).toBe('[T1][][sender]');
			expect(INBOXMETADATA(sheet, ...createParamTerms('T1', '', 'person', 'vorname')))
				.toBe('[T1][][person][vorname]');
			expect(INBOXMETADATA(sheet, ...createParamTerms('', '', 'person'))).toBe('[T1][][person]');
			expect(INBOXMETADATA(sheet, ...createParamTerms('T1', 'msg-simple2', 'sender')))
				.toBe('[T1][msg-simple2][sender]');
		});

		it('should except cell range as parameter', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			let terms = createParamTerms('T1', '').concat(createCellTerm('A1', sheet));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][A1]');
			terms = createParamTerms('T1', '').concat(...createCellTerms(['A1', 'C2'], sheet));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][A1][C2]');
			terms = createParamTerms('T1', '').concat(createCellRangeTerm('A1:C2', sheet));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][A1][B1][C1][A2][B2][C2]');
			terms = createParamTerms('T1', '').concat(createCellTerm('IF1', sheet));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][IF1]');
			terms = createParamTerms('T1', '').concat(createCellRangeTerm('COMMENT1:C1', sheet));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][COMMENT1][IF1][A1][B1][C1]');
		});

		it('should be possible to reference an array index', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const terms = createParamTerms('T1', '', 'Customers').concat(Term.fromNumber(0));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][Customers][0]');
		});
	});

	describe('handling of loop-element', () => {
		it('should add loop-element', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[metadata][Teile]');
			let terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][Teile][0]');
			terms = createParamTerms('T1', '').concat(createParamTerms('', 'Nr'));
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][Teile][0][Nr]');
		});
		it('should return error if loop-element is not found', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Teile]');
			let terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXMETADATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
			terms = createParamTerms('T1', '').concat(createParamTerms('', 'Nr'));
			expect(INBOXMETADATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
			sheet.streamsheet.setLoopPath('');
			terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXMETADATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
		});
		it('should be possible to reference a loop-element absolute', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[metadata][Teile]');
			const terms = createParamTerms('T1', '', 'Teile', '1', 'Nr');
			expect(INBOXMETADATA(sheet, ...terms)).toBe('[T1][][Teile][1][Nr]');
		});
	});

	describe('handling of missing parameters', () => {
		it(`should return current message of calling sheet if no parameter is provided`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			// loop
			sheet.streamsheet.setLoopPath('[metadata][Teile]');
			sheet.loadCells({ A1: { formula: 'inboxmetadata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Teile][0]');
			sheet.loadCells({ A1: { formula: 'inboxmetadata(,,,"Nr")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Teile][0][Nr]');
			// without loop
			sheet.streamsheet.setLoopPath('');
			sheet.loadCells({ A1: { formula: 'inboxmetadata()' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
			sheet.loadCells({ A1: { formula: 'inboxmetadata(,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
			sheet.loadCells({ A1: { formula: 'inboxmetadata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(ERROR.INVALID_LOOP_PATH);
			sheet.loadCells({ A1: { formula: 'inboxmetadata("T1")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');			
			sheet.loadCells({ A1: { formula: 'inboxmetadata("T1",)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
		});
	});
});
