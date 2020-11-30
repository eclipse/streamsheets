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

const wait = ms => new Promise((resolve) => {
	setTimeout(resolve, ms);
});

const expectValue = (value) => ({
	toBeInRange: (min, max) => {
		expect(value).toBeGreaterThanOrEqual(min);
		expect(value).toBeLessThanOrEqual(max);
	}
});


// const createStreamSheet = (name, trigger, cells) => {
// 	const streamsheet = new StreamSheet();
// 	streamsheet.name = name;
// 	streamsheet.trigger = trigger;
// 	streamsheet.sheet.load({ cells });
// 	return streamsheet;
// };
// const createMachine = async (conf, ...streamsheets) => {
// 	const machine = new Machine();
// 	await machine.load(conf);
// 	machine.removeAllStreamSheets();
// 	streamsheets.forEach(streamsheet => machine.addStreamSheet(streamsheet));
// 	return machine;
// };
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
	// it('should wait a cell with await, pause...', async () => {
	// expect(false).toBe(true);
	// });
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
	it('should increase sheet steps counter on each machine step', async () => {
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
	it('should process next message after sheet calculation', async () => {
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
	it('should process next loop element after sheet calculation', async () => {
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
	it('should reuse same message on "repeat until..." until return() is called', async () => {
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
	it('should not increase sheet steps on "repeat until..." and manual steps', async () => {
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
	it('should not block other sheets on "repeat until..."', async () => {
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
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.start();
		await machine.pause();
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s1.inbox.put(new Message());
		await wait(100);
		await machine.pause();
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(0);
		await machine.stop();
	});
	it('should reuse same loop element on "repeat until..." until return() is called', async () => {
		const { machine, s1 } = setup();
		s1.trigger.update({ repeat: 'endless' });
		s1.updateSettings({ loop: { path: '[data][loop]', enabled: true } });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'if(mod(A1,3)=0,return(),false)' }, s1.sheet);
		s1.inbox.put(new Message({ loop: [{ val: 1 }, { val: 2 }, { val: 3 }] }));
		s1.inbox.put(new Message({ loop: [{ val: 4 }, { val: 5 }] }));
		s1.inbox.put(new Message());
		s1.inbox.put(new Message({ loop: [{ val: 6 }, { val: 7} ] }));
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
	it('should not calculate sheet on "repeat until..." if machine is paused', async () => {
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
});


describe.skip('ContinuouslyTrigger IO', () => {
	it('should be possible to save trigger settings to JSON', () => {
		expect(false).toBe(true);
	});
	it('should be possible to restore trigger from JSON', () => {
		expect(false).toBe(true);
	});
});
describe.skip('StreamSheetTrigger', () => {
	describe('creation', () => {
		it('should create an arrival trigger as default', () => {
			const trigger = StreamSheetTrigger.create();
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.ARRIVAL);
		});
		it('should create a timer trigger if specified', () => {
			const trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.TIMER });
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.TIMER);
			expect(trigger.config.interval).toBe(500);
			expect(trigger.config.intervalUnit).toBe('ms');
		});
		it('should create a machine trigger if specified', () => {
			let trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START });
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_START);
			trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STARTSTOP });
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STARTSTOP);
			trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP });
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STOP);
		});
		it('should create an execute trigger if specified', () => {
			const trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE });
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(StreamSheetTrigger.TYPE.EXECUTE);
		});
	});
	describe('IO', () => {
		describe('toJSON', () => {
			it('should return a JSON object for type ARRIVAL', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.ARRIVAL);
			});
			it('should return a JSON object for type TIMER', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.TIMER }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.TIMER);
				// check default settings:
				expect(json.interval).toBe(500);
				expect(json.intervalUnit).toBe('ms');
			});
			it('should return a JSON object for type MACHINE_START', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.MACHINE_START);
			});
			it('should return a JSON object for type MACHINE_STOP', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STOP);
			});
			it('should return a JSON object for type MACHINE_STARTSTOP', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STARTSTOP }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STARTSTOP);
			});
			it('should return a JSON object for type EXECUTE', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }).toJSON();
				expect(json).toBeDefined();
				expect(json.type).toBe(StreamSheetTrigger.TYPE.EXECUTE);
			});
		});
		describe('create with config object returned by toJSON', () => {
			it('should create a trigger of type ARRIVAL', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }).toJSON();
				const trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.ARRIVAL);
			});
			it('should return a JSON object for type TIMER', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.TIMER }).toJSON();
				let trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.TIMER);
				expect(trigger.config.interval).toBe(500);
				expect(trigger.config.intervalUnit).toBe('ms');
				// again with changed defaults...
				json.interval = 2;
				json.intervalUnit = 's';
				trigger = StreamSheetTrigger.create(json);
				expect(trigger.config.interval).toBe(2);
				expect(trigger.config.intervalUnit).toBe('s');
			});
			it('should return a JSON object for type MACHINE_START', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START }).toJSON();
				const trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_START);
			});
			it('should return a JSON object for type MACHINE_STOP', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }).toJSON();
				const trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STOP);
			});
			it('should return a JSON object for type MACHINE_STARTSTOP', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STARTSTOP }).toJSON();
				const trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STARTSTOP);
			});
			it('should return a JSON object for type EXECUTE', () => {
				const json = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }).toJSON();
				const trigger = StreamSheetTrigger.create(json);
				expect(trigger).toBeDefined();
				expect(trigger.type).toBe(StreamSheetTrigger.TYPE.EXECUTE);
			});
		});
	});
	describe('OnMachineStop', () => {
		it('should execute sheet on machine stop', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }),
				{ A1: { formula: 'A1+1' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }),
				{ A1: { formula: 'A1+1' } });
			const machine = await createMachine({ settings: {cycletime: 10000} }, t1, t2);
			await machine.start();
			await machine.pause();
			// putMessages(t1, new Message(), new Message(), new Message());
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t2.sheet.cellAt('A1').value).toBe(1);
			await machine.stop();
			expect(machine.state).toBe(State.WILL_STOP);
			// step manually since machine is paused...
			await machine.step();
			// only sheets which are triggered by stop should be processed
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(machine.state).toBe(State.STOPPED);
		});
		it('should prevent machine stop in endless mode, but can be cancelled by calling stop again', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }),
				{ A1: { formula: 'A1+1' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }),
				{ A1: { formula: 'A1+1' } });
			const t3 = createStreamSheet('T3',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' } });
			const machine = await createMachine({ settings: {cycletime: 10000} }, t1, t2, t3);
			await machine.start();
			await machine.pause();
			// putMessages(t1, new Message(), new Message(), new Message());
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t2.sheet.cellAt('A1').value).toBe(1);
			expect(t3.sheet.cellAt('A1').value).toBe(1);
			await machine.stop();
			// stop is prevented so:
			await machine.step();
			expect(machine.state).toBe(State.WILL_STOP);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(machine.state).toBe(State.WILL_STOP);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('A1').value).toBe(5);
			// stop again to really stop machine
			await machine.stop();
			expect(machine.state).toBe(State.STOPPED);
			await machine.step();
			await machine.step();
			// no changes because triggers are stopped/reset too (DL-654)
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('A1').value).toBe(5);
		});
		it('should be possible to remove trigger', async () => {
			const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }));
			await createMachine({ settings: {cycletime: 10000} }, t1);
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_STOP);
			// remove trigger
			t1.trigger = undefined;
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.NONE);
		});
	});
	describe('OnMachineStart', () => {
		it('should execute sheet on machine start', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START }),
				{ A1: { formula: 'A1+1' } });
			const machine = await createMachine({ settings: {cycletime: 10000} }, t1);
			// new REQ.: we allow step for this trigger setting...
			await machine.step();
			expect(t1.sheet.cellAt('A1', t1.sheet).value).toBe(2);
			await machine.start();
			await machine.pause();
			expect(t1.sheet.cellAt('A1', t1.sheet).value).toBe(3);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1', t1.sheet).value).toBe(6);
		});
		it('should execute sheet on machine start and repeat in endless mode', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' } }
			);
			const machine = await createMachine({ settings: {cycletime: 10000} }, t1);
			await machine.start();
			await machine.pause();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(5);
		});
		it('should be possible to remove trigger', async () => {
			const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START }));
			await createMachine({ settings: {cycletime: 10000} }, t1);
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.MACHINE_START);
			// remove trigger
			t1.trigger = undefined;
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.NONE);
		});
		// DL-2241
		it('should wait for machine start event if machine runs already', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }), // , repeat: 'endless' }),
				{ A1: { formula: 'A1+1' } }
			);
			const sheet = t1.sheet;
			const machine = await createMachine({ settings: {cycletime: 50} }, t1);
			await machine.start();
			await wait(250);
			expect(sheet.cellAt('A1').value).toBe(1);
			// now switch trigger:
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START });
			await wait(250);
			expect(sheet.cellAt('A1').value).toBe(2);
			// stop if we change
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP });
			await wait(250);
			expect(sheet.cellAt('A1').value).toBe(2);
			// DL-2241 when switching to continuously it should run directly...
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' });
			await wait(250);
			expect(sheet.cellAt('A1').value).toBeGreaterThanOrEqual(3);
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP });
			const lastStep = sheet.cellAt('A1').value;
			await wait(250);
			expect(sheet.cellAt('A1').value).toBe(lastStep);
		});
		// DL-2467
		it('should run an added streamsheet with continuously trigger directly if machine runs already', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }),
				{ A1: { formula: 'A1+1' } }
			);
			// streamsheet with continuously trigger
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' }),
				{ A2: { formula: 'A2+1' } }
			);
			let stepCounter = 0;
			const inc = () => {
				stepCounter += 1;
			};
			const machine = await createMachine({ settings: {cycletime: 50} }, t1);
			await machine.start();
			await wait(100);
			expect(t1.sheet.cellAt('A1').value).toBe(1);
			// add continuously streamsheet:
			t2.on('step', inc);
			machine.addStreamSheet(t2);
			await wait(250);
			expect(t2.sheet.cellAt('A2').value).toBeGreaterThanOrEqual(3);
			expect(stepCounter).toBeGreaterThan(1);
			// after removal stepCount should not increase...
			machine.removeStreamSheet(t2);
			stepCounter = 0;
			await wait(250);
			expect(stepCounter).toBe(0);
		});
	});
	describe('OnTime', () => {
		it.skip('not implemented yet', () => {
			expect(false).toBe(true);
		});
	});
	describe('OnRandom', () => {
		it.skip('not implemented yet', () => {
			expect(false).toBe(true);
		});
	});
});
