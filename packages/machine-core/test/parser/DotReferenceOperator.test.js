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
const { Machine, Message, Sheet, StreamSheet } = require('../..');
const { createCellAt } = require('../utils');

const ERROR = FunctionErrors.code;

const json2str = (json) => JSON.stringify(json).replace(/"/g, '\\"');

describe('DotReferenceOperator', () => {
	it('should return referenced value', () => {
		const sheet = new Sheet();
		const json = { key: 42 };
		const jsonFormula = `json.from.text("${json2str(json)}")`;
		createCellAt('A1', { formula: `${jsonFormula}.key` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		// same with passed string
		createCellAt('A1', { formula: `${jsonFormula}."key"` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		// and reference
		createCellAt('A1', 'key', sheet);
		createCellAt('A2', { formula: `${jsonFormula}.A1` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(42);
	});
	it('should support concatenation of references', () => {
		const sheet = new Sheet();
		const json = { a: { b: { c: 23 } } };
		const jsonFormula = `json.from.text("${json2str(json)}")`;
		createCellAt('A1', { formula: `${jsonFormula}.a.b.c` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(23);
		// same with passed string
		createCellAt('A1', { formula: `${jsonFormula}."a"."b"."c"` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(23);
		// and reference
		createCellAt('A1', 'a', sheet);
		createCellAt('B1', 'b', sheet);
		createCellAt('C1', 'c', sheet);
		createCellAt('A2', { formula: `${jsonFormula}.A1.B1.C1` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(23);
	});
	it('should work with normal operators', () => {
		const sheet = new Sheet();
		const json = { a: 42, b: 23 };
		const jsonFormula = `json.from.text("${json2str(json)}")`;
		createCellAt('A1', { formula: `${jsonFormula}.a * ${jsonFormula}.b` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(966);
		// same with references
		createCellAt('A1', 'a', sheet);
		createCellAt('B1', 'b', sheet);
		createCellAt('A2', { formula: `${jsonFormula}.A1 + ${jsonFormula}.B1` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(65);
	});
	it('can be used as function parameters', () => {
		const sheet = new Sheet();
		const json = { a: 42, b: 23 };
		const jsonFormula = `json.from.text("${json2str(json)}")`;
		createCellAt('A1', { formula: `sum(${jsonFormula}.a,${jsonFormula}.b)` }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(65);
		// same with references
		createCellAt('A1', 'a', sheet);
		createCellAt('B1', 'b', sheet);
		createCellAt('A2', { formula: `sum(${jsonFormula}.A1,${jsonFormula}.B1)` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(65);
	});
	it('can use result of function as reference', () => {
		const sheet = new Sheet();
		const json = { keyA: 42, keyB: 23, nested: { obj: { id: '123' } } };
		const jsonFormula = `json.from.text("${json2str(json)}")`;
		createCellAt('A1', 'A', sheet);
		createCellAt('B1', 'B', sheet);
		createCellAt('C1', 'key', sheet);
		createCellAt('A2', { formula: `sum(${jsonFormula}.concat(C1,A1),${jsonFormula}.concat(C1,B1))` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(65);
		createCellAt('A1', 'nested', sheet);
		createCellAt('B1', 'obj', sheet);
		createCellAt('C1', 'id', sheet);
		createCellAt('A2', { formula: `${jsonFormula}.concat(A1).concat(B1).concat(C1)` }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe('123');
	});
	it('should support inbox, inboxdata and inboxmetadata', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		streamsheet.inbox.put(new Message({ key: 42 }, '123id'));
		createCellAt('A1', { formula: 'inbox.data.key' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		createCellAt('A1', { formula: 'inboxdata.key' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		createCellAt('A1', { formula: 'inboxmetadata.id' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe('123id');
	});
	it('should support outbox, outboxdata and outboxmetadata', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		machine.addStreamSheet(streamsheet);
		machine.outbox.put(new Message({ key: 42 }, '123id'));
		createCellAt('A1', { formula: 'outbox.data.key' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		createCellAt('A1', { formula: 'outboxdata.key' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe(42);
		createCellAt('A1', { formula: 'outboxmetadata.id' }, sheet);
		expect(sheet.cellAt('A1')).toBeDefined();
		expect(sheet.cellAt('A1').value).toBe('123id');
	});
	it('should handle if identifier is part of function', () => {
		const sheet = new Sheet();
		createCellAt(
			'A1',
			{ formula: `json.from.text("${json2str({ json: { from: { text: 42 } } })}")` },
			sheet
		);
		createCellAt('A2', { formula: `A1.json.from.text` }, sheet);
		expect(sheet.cellAt('A2').value).toBe(42);
	});
	it(`should return ${ERROR.VALUE} if no json or reference undefined or ref is invalid`, () => {
		const sheet = new Sheet();
		const json = `json.from.text("${json2str({ key: 42 })}")`;
		createCellAt('A2', { formula: 'A1.B1' }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);
		
		createCellAt('A1', { formula: `${json}"` }, sheet);
		createCellAt('A2', { formula: 'A1.B1' }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(ERROR.VALUE);

		createCellAt('A1', { formula: `${json}"` }, sheet);
		createCellAt('B1', 'key', sheet);
		createCellAt('A2', { formula: 'A1.B1' }, sheet);
		expect(sheet.cellAt('A2')).toBeDefined();
		expect(sheet.cellAt('A2').value).toBe(42);
	});
});
