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
const { ContinuouslyTrigger, Machine, Message, State, StreamSheet2, StreamSheetTrigger } = require('../../..');
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
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	s1.trigger = new ContinuouslyTrigger();
	return { machine, s1 };
};
describe('ContinuouslyTrigger', () => {
	it('should process sheet on each machine step', async () => {
		const { machine, s1 } = setup();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		await machine.start();
		await wait(100);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
		const current = s1.sheet.cellAt('A1').value;
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(current + 1);
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(current + 3);
	});

	it('should process sheet on running machine', async () => {
		expect(false).toBe(true);
	});	
	it.skip('should not block other sheets on "repeat until..."', async () => {
		const { machine, s1 } = setup();
		const s2 = new StreamSheet2({ name: 'S2' });
		machine.addStreamSheet(s2);
		s2.trigger = new ContinuouslyTrigger();
		s1.trigger.update({ repeat: 'endless' });
		// s1 will never return!
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s2.sheet.cellAt('A2').value).toBe(1);
		await machine.start();
		await wait(200);
		await machine.pause();
		expect(s1.stats.steps).toBe(1);
		// actually it should be much higher than 40!!!
		expect(s1.stats.repeatsteps).toBeGreaterThan(40);
		// should have been executed at least 3 times...
		expectValue(s2.stats.steps).toBeInRange(3, 6);
		await machine.stop();
	});

	it.skip('should not calculate sheet on "repeat until..." if machine is paused', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		// s1 will never return!
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		await machine.start();
		await wait(20);
		await machine.pause();
		expect(s1.stats.repeatsteps).toBeGreaterThan(10);
		const repeatsteps = s1.stats.repeatsteps;
		await wait(50);
		expect(s1.stats.repeatsteps).toBe(repeatsteps);
		// a single step:
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(repeatsteps + 1);
		// resume:
		await machine.start();
		await wait(5);
		await machine.pause();
		expect(s1.stats.repeatsteps).toBeGreaterThan(repeatsteps);
		expect(s1.stats.steps).toBe(1);
		await machine.stop();
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

	// tmp. skip all non behaviour related tests!! include them later again...
	it.skip('should increase sheet steps counter on each machine step', async () => {
		const { machine, s1 } = setup();
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		await machine.step();
		expect(s1.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.stats.steps).toBe(4);
		await machine.start();
		await wait(100);
		// note: steps counter is reset on machine stop!
		await machine.pause();
		expectValue(s1.stats.steps).toBeInRange(5, 7);
		await machine.stop();
		expect(s1.stats.steps).toBe(0);
	});
	it.skip('should not increase sheet steps on "repeat until..." and manual steps', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		await machine.step();
		expect(s1.stats.steps).toBe(1);
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.stats.steps).toBe(1);
		expect(s1.stats.repeatsteps).toBe(0); // <-- 0 because we return in this step => clears repeatsteps
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.stats.steps).toBe(2);
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.stats.steps).toBe(2);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(3);
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(7);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(0);
		await machine.step();
		expect(s1.stats.steps).toBe(4);
		expect(s1.stats.repeatsteps).toBe(1);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(4);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(12);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
	});
	it.skip('should not increase sheet steps on "repeat until..." and running machine', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.start();
		await machine.pause();
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		expect(s1.inbox.size).toBe(3);
		await machine.start();
		await wait(200);
		await machine.pause();
		// last message is reused so:
		expect(s1.inbox.size).toBe(1);
		expectValue(s1.stats.steps).toBeInRange(4, 6);
		expectValue(s1.stats.repeatsteps).toBeInRange(0, 2);
		await machine.stop();
	});

	// tmp. skip all messages related tests!! include them later again...
	it.skip('should process next message after sheet calculation', async () => {
		const { machine, s1 } = setup();
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
	});
	it.skip('should process next loop element after sheet calculation', async () => {
		const { machine, s1 } = setup();
		s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s1.inbox.put(new Message());
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		await machine.step();
		// message is not removed, so still 3 messages and loop index at 2
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(2);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(0);
	});
	it.skip('should reuse same message on "repeat until..." until return() is called', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		s1.inbox.put(new Message());
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(4);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(7);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(12);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
	});
	it.skip('should reuse same loop element on "repeat until..."', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s1.inbox.put(new Message());
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		// now we are at loop index 1
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		// loop index 1 should be used 3x
		await machine.step();
		await machine.step();
		await machine.step();
		// now we are at loop index 2
		expect(s1.getLoopIndex()).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		// loop index 2 should be used 3x
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(9);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		// with next step we use next message:
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(12);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		// loop index 1 should be used 3x
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(15);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		// with next step we use next message:
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(0);
		// we keep last message and loop index...
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(0);

		// AGAIN but with running machine:
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		await machine.start();
		await machine.pause();
		s1.inbox.put(new Message());
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		await machine.start();
		await wait(100);
		await machine.pause();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(1);
		await machine.stop();
	});
	it.skip('should reuse same loop element on "repeat until..." until return() is called', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s1.inbox.put(new Message());
		s1.inbox.put(new Message({ loop: [{ val: 6 }, { val: 7 }] }));
		expect(s1.inbox.size).toBe(4);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		await machine.step();
		expect(s1.stats.steps).toBe(1);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.steps).toBe(2);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.getLoopIndex()).toBe(2);
		expect(s1.sheet.cellAt('A1').value).toBe(6);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(4);
		expect(s1.getLoopIndex()).toBe(2);
		expect(s1.stats.steps).toBe(3);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(9);
		// next message:
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(10);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.steps).toBe(4);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(12);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.steps).toBe(5);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(15);
		// next message:
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.steps).toBe(6);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(18);
		// next message:
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		await machine.step();
		expect(s1.stats.steps).toBe(7);
		expect(s1.stats.repeatsteps).toBe(0);
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(21);
		// its last message and last loop, so we will keep it...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.stats.steps).toBe(8);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(25);
	});
});

describe.skip('ContinuouslyTrigger IO', () => {
	it('should be possible to save trigger settings to JSON', () => {
		expect(false).toBe(true);
	});
	it('should be possible to restore trigger from JSON', () => {
		expect(false).toBe(true);
	});
});
