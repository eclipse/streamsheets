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
const { ContinuousTrigger, Machine, StreamSheet, TimerTrigger, TriggerFactory } = require('../../..');
const { createCellAt, wait, monitorStreamSheet } = require('../../utils');

const setup = (triggerConfig = {}) => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 50;
	s1.trigger = new TimerTrigger(triggerConfig);
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
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(2);
				await machine.step();
				await machine.step();
				expect(s1.sheet.cellAt('A1').value).toBe(4);
			});
			it('should trigger at defined intervals after machine start', async () => {
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 50 });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(170);
				await machine.stop();
				// should trigger each 50ms
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(4);
			});
			it('should trigger at defined long interval after machine start', async () => {
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 1, intervalUnit: 's' });
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
					type: TimerTrigger.TYPE_TIME,
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
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 5000, repeat: 'endless' });
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await wait(50);
				await machine.stop();
				expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(3);
			});
			it('should ignore machine or interval trigger if running in "repeat until..." until resumed', async () => {
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 500, repeat: 'endless' });
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
				await wait(550);
				expect(s1.sheet.cellAt('A1').value).toBe(10);
				expect(s1.sheet.cellAt('A3').value).toBe(8);
				await machine.stop();
			});
		});
		describe('update trigger', () => {
			it('should stop interval if another trigger is set', async () => {
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 50 });
				const monitorS1 = monitorStreamSheet(s1);
				const newTrigger = new ContinuousTrigger();
				machine.cycletime = 5000;
				createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
				expect(s1.sheet.cellAt('A1').value).toBe(1);
				await machine.start();
				await monitorS1.isAtStep(3)
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
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 5000, repeat: 'endless' });
				const newTrigger = new ContinuousTrigger();
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
				const { machine, s1 } = setup({ type: TimerTrigger.TYPE_TIME, interval: 10000 });
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
				let json = new TimerTrigger({ type: TimerTrigger.TYPE_TIME }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TimerTrigger.TYPE_TIME);
				expect(json.repeat).toBe('once');
				expect(json.interval).toBe(500);
				expect(json.intervalUnit).toBe('ms');
				json = new TimerTrigger({
					type: TimerTrigger.TYPE_TIME,
					repeat: 'endless',
					interval: 2,
					intervalUnit: 's'
				}).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(TimerTrigger.TYPE_TIME);
				expect(json.repeat).toBe('endless');
				expect(json.interval).toBe(2);
				expect(json.intervalUnit).toBe('s');
			});
			it('should be possible to restore trigger from JSON', () => {
				let trigger = TriggerFactory.create(new TimerTrigger({ type: TimerTrigger.TYPE_TIME }).toJSON());
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TimerTrigger.TYPE_TIME);
				expect(trigger.isEndless).toBe(false);
				expect(trigger.interval).toBe(500);
				expect(trigger.intervalUnit).toBe('ms');
				trigger = TriggerFactory.create(
					new TimerTrigger({
						type: TimerTrigger.TYPE_TIME,
						repeat: 'endless',
						interval: 2,
						intervalUnit: 's'
					}).toJSON()
				);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(TimerTrigger.TYPE_TIME);
				expect(trigger.isEndless).toBe(true);
				expect(trigger.interval).toBe(2);
				expect(trigger.intervalUnit).toBe('s');
			});
		});
	});
});