const { Machine, Message, StreamSheet, StreamSheetTrigger } = require('../..');
const { FunctionErrors } = require('@cedalo/error-codes');

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

describe('StreamSheetTrigger: OnDataArrival', () => {
	it('should trigger calculation on message arrival immediately', async () => {
		const t1 = createStreamSheet('T1', { A1: { formula: 'A1+1' } });
		const sheet = t1.sheet;
		const machine = createMachine({ settings: { cycletime: 20000 } }, t1);
		await machine.start();
		expect(sheet.cellAt('A1').value).toBe(1);
		putMessages(t1, new Message());
		await wait(100);
		expect(sheet.cellAt('A1').value).toBe(2);
		putMessages(t1, new Message(), new Message(), new Message());
		await wait(100);
		expect(sheet.cellAt('A1').value).toBe(5);
	});
	it('should not calculate sheet if machine is in pause mode', async () => {
		const t1 = createStreamSheet('T1', { A1: { formula: 'A1+1' } });
		const sheet1 = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 1000} }, t1);
		await machine.pause();
		expect(sheet1.cellAt('A1').value).toBe(1);
		putMessages(t1, new Message());
		expect(sheet1.cellAt('A1').value).toBe(1);
		putMessages(t1, new Message(), new Message(), new Message());
		expect(sheet1.cellAt('A1').value).toBe(1);
	});
	it('should support manual step as long as there are messages', async () => {
		const t1 = createStreamSheet('T1', { A1: { formula: 'A1+1' } });
		const sheet1 = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 1000} }, t1);
		await machine.pause();
		expect(sheet1.cellAt('A1').value).toBe(1);
		putMessages(t1, new Message(), new Message(), new Message());
		expect(sheet1.cellAt('A1').value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(2);
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(4);
		// no messages left, additional steps have no effect
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(4);
	});
	it('should calculate as long as messages are in inbox', async () => {
		const t1 = createStreamSheet('T1', { A1: { formula: 'A1+1' } });
		const sheet1 = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 1000} }, t1);
		machine.pause();
		expect(sheet1.cellAt('A1').value).toBe(1);
		putMessages(t1, new Message(), new Message(), new Message(), new Message(), new Message());
		expect(sheet1.cellAt('A1').value).toBe(1);
		await machine.start();
		await wait(1000);
		// note: last message is never popped! (its a requirement)
		expect(t1.inbox.size).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(6);
	});
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
	it('should not prevent calculation of other sheets', async () => {
		const t1 = createStreamSheet('T1', { A1: { formula: 'A1+1' } });
		const t2 = createStreamSheet('T2', { A2: { formula: 'A2+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START, repeat: 'endless' }));
		const sheet1 = t1.sheet;
		const sheet2 = t2.sheet;
		const machine = createMachine({ settings: {cycletime: 50} }, t1, t2);
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(1);
		// run for 1 second and put a message each 100ms
		await machine.start();
		await callPerSecond(() => {
			putMessages(t1, new Message());
		}, 10);
		await machine.stop();
		// we roughly add about 10 messages, so
		expect(sheet1.cellAt('A1').value).toBeGreaterThanOrEqual(9);
		// we cycle twice as fast, so roughly
		expect(sheet2.cellAt('A2').value).toBeGreaterThanOrEqual(18);
	});
	it('should run in machine cycle-speed if its set to endless mode and no message is in inbox', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }));
		const sheet = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 100} }, t1);
		expect(t1.trigger.isEndless).toBe(true);
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.start();
		putMessages(t1, new Message());
		// we roughly run for about 1 second, so
		await wait(1000);
		await machine.stop();
		expect(sheet.cellAt('A1').value).toBeGreaterThanOrEqual(9);
		expect(sheet.cellAt('A1').value).toBeLessThan(15);
	});
	it('should calculate always on same message in endless mode', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }));
		const sheet = t1.sheet;
		const message = new Message();
		const machine = createMachine({ settings: {cycletime: 50} }, t1);
		expect(t1.trigger.isEndless).toBe(true);
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.pause();
		putMessages(t1, message);
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.step();
		expect(t1.inbox.peek().id).toBe(message.id);
		expect(sheet.cellAt('A1').value).toBe(2);
		putMessages(t1, new Message(), new Message());
		expect(sheet.cellAt('A1').value).toBe(2);
		await machine.step();
		await machine.step();
		expect(t1.inbox.peek().id).toBe(message.id);
		expect(sheet.cellAt('A1').value).toBe(4);
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
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B1').value).toBe(true);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B1').value).toBe(true);
	});
	it('should not calculate sheet twice in endless mode and triggered by arrived message', async () => {
		const t1 = createStreamSheet('T1',
			{ A1: { formula: 'A1+1' } },
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }));
		const sheet = t1.sheet;
		const machine = createMachine({ settings: {cycletime: 100} }, t1);
		expect(t1.trigger.isEndless).toBe(true);
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.start();
		putMessages(t1, new Message());
		// roughly run for about 1 second -> add about 10 messages => should not trigger additional calculations
		await callPerSecond(() => {
			putMessages(t1, new Message());
		}, 10);
		await machine.stop();
		expect(sheet.cellAt('A1').value).toBeLessThanOrEqual(20);
		expect(sheet.cellAt('A1').value).toBeGreaterThanOrEqual(10);
	});
	it('should be possible to remove trigger', () => {
		const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }));
		createMachine({ settings: {cycletime: 10000} }, t1);
		expect(t1.trigger).toBeDefined();
		expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.ARRIVAL);
		// remove trigger
		t1.trigger = undefined;
		expect(t1.trigger).toBeDefined();
		expect(t1.trigger.type).toBe(StreamSheetTrigger.TYPE.NONE);
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
