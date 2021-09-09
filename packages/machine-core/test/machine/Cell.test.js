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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Term } = require('@cedalo/parser');
const { Cell, Machine, SheetParser, StreamSheet } = require('../..');
const { description } = require('./utils');

describe('Cell', () => {
	const streamsheet = new StreamSheet();
	const sheet = streamsheet.sheet;

	describe('value', () => {
		it('should return value', () => {
			const cell = new Cell('value');
			expect(cell.value).toBe('value');
		});
		it('should return value form term', () => {
			let cell = new Cell(42);
			expect(cell.value).toBe(42);
			cell.term = Term.fromString('hello');
			expect(cell.value).toBe('hello');
			cell = SheetParser.createCell({ formula: '(3*12)+4' }, sheet);
			// cell.evaluate();
			cell.init();
			expect(cell.value).toBe(40);
		});
	});
	describe('default value', () => {
		it('should return 0 if value is NaN', () => {
			const cell = new Cell(1 / undefined).init();
			expect(cell.value).toBe(0);
		});
		it('should return 0 if value is not defined', () => {
			expect(new Cell(null).value).toBe(null);
			expect(new Cell(undefined).value).toBeUndefined();
		});
	});
	describe('formula', () => {
		// if cell value is based on a cell reference or formula, otherwise undefined
		it('should return formula if cell value is based on', () => {
			let cell = SheetParser.createCell({ formula: 'A1' }, sheet).init();
			expect(cell.formula).toBeDefined();
			expect(cell.formula).toBe('A1');
			cell = SheetParser.createCell({ formula: '2*6' }, sheet).init();
			expect(cell.formula).toBeDefined();
			expect(cell.formula).toBe('2*6');
		});
		it('should return undefined if cell value is not based on formula', () => {
			expect(new Cell(12).formula).toBeUndefined();
			expect(new Cell('A1').formula).toBeUndefined();
			expect(SheetParser.createCell('A1', sheet).init().formula).toBeUndefined();
			const cell = new Cell();
			cell.term = Term.fromString('hallo');
			expect(cell.formula).toBeUndefined();
		});
		it('should preserve formula even with errors', () => {
			let cell = SheetParser.createCell({ formula: 'len(_A1)' }, sheet).init();
			expect(cell).toBeDefined();
			expect(cell.term).toBeDefined();
			expect(FunctionErrors.isError(cell.value)).toBeTruthy();
			expect(cell.hasFormula).toBeTruthy();
			expect(cell.formula).toBe('len(_A1)');
			cell = SheetParser.createCell({ formula: 'len(AEA1)' }, sheet).init();
			expect(cell).toBeDefined();
			expect(cell.term).toBeDefined();
			expect(FunctionErrors.isError(cell.value)).toBeTruthy();
			expect(cell.hasFormula).toBeTruthy();
			expect(cell.formula).toBe('len(AEA1)');
		});
	});
	describe('description', () => {
		it('should return description with formula if cell value is based on formula', () => {
			expect(SheetParser.createCell({ formula: 'A1' }, sheet).init().description().formula).toBe('A1');
			expect(SheetParser.createCell({ formula: '2*5' }, sheet).init().description().formula).toBe('2*5');
			expect(SheetParser.createCell({ formula: 'read(inboxdata(,"id"), C2)' }, sheet)
					.init()
					.description().formula).toBe('READ(INBOXDATA(,"id"),C2)');
		});
		it('should return boolean if cell value is a not computed boolean', () => {
			expect(description(new Cell(true)).isEqualTo({ value: true, type: 'boolean' })).toBeTruthy();
			expect(description(new Cell(false)).isEqualTo({ value: false, type: 'boolean' })).toBeTruthy();
			const cell = new Cell();
			cell.term = Term.fromBoolean(false);
			expect(description(cell).isEqualTo({ value: false, type: 'bool', formula: undefined })).toBeTruthy();
			cell.term = Term.fromBoolean(true);
			expect(description(cell).isEqualTo({ value: true, type: 'bool', formula: undefined })).toBeTruthy();
			expect(description(SheetParser.createCell(true, sheet).init()).isEqualTo({ value: true })).toBeTruthy();
			expect(description(SheetParser.createCell(false, sheet).init()).isEqualTo({ value: false })).toBeTruthy();
		});
		it('should return number if cell value is a not computed number', () => {
			expect(description(new Cell(42)).isEqualTo({ value: 42, type: 'number', formula: undefined })).toBeTruthy();
			expect(description(new Cell(-23)).isEqualTo({ value: -23, type: 'number', formula: undefined }))
				.toBeTruthy();
			const cell = new Cell();
			cell.term = Term.fromNumber(0);
			expect(description(cell).isEqualTo({ value: 0, formula: undefined })).toBeTruthy();
			expect(description(SheetParser.createCell({ value: '4567', type: 'number' }, sheet).init())
				.isEqualTo({ value: 4567 })).toBeTruthy();
			expect(description(SheetParser.createCell(-234, sheet).init()).isEqualTo({ value: -234 })).toBeTruthy();
		});
		it('should return a string if cell value is a not computed string', () => {
			expect(description(new Cell('')).isEqualTo({ value: '', formula: undefined })).toBeTruthy();
			expect(description(new Cell('hi')).isEqualTo({ value: 'hi', formula: undefined })).toBeTruthy();
			const cell = new Cell();
			cell.term = Term.fromString('5-3');
			expect(description(cell).isEqualTo({ value: '5-3', formula: undefined })).toBeTruthy();
			expect(description(SheetParser.createCell('2*5', sheet).init()).isEqualTo({ value: '2*5' })).toBeTruthy();
			expect(description(SheetParser.createCell({ formula: '2*5' }, sheet).init()).isEqualTo({
				value: 10,
				formula: '2*5'
			})).toBeTruthy();
		});
		// DL-4113:
		it(`should return ${Cell.VALUE_REPLACEMENT} for json values`, async () => {
			const sheet1 = new StreamSheet().sheet.load({
				cells: { 
					A1: 'key', B1: 42,
					A2: {formula: 'json(A1:B1)'},
					A3: {formula: 'A2'}
				}
			});
			const machine = new Machine();
			machine.addStreamSheet(sheet1.streamsheet);
			await machine.step();
			const json = sheet1.toJSON();
			expect(json.cells).toBeDefined();
			expect(json.cells.A2.value).toBe(Cell.VALUE_REPLACEMENT);
			expect(json.cells.A3.value).toBe(Cell.VALUE_REPLACEMENT);
		});
		// DL-4908
		it('should limit string values to max length specified by sheet setting', async () => {
			const sheet1 = new StreamSheet().sheet.load({
				cells: { 
					A1: 'hello world', B1: 'john doe',
					A2: {formula: 'CONCAT(A1,B1)'}
				}
			});
			const machine = new Machine();
			machine.addStreamSheet(sheet1.streamsheet);
			await machine.step();
			let json = sheet1.toJSON();
			expect(json.cells).toBeDefined();
			expect(json.cells.A1.value).toBe('hello world');
			expect(json.cells.B1.value).toBe('john doe');
			expect(json.cells.A2.value).toBe('hello worldjohn doe');
			// change maxchars setting
			sheet1.updateSettings({maxchars: 7});
			expect(sheet1.settings.maxchars).toBe(7);
			await machine.step();
			json = sheet1.toJSON();
			expect(json.cells).toBeDefined();
			expect(json.cells.A1.value).toBe('hello w');
			expect(json.cells.B1.value).toBe('john do');
			expect(json.cells.A2.value).toBe('hello w');
			// change maxchars setting
			sheet1.updateSettings({maxchars: -1});
			expect(sheet1.settings.maxchars).toBe(-1);
			await machine.step();
			json = sheet1.toJSON();
			expect(json.cells).toBeDefined();
			expect(json.cells.A1.value).toBe('hello world');
			expect(json.cells.B1.value).toBe('john doe');
			expect(json.cells.A2.value).toBe('hello worldjohn doe');
			// change maxchars setting
			sheet1.updateSettings({maxchars: undefined });
			expect(sheet1.settings.maxchars).toBe(-1);
			await machine.step();
			json = sheet1.toJSON();
			expect(json.cells).toBeDefined();
			expect(json.cells.A1.value).toBe('hello world');
			expect(json.cells.B1.value).toBe('john doe');
			expect(json.cells.A2.value).toBe('hello worldjohn doe');
		});
		test('sheet string limit should be independent per sheet', async () => {
			const sheet1 = new StreamSheet().sheet.loadCells({ A1: 'hello world' });
			const sheet2 = new StreamSheet().sheet.loadCells({ A2: 'killroy was here' });
			const machine = new Machine();
			machine.addStreamSheet(sheet1.streamsheet);
			machine.addStreamSheet(sheet2.streamsheet);
			sheet1.updateSettings({maxchars: 5});
			sheet2.updateSettings({maxchars: 7});
			await machine.step();
			let json1 = sheet1.toJSON();
			let json2 = sheet2.toJSON();
			expect(json1.cells.A1.value).toBe('hello');
			expect(json2.cells.A2.value).toBe('killroy');
			sheet1.updateSettings({maxchars: -1});
			json1 = sheet1.toJSON();
			json2 = sheet2.toJSON();
			expect(json1.cells.A1.value).toBe('hello world');
			expect(json2.cells.A2.value).toBe('killroy');
			sheet1.updateSettings({maxchars: 5});
			sheet2.updateSettings({maxchars: undefined});
			json1 = sheet1.toJSON();
			json2 = sheet2.toJSON();
			expect(json1.cells.A1.value).toBe('hello');
			expect(json2.cells.A2.value).toBe('killroy was here');
			sheet1.updateSettings({maxchars: undefined});
			sheet2.updateSettings({maxchars: -1});
			json1 = sheet1.toJSON();
			json2 = sheet2.toJSON();
			expect(json1.cells.A1.value).toBe('hello world');
			expect(json2.cells.A2.value).toBe('killroy was here');
		});
	});
	describe('update', () => {
			// called instead of evaluate after load. should fix references without changing value!
	// with evaluate() e.g. A1+1 would become 2 instead of 1 !!!!

		it('should fix cell values without changing already determined value', () => {
			sheet.clear();
			sheet.setCellAt('A1', SheetParser.createCell({ formula: 'A1+1' }, sheet));
			sheet.setCellAt('A2', SheetParser.createCell({ formula: 'A3' }, sheet));
			sheet.setCellAt('A3', SheetParser.createCell({ value: 2 }, sheet));
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A2').value).toBe(0); // reference to a non existing cell results in 0 (DL-1958)
			expect(sheet.cellAt('A3').value).toBe(2);
			sheet.iterate((cell) => cell.update());
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(sheet.cellAt('A2').value).toBe(0); // still 0 since values is not changed by update()
			expect(sheet.cellAt('A3').value).toBe(2);
		});
	});
});
