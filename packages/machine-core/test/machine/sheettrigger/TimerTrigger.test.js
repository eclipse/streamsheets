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
const { Machine, Message, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, expectValue, monitorStreamSheet, wait } = require('../../utils');

const createStreamsheet = (config) => {
	const streamsheet = new StreamSheet({ name: config.name });
	streamsheet.trigger = TriggerFactory.create(config);
	return streamsheet;
};

const setup = (triggerConfig = {}) => {
	const machine = new Machine();
	const s1 = createStreamsheet({ name: 'S1', ...triggerConfig });
	// const s1 = new StreamSheet({ name: 'S1'});
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	s1.trigger = TriggerFactory.create(triggerConfig);
	return { machine, s1 };
};


describe('TimerTrigger', () => {
	// describe('trigger type random', () => {
	// 	describe('general behaviour', () => {});
	// 	describe('update trigger', () => {});
	// 	describe('serialize', () => {});
	// });
	describe('trigger type time', () => {
		describe('general behaviour', () => {
			it('should process sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			it('should trigger at defined intervals after machine start', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 50 });
				// const monitorS1 = monitorStreamSheet(s1);
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(180);
				await machine.stop();
				// should trigger each 50ms
				expectValue(s1.sheet.cellAt('A1').value).toBeInRange(3, 5);
			});
			it('should trigger at defined long interval after machine start', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 1, intervalUnit: 's' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				// first trigger directly after start
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await wait(500);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await wait(600);
				await machine.stop();
				// second trigger on specified interval
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			it('should trigger first time after specified start value', async () => {
				const startDate = new Date(Date.now() + 200).toString();
				const { machine, s1 } = setup({
					type: TriggerFactory.TYPE.TIMER,
					interval: 1,
					intervalUnit: 's',
					start: startDate
				});
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await wait(500);
				// first trigger after specified start date
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await wait(700);
				await machine.stop();
				// second trigger on specified interval
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			it('should ignore machine or interval trigger if running in "repeat until..."', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 5000, repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(50);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(3);
			});
			it('should stop processing in "repeat until..." mode if machine is stopped', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 50, repeat: 'endless' });
				machine.cycletime = 10;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(50);
				await machine.stop();
				const s1A1Value = s1.sheet.cellAt('A1').value;
				expect(s1A1Value).toBeGreaterThan(3);
				await wait(50);
				expect(s1A1Value).toBe(s1A1Value);
			});
			it('should ignore machine or interval trigger if running in "repeat until..." until resumed', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 300, repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'if(mod(A1,5)=0,return(),false)' }, s1.sheet);
				createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(1);
				await machine.start();
				await wait(100);
				expect(s1.sheet.cellAt('A1').value).toBe(5);
				expect(s1.sheet.cellAt('A3').value).toBe(4);
				await wait(100);
				expect(s1.sheet.cellAt('A1').value).toBe(5);
				expect(s1.sheet.cellAt('A3').value).toBe(4);
				await wait(300);
				expect(s1.sheet.cellAt('A1').value).toBe(10);
				expect(s1.sheet.cellAt('A3').value).toBe(8);
				await machine.stop();
			});
			it('should resume from execute sheet on manual steps', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER });
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
				machine.addStreamSheet(s2);
				s1.trigger.update({ repeat: 'endless'});
				s1.updateSettings({ loop: { path: '[data]', enabled: true } });
				s1.sheet.loadCells({
					A1: { formula: 'A1+1' },
					A2: { formula: 'loopindices()' },
					A3: { formula: 'messageids()' },
					A4: { formula: 'execute("S2")' },
					B4: { formula: 'B4+1' },
					B5: { formula: 'return()' }
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
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A2').value).toBe('0');
				expect(s1.sheet.cellAt('A3').value).toBe('1');
				expect(s2.sheet.cellAt('B1').value).toBe(2);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1');
				expect(s2.sheet.cellAt('B1').value).toBe(3);
				expect(s2.sheet.cellAt('B2').value).toBe(false);
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1');
				expect(s2.sheet.cellAt('B1').value).toBe(4);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				await machine.step()
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1');
				expect(s2.sheet.cellAt('B1').value).toBe(6);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(2);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2');
				expect(s2.sheet.cellAt('B1').value).toBe(8);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(2);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0,1');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2,2');
				expect(s2.sheet.cellAt('B1').value).toBe(10);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0,1,0');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2,2,3');
				expect(s2.sheet.cellAt('B1').value).toBe(12);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
				await machine.step();
				// last message is kept
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0,1,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2,2,3,3');
				expect(s2.sheet.cellAt('B1').value).toBe(13);
				expect(s2.sheet.cellAt('B2').value).toBe(false);
			});
			it('should resume from execute sheet on machine run', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER });
				const monitorS1 = monitorStreamSheet(s1);
				const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
				machine.addStreamSheet(s2);
				s1.trigger.update({ repeat: 'endless'});
				s1.updateSettings({ loop: { path: '[data]', enabled: true } });
				s1.sheet.loadCells({
					A1: { formula: 'A1+1' },
					A2: { formula: 'loopindices()' },
					A3: { formula: 'messageids()' },
					A4: { formula: 'execute("S2")' },
					B4: { formula: 'B4+1' },
					B5: { formula: 'return()' }
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
				await monitorS1.hasFinishedStep(6);
				await machine.stop();
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A2').value).toBe('0,1,2,0,1,0');
				expect(s1.sheet.cellAt('A3').value).toBe('1,1,1,2,2,3');
				expect(s2.sheet.cellAt('B1').value).toBe(12);
				expect(s2.sheet.cellAt('B2').value).toBe(true);
			});
			it('should process same loop element in "repeat until..." return() then use next one or next message on manual steps', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER });
				s1.trigger.update({ repeat: 'endless' });
				s1.updateSettings({ loop: { path: '[data]', enabled: true } });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'loopindices()' }, s1.sheet);
				createCellAt('A3', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
				machine.pause();
				s1.inbox.put(new Message());
				s1.inbox.put(new Message([1, 2, 3]));
				s1.inbox.put(new Message([4, 5]));
				s1.inbox.put(new Message());
				expect(s1.inbox.size).toBe(4);
				await machine.step();
				expect(s1.inbox.size).toBe(4);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				expect(s1.sheet.cellAt('A2').value).toBe('0');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				expect(s1.sheet.cellAt('A3').value).toBe(false);
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A1').value).toBe(4);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A1').value).toBe(6);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(3);
				expect(s1.sheet.cellAt('A1').value).toBe(8);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				expect(s1.inbox.size).toBe(2);
				expect(s1.sheet.cellAt('A3').value).toBe(false);
				await machine.step();
				expect(s1.inbox.size).toBe(2);
				expect(s1.sheet.cellAt('A1').value).toBe(10);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				await machine.step();
				expect(s1.inbox.size).toBe(2);
				expect(s1.sheet.cellAt('A1').value).toBe(12);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2,0,0,1,1');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A3').value).toBe(false);
				await machine.step();
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(14);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2,0,0,1,1,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
				await machine.step();
				// last message is still in inbox
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(15);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2,0,0,1,1,0,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe(false);
			});
			it('should process same loop element in "repeat until..." return() then use next one or next message on machine run', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER });
				const monitorS1 = monitorStreamSheet(s1);
				s1.trigger.update({ repeat: 'endless' });
				s1.updateSettings({ loop: { path: '[data]', enabled: true } });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				createCellAt('A2', { formula: 'loopindices()' }, s1.sheet);
				createCellAt('A3', { formula: 'if(mod(A1,2)=0,return(),false)' }, s1.sheet);
				machine.pause();
				s1.inbox.put(new Message());
				s1.inbox.put(new Message([1, 2, 3]));
				s1.inbox.put(new Message([4, 5]));
				s1.inbox.put(new Message());
				expect(s1.inbox.size).toBe(4);
				await machine.start();
				await monitorS1.hasFinishedStep(13);
				await machine.stop();
				expect(s1.inbox.size).toBe(1);
				expect(s1.sheet.cellAt('A1').value).toBe(14);
				expect(s1.sheet.cellAt('A2').value).toBe('0,0,0,1,1,2,2,0,0,1,1,0,0');
				expect(s1.sheet.cellAt('A3').value).toBe(true);
			});
		});
		describe('behaviour on start, stop, pause and step', () => {
			test('start - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(5);
			});
			test('start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(30);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();	// resumes
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			test('pause - start - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.pause();
				await machine.start();	// resumes
				await wait(30);
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.start(); // resumes
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			test('pause - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.pause();
				await wait(10);
				await machine.stop();
				await wait(10);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			test('stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
			});
			test('stop - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await wait(10);
				await machine.pause();
				await wait(10);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
			});
			test('stop - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.stop();
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(5);
			});
			test('pause - step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.pause();
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start(); // resumes
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			test('step - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();
				await wait(30);
				await machine.stop();
				// one after start and second time after interval
				expect(s1.sheet.cellAt('A1').value).toBe(5);
			});
			test('step - pause - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				await machine.step();
				await machine.pause();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();	// resumes
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			test('step - stop - start - stop', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 20 });
				machine.cycletime = 1000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				await machine.step();
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(3);
				await machine.start();
				await wait(30);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBe(5);
			});
		});
		describe('update trigger', () => {
			it('should stop interval if another trigger is set', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 50 });
				const monitorS1 = monitorStreamSheet(s1);
				const newTrigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
				machine.cycletime = 5000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await monitorS1.hasFinishedStep(3)
				expect(s1.sheet.cellAt('A1').value).toBe(4);
				s1.trigger = newTrigger;
				await wait(100);
				// still at 4
				expect(s1.sheet.cellAt('A1').value).toBe(4);
				// increase machine cycle:
				machine.cycletime = 10;
				await wait(100);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(4);
			});
			it('should stop interval in "repeat until..." if new trigger is set', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 5000, repeat: 'endless' });
				const newTrigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
				machine.cycletime = 5000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(50);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(3);
				s1.trigger = newTrigger;
				const s1a1 = s1.sheet.cellAt('A1').value;
				await wait(50);
				expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
				await machine.stop();
			});
			it('should apply new interval', async () => {
				const { machine, s1 } = setup({ type: TriggerFactory.TYPE.TIMER, interval: 10000 });
				machine.cycletime = 5000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(100);
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				// update trigger interval
				s1.trigger.update({ interval: 10 });
				await wait(100);
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(2);
				await machine.stop();
			});
		});
		describe('serialize', () => {
			it('should be possible to save trigger settings to JSON', () => {
				let json = TriggerFactory.create({ type: TriggerFactory.TYPE.TIMER }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.TIMER);
				expect(json.repeat).toBe('once');
				expect(json.interval).toBe(500);
				expect(json.intervalUnit).toBe('ms');
				json = TriggerFactory.create({
					type: TriggerFactory.TYPE.TIMER,
					repeat: 'endless',
					interval: 2,
					intervalUnit: 's'
				}).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TriggerFactory.TYPE.TIMER);
				expect(json.repeat).toBe('endless');
				expect(json.interval).toBe(2);
				expect(json.intervalUnit).toBe('s');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(TriggerFactory.create({ type: TriggerFactory.TYPE.TIMER }).toJSON());
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.TIMER);
				expect(trigger.isEndless).toBe(false);
				expect(trigger.interval).toBe(500);
				expect(trigger.intervalUnit).toBe('ms');
				trigger = TriggerFactory.create(
					TriggerFactory.create({
						type: TriggerFactory.TYPE.TIMER,
						repeat: 'endless',
						interval: 2,
						intervalUnit: 's'
					}).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TriggerFactory.TYPE.TIMER);
				expect(trigger.isEndless).toBe(true);
				expect(trigger.interval).toBe(2);
				expect(trigger.intervalUnit).toBe('s');
			});
		});
	});
});