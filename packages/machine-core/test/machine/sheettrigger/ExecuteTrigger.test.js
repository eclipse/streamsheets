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
const {
	ContinuouslyTrigger,
	ExecuteTrigger,
	Machine,
	Message,
	State,
	StreamSheet2,
	StreamSheetTrigger
} = require('../../..');
const { createCellAt } = require('../../utils');

const wait = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const expectValue = (value) => ({
	toBeInRange: (min, max) => {
		expect(value).toBeGreaterThanOrEqual(min);
		expect(value).toBeLessThanOrEqual(max);
	}
});

const setup = () => {
	const machine = new Machine();
	const s1 = new StreamSheet2({ name: 'S1' });
	const s2 = new StreamSheet2({ name: 'S2' });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.addStreamSheet(s2);
	machine.cycletime = 50;
	return { machine, s1, s2 };
};

describe('ExecuteTrigger', () => {
	it.skip('should only calculate sheet if called via another sheet', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(4);
	});
	it.skip('should repeat calculation specified times', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2", 4)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(5);
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(13);
	});
	it.skip('should use passed message', async () => {
		const { machine, s1, s2 } = setup();
		const message = new Message({ user: 'guest' });
		const counts = { attached: 0, detached: 0 };
		machine.outbox.put(message);
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 1, "out:${message.id}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.on('message_attached', () => { counts.attached += 1; });
		s2.on('message_detached', () => { counts.detached += 1; });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		expect(counts.attached).toBe(1);
		expect(counts.detached).toBe(1);
		await machine.step();
		await machine.step();
		expect(counts.attached).toBe(3);
		expect(counts.detached).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(4);
	});
	it('should consume a message on each repetition', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2", 4)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		expect(s2.inbox.size).toBe(4);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(5);
		// last message is consumed by still in inbox due to client...
		expect(s2.inbox.size).toBe(1);
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(13);
		expect(s2.inbox.size).toBe(1);		
	});
	it.skip('should consume loop-element on each repetition', async () => {
		expect(false).toBe(true);
	});

	it.skip('should use passed message with loop element', async () => {
		expect(false).toBe(true);
		// how to run through loop on execute...
	});
	it.skip('should reuse same message on "repeat until..."', async () => {
		expect(false).toBe(true);
	});
	it.skip('should reuse same loop element on "repeat until..."', async () => {
		expect(false).toBe(true);
	});
	it.skip('should use next message on "repeat until..." if return was called', async () => {
		expect(false).toBe(true);
	});
	it.skip('should use next loop element on "repeat until..." if return was called', async () => {
		expect(false).toBe(true);
	});
	test.skip('calling sheet waits until executed sheet returns', async () => {
		expect(false).toBe(true);
	});
	test.skip('calling sheet waits until executed sheet returns from "repeat until..."', async () => {
		expect(false).toBe(true);
	});
	it.skip('should repeat calculation as often as specified by repeat parameter using same message', async () => {
		expect(false).toBe(true);
	});
	it.skip('should repeat calculation as often as specified by repeat parameter using same loop element', async () => {
		expect(false).toBe(true);
	});
	it.skip('should increase execute counter', async () => {
		expect(false).toBe(true);
	});
	test.skip('above behaviour with a running machine', () => {
		expect(false).toBe(true);
	});
});
describe.skip('ExecuteTrigger IO', () => {});
