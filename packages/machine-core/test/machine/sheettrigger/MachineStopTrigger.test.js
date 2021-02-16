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
	machine.cycletime = 10;
	return { machine, s1 };
};
describe('MachineStopTrigger', () => {
	describe('general behaviour', () => {
		it('should execute sheet on machine stop once', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY });
			const monitorS1 = monitorStreamSheet(s1);
			const machineMonitor = monitorMachine(machine);
			machine.cycletime = 10;
			machine.addStreamSheet(s2);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			await machine.start();
			await machineMonitor.hasFinishedStep(2);
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
		it('should execute sheet on stop once and do it again after start & stop', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
			const monitorS1 = monitorStreamSheet(s1);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.start();
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.stop();
			await monitorS1.hasFinishedStep(1);
			expect(machine.state).toBe(State.STOPPED);
			// should only triggered once...
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			// do again several time...
			await machine.start();
			await machine.stop();
			await monitorS1.hasFinishedStep(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			await machine.start();
			await machine.stop();
			await monitorS1.hasFinishedStep(3);
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
		it('should process sheet on manual steps once or endlessly until return', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
			const monitorS1 = monitorStreamSheet(s1);
			machine.addStreamSheet(s2);
			s2.sheet.load({
				cells: {
					B1: { formula: 'B1+1' },
					B2: { formula: 'if(B1>3, return(), false)' },
					B3: { formula: 'B3+1' }
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
			await monitorS1.hasFinishedStep(1);
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
			// stop again to really stop machine in case of any error...
			await machine.stop();
			expect(machine.state).toBe(State.STOPPED);
		});
		it('should prevent machine stop in endless mode, but can be cancelled by calling stop again', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP });
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.CONTINUOUSLY });
			const s3 = createStreamsheet({ name: 'S3', type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
			const monitorS1 = monitorStreamSheet(s1);
			const machineMonitor = monitorMachine(machine);
			machine.addStreamSheet(s2);
			machine.addStreamSheet(s3);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			createCellAt('C1', { formula: 'C1+1' }, s3.sheet);
			await machine.start();
			await machineMonitor.hasFinishedStep(2);
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
			await monitorS1.hasFinishedStep(1);
			// stop is still prevented so:
			expect(machine.state).toBe(State.WILL_STOP);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(5);
			expect(s3.sheet.cellAt('C1').value).toBe(2);
			await machine.step();
			await machine.step();
			await machine.step();
			await wait(100);
			let s3c1 = s3.sheet.cellAt('C1').value;
			expect(machine.state).toBe(State.WILL_STOP);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(8);
			expect(s3c1).toBeGreaterThan(5);
			// stop again to really stop machine
			await machine.stop();
			s3c1 = s3.sheet.cellAt('C1').value;
			expect(machine.state).toBe(State.STOPPED);
			await machine.step();
			await machine.step();
			// no changes because triggers are stopped/reset too (DL-654)
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s2.sheet.cellAt('B1').value).toBe(10);
			expect(s3.sheet.cellAt('C1').value).toBe(s3c1);
			// start & stop again
			await machine.start();
			await machine.stop();
			await monitorS1.hasFinishedStep(2);
			expect(machine.state).toBe(State.WILL_STOP);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			await machine.stop();
			expect(machine.state).toBe(State.STOPPED);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s3.sheet.cellAt('C1').value).toBeGreaterThan(s3c1);
		});
		it('should resume from execute sheet on machine run', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
			const monitorS1 = monitorStreamSheet(s1);
			const machineMonitor = monitorMachine(machine);
			machine.addStreamSheet(s2);
			s1.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'loopindices()' },
				A3: { formula: 'messageids()' },
				A4: { formula: 'execute("S2")' },
				B4: { formula: 'B4+1' },
				A5: { formula: 'return()' }
			});
			s2.sheet.loadCells({
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(mod(B1,2)=0,return(),false)' }
			});
			await machine.pause();
			s1.inbox.put(new Message([1, 2, 3], '1'));
			s1.inbox.put(new Message([4, 5], '2'));
			expect(s1.inbox.size).toBe(2);
			await machine.start();
			await machineMonitor.hasFinishedStep(1);
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('A2').value).toBe('');
			expect(s1.sheet.cellAt('A3').value).toBe('');
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(false);
			await machine.stop();
			await monitorS1.hasFinishedStep(1);
			expect(s1.inbox.size).toBe(2);
			expect(machine.state).toBe(State.WILL_STOP);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('A2').value).toBe('0');
			expect(s1.sheet.cellAt('A3').value).toBe('1');
			expect(s2.sheet.cellAt('B1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			await monitorS1.hasFinishedStep(2);
			expect(s1.inbox.size).toBe(2);
			expect(machine.state).toBe(State.WILL_STOP);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('A2').value).toBe('0,1');
			expect(s1.sheet.cellAt('A3').value).toBe('1,1');
			expect(s2.sheet.cellAt('B1').value).toBe(4);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			await monitorS1.hasFinishedStep(3);
			expect(s1.inbox.size).toBe(2);
			expect(machine.state).toBe(State.STOPPED);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe('0,1,2');
			expect(s1.sheet.cellAt('A3').value).toBe('1,1,1');
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
			await wait(100);
			// s1 is done => expect no changes
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('A2').value).toBe('0,1,2');
			expect(s1.sheet.cellAt('A3').value).toBe('1,1,1');
			expect(s2.sheet.cellAt('B1').value).toBe(6);
			expect(s2.sheet.cellAt('B2').value).toBe(true);
		});
		it('should process same loop element in "repeat until..." return() then use next one or next message on machine run', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
			const monitorS1 = monitorStreamSheet(s1);
			s1.updateSettings({ loop: { path: '[data]', enabled: true } });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('A2', { formula: 'loopindices()' }, s1.sheet);
			createCellAt('A3', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
			machine.pause();
			s1.inbox.put(new Message([1, 2, 3]));
			s1.inbox.put(new Message());
			expect(s1.inbox.size).toBe(2);
			await machine.start();
			await machine.stop();
			await monitorS1.hasFinishedStep(5);
			expect(machine.state).toBe(State.STOPPED);
			expect(s1.inbox.size).toBe(2);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
			expect(s1.sheet.cellAt('A2').value).toBe('0,1,1,2,2');
			expect(s1.sheet.cellAt('A3').value).toBe(true);
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
		test('start-stop-stop', async () => {
			const { machine, s1 } = setup({ type: TriggerFactory.TYPE.MACHINE_STOP, repeat: 'endless' });
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 10;
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.stop();
			await monitorS1.hasFinishedStep(1);
			expect(machine.state).toBe(State.WILL_STOP);
			await wait(20);
			await machine.stop();
			const s1a1 = s1.sheet.cellAt('A1').value;
			expect(s1a1).toBeGreaterThan(2);
			expect(machine.state).toBe(State.STOPPED);
			await wait(20);
			expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
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
