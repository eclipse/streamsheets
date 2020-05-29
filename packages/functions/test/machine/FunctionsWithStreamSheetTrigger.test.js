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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, Message, State, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

const random = (nr = 10) => Math.floor(Math.random() * Math.floor(nr));
const createMessage = () => new Message([
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() }
]);

const createStreamSheet = (name, cells, trigger) => {
	const streamsheet = new StreamSheet();
	streamsheet.name = name;
	streamsheet.trigger = trigger || StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL });
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

const putMessages = (streamsheet, ...messages) => messages.forEach(message => streamsheet.inbox.put(message));

const callPerSecond = (func, times = 1) => new Promise((resolve) => {
	const interval = 1000 / times;
	let counter = 0;
	const intId = setInterval(() => {
		func();
		counter += 1;
		if (counter > times) {
			clearInterval(intId);
			resolve();
		}
	}, interval);
});
const wait = ms => new Promise((resolve) => {
	setTimeout(resolve, ms);
});

describe('OnDataArrival with EXECUTE(), RETURN()', () => {
	it('should not prevent execution of another sheet via EXECUTE()', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'EXECUTE("T2")' }, C1: { formula: 'C1+1' } });
		const t2 = createStreamSheet('T2', { A2: { formula: 'A2+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
		const sheet1 = t1.sheet;
		const sheet2 = t2.sheet;
		const machine = createMachine({ settings: {cycletime: 20000} }, t1, t2);
		await machine.start();
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(1);
		putMessages(t1, new Message());
		await wait(100);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('C1').value).toBe(2);
		expect(sheet2.cellAt('A2').value).toBe(2);
		putMessages(t1, new Message(), new Message(), new Message());
		await wait(100);
		expect(sheet1.cellAt('A1').value).toBe(5);
		expect(sheet1.cellAt('C1').value).toBe(5);
		expect(sheet2.cellAt('A2').value).toBe(5);
	});
	it('should consume always same message in endless mode until return, then next message', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>3, return(), false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }));
		const sheet = t1.sheet;
		const msgA = new Message();
		const msgB = new Message();
		const machine = createMachine({ settings: {cycletime: 10000} }, t1);
		expect(t1.trigger.isEndless).toBe(true);
		await machine.pause();
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(false);
		putMessages(t1, msgA, msgB);
		await machine.step();
		expect(t1.inbox.peek().id).toBe(msgA.id);
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B1').value).toBe(false);
		await machine.step();
		expect(t1.inbox.peek().id).toBe(msgA.id);
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(false);
		await machine.step();
		expect(t1.inbox.peek().id).toBe(msgA.id);
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B1').value).toBe(true);
		await machine.step();
		expect(t1.inbox.peek().id).toBe(msgB.id);
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B1').value).toBe(true);
	});
	it('should stop calculation in endless mode on return', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>3, return(), false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }));
		const sheet = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 50} }, t1);
		expect(t1.trigger.isEndless).toBe(true);
		expect(t1.stats.repeatsteps).toBe(0);
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.pause();
		putMessages(t1, new Message());
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B1').value).toBe(false);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(false);
		await machine.step();
		expect(t1.stats.repeatsteps).toBe(3);
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B1').value).toBe(true);
		await machine.step();
		// return has reset repeatsteps counter:
		expect(t1.stats.repeatsteps).toBe(1);
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(7);
		expect(sheet.cellAt('B1').value).toBe(true);
	});
	describe('DL-1484: calculation of additional sheet, triggered via execute, should be done in machine cycle', () => {
		it('should calculate sheet triggered by execute', async () => {
			const t1 = createStreamSheet('T1', { A1: { formula: 'execute("T2")' } });
			const t2 = createStreamSheet('T2', { A2: { formula: 'getcycle()' }, B2: { formula: 'return(42)' } },
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' }));
			const sheet1 = t1.sheet;
			const sheet2 = t2.sheet;
			const machine = createMachine({ settings: {cycletime: 1000} }, t1, t2);
			expect(sheet1.cellAt('A1').value).toBe(true);
			expect(sheet2.cellAt('A2').value).toBe(0);
			expect(sheet2.cellAt('B2').value).toBe(true);
			await machine.start();
			// run for 1 second and put one message
			await callPerSecond(() => {
				putMessages(t1, new Message());
			}, 1);
			await machine.stop();
			expect(sheet1.cellAt('A1').value).toBe(42);
			// we cycle twice as fast, so roughly
			expect(sheet2.cellAt('A2').value).toBe(1);
			expect(sheet2.cellAt('B2').value).toBe(42);
		});
		it('should calculate sheet triggered by execute in machine cycle', async () => {
			const t1 = createStreamSheet('T1', { A1: { formula: 'execute("T2", 5)' } });
			const t2 = createStreamSheet('T2', { A2: { formula: 'getexecutestep()' } },
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
			const sheet1 = t1.sheet;
			const sheet2 = t2.sheet;
			const machine = createMachine({ settings: {cycletime: 1000} }, t1, t2);
			expect(sheet1.cellAt('A1').value).toBe(true);
			expect(sheet2.cellAt('A2').value).toBe(0);
			await machine.start();
			putMessages(t1, new Message());
			// run for 1 second
			await wait(1000);
			await machine.stop();
			expect(sheet1.cellAt('A1').value).toBe(false);
			expect(sheet2.cellAt('A2').value).toBe(5);
		});
		it('should calculate sheet triggered by execute outside of machine cycle', async () => {
			const t1 = createStreamSheet('T1', { A1: { formula: 'execute("T2")' } });
			const t2 = createStreamSheet('T2', { A2: { formula: 'getcycle()' } },
				StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' }));
			const sheet1 = t1.sheet;
			const sheet2 = t2.sheet;
			const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
			expect(sheet1.cellAt('A1').value).toBe(true);
			expect(sheet2.cellAt('A2').value).toBe(0);
			await machine.start();
			putMessages(t1, new Message());
			// run for 1 second
			await wait(500);
			await machine.stop();
			expect(sheet1.cellAt('A1').value).toBe(FunctionErrors.code.NA);
			// getcycle returns number of steps done in endless mode => so must be far more than 1
			expect(sheet2.cellAt('A2').value).toBeGreaterThan(1);
		});
	});
});
describe('OnExecute', () => {
	it('should execute only if triggered from another streamsheet', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1==3,execute("T2", 1),false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' })
		);
		const t2 = createStreamSheet('T2',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE })
		);
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
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1==3,execute("T2", 1),false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' })
		);
		const t2 = createStreamSheet('T2',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' })
		);
		const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
		// putMessages(t1, new Message(), new Message(), new Message(), new Message());
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(t1.sheet.cellAt('B1').value).toBe(false);
		expect(t2.sheet.cellAt('A1').value).toBe(1);
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(3);
		expect(t1.sheet.cellAt('B1').value).toBe(FunctionErrors.code.NA);
		expect(t2.sheet.cellAt('A1').value).toBe(2);
		await machine.step();
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(3);
		expect(t1.sheet.cellAt('B1').value).toBe(FunctionErrors.code.NA);
		expect(t2.sheet.cellAt('A1').value).toBe(4);
	});
	it('should always execute if triggered once and in endless mode until return', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'execute("T2")' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		);
		const t2 = createStreamSheet('T2',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>4, return(true), false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE, repeat: 'endless' })
		);
		const machine = createMachine({ settings: {cycletime: 10000} }, t1, t2);
		// putMessages(t1, new Message(), new Message());
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(t1.sheet.cellAt('B1').value).toBe(FunctionErrors.code.NA);
		expect(t2.sheet.cellAt('A1').value).toBe(2);
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(t1.sheet.cellAt('B1').value).toBe(FunctionErrors.code.NA);
		expect(t2.sheet.cellAt('A1').value).toBe(3);
		expect(t2.sheet.cellAt('B1').value).toBe(false);
		await machine.step();
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(t1.sheet.cellAt('B1').value).toBe(FunctionErrors.code.NA);
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
		const t1 = createStreamSheet('T1', {}, StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
		createMachine({ settings: {cycletime: 10000} }, t1);
		expect(t1.trigger).toBeDefined();
		expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.EXECUTE);
		// remove trigger
		t1.trigger = undefined;
		expect(t1.trigger).toBeDefined();
		expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.NONE);
	});
});
describe('OnMachineStop with RETURN()', () => {
	it('should prevent machine stop in endless mode until return', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }));
		const t2 = createStreamSheet('T2',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP }));
		const t3 = createStreamSheet('T3',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>2, return(), false)' }, C1: { formula: 'C1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_STOP, repeat: 'endless' }));
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
});
describe('OnMachineStart with RETURN()', () => {
	it('should execute sheet on machine start and repeat in endless mode until return', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(A1>2, return(), false)' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' })
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
			{ B1: { formula: 'return()' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' })
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
});