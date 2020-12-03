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
const addOutboxMessage = (machine, message) => {
	message = message || new Message({ outbox: true });
	machine.outbox.put(message);
	return message.id;
};

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
	it.skip('should support execute-repetitions', async () => {
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
		const counts = { attached: 0, detached: 0 };
		const messageId = addOutboxMessage(machine);
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 1, "out:${messageId}")` }, s1.sheet);
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
	it.skip('should use passed message before using inbox ones', async () => {
		const { machine, s1, s2 } = setup();
		const messageId = addOutboxMessage(machine);
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 3, "out:${messageId}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		expect(s2.inbox.size).toBe(3);
		await machine.step();
		expect(s2.inbox.size).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(4);
		// a processed message is removed with next step
		await machine.step();
		expect(s2.inbox.size).toBe(1);
	});
	it('should use passed message before using inbox ones on machine run', async () => {
		const { machine, s1, s2 } = setup();
		const messageId = addOutboxMessage(machine);
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 3, "out:${messageId}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.start();
		await machine.pause();
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		expect(s2.inbox.size).toBe(3);
		await machine.start();
		await wait(5);
		await machine.pause();
		expect(s2.inbox.size).toBe(2);
		// 3 because: (=>1) -> start(=>2) -> pause -> start(=>3)
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(7);
		// a processed message is removed with next step
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s2.inbox.size).toBe(1);
	});
	it.skip('should consume a message on each execute-repetition', async () => {
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
		expect(s2.inbox.size).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(13);
	});
	it.skip('should consume a message on each execute-repetition on machine run', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2", 3)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.start();
		await machine.pause();
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		expect(s2.inbox.size).toBe(4);
		await machine.start();
		await wait(10);
		await machine.pause();
		// processed message is consumed by next step, still in inbox due to client...
		expect(s2.inbox.size).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(7);
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s2.inbox.size).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(6);
		expect(s2.sheet.cellAt('A2').value).toBe(16);
	});
	it.skip('should consume loop-element on each repetition', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2", 3)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		s2.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 6 }, { val: 7 }] }));
		s2.inbox.put(new Message());
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		expect(s2.inbox.size).toBe(4);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(4);
		// processed message is consumed by next step, still in inbox due to client...
		expect(s2.inbox.size).toBe(4);
		expect(s2.getLoopIndex()).toBe(2);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(7);
		expect(s2.inbox.size).toBe(2);
		expect(s2.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(10);
		expect(s2.inbox.size).toBe(1);
		expect(s2.getLoopIndex()).toBe(0);
	});
	it.skip('should consume loop-element on each execute-repetition on machine run', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2", 3)' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.start();
		await machine.pause();
		s2.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 6 }, { val: 7 }] }));
		s2.inbox.put(new Message());
		expect(s2.inbox.size).toBe(4);
		await machine.start();
		await wait(10);
		await machine.pause();
		// processed message is consumed by next step, still in inbox due to client...
		expect(s2.inbox.size).toBe(4);
		expect(s2.getLoopIndex()).toBe(2);
		// 3 because: (=>1) -> start(=>2) -> pause -> start(=>3)
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(7);
		await machine.start();
		await wait(10);
		await machine.pause();
		expect(s2.inbox.size).toBe(2);
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(10);
		await machine.stop();
	});
	it.skip('should use passed message with loop element before next in inbox', async () => {
		const { machine, s1, s2 } = setup();
		const messageId = addOutboxMessage(machine, new Message({ loop: [{ val: 1 }, { val: 2 }] }));
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 2, "out:${messageId}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		s2.inbox.put(new Message({ loop: [{ val: 3 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }, { val: 6 }] }));
		s2.inbox.put(new Message());
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		expect(s2.inbox.size).toBe(3);
		await machine.step();
		expect(s2.inbox.size).toBe(3);
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(3);
		await machine.step();
		await machine.step();
		expect(s2.inbox.size).toBe(3);
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(7);
		// increase repetitions value => inbox messages must be used:
		createCellAt('A2', { formula: `execute("S2", 5, "out:${messageId}")` }, s1.sheet);
		await machine.step();
		expect(s2.inbox.size).toBe(2);
		expect(s2.getLoopIndex()).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(5);
		expect(s2.sheet.cellAt('A2').value).toBe(12);
	});
	it.skip('should use passed message with loop element before next in inbox on running machine', async () => {
		const { machine, s1, s2 } = setup();
		const messageId = addOutboxMessage(machine, new Message({ loop: [{ val: 1 }, { val: 2 }] }));
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 2, "out:${messageId}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger();
		s2.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		await machine.start();
		await machine.pause();
		s2.inbox.put(new Message({ loop: [{ val: 3 }] }));
		s2.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }, { val: 6 }] }));
		s2.inbox.put(new Message());
		expect(s2.inbox.size).toBe(3);
		await machine.start();
		await wait(10);
		await machine.pause();
		expect(s2.inbox.size).toBe(3);
		expect(s2.getLoopIndex()).toBe(1);
		// 3 because: (=>1) -> start(=>2) -> pause -> start(=>3)
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(5);
		// increase repetitions value => inbox messages must be used:
		createCellAt('A2', { formula: `execute("S2", 5, "out:${messageId}")` }, s1.sheet);
		await machine.start();
		await wait(10);
		await machine.pause();
		expect(s2.inbox.size).toBe(2);
		expect(s2.getLoopIndex()).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(10);
		await machine.stop();
	});
	it.skip('should repeat calculation on "repeat until..." until return()', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger({ repeat: 'endless' });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		createCellAt('A3', { formula: 'if(mod(A2,3)=0,return(),false)' }, s2.sheet);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		expect(s2.sheet.cellAt('A3').value).toBe(false);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(3);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(6);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		// same with running machine:
		await machine.start();
		await wait(110);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBeGreaterThanOrEqual(9);
	});
	it.skip('should reuse passed message on "repeat until..." until return()', async () => {
		const { machine, s1, s2 } = setup();
		const counts = { attached: 0, detached: 0 };
		let messageId = addOutboxMessage(machine);
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: `execute("S2", 1, "out:${messageId}")` }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger({ repeat: 'endless' });
		s2.on('message_attached', () => { counts.attached += 1; });
		s2.on('message_detached', () => { counts.detached += 1; });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		createCellAt('A3', { formula: 'if(mod(A2,3)=0,return(),false)' }, s2.sheet);
		await machine.step();
		expect(counts.attached).toBe(1);
		expect(counts.detached).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		expect(s2.sheet.cellAt('A3').value).toBe(false);
		await machine.step();
		expect(counts.attached).toBe(1);
		expect(counts.detached).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(3);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		messageId = addOutboxMessage(machine);
		createCellAt('A2', { formula: `execute("S2", 1, "out:${messageId}")` }, s1.sheet);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(counts.attached).toBe(2);
		expect(counts.detached).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(6);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		// same with running machine:
		counts.attached = 0;
		counts.detached = 0;
		messageId = addOutboxMessage(machine);
		createCellAt('A2', { formula: `execute("S2", 1, "out:${messageId}")` }, s1.sheet);
		await machine.start();
		await wait(110);
		await machine.stop();
		expect(counts.attached).toBe(1);
		expect(counts.detached).toBe(2);	// <-- 2 because we detach old message 
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBeGreaterThanOrEqual(9);
	});
	it.skip('should reuse same message on "repeat until..." until return()', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		s2.trigger = new ExecuteTrigger({ repeat: 'endless' });
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		createCellAt('A3', { formula: 'if(mod(A2,3)=0,return(),false)' }, s2.sheet);
		await machine.step();
		expect(s2.inbox.size).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		expect(s2.sheet.cellAt('A3').value).toBe(false);
		await machine.step();
		expect(s2.inbox.size).toBe(3);	// <-- detach in next step
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBe(3);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(s2.inbox.size).toBe(2);
		await machine.step();
		await machine.step();
		expect(s2.inbox.size).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A3').value).toBe(3);
		expect(s2.sheet.cellAt('A2').value).toBe(6);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
		await machine.step();
		expect(s2.inbox.size).toBe(1);
		await machine.step();
		await machine.step();
		expect(s2.inbox.size).toBe(1);	// <-- keep last message
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A3').value).toBe(4);
		expect(s2.sheet.cellAt('A2').value).toBe(9);
		expect(s2.sheet.cellAt('A3').value).toBe(true);
	});
	it.skip('should reuse same message on "repeat until..." until return() on running machine', async () => {
		const { machine, s1, s2 } = setup();
		s1.trigger = new ContinuouslyTrigger();
		s2.trigger = new ExecuteTrigger({ repeat: 'endless' });
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		createCellAt('A3', { formula: 'if(mod(A2,3)=0,return(),false)' }, s2.sheet);
		await machine.start();
		await machine.pause();
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		s2.inbox.put(new Message());
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);		
		expect(s2.inbox.size).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('A2').value).toBe(1);
		expect(s2.sheet.cellAt('A3').value).toBe(false);
		await machine.start();
		await wait(10);
		await machine.pause();
		// const s2a2 = s2.sheet.cellAt('A2').value;
		expect(s2.inbox.size).toBe(2);
		// expect(s2a2).toBeGreaterThan(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		// expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('A2').value).toBeGreaterThanOrEqual(6);
		// expect(s2.sheet.cellAt('A3').value).toBe(true);
		// await machine.start();
		// await wait(130);
		// await machine.pause();
		// expect(s2.inbox.size).toBe(1);
		// expect(s1.sheet.cellAt('A1').value).toBe(3);
		// expect(s1.sheet.cellAt('A3').value).toBe(3);
		// expect(s2.sheet.cellAt('A2').value).toBeGreaterThanOrEqual(6);
		// await machine.stop();
	});

	it.skip('should use next message on each execute-repetition but reuse last on "repeat until..." until return()', async () => {
		expect(false).toBe(true);
	});
	it.skip('should reuse same loop-element on "repeat until..." until return()', async () => {
		expect(false).toBe(true);
	});
	it.skip('should use next loop-element on each execute-repetition but reuse last on "repeat until..." until return()', async () => {
		expect(false).toBe(true);
	});

	test.skip('calling sheet waits at same message until execute() returns', () => {
		expect(false).toBe(true);
	});
	test.skip('calling sheet waits at same loop-element until execute() returns', () => {
		expect(false).toBe(true);
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
	it.skip('should stop if new trigger is set', () => {
		expect(false).toBe(true);
	});
	it.skip('should stop "repeat until.." if new trigger is set', () => {
		expect(false).toBe(true);
	});
	it.skip('should stop "repeat until.." if machine is stopped', () => {
		expect(false).toBe(true);
	});
	it.skip('should do no "repeat until.." on manual step', () => {
		expect(false).toBe(true);
	});

	it.skip('should resume processing before all repetitions are run if return() before', () => {
		expect(false).toBe(true);
	});
	it.skip('should resume processing before all repetitions are run if return() before in "repeat until..."', () => {
		expect(false).toBe(true);
	});
	test.skip('executed sheet executes another sheet and has to wait and resume until last called returns', () => {
		expect(false).toBe(true);
	});
	test.skip('calling sheet removes its execute() cell, so it will immediately resume and execute sheet stops', () => {
		expect(false).toBe(true);
	});
});
describe.skip('ExecuteTrigger IO', () => {});
