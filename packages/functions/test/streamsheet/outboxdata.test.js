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
const { OUTBOXDATA } = require('../../src/functions/streamsheet').functions;
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
	machine.outbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE.data), 'msg-simple'));
	machine.outbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE2.data), 'msg-simple2'));
	return streamsheet.sheet;
};

describe('outboxdata', () => {
	describe('referencing outbox data', () => {
		it('should return a string denoting complete json path', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(OUTBOXDATA(sheet, ...createParamTerms('msg-simple', 'person'))).toBe('[msg-simple][person]');
			expect(OUTBOXDATA(sheet, ...createParamTerms('msg-simple', 'person', 'vorname')))
				.toBe('[msg-simple][person][vorname]');
			expect(OUTBOXDATA(sheet, ...createParamTerms('msg-simple', 'person', 'kundenname', 'vorname')))
				.toBe('[msg-simple][person][kundenname][vorname]');
		});

		it('should except cell range as parameter', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			let terms = createParamTerms('msg-simple').concat(createCellTerm('A1', sheet));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][A1]');
			terms = createParamTerms('msg-simple').concat(...createCellTerms(['A1', 'C2'], sheet));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][A1][C2]');
			terms = createParamTerms('msg-simple').concat(createCellRangeTerm('A1:C2', sheet));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][A1][B1][C1][A2][B2][C2]');
			terms = createParamTerms('msg-simple').concat(createCellTerm('IF1', sheet));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][IF1]');
			terms = createParamTerms('msg-simple').concat(createCellRangeTerm('COMMENT1:C1', sheet));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][COMMENT1][IF1][A1][B1][C1]');
		});

		it('should be possible to reference an array index', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			const terms = createParamTerms('msg-simple', 'Customers').concat(Term.fromNumber(0));
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple][Customers][0]');
		});
	});

	describe('referencing inbox message', () => {
		it('should use specified message', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			const terms = createParamTerms('msg-simple2', 'Kundenname', 'Vorname');
			expect(OUTBOXDATA(sheet, ...terms)).toBe('[msg-simple2][Kundenname][Vorname]');
		});
	});

	describe('handling of missing parameters', () => {
		it(`should return error "${ERROR.ARGS}" if not all required parameters are provided`, () => {
			const sheet = setup({ streamsheetName: 'T1' }).load(SHEETS.SIMPLE);
			const terms = createParamTerms('').concat(Term.fromString(''));
			expect(OUTBOXDATA()).toBe(ERROR.ARGS);
			expect(OUTBOXDATA(sheet)).toBe(ERROR.ARGS);
			expect(OUTBOXDATA(sheet, terms[0])).toBe(ERROR.NO_MSG_ID);
		});
	});
});
