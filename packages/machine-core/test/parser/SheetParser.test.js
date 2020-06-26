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
const { Machine, StreamSheet, Sheet } = require('../..');
const { functions } = require('../utils');
const { SheetParser } = require('../../src/parser/SheetParser');
const { FuncTerm, Operand } = require('@cedalo/parser');
const { FunctionErrors } = require('@cedalo/error-codes');


let machine;
beforeEach(() => {
	Object.assign(SheetParser.context.functions, functions);
	SheetParser.context.scope = new Sheet();
	machine = new Machine();
	machine.addStreamSheet(new StreamSheet({ name: 'T1' }));
	machine.addStreamSheet(new StreamSheet({ name: 'T2' }));
});


describe('parsing of sheet functions', () => {
	it('should resolve available sheet functions', () => {
		const context = SheetParser.context;
		expect(context.hasFunction('copyvalues')).toBeTruthy();
		expect(context.hasFunction('sum')).toBeTruthy();
		expect(context.hasFunction('SWAPVALUES')).toBeTruthy();
		expect(context.hasFunction('InBoxdAta')).toBeTruthy();
	});
	it('should parse copyvalues function', () => {
		const term = SheetParser.parse('copyvalues(A1, B1)');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('copyvalues');
		expect(term.params.length).toBe(2);
		expect(term.params[0].operand.index.toString()).toBe('A1');
		expect(term.params[1].operand.index.toString()).toBe('B1');
	});
	it('should parse sum function', () => {
		let term = SheetParser.parse('sum(A1, B3, D4)');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('sum');
		expect(term.params.length).toBe(3);
		expect(term.params[0].operand.index.toString()).toBe('A1');
		expect(term.params[1].operand.index.toString()).toBe('B3');
		expect(term.params[2].operand.index.toString()).toBe('D4');
		// define a range with :, e.g. A1:D4
		term = SheetParser.parse('sum("A1:D4")');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('sum');
		expect(term.params.length).toBe(1);
		const rangedef = term.params[0].operand;
		expect(rangedef.type).toBe(Operand.TYPE.STRING);
		expect(rangedef.value).toBe('A1:D4');
	});
	it('should parse swapvalues function', () => {
		const term = SheetParser.parse('swapvalues(A1, B3)');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('swapvalues');
		expect(term.params.length).toBe(2);
		expect(term.params[0].operand.index.toString()).toBe('A1');
		expect(term.params[1].operand.index.toString()).toBe('B3');
	});
	it('should parse inboxdata function', () => {
		let term = SheetParser.parse('inboxdata("T1", "msgid", "Kundenname", "Vorname")');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('inboxdata');
		expect(term.params.length).toBe(4);
		expect(term.params[0].operand.value).toBe('T1');
		expect(term.params[1].operand.value).toBe('msgid');
		expect(term.params[2].operand.value).toBe('Kundenname');
		expect(term.params[3].operand.value).toBe('Vorname');
		term = SheetParser.parse('inboxdata("T1", , A1:C1)');
		expect(term.name).toBe('inboxdata');
		expect(term.params.length).toBe(3);
		expect(term.params[0].operand.value).toBe('T1');
		expect(term.params[1].operand.value).toBeUndefined();
		// range is passed as string term...
		expect(term.params[2].operand.type).toBe(Operand.TYPE.REFERENCE);
		expect(term.params[2].operand.toString()).toBe('A1:C1');
		term = SheetParser.parse('inboxdata( , , , A1:C1)');
		expect(term.name).toBe('inboxdata');
		expect(term.params.length).toBe(4);
		expect(term.params[0].operand.value).toBeUndefined();
		expect(term.params[1].operand.value).toBeUndefined();
		expect(term.params[2].operand.type).toBe(Operand.TYPE.UNDEF);
		expect(term.params[2].operand.value).toBeUndefined();
		expect(term.params[3].operand.type).toBe(Operand.TYPE.REFERENCE);
		expect(term.params[3].operand.toString()).toBe('A1:C1');
	});
	it('should parse read function', () => {
		const term = SheetParser.parse('read(inboxdata("Kundenname", "Vorname"), C2, "String")');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('read');
		expect(term.params.length).toBe(3);
		// first param should be inboxdata function term:
		expect(term.params[0].func).toBeDefined();
		expect(term.params[0].params.length).toBe(2);
		expect(term.params[0].params[0].operand.value).toBe('Kundenname');
		expect(term.params[0].params[1].operand.value).toBe('Vorname');
		// second param cell-reference
		expect(term.params[1].operand.index.toString()).toBe('C2');
		expect(term.params[2].operand.value).toBe('String');
	});
	it('should parse write function', () => {
		const term = SheetParser.parse('write(outboxdata("[out1]", "Positionen"), ,"Array")');
		expect(term).toBeDefined();
		expect(term instanceof FuncTerm).toBeTruthy();
		expect(term.name).toBe('write');
		// first param should be outboxdata function term:
		expect(term.params[0].func).toBeDefined();
		expect(term.params[0].params.length).toBe(2);
		expect(term.params[0].params[0].operand.value).toBe('[out1]');
		expect(term.params[0].params[1].operand.value).toBe('Positionen');
		// second param cell-reference is empty
		expect(term.params[1].operand.value).toBeUndefined();
		// third param is type string
		expect(term.params[2].operand.value).toBe('Array');
		expect(term.params.length).toBe(3);
		expect(SheetParser.parse('write(outboxdata("[out1]", "Positionen", 0), ,"Dicitonary")')).toBeDefined();
		expect(SheetParser.parse('write(outboxdata("[out1]", "Positionen", 0, "PosNr"), A2,"Number")')).toBeDefined();
	});
	it('should support list parameters', () => {
		let term = SheetParser.parse('setvalue(true,"[out1]",[A1, C1])');
		expect(term).toBeDefined();
		expect(term.params.length).toBe(3);
		expect(term.params[2].isList).toBeTruthy();
		expect(term.params[2].params.length).toBe(2);
		expect(term.params[2].params[0].operand.index.toString()).toBe('A1');
		expect(term.params[2].params[1].operand.index.toString()).toBe('C1');
		SheetParser.context.scope = new Sheet();
		term = SheetParser.parse('[A1, C1]');
		expect(term).toBeDefined();
		expect(term.isList).toBeTruthy();
		expect(term.params.length).toBe(2);
		expect(term.params[0].operand.index.toString()).toBe('A1');
		expect(term.params[1].operand.index.toString()).toBe('C1');
		SheetParser.context.scope = new Sheet();
		term = SheetParser.parse('[A1:C2, E3:F5]');
		expect(term).toBeDefined();
		expect(term.isList).toBeTruthy();
		expect(term.params.length).toBe(2);
		expect(term.params[0].operand.range.toString()).toBe('A1:C2');
		expect(term.params[1].operand.range.toString()).toBe('E3:F5');
	});
});
describe('parsing of custom operators', () => {
	it('should recognize <> as not-equal-operator', () => {
		const term = SheetParser.parse('"hello" <> "world"');
		expect(term).toBeDefined();
		expect(term.value).toBe(true);
		expect(SheetParser.parse('"hello"<>"hello"').value).toBe(false);
	});
	// DL-1420
	it('should return an error value for incomplete binary operations', () => {
		let term = SheetParser.parse('2*');
		expect(term).toBeDefined();
		expect(FunctionErrors.isError(term.value)).toBeTruthy();
		term = SheetParser.parse('2-');
		expect(term).toBeDefined();
		expect(FunctionErrors.isError(term.value)).toBeTruthy();
		term = SheetParser.parse('max(1,-2-)');
		expect(term).toBeDefined();
		expect(FunctionErrors.isError(term.value)).toBeTruthy();
		term = SheetParser.parse('max(1,-2*)');
		expect(term).toBeDefined();
		expect(FunctionErrors.isError(term.value)).toBeTruthy();
	});
});
