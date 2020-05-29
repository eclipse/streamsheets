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
const { INBOXDATA } = require('../../src/functions');
const { createCellTerm, createCellRangeTerm, createParamTerms } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

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
			expect(INBOXDATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
			terms = createParamTerms('T1', '').concat(createParamTerms('', 'Artikel'));
			expect(INBOXDATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
			sheet.streamsheet.setLoopPath('');
			terms = createParamTerms('T1', '').concat(Term.fromString(''));
			expect(INBOXDATA(sheet, ...terms)).toBe(ERROR.INVALID_LOOP_PATH);
		});
		it(`should return error "${ERROR.INVALID_LOOP_PATH}" if given loop path does not match`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			// no loop set:
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(ERROR.INVALID_LOOP_PATH);
			sheet.loadCells({ A1: { formula: 'inboxdata(,,,"Positionen")' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(ERROR.INVALID_LOOP_PATH);
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
		it('should work with recursive loop element', async () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			streamsheet.updateSettings({
				loop: { path: '[data][measurements]', enabled: true, recursively: true },
				trigger: { type: 'always' }
			});
			streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.RECURSIVE.data), 'msg-recursive'));
			sheet.loadCells({ A1: { formula: 'inboxdata(, , ,)' } });
			machine.addStreamSheet(streamsheet);
			expect(sheet.cellAt('A1').value).toBe('[][][measurements][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][ts]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][time]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][time][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][time][1]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][time][2]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][temperature]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][temperature][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][temperature][1]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][0][series][temperature][2]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1][ts]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1][series]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1][series][time]');
			await machine.step();
			await machine.step();
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1][series][temperature]');
			await machine.step();
			await machine.step();
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][measurements][1][series][temperature][2]');
		});
		it('should ignore null values on recursive loop element', async () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			streamsheet.updateSettings({
				loop: { path: '[data]', enabled: true, recursively: true },
				trigger: { type: 'always' }
			});
			streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.RECURSIVE_NULL), 'msg-recursive'));
			sheet.loadCells({ A1: { formula: 'inboxdata(, , ,)' } });
			machine.addStreamSheet(streamsheet);
			expect(sheet.cellAt('A1').value).toBe('[][][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][Action]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][OrderToken]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][CartToken]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][applied_discounts]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][key]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][destination_location_id]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][fulfillment_service]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][gift_card]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][grams]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][origin_location_id]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][product_id]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][properties]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][quantity]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][requires_shipping]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][sku]')
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][tax_lines]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][taxable]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][title]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][variant_id]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][variant_title]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][variant_price]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][vendor]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][user_id]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement][measured_type]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement][quantity_value]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement][quantity_unit]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement][reference_value]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][unit_price_measurement][reference_unit]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][country_hs_codes]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][country_code_of_origin]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][province_code_of_origin]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][harmonized_system_code]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][compare_at_price]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][line_price]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][price]');
			await machine.step();
			expect(sheet.cellAt('A1').value).toBe('[S1][][LineItems][0][presentment_title]');
		});
	});

	describe('handling of missing parameters', () => {
		it(`should return current message of calling sheet if no parameter is provided`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			// loop
			sheet.loadCells({ A1: { formula: 'inboxdata(,,)' } });
			sheet.streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe(ERROR.INVALID_LOOP_PATH);
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
