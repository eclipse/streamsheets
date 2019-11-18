const SHEETS = require('../_data/sheets.json');
const MESSAGES = require('../_data/messages.json');
const { INBOXDATA } = require('../../src/functions');
const { createCellTerm, createCellRangeTerm, createParamTerms } = require('../utils');
const { Term } = require('@cedalo/parser');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors: Error } = require('@cedalo/error-codes');

const createCellTerms = (strings, sheet) => strings.map(str => createCellTerm(str, sheet));

const setup = (config) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	streamsheet.name = config.streamsheetName;
	streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE.data), 'msg-simple'));
	streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE2.data), 'msg-simple2'));
	return streamsheet.sheet;
};

describe('inboxdata', () => {
	describe('referencing inbox message data', () => {
		it('should return a string denoting json path', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(INBOXDATA(sheet, ...createParamTerms('T1', '', 'person'))).toBe('[T1][][person]');
			expect(INBOXDATA(sheet, ...createParamTerms('T1', '', 'person', 'vorname')))
				.toBe('[T1][][person][vorname]');
			expect(INBOXDATA(sheet, ...createParamTerms('T1', '', 'person', 'kundenname', 'vorname')))
				.toBe('[T1][][person][kundenname][vorname]');
		});

		it('should except cell range as parameter', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			let terms = createParamTerms('T1', '').concat(createCellTerm('A1', sheet));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][A1]');
			terms = createParamTerms('T1', '').concat(...createCellTerms(['A1', 'C2'], sheet));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][A1][C2]');
			terms = createParamTerms('T1', '').concat(createCellRangeTerm('A1:C2', sheet));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][A1][B1][C1][A2][B2][C2]');
			terms = createParamTerms('T1', '').concat(createCellTerm('IF1', sheet));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][IF1]');
			terms = createParamTerms('T1', '').concat(createCellRangeTerm('COMMENT1:C1', sheet));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][COMMENT1][IF1][A1][B1][C1]');
		});

		it('should be possible to reference an array index', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			const terms = createParamTerms('T1', '', 'Customers').concat(Term.fromNumber(0));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][Customers][0]');
		});
	});

	describe('referencing inbox message', () => {
		it('should use specified message', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			const terms = createParamTerms('T1', 'msg-simple2', 'Kundenname', 'Vorname');
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][msg-simple2][Kundenname][Vorname]');
		});
	});

	describe('handling of loop-element', () => {
		it('should add loop-element', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			let terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][Positionen][0]');
			terms = createParamTerms('T1', '').concat(createParamTerms('', 'Artikel'));
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][Positionen][0][Artikel]');
		});
		it('should return error if loop-element is not found', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			sheet.streamsheet.setLoopPath('[metadata][Positionen]');
			let terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXDATA(sheet, ...terms)).toBe(Error.code.INVALID_LOOP_PATH);
			terms = createParamTerms('T1', '').concat(createParamTerms('', 'Artikel'));
			expect(INBOXDATA(sheet, ...terms)).toBe(Error.code.INVALID_LOOP_PATH);
			sheet.streamsheet.setLoopPath('');
			terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXDATA(sheet, ...terms)).toBe(Error.code.INVALID_LOOP_PATH);
		});
		it(`should return error "${Error.code.INVALID_LOOP_PATH}" if given loop path does not match`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			// no loop set:
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(Error.code.INVALID_LOOP_PATH);
			sheet.loadCells({ A1: { formula: 'inboxdata(,,,"Positionen")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(Error.code.INVALID_LOOP_PATH);
			// set loop:
			sheet.streamsheet.setLoopPath('[data]');
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Kundenname]');
			sheet.loadCells({ A1: { formula: 'inboxdata(,,,"Vorname")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Kundenname][Vorname]');
			// absolute reference:
			sheet.loadCells({ A1: { formula: 'inboxdata(,,"Kundennummer")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Kundennummer]');
			sheet.loadCells({ A1: { formula: 'inboxdata(,,"Warenkorb",0)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Warenkorb][0]');
		});
		it('should be possible to reference a loop-element absolute', () => {
			const sheet = setup({ streamsheetName: 'T1' }).load({ cells: SHEETS.SIMPLE });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			const terms = createParamTerms('T1', '', 'Positionen', '2', 'Artikel');
			expect(INBOXDATA(sheet, ...terms)).toBe('[T1][][Positionen][2][Artikel]');
		});
	});

	describe('handling of missing parameters', () => {
		it(`should return current message of calling sheet if no parameter is provided`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			// loop
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(Error.code.INVALID_LOOP_PATH);
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][][Positionen][0]');
			// without loop
			sheet.streamsheet.setLoopPath('');
			sheet.loadCells({ A1: { formula: 'inboxdata()' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
			sheet.loadCells({ A1: { formula: 'inboxdata(,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
			sheet.loadCells({ A1: { formula: 'inboxdata("T1")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');			
			sheet.loadCells({ A1: { formula: 'inboxdata("T1",)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('[T1][]');
		});
	});
});
