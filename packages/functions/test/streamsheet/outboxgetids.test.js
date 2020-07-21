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
const { Cell, Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const {	createCellAt } = require('../utilities');

const ERROR = FunctionErrors.code;

describe('outbox.getids', () => {
	it('should return all messages from outbox', async () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		// add 3 messages to outbox:
		outbox.put(new Message({}, 'id1'));
		outbox.put(new Message({}, 'id2'));
		outbox.put(new Message({}, 'id3'));
		createCellAt('A1', { formula: 'outbox.getids()' }, sheet);
		const cell = sheet.cellAt('A1');
		expect(cell.description().value).toBe(Cell.VALUE_REPLACEMENT);
		expect(cell.value).toEqual(['id3', 'id2', 'id1']);
		outbox.pop('id2');
		await machine.step();
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id1']);
		outbox.pop();
		await machine.step();
		expect(sheet.cellAt('A1').value).toEqual(['id1']);
		outbox.pop();
		await machine.step();
		expect(sheet.cellAt('A1').value).toEqual([]);
	});
	it('should return list with specified id', () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		outbox.put(new Message({}, 'id1'));
		outbox.put(new Message({}, 'id2'));
		outbox.put(new Message({}, 'id3'));
		createCellAt('A1', { formula: 'outbox.getids("id1")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id1']);
		createCellAt('A1', { formula: 'outbox.getids("id2")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id2']);
		createCellAt('A1', { formula: 'outbox.getids("id3")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3']);
		createCellAt('A1', { formula: 'outbox.getids("id4")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual([]);
	});
	it('should support * wildcard', () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		outbox.put(new Message({}, 'id1'));
		outbox.put(new Message({}, 'id2'));
		outbox.put(new Message({}, 'id3'));
		createCellAt('A1', { formula: 'outbox.getids("*")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id2', 'id1']);
		createCellAt('A1', { formula: 'outbox.getids("id*")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id2', 'id1']);
		createCellAt('A1', { formula: 'outbox.getids("*id*")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id2', 'id1']);
		createCellAt('A1', { formula: 'outbox.getids("*3")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3']);
		createCellAt('A1', { formula: 'outbox.getids("i*2")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id2']);
		createCellAt('A1', { formula: 'outbox.getids("id1*3")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual([]);
	});
	it('should ignore escaped * wildcard', () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		outbox.put(new Message({}, 'id*1'));
		outbox.put(new Message({}, '*id2'));
		outbox.put(new Message({}, 'id3*'));
		createCellAt('A1', { formula: 'outbox.getids("*")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3*', '*id2', 'id*1']);
		createCellAt('A1', { formula: 'outbox.getids("*~*")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3*']);
		createCellAt('A1', { formula: 'outbox.getids("~**")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['*id2']);
		createCellAt('A1', { formula: 'outbox.getids("i*~**")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3*', 'id*1']);
	});
	it('should support ? wildcard', () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		outbox.put(new Message({}, 'id1'));
		outbox.put(new Message({}, 'id2'));
		outbox.put(new Message({}, 'id3'));
		createCellAt('A1', { formula: 'outbox.getids("id?")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id2', 'id1']);
		createCellAt('A1', { formula: 'outbox.getids("i?2")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id2']);
		createCellAt('A1', { formula: 'outbox.getids("?d3")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3']);
		createCellAt('A1', { formula: 'outbox.getids("???")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3', 'id2', 'id1']);
		createCellAt('A1', { formula: 'outbox.getids("??")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual([]);
	});
	it('should ignore escaped ? wildcard', () => {
		const machine = new Machine();
		const outbox = machine.outbox;
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		outbox.put(new Message({}, 'id?1'));
		outbox.put(new Message({}, '?id2'));
		outbox.put(new Message({}, 'id3?'));
		createCellAt('A1', { formula: 'outbox.getids("~?id?")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['?id2']);
		createCellAt('A1', { formula: 'outbox.getids("id~??")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id?1']);
		createCellAt('A1', { formula: 'outbox.getids("id?~?")' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(['id3?']);
	});
	it('should return an empty list if outbox has no messages', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		createCellAt('A1', { formula: 'outbox.getids()' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual([]);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toEqual([]);
	});
	it(`should return ${ERROR.ARGS} if called with to many arguments`, () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', { formula: 'outbox.getids("*",12)' }, sheet);
		expect(sheet.cellAt('A1').value).toBe(ERROR.ARGS);
	});
	it(`should return ${ERROR.VALUE} if first parameter is no string`, () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', { formula: 'outbox.getids(A2)' }, sheet);
		expect(sheet.cellAt('A1').value).toBe(ERROR.VALUE);
	});
});