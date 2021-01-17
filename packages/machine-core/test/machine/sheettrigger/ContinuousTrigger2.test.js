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
const { ContinuousTrigger, NeverTrigger, Machine, Message, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, expectValue, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

const createStreamsheet = ({ name, type, repeat }) => {
	const streamsheet = new StreamSheet({ name });
	streamsheet.trigger = TriggerFactory.create({ type, repeat });
	return streamsheet;
};

const setup = () => {
	const machine = new Machine();
	const s1 = createStreamsheet({ name: 'S1', type: TriggerFactory.TYPE.CONTINUOUSLY });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	return { machine, s1 };
};

describe('ContinuousTrigger', () => {
	describe('behaviour on machine run', () => {
		describe('general behaviour', () => {
			it('should process sheet on machine start', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				machine.cycletime = 10;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await monitorS1.hasPassedStep(3);
				await machine.stop();
				expectValue(s1.sheet.cellAt('A1').value).toBeInRange(4, 5);
				await machine.start();
				await monitorS1.hasPassedStep(5);
				await machine.stop();
				expectValue(s1.sheet.cellAt('A1').value).toBeInRange(9, 10);
			});
			it('should not process sheet if machine is paused', async () => {
				const { machine, s1 } = setup();
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(20);
				await machine.pause();
				expect(s1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await wait(50);
				// no change while pause:
				expect(s1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.stop();
				expect(s1.stats.steps).toBe(0);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			it('should not process sheet if paused by function', async () => {
				const { machine, s1 } = setup();
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machineMonitor.hasPassedStep(2);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				createCellAt('A2', undefined, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				await machineMonitor.hasPassedStep(4);
				await machine.stop();
				// will directly pause again, so
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			it('should run endlessly on "repeat until..." until machine is stopped', async () => {
				const { machine, s1 } = setup();
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(2);
			});
			it('should run endlessly on "repeat until..." until machine is paused', async () => {
				const { machine, s1 } = setup();
				const machineMonitor = monitorMachine(machine);
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(30);
				await machine.pause();
				// step count should stay at 1
				expect(s1.stats.steps).toBe(1);
				const current = s1.sheet.cellAt('A1').value;
				expect(current).toBeGreaterThan(2);
				// resume from pause:
				await machine.start();
				await machineMonitor.nextSteps(2);
				await wait(30);
				await machine.pause();
				expect(s1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(current);
				await machine.stop();
			});
			it('should not calculate sheet on "repeat until..." if machine is paused', async () => {
				const { machine, s1 } = setup();
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(10);
				await machine.pause();
				// step count should stay at 1
				expect(s1.stats.steps).toBe(1);
				const current = s1.sheet.cellAt('A1').value;
				expect(current).toBeGreaterThan(2);
				await wait(10);
				// no change while pause:
				expect(s1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(current);
				await machine.stop();
				expect(s1.stats.steps).toBe(0);
				expect(s1.sheet.cellAt('A1').value).toBe(current);
			});
			it('should resume processing sheet on return in "repeat until..."', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A3', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
				createCellAt('A4', { formula: 'A4+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(false);
				expect(s1.sheet.cellAt('A4').value).toBe(1);
				await machine.start();
				await monitorS1.hasPassedStep(3);
				await wait(10);
				await machine.stop();
				// should calculate sheet 3 times with 3 times in endless mode
				expect(s1.sheet.cellAt('A1').value).toBe(9);
				expect(s1.sheet.cellAt('A4').value).toBe(6); // <- A4 is skipped each third time
			});
			it('should not resume sheet on machine resume if sheet was paused by function', async () => {
				const { machine, s1 } = setup();
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(10);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				// wait at least for next tick:
				await wait(70);
				expect(machine.stats.steps).toBe(2);
				// should still be paused:
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				// resume pause function
				createCellAt('A2', undefined, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				await wait(120);
				expect(machine.stats.steps).toBeGreaterThanOrEqual(4);
				// only have 3 and 2 because on next tick it will pause again...
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s1.sheet.cellAt('A3').value).toBe(2);
				await machine.stop();
			});
			it('should not resume sheet in "repeat until..." on machine resume if sheet was paused by function', async () => {
				const { machine, s1 } = setup();
				const machineMonitor = monitorMachine(machine);
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(10);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				// wait at least for next tick:
				await machineMonitor.nextSteps(1);
				expect(machine.stats.steps).toBe(2);
				// should still be paused:
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				// resume pause function
				createCellAt('A2', undefined, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				await machineMonitor.nextSteps(2);
				expect(machine.stats.steps).toBeGreaterThanOrEqual(4);
				// only have 3 and 2 because on next tick it will pause again...
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s1.sheet.cellAt('A3').value).toBe(2);
				await machine.stop();
			});
			it('should resume on machine stop and start if process was paused by function', async () => {
				const { machine, s1 } = setup();
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(70);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.start();
				await wait(70);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			it('should resume on machine stop and start in "repeat until..." if process was paused by function', async () => {
				const { machine, s1 } = setup();
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause()' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(70);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.start();
				await wait(70);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			it('should not block other sheets on "repeat until..."', async () => {
				const { machine, s1 } = setup();
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY, repeat: 'endless' });
				machine.addStreamSheet(s2);
				// s2 will never return!
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'A2+1' }, s2.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('A2').value).toBe(1);
				await machine.start();
				await wait(120);
				await machine.pause();
				// s1 should be triggered 3 times...
				expect(s1.stats.steps).toBe(3);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
				// s2 did run in endless mode so...
				const s2a2 = s2.sheet.cellAt('A2').value;
				expect(s2a2).toBeGreaterThan(2); // actually it should be much higher than 2!!!
				await machine.start();
				await wait(120);
				await machine.stop();
				// s1 should be triggered at least 2 times...
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(5);
				expect(s2.sheet.cellAt('A2').value).toBeGreaterThan(s2a2 + 2);
			});
			it('should continue processing after resuming from paused by function', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				machine.cycletime = 5000;
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause(0.1)' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(true);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await monitorS1.hasPassedRepeatStep(8);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(9);
				expect(s1.sheet.cellAt('A3').value).toBe(8);
			});
			it('should not resume from function if machine is halted', async () => {
				const { machine, s1 } = setup();
				machine.cycletime = 10;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause(0.02)' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(5);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await wait(40);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start(); // resume machine
				await wait(10);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s1.sheet.cellAt('A3').value).toBe(2);
			});
			it('should not resume from "repeat until..." mode on return() if machine is halted', async () => {
				const { machine, s1 } = setup();
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause(0.02)' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(true);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(5);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await wait(40);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start(); // resume machine
				await wait(10);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s1.sheet.cellAt('A3').value).toBe(2);
			});
			it('should process again after start/stop/start', async () => {
				const { machine, s1 } = setup();
				s1.trigger.update({ repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'pause(0.1)' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(true);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(5);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();	// start after stop triggers calc
				await wait(120);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
				expect(s1.sheet.cellAt('A3').value).toBe(2);
			});
		});

		describe('message handling', () => {
			it('should process next message if sheet is processed', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				await machine.start();
				await machine.pause();
				s1.inbox.put(new Message());
				s1.inbox.put(new Message());
				s1.inbox.put(new Message());
				expect(s1.inbox.size).toBe(3);
				await machine.start();
				await monitorS1.hasPassedStep(4);
				await machine.stop();
				expect(s1.inbox.size).toBe(1);
			});	
			it('should process next loop element if sheet is processed', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
				await machine.start();
				await machine.pause();
				s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
				s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
				s1.inbox.put(new Message());
				expect(s1.inbox.size).toBe(3);
				await machine.start();
				await monitorS1.hasPassedStep(4);
				await machine.pause();
				// message is not removed, so still 3 messages and loop index at 2
				expect(s1.inbox.size).toBe(3);
				expect(s1.getLoopIndex()).toBe(2);
				await machine.start();
				await monitorS1.hasPassedStep(7);
				await machine.pause();
				expect(s1.inbox.size).toBe(1);
				expect(s1.getLoopIndex()).toBe(0);
				await machine.stop();
			});
			it('should reuse same message on "repeat until..." until return() is called', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				s1.trigger.update({ repeat: 'endless' });
				await machine.start();
				await wait(10);
				await machine.pause();
				s1.inbox.put(new Message());
				s1.inbox.put(new Message());
				s1.inbox.put(new Message());
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
				expect(s1.inbox.size).toBe(3);
				expect(s1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(false);
				await machine.start();
				await monitorS1.hasPassedStep(4);
				await wait(10); // short wait until endless is done...
				await machine.pause();
				expect(s1.stats.steps).toBe(4);
				// we reuse last message
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(8);
				expect(s1.sheet.cellAt('A2').value).toBe(true);
				await machine.stop();
			});
			it('should reuse same loop element on "repeat until..." until return() is called', async () => {
				const { machine, s1 } = setup();
				const monitorS1 = monitorStreamSheet(s1);
				s1.trigger.update({ repeat: 'endless' });
				s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
				await machine.start();
				await wait(10);
				await machine.pause();
				s1.inbox.put(new Message());
				s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
				await machine.start();
				await monitorS1.hasPassedStep(4);
				await wait(10); // short wait until endless is done...
				await machine.pause();
				expect(s1.stats.steps).toBe(4);
				expect(s1.sheet.cellAt('A1').value).toBe(8);
				expect(s1.sheet.cellAt('A2').value).toBe(true);
				// reuse last message and loop element:
				expect(s1.inbox.size).toBe(1);
				expect(s1.getLoopIndex()).toBe(1);
				await machine.stop();
			});
		});
	});

	describe('behaviour on manual stepping', () => {
		it('should process sheet on manual steps if machine is stopped', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should process sheet on manual steps after pause & stop machine', async () => {
			const { machine, s1 } = setup();
			machine.cycletime = 1000;
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.start();
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should process sheet on manual steps if machine is paused', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			// now step 3 times
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			await machine.start();
			await wait(120);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(6);
		});
		it('should process sheet on manual steps if machine is paused in "repeat until..."', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await monitorS1.hasPassedRepeatStep(10);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(11);
			// now step 3 times
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(11 + 3);
			await machine.start();
			await monitorS1.hasPassedRepeatStep(monitorS1.stats.repeatsteps + 2);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(11 + 3 + 1);
		});
		it('should not process sheet on manual steps if paused by function', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'pause()' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.stats.steps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.stats.steps).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			// resume via cell delete
			createCellAt('A2', undefined, s1.sheet);
			await machine.step();
			expect(s1.stats.steps).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			await machine.step();
			expect(s1.stats.steps).toBe(3);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			createCellAt('A2', { formula: 'pause()' }, s1.sheet);
			await machine.step();	// step to pause sheet at A2
			expect(s1.stats.steps).toBe(4);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.stats.steps).toBe(4);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
		});
		it('should process next message if sheet is processed on manual steps', async () => {
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
		it('should process next loop element if sheet is processed on manual steps', async () => {
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
		it('should reuse same message on "repeat until..." until return() is called on manual steps', async () => {
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
		it('should reuse same loop element on "repeat until..." until return() is called on manual steps', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
			s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
			s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
			s1.inbox.put(new Message());
			expect(s1.inbox.size).toBe(3);
			expect(s1.getLoopIndex()).toBe(0);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			expect(s1.getLoopIndex()).toBe(1);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			// processed message will be detached with next step!!
			expect(s1.getLoopIndex()).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.sheet.cellAt('A1').value).toBe(7);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(8);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(9);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
			await machine.step();
			// processed message will be detached with next step!!
			expect(s1.getLoopIndex()).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(10);
			expect(s1.sheet.cellAt('A2').value).toBe(true);
			await machine.step();
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.sheet.cellAt('A1').value).toBe(11);
			expect(s1.sheet.cellAt('A2').value).toBe(false);
		});
	});

	describe('updating trigger', () => {
		it('should stop repeat in "repeat until..." if corresponding setting is disabled', async () => {
			const { machine, s1 } = setup();
			machine.cycletime = 5000;
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
			s1.trigger.update({ repeat: 'once' });
			const s1a1 = s1.sheet.cellAt('A1').value;
			await wait(20);
			expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
			await machine.stop();
		});
		it('should continue process sheet if new trigger is set', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await wait(20);
			s1.trigger = new ContinuousTrigger();
			await wait(70);
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
			await machine.stop();
		});
		it('should stop process sheet if new trigger is NONE', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(2);
			s1.trigger = new NeverTrigger();
			await wait(70);
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(2);
			await machine.stop();
		});
		it('should stop "repeat until..." if new trigger is set without "repeat until..."', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await wait(10);
			s1.trigger = new ContinuousTrigger();
			const repeatsteps = s1.stats.repeatsteps;
			await wait(20);
			expect(s1.stats.repeatsteps).toBe(repeatsteps);
			await machine.stop();
		});
		it('should keep "repeat until..." if new trigger is set with same settings', async () => {
			const { machine, s1 } = setup();
			const machineMonitor = monitorMachine(machine);
			const newTrigger = new ContinuousTrigger({ repeat: 'endless' });
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await machineMonitor.nextSteps(1);
			s1.trigger = newTrigger;
			const repeatsteps = s1.stats.repeatsteps;
			await machineMonitor.nextSteps(2);
			expect(s1.stats.repeatsteps).toBeGreaterThan(repeatsteps);
			await machine.stop();
		});
		it('should have no effect setting a trigger with same settings in "repeat until..." mode and sheet is paused by function', async () => {
			const { machine, s1 } = setup();
			const machineMonitor = monitorMachine(machine);
			const newTrigger = new ContinuousTrigger({ repeat: 'endless' });
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'pause()' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await machineMonitor.nextSteps(2);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.stats.repeatsteps).toBe(1);
			s1.trigger = newTrigger;
			await machineMonitor.nextSteps(2);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.stats.repeatsteps).toBe(1);
			await machineMonitor.nextSteps(2);
			await machine.pause();
			expect(s1.stats.steps).toBe(1);
			expect(s1.stats.repeatsteps).toBe(1);
			await machine.stop();
		});
	});
	describe('counter stats', () => {
		it('should count sheet step on each calculation', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.stats.steps).toBe(0);
			await machine.step();
			await machine.step();
			expect(s1.stats.steps).toBe(2);
			await machine.start();
			await wait(120);
			await machine.pause();
			expect(s1.stats.steps).toBeGreaterThanOrEqual(5);
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(4);
			// stats.steps are reset on stop
			await machine.stop();
			expect(s1.stats.steps).toBe(0);
			await machine.start();
			await wait(120);
			await machine.pause();
			expect(s1.stats.steps).toBeGreaterThanOrEqual(3);
			await machine.stop();
			expect(s1.stats.steps).toBe(0);
		});
		it('should count repeat steps in "repeat until..." mode', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.stats.steps).toBe(0);
			expect(s1.stats.repeatsteps).toBe(0);
			await machine.start();
			await wait(120);
			await machine.pause();
			// we are running in repeat mode, so
			expect(s1.stats.steps).toBe(1);
			// actually it should be much larger:
			expect(s1.stats.repeatsteps).toBeGreaterThan(2);
			await machine.stop();
			expect(s1.stats.steps).toBe(0);
			expect(s1.stats.repeatsteps).toBe(0);
		});
		it('should count repeat steps only in "repeat until..." mode on manual steps', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.stats.steps).toBe(0);
			expect(s1.stats.repeatsteps).toBe(0);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(s1.stats.steps).toBe(1);
			expect(s1.stats.repeatsteps).toBe(3);
		});
		it('should not count repeat steps in "repeat until..." mode if machine paused', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.stats.steps).toBe(0);
			expect(s1.stats.repeatsteps).toBe(0);
			await machine.start();
			await wait(10);
			await machine.pause();
			const repeats = s1.stats.repeatsteps;
			expect(repeats).toBeGreaterThan(2);
			await wait(120);
			// we are running in repeat mode, so
			expect(s1.stats.steps).toBe(1);
			expect(s1.stats.repeatsteps).toBe(repeats);
			await machine.stop();
		});
		it('should not count repeat steps in "repeat until..." mode if paused by function', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'pause()' }, s1.sheet);
			expect(s1.stats.steps).toBe(0);
			expect(s1.stats.repeatsteps).toBe(0);
			await machine.start();
			await wait(10);
			await machine.pause();
			expect(s1.stats.steps).toBe(1);
			expect(s1.stats.repeatsteps).toBe(1);
			await machine.start();
			await wait(70);
			await machine.pause();
			expect(s1.stats.steps).toBe(1);
			expect(s1.stats.repeatsteps).toBe(1);
			await machine.stop();
		});
		it('should not count repeat steps in "repeat until..." mode if paused by function', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'pause(0.1)' }, s1.sheet);
			await machine.start();
			await wait(500);
			expectValue(s1.stats.repeatsteps).toBeInRange(3, 6);
			await machine.stop();
			expectValue(s1.sheet.cellAt('A1').value).toBeInRange(2, 7);
		});
	});
	describe('serialize', () => {
		it('should be possible to save trigger settings to JSON', () => {
			let json = new ContinuousTrigger().toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(ContinuousTrigger.TYPE);
			expect(json.repeat).toBe('once');
			json = new ContinuousTrigger({ repeat: 'endless' }).toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(ContinuousTrigger.TYPE);
			expect(json.repeat).toBe('endless');
		});
		it('should be possible to restore trigger from JSON', () => {
			let trigger = TriggerFactory.create(new ContinuousTrigger().toJSON());
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(ContinuousTrigger.TYPE);
			expect(trigger.isEndless).toBe(false);
			trigger = TriggerFactory.create(new ContinuousTrigger({ repeat: 'endless' }).toJSON());
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(ContinuousTrigger.TYPE);
			expect(trigger.isEndless).toBe(true);
		});
	});
});
