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
const { Machine, StreamSheet, TriggerFactory } = require('../../..');
const { createCellAt, expectValue, monitorStreamSheet, wait } = require('../../utils');

const setup = (triggerConfig = {}) => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
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
		});
		describe.skip('behaviour on start, stop, pause and step', () => {
			// do sequence 2 times, before final stop
			test('start - stop - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('start - pause - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('pause - start - pause - start - stop', async () => {
			});
			test('pause - stop - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('stop - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('stop - pause - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('stop - step - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('pause - step - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('step - start - stop', async () => {
			});
			test('step - pause - start - stop', async () => {
				expect(false).toBe(true);
			});
			test('step - stop - start - stop', async () => {
				expect(false).toBe(true);
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
				await monitorS1.hasPassedStep(3)
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