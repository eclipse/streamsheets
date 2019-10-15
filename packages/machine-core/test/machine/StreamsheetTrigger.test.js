const ERROR = require('../../src/functions/errors');
const { Machine, Message, State, StreamSheet, StreamSheetTrigger } = require('../..');


const wait = ms => new Promise((resolve) => {
	setTimeout(resolve, ms);
});


const createStreamSheet = (name, trigger, cells) => {
	const streamsheet = new StreamSheet();
	streamsheet.name = name;
	streamsheet.trigger = trigger;
	streamsheet.sheet.load({ cells });
	return streamsheet;
};
const createMachine = (conf, ...streamsheets) => {
	const machine = new Machine();
	machine.load(conf);
	machine.removeAllStreamSheets();
	streamsheets.forEach(streamsheet => machine.addStreamSheet(streamsheet));
	return machine;
};
const random = (nr = 10) => Math.floor(Math.random() * Math.floor(nr));
const createMessage = () => new Message([
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() }
]);


describe('StreamSheetTrigger', () => {
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
	describe('OnExecute', () => {
		it('should execute only if triggered from another streamsheet', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1==3,execute("T2", 1),false)' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }),
				{ A1: { formula: 'A1+1' } });
			const machine = createMachine({ settings: { cycletime: 10000 } }, t1, t2);
			// putMessages(t1, new Message(), new Message(), new Message(), new Message());
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(false);
			expect(t2.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			expect(t1.sheet.cellAt('B1').value).toBe(false);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(5);
			expect(t1.sheet.cellAt('B1').value).toBe(false);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
		});
		it('should always execute if triggered once and if in endless mode', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1==3,execute("T2", 1),false)' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' } });
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
			// putMessages(t1, new Message(), new Message(), new Message(), new Message());
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(false);
			expect(t2.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			expect(t1.sheet.cellAt('B1').value).toBe(ERROR.NA);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			expect(t1.sheet.cellAt('B1').value).toBe(ERROR.NA);
			expect(t2.sheet.cellAt('A1').value).toBe(4);
		});
		it('should always execute if triggered once and in endless mode until return', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'execute("T2")' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>4, return(true), false)' } });
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
			// putMessages(t1, new Message(), new Message());
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(ERROR.NA);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(ERROR.NA);
			expect(t2.sheet.cellAt('A1').value).toBe(3);
			expect(t2.sheet.cellAt('B1').value).toBe(false);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(ERROR.NA);
			expect(t2.sheet.cellAt('A1').value).toBe(4);
			expect(t2.sheet.cellAt('B1').value).toBe(false);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(true);
			expect(t2.sheet.cellAt('A1').value).toBe(5);
			expect(t2.sheet.cellAt('B1').value).toBe(true);
			await machine.step();
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t2.sheet.cellAt('A1').value).toBe(5);
			expect(t1.sheet.cellAt('B1').value).toBe(true);
		});
		it('should be possible to remove trigger', () => {
			const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
			createMachine({ settings: {cycletime: 10000} }, t1);
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.EXECUTE);
			// remove trigger
			t1.trigger = undefined;
			expect(t1.trigger).toBeDefined();
			expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.NONE);
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
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
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
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2, t3);
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
		it('should prevent machine stop in endless mode until return', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }),
				{ A1: { formula: 'A1+1' } });
			const t2 = createStreamSheet('T2',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }),
				{ A1: { formula: 'A1+1' } });
			const t3 = createStreamSheet('T3',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>2, return(), false)' }, C1: { formula: 'C1+1' } });
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2, t3);
			await machine.start();
			await machine.pause();
			// putMessages(t1, new Message(), new Message(), new Message());
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t2.sheet.cellAt('A1').value).toBe(1);
			expect(t3.sheet.cellAt('A1').value).toBe(1);
			expect(t3.sheet.cellAt('B1').value).toBe(false);
			expect(t3.sheet.cellAt('C1').value).toBe(1);
			await machine.stop();
			// stop is prevented so:
			await machine.step();
			expect(machine.state).toBe(State.WILL_STOP);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('B1').value).toBe(false);
			expect(t3.sheet.cellAt('C1').value).toBe(2);
			await machine.step();
			await machine.step();
			// return should match, so
			expect(machine.state).toBe(State.STOPPED);
			expect(t2.sheet.cellAt('A1').value).toBe(2);
			expect(t3.sheet.cellAt('A1').value).toBe(3);
			expect(t3.sheet.cellAt('B1').value).toBe(true);
			expect(t3.sheet.cellAt('C1').value).toBe(2);
			// stop again to realy stop machine in case of any error...
			await machine.stop();
		});
		it('should be possible to remove trigger', () => {
			const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }));
			createMachine({ settings: {cycletime: 10000} }, t1);
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
			const machine = createMachine({ settings: {cycletime: 10000} }, t1);
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
			const machine = createMachine({ settings: {cycletime: 10000} }, t1);
			await machine.start();
			await machine.pause();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(5);
		});
		it('should execute sheet on machine start and repeat in endless mode until return', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' }),
				{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>2, return(), false)' } }
			);
			const machine = createMachine({ settings: {cycletime: 10000} }, t1);
			await machine.start();
			await machine.pause();
			expect(t1.sheet.cellAt('A1').value).toBe(2);
			expect(t1.sheet.cellAt('B1').value).toBe(false);
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(3);
			expect(t1.sheet.cellAt('B1').value).toBe(true);
			// new REQ.: we allow step for this trigger setting...
			await machine.step();
			await machine.step();
			expect(t1.sheet.cellAt('A1').value).toBe(5);
			expect(t1.sheet.cellAt('B1').value).toBe(true);
		});
		it('should process sheet on each loop element in endless mode until return', async () => {
			const t1 = createStreamSheet('T1',
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' }),
				{ B1: { formula: 'return()' } }
			);
			const machine = createMachine({ settings: {cycletime: 10000} }, t1);
			t1.updateSettings({ loop: { path: '[Data]', enabled: true } });
			// add some messages
			t1.inbox.put(createMessage());
			t1.inbox.put(createMessage());
			await machine.step();
			expect(t1.inbox.size).toBe(2);
			expect(t1.getLoopIndex()).toBe(0);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(1);
			await machine.step();
			expect(t1.inbox.size).toBe(2);
			expect(t1.getLoopIndex()).toBe(1);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(2);
			await machine.step();
			expect(t1.inbox.size).toBe(2);
			expect(t1.getLoopIndex()).toBe(2);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(3);
			await machine.step();
			expect(t1.inbox.size).toBe(1);
			expect(t1.getLoopIndex()).toBe(0);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(4);
			// steps until last loop element reached
			await machine.step();
			await machine.step();
			expect(t1.inbox.size).toBe(1);
			expect(t1.getLoopIndex()).toBe(2);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(6);
			// => kept in endless mode...
			await machine.step();
			await machine.step();
			expect(t1.inbox.size).toBe(1);
			expect(t1.getLoopIndex()).toBe(2);
			expect(machine.getStreamSheetByName('T1').stats.steps).toBe(8);
		});
		it('should be possible to remove trigger', () => {
			const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START }));
			createMachine({ settings: {cycletime: 10000} }, t1);
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
			const machine = createMachine({ settings: {cycletime: 50} }, t1);
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
			const machine = createMachine({ settings: {cycletime: 50} }, t1);
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
