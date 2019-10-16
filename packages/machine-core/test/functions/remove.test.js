const { Machine, Message } = require('../..');
const { REMOVE } = require('../../src/functions');
const { createCellAt, createCellTerm } = require('./utils');
const { Term } = require('@cedalo/parser');


describe.skip('remove', () => {
	it.skip('should remove message from outbox', () => {
		const machine = new Machine();
		const sheet = machine.streamsheets[0].sheet;
		machine.outbox.put(new Message({}, '1234'));
		expect(machine.outbox.size).toBe(1);
		expect(REMOVE(sheet, Term.fromString('1234'))).toBe(true);
		expect(machine.outbox.size).toBe(0);
		machine.outbox.put(new Message({}, '12'));
		machine.outbox.put(new Message({}, '123'));
		machine.outbox.put(new Message({}, '1234'));
		expect(machine.outbox.size).toBe(3);
		expect(REMOVE(sheet, Term.fromString('12'))).toBe(true);
		expect(machine.outbox.size).toBe(2);
		expect(REMOVE(sheet, Term.fromString('123'))).toBe(true);
		expect(machine.outbox.size).toBe(1);
		expect(REMOVE(sheet, Term.fromString('1234'))).toBe(true);
		expect(machine.outbox.size).toBe(0);
	});
	it.skip('should ignore if outbox is empty', () => {
		const machine = new Machine();
		const sheet = machine.streamsheets[0].sheet;
		expect(machine.outbox.size).toBe(0);
		expect(REMOVE(sheet, Term.fromString('1234'))).toBe(true);
		expect(machine.outbox.size).toBe(0);
	});
	it.skip('should ignore unknown message id', () => {
		const machine = new Machine();
		const sheet = machine.streamsheets[0].sheet;
		machine.outbox.put(new Message({}, '1234'));
		expect(machine.outbox.size).toBe(1);
		expect(REMOVE(sheet, Term.fromString('12'))).toBe(true);
		expect(machine.outbox.size).toBe(1);
	});
	it.skip('should accept ID defined by cell reference', () => {
		const machine = new Machine();
		const sheet = machine.streamsheets[0].sheet;
		machine.outbox.put(new Message({}, '1234'));
		createCellAt('A1', '"1234"', sheet);
		expect(REMOVE(sheet, createCellTerm('A1', sheet))).toBe(true);
		expect(machine.outbox.size).toBe(0);
	});
});
