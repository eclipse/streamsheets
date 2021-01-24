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
const { Machine, Message, State, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, monitorMachine, monitorStreamSheet, wait } = require('../../utils');

const createStreamsheet = ({ name, type, repeat }) => {
	const streamsheet = new StreamSheet({ name });
	streamsheet.trigger = TriggerFactory.create({ type, repeat });
	return streamsheet;
};

const setup = (triggerConfig = {}) => {
	const machine = new Machine();
	const s1 = createStreamsheet({ name: 'S1', ...triggerConfig });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	return { machine, s1 };
};
describe('MachineTrigger', () => {
	describe('machine start trigger', () => {
		describe('general behaviour', () => {
			it.skip('should execute sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
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
			it.skip('should execute sheet once on machine start', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			it.skip('should execute sheet on manual steps but only once on machine start', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
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
			it.skip('should execute sheet on start once and do again after stop & start', async () =>{
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				// once again after each stop/start
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.start();
				await machineMonitor.nextSteps(3);
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(4);
			});
			it.skip('should execute sheet on machine start and repeat in endless mode', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
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
			it.skip('should stop processing if returned from "repeat until..."', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'if(mod(A1,10)=0,return(23), false)' }, s1.sheet);
				await machine.start();
				await wait(100);
				await machine.stop();
				expect(monitorS1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(23);
				expect(s1.sheet.cellAt('A1').value).toBe(10);
			});
			it.skip('should execute sheet on machine start "repeat until..." return() and do it again after stop & start', async () =>{
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'if(mod(A1,10)=0,return(23), false)' }, s1.sheet);
				await machine.start();
				await wait(100);
				await machine.stop();
				expect(monitorS1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(23);
				expect(s1.sheet.cellAt('A1').value).toBe(10);
				// do it again after each stop/start
				await machine.start();
				await wait(100);
				await machine.stop();
				await machine.start();
				await wait(100);
				await machine.stop();
				expect(monitorS1.stats.steps).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe(23);
				expect(s1.sheet.cellAt('A1').value).toBe(30);
			});
			// DL-2467
			it.skip('should run an added streamsheet with continuously trigger directly if machine runs already', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY });
				const monitorS2 = monitorStreamSheet(s2);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				await machine.start();
				await wait(10);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(1);
				// now add streamsheet with continuous trigger...
				machine.addStreamSheet(s2);
				await monitorS2.hasPassedStep(3);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(4);
				await machine.stop();
			});
			it.skip('should resume from execute sheet', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				const monitorS1 = monitorStreamSheet(s1);
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
				machine.addStreamSheet(s2);
				s1.updateSettings({ loop: { path: '[data]', enabled: true } });
				s1.sheet.loadCells({
					A1: { formula: 'A1+1' },
					A2: { formula: 'loopindices()' },
					A3: { formula: 'messageids()' },
					A4: { formula: 'execute("S2")' },
					B4: { formula: 'B4+1' }
				});
				s2.sheet.loadCells({
					B1: { formula: 'B1+1' },
					B2: { formula: 'if(mod(B1,2)=0,return(),false)' }
				});
				await machine.pause();
				s1.inbox.put(new Message([1, 2, 3], '1'));
				s1.inbox.put(new Message([4, 5], '2'));
				s1.inbox.put(new Message({}, '3'));
				expect(s1.inbox.size).toBe(3);
				await machine.start();
				await monitorS1.hasFinishedStep(7);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(8);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0,1,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2,2,3,3');
				expect(s1.sheet.cellAt('B4').value).toBe(8);
				expect(s2.sheet.cellAt('B1').value).toBe(14);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
			});
		});
		describe.skip('behaviour on start, stop, pause and step', () => {
			test('start - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
			});
			test('start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machine.pause();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			test('pause - start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				await machine.start();
				await machine.pause();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(1);
			});
			test('pause - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				await machine.stop();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			test('stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			test('stop - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				await machine.pause();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(1);
			});
			test('stop - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
			});
			test('pause - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(2);
			});
			test('step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(4);
			});
			test('step - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.pause();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
			});
			test('step - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(3);
				await machine.stop();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1', s1.sheet).value).toBe(4);
			});
		});
		describe.skip('update trigger', () => {
			it('should be possible to remove trigger', async () => {
				const { s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				s1.trigger = undefined;
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(TriggerFactory.TYPE.NONE);
			});
			it('should have no effect setting same trigger again', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START });
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.stop();
			});
			it('should trigger new calculation if machine runs already in endless mode', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(2);
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
				const s1a1 = s1.sheet.cellAt('A1').value;
				await machineMonitor.nextSteps(2)
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(s1a1);
				await machine.stop();
			});
			// DL-2241
			it('should not wait for machine start event if machine runs already', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
				const machineMonitor = monitorMachine(machine);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				// now switch trigger -> calc once:
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// stop if we change
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// DL-2241 when switching to continuously it should run directly...
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY, repeat: 'endless' });
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const s1a1 = s1.sheet.cellAt('A1').value;
				await machineMonitor.nextSteps(2);
				expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
				s1.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.NONE });
				await machine.stop();
			});
		});
		describe.skip('serialize', () => {
			it('should be possible to save trigger settings to JSON', () => {
				let json = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.MACHINE_START);
				expect(json.repeat).toBe('once');
				json = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.MACHINE_START);
				expect(json.repeat).toBe('endless');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(
					TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.MACHINE_START);
				expect(trigger.isEndless).toBe(false);
				trigger = TriggerFactory.create(
					TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.MACHINE_START);
				expect(trigger.isEndless).toBe(true);
			});
		});
	});
	describe.skip('machine stop trigger', () => {
		describe('general behaviour', () => {
			it('should execute sheet on machine stop once', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY });
				const monitorS1 = monitorStreamSheet(s1);
				const monitorS2 = monitorStreamSheet(s2);
				machine.cycletime = 10;
				machine.addStreamSheet(s2);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				await machine.start();
				await monitorS2.hasFinishedStep(2);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(3);
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				// should only triggered once...
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// step manually should have no effect for stopped triggered...
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(5);
			});
			it('should execute sheet on stop once and do it again after start & stop', async () =>{
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				expect(machine.state).toBe(State.STOPPED);
				// should only triggered once...
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// do again several time...
				await machine.start();
				await machine.stop();
				await machine.start();
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			it('should not process sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
			});
			it('should process sheet on manual steps once or endlessly until return', async() => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
				machine.addStreamSheet(s2);
				s2.sheet.load({
					cells: {
						B1: { formula: 'B1+1' }, B2: { formula: 'if(B1>3, return(), false)' }, B3: { formula: 'B3+1' }
					}
				});
				s1.sheet.load({ cells: { A1: { formula: 'A1+1' } } });
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(1);
				expect(s2.sheet.cellAt('B2').value).toBe(false);
				expect(s2.sheet.cellAt('B3').value).toBe(1);
				await machine.start();
				await machine.pause();
				await machine.step();
				await machine.step();
				// do nothing until stop
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s2.sheet.cellAt('B1').value).toBe(1);
				expect(s2.sheet.cellAt('B2').value).toBe(false);
				expect(s2.sheet.cellAt('B3').value).toBe(1);
				// trigger stop:
				await machine.stop();
				expect(machine.state).toBe(State.WILL_STOP);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(2);
				expect(s2.sheet.cellAt('B2').value).toBe(false);
				expect(s2.sheet.cellAt('B3').value).toBe(2);
				// s2 still active:
				await wait(80);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(4);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				expect(s2.sheet.cellAt('B3').value).toBe(3);
				// stop again to realy stop machine in case of any error...
				await machine.stop();
				expect(machine.state).toBe(State.STOPPED);
			});
			it('should prevent machine stop in endless mode, but can be cancelled by calling stop again', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY });
				const s3 = createStreamsheet({ name: 'S3', type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
				const monitorS2 = monitorStreamSheet(s2);
				machine.addStreamSheet(s2);
				machine.addStreamSheet(s3);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
				createCellAt('C1', { formula: 'C1+1' }, s3.sheet);
				await machine.start();
				await monitorS2.hasPassedStep(2);
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
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(5);
				expect(s3c1).toBeGreaterThan(5);
				// stop again to really stop machine
				await machine.stop();
				expect(machine.state).toBe(State.STOPPED);
				await machine.step();
				await machine.step();
				// no changes because triggers are stopped/reset too (DL-654)
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s2.sheet.cellAt('B1').value).toBe(7);
				expect(s3.sheet.cellAt('C1').value).toBe(s3c1);
				// start & stop again
				await machine.start();
				await machine.stop();
				expect(machine.state).toBe(State.WILL_STOP);
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.stop();
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				expect(s3.sheet.cellAt('C1').value).toBeGreaterThan(s3c1);
			});
		});
		describe('behaviour on start, stop, pause and step', () => {
			test('start - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				machine.cycletime = 10;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.start();
				await machine.pause();
				await machine.start();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('pause - start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				await machine.start();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.pause();
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('pause - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(2);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			test('stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				// does nothing because we didn't start before
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('stop - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				await machine.pause();
				// does nothing because we didn't start before
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('stop - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.stop();
				await machine.step();
				await machine.step();
				// does nothing because we didn't start before
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('pause - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.pause();
				await machine.step();
				// does nothing because we didn't start before
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.step();
				// steps do nothing
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('step - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.pause();
				// steps & pause do nothing
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('step - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				await machine.step();
				await machine.step();
				// steps & pause do nothing
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(1);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.start();
				await machine.stop();
				await monitorS1.hasFinishedStep(2);
				expect(machine.state).toBe(State.STOPPED);
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
		});
		describe('update trigger', () => {
			it('should be possible to remove trigger', async () => {
				const { s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(TriggerFactory.TYPE.MACHINE_STOP);
				// remove trigger
				s1.trigger = undefined;
				expect(s1.trigger).toBeDefined();
				expect(s1.trigger.type).toBe(TriggerFactory.TYPE.NONE);
			});
		});
		describe('serialize', () => {
			it('should be possible to save trigger settings to JSON', () => {
				let json = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.MACHINE_STOP);
				expect(json.repeat).toBe('once');
				json = TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.MACHINE_STOP);
				expect(json.repeat).toBe('endless');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(
					TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.MACHINE_STOP);
				expect(trigger.isEndless).toBe(false);
				trigger = TriggerFactory.create(
					TriggerFactory.create({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' }).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.MACHINE_STOP);
				expect(trigger.isEndless).toBe(true);
			});
		});
	});
});