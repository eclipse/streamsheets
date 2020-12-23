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
const { ContinuousTrigger, Machine, Message, OnMessageTrigger, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, monitorStreamSheet, wait } = require('../../utils');

const putMessages = (streamsheet, ...messages) => messages.forEach(message => streamsheet.inbox.put(message));

const callPerSecond = (func, times = 1) => new Promise((resolve) => {
	const interval = 1000 / times;
	let counter = 0;
	const intId = setInterval(() => {
		func();
		counter += 1;
		if (counter > times) {
			clearInterval(intId);
			resolve();
		}
	}, interval);
});

const setup = () => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 20000;
	s1.trigger = new OnMessageTrigger();
	return { machine, s1 };
};

describe('OnMessageTrigger', () => {
	describe('general behaviour', () => {
		it('should trigger calculation on message arrival immediately', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message());
			await wait(100);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			putMessages(s1, new Message(), new Message(), new Message());
			await wait(100);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			await machine.stop();
		});
		it('should not calculate sheet if machine is in pause mode', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
		});
		// DL-3709 new behaviour:
		it('should support manual step even if inbox has no messages', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(6);
		});
		it('should calculate as long as messages are in inbox', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await wait(1000);
			// note: last message is never popped! (its a requirement)
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
		});
		it('should not prevent calculation of other sheets', async () => {
			const { machine, s1 } = setup();
			const s2 = new StreamSheet();
			s2.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
			machine.addStreamSheet(s2);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			// run for 1 second and put a message each 100ms
			await machine.start();
			await callPerSecond(() => putMessages(s1, new Message()), 10);
			await machine.stop();
			// we roughly add about 10 messages, so
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(9);
			// we cycle twice as fast, so roughly
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThanOrEqual(18);
		});
		// note: new behaviour! instead of machine-cycle it should run as fast as possible in endless mode
		it('should run as fast as possible if its set to endless mode and no message is in inbox', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			await wait(100);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(10);
		});
		it('should calculate always on same message in endless mode', async () => {
			const { machine, s1 } = setup();
			const message = new Message();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.pause();
			putMessages(s1, message);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.inbox.peek().id).toBe(message.id);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			putMessages(s1, new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.inbox.peek().id).toBe(message.id);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should not calculate sheet twice in endless mode and triggered by arrived message', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			// roughly run for about 1 second -> add about 10 messages => should not trigger additional calculations
			await callPerSecond(() => putMessages(s1, new Message()), 10);
			// steps do not increase
			expect(s1.stats.steps).toBe(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(10);
		});
	});
	describe('update trigger', () => {
		it('should be possible to remove trigger', async () => {
			const { s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger).toBeDefined();
			expect(s1.trigger.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			// remove trigger
			s1.trigger = undefined;
			expect(s1.trigger).toBeDefined();
			expect(s1.trigger.type).toBe(TriggerFactory.TYPE.NONE);
		});
		it('should stop message processing if another trigger is set', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const newTrigger = new ContinuousTrigger();
			const messages = Array.from({ length: 20 }, () => new Message());
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, ...messages);
			await monitorS1.hasPassedStep(3)
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			s1.trigger = newTrigger;
			await wait(100);
			// still at 4
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			await wait(100);
			await machine.stop();
			// expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(4);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should stop message processing in "repeat until..." if new trigger is set', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const newTrigger = new ContinuousTrigger();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			await monitorS1.hasPassedRepeatStep(3)
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(4);
			s1.trigger = newTrigger;
			const s1a1 = s1.sheet.cellAt('A1').value;
			await wait(50);
			expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
			await machine.stop();
		});

	});
	describe('serialize', () => {
		it('should be possible to save trigger settings to JSON', () => {
			let json = new OnMessageTrigger().toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(OnMessageTrigger.TYPE);
			expect(json.repeat).toBe('once');
			json = new OnMessageTrigger({ repeat: 'endless' }).toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(OnMessageTrigger.TYPE);
			expect(json.repeat).toBe('endless');
		});
		it('should be possible to restore trigger from JSON', () => {
			let trigger = TriggerFactory.create(new OnMessageTrigger().toJSON());
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(OnMessageTrigger.TYPE);
			expect(trigger.isEndless).toBe(false);
			trigger = TriggerFactory.create(new OnMessageTrigger({ repeat: 'endless' }).toJSON());
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(OnMessageTrigger.TYPE);
			expect(trigger.isEndless).toBe(true);
		});
	});
});
