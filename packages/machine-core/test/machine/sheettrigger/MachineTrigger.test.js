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
	MachineTrigger,
	NeverTrigger,
	Machine,
	State,
	StreamSheet2,
	TriggerFactory
} = require('../../..');
const { createCellAt, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

const setup = (triggerConfig = {}) => {
	const machine = new Machine();
	const s1 = new StreamSheet2({ name: 'S1' });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	s1.trigger = new MachineTrigger(triggerConfig);
	return { machine, s1 };
};
describe('MachineTrigger', () => {
	describe('machine start trigger', () => {
		describe('general behaviour', () => {
			it('should execute sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				// new REQ.: we allow step for this trigger setting...
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.step();
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(6);
			});
			it('should execute sheet once on machine start', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			it('should execute sheet on manual steps but only once on machine start', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				// new REQ.: we allow step for this trigger setting...
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.pause();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(5);
				await machine.stop();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(6);
			});
			it('should execute sheet on machine start and repeat in endless mode', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START, repeat: 'endless' });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2);
				await machine.pause();
				const s1a1 = s1.sheet.cellAt('A1').value;
				expect(s1a1).toBeGreaterThan(2);
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(s1a1 + 1);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(s1a1 + 3);
			});
			// DL-2467
			it('should run an added streamsheet with continuously trigger directly if machine runs already', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_STOP });
				const s2 = new StreamSheet2()
				s2.trigger = new ContinuouslyTrigger(/* { repeat: 'endless' } */);
				const monitorS2 = monitorStreamSheet(s2);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				await machine.start();
				await wait(10);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(1);
				// now add streamsheet with continuous trigger...
				machine.addStreamSheet(s2);
				await monitorS2.isAtStep(3);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(4);
				await machine.stop();
			});
		});
		describe('update trigger', () => {
			it('should be possible to remove trigger', async () => {
				const { s1 } = setup({ type: MachineTrigger.TYPE_START, repeat: 'endless' });
				s1.trigger = undefined;
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(NeverTrigger.TYPE);
			});
			it('should trigger new calculation if machine runs already', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				s1.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_START });
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.stop();
			});
			it('should trigger new calculation if machine runs already in endless mode', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_START, repeat: 'endless' });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(2);
				s1.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_START, repeat: 'endless' });
				const s1a1 = s1.sheet.cellAt('A1').value;
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(s1a1);
				await machine.stop();
			});
			// DL-2241
			it('should wait for machine start event if machine runs already', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_STOP, repeat: 'endless' });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				// now switch trigger:
				s1.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_START });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// stop if we change
				s1.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_STOP });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// DL-2241 when switching to continuously it should run directly...
				s1.trigger = new ContinuouslyTrigger({ repeat: 'endless' });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
				s1.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_STOP });
				const s1a1 = s1.sheet.cellAt('A1').value;
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
				s1.trigger = new NeverTrigger();
				await machine.stop();
			});
		});
		describe('serialize', () => {
			it('should be possible to save trigger settings to JSON', () => {
				let json = new MachineTrigger({ type: MachineTrigger.TYPE_START }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(MachineTrigger.TYPE_START);
				expect(json.repeat).toBe('once');
				json = new MachineTrigger({ type: MachineTrigger.TYPE_START, repeat: 'endless' }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(MachineTrigger.TYPE_START);
				expect(json.repeat).toBe('endless');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(
					new MachineTrigger({ type: MachineTrigger.TYPE_START }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(MachineTrigger.TYPE_START);
				expect(trigger.isEndless).toBe(false);
				trigger = TriggerFactory.create(
					new MachineTrigger({ type: MachineTrigger.TYPE_START, repeat: 'endless' }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(MachineTrigger.TYPE_START);
				expect(trigger.isEndless).toBe(true);
			});
		});
	});
	describe('machine stop trigger', () => {
		describe('general behaviour', () => {
			it('should execute sheet on machine stop', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_STOP });
				const s2 = new StreamSheet2()
				const monitorS2 = monitorStreamSheet(s2);
				s2.trigger = new ContinuouslyTrigger();
				machine.addStreamSheet(s2);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				await machine.start();
				await monitorS2.isAtStep(2);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(3);
				await machine.stop();
				expect(machine.state).toBe(State.WILL_STOP);
				// should triggered once...
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// step manually since machine is paused...
				await machine.step();
				// only sheets which are triggered by stop should be processed
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s2.sheet.cellAt('B1').value).toBe(3);
				expect(machine.state).toBe(State.STOPPED);
			});
			it('should not process sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_STOP });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
			});
			it('should prevent machine stop in endless mode, but can be cancelled by calling stop again', async () => {
				const { machine, s1 } = setup({ type: MachineTrigger.TYPE_STOP });
				const s2 = new StreamSheet2()
				const s3 = new StreamSheet2()
				s2.trigger = new ContinuouslyTrigger();
				s3.trigger = new MachineTrigger({ type: MachineTrigger.TYPE_STOP, repeat: 'endless' });
				const monitorS2 = monitorStreamSheet(s2);
				machine.addStreamSheet(s2);
				machine.addStreamSheet(s3);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				createCellAt('C1', { formula: 'C1+1' }, s3.sheet);
				await machine.start();
				await monitorS2.isAtStep(2);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(3);
				expect(s3.sheet.cellAt('C1').value).toBe(1);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(5);
				expect(s3.sheet.cellAt('C1').value).toBe(1);
				await machine.stop();
				// stop is prevented so:
				expect(machine.state).toBe(State.WILL_STOP);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(5);
				expect(s3.sheet.cellAt('C1').value).toBe(2);
				await machine.step();
				await machine.step();
				await machine.step();
				await wait(100);
				const s3c1 = s3.sheet.cellAt('C1').value;
				expect(machine.state).toBe(State.WILL_STOP);
				expect(s1.sheet.cellAt('A1').value).toBe(5);
				expect(s2.sheet.cellAt('B1').value).toBe(5);
				expect(s3c1).toBeGreaterThan(5);
				// stop again to really stop machine
				await machine.stop();
				expect(machine.state).toBe(State.STOPPED);
				await machine.step();
				await machine.step();
				// no changes because triggers are stopped/reset too (DL-654)
				expect(s1.sheet.cellAt('A1').value).toBe(5);
				expect(s2.sheet.cellAt('B1').value).toBe(7);
				expect(s3.sheet.cellAt('C1').value).toBe(s3c1);
			});
		});
		describe('update trigger', () => {
			it('should be possible to remove trigger', async () => {
				const { s1 } = setup({ type: MachineTrigger.TYPE_STOP });
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(MachineTrigger.TYPE_STOP);
				// remove trigger
				s1.trigger = undefined;
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(NeverTrigger.TYPE);
			});
		});
		describe('serialize', () => {
			it('should be possible to save trigger settings to JSON', () => {
				let json = new MachineTrigger({ type: MachineTrigger.TYPE_STOP }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(MachineTrigger.TYPE_STOP);
				expect(json.repeat).toBe('once');
				json = new MachineTrigger({ type: MachineTrigger.TYPE_STOP, repeat: 'endless' }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(MachineTrigger.TYPE_STOP);
				expect(json.repeat).toBe('endless');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(
					new MachineTrigger({ type: MachineTrigger.TYPE_STOP }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(MachineTrigger.TYPE_STOP);
				expect(trigger.isEndless).toBe(false);
				trigger = TriggerFactory.create(
					new MachineTrigger({ type: MachineTrigger.TYPE_STOP, repeat: 'endless' }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(MachineTrigger.TYPE_STOP);
				expect(trigger.isEndless).toBe(true);
			});
		});
	});
});