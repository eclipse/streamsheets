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
const { createCellAt, monitorStreamSheet, wait } = require('../../utils');


const createStreamsheet = ({ name, type, repeat }) => {
	const streamsheet = new StreamSheet({ name });
	streamsheet.trigger = TriggerFactory.create({ type, repeat });
	return streamsheet;
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

const setup = () => {
	const machine = new Machine();
	const s1 = createStreamsheet({ name: 'S1', type: TriggerFactory.TYPE.ARRIVAL });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.cycletime = 20000;
	return { machine, s1 };
};

describe('OnMessageTrigger', () => {
	describe('general behaviour', () => {
		it('should trigger calculation on message arrival immediately', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message());
			await monitorS1.hasFinishedStep(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			putMessages(s1, new Message(), new Message(), new Message());
			await monitorS1.hasFinishedStep(4);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			await wait(100);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			await machine.stop();
		});
		it('should not calculate sheet if machine is in pause mode', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await monitorS1.hasFinishedStep(4);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(5);
		});
		// DL-3709 new behaviour:
		it('should support manual step even if inbox has no messages', async () => {
			const { machine, s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			await machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			await machine.step();
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(6);
		});
		it('should calculate as long as messages are in inbox', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			machine.pause();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, new Message(), new Message(), new Message(), new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			await monitorS1.hasFinishedStep(5)
			// note: last message is never popped! (its a requirement)
			expect(s1.inbox.size).toBe(1);
			expect(s1.sheet.cellAt('A1').value).toBe(6);
		});
		it('should not prevent calculation of other sheets', async () => {
			const { machine, s1 } = setup();
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.MACHINE_START, repeat: 'endless' });
			machine.addStreamSheet(s2);
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s2.sheet.cellAt('B1').value).toBe(1);
			// run for 1 second and put a message each 100ms
			await machine.start();
			await callPerSecond(() => putMessages(s1, new Message()), 10);
			await machine.stop();
			// we roughly added about 10 messages, so
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(9);
			// we cycle twice as fast, so roughly
			expect(s2.sheet.cellAt('B1').value).toBeGreaterThanOrEqual(18);
		});
		// note: new behaviour! instead of machine-cycle it should run as fast as possible in endless mode
		it('should run as fast as possible if its set to endless mode and no message is in inbox', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			await wait(50);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(10);
		});
		it('should always calculate with same message in endless mode', async () => {
			const { machine, s1 } = setup();
			const message = new Message();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.pause();
			putMessages(s1, message);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.step();
			expect(s1.inbox.peek().id).toBe(message.id);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			putMessages(s1, new Message(), new Message());
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			await machine.step();
			await machine.step();
			expect(s1.inbox.peek().id).toBe(message.id);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should always calculate with same loop-element in endless mode', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const message = new Message([1,2,3]);
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			putMessages(s1, message);
			await monitorS1.hasFinishedStep(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.peek().id).toBe(message.id);
			putMessages(s1, new Message(), new Message());
			// await wait(20);
			await monitorS1.hasFinishedStep(3);
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(2);
			expect(s1.getLoopIndex()).toBe(0);
			expect(s1.inbox.peek().id).toBe(message.id);
			await machine.stop();
		});
		it('should not calculate sheet twice in endless mode and triggered by arrived message', async () => {
			const { machine, s1 } = setup();
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger.isEndless).toBe(true);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			// roughly run for about 1 second -> add about 10 messages => should not trigger additional calculations
			await callPerSecond(() => putMessages(s1, new Message()), 10);
			// steps do not increase
			expect(s1.stats.steps).toBe(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(10);
		});
		test('with execute another sheet', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE });
			s1.sheet.load({
				cells: {
					A1: { formula: 'A1+1' },
					B1: { formula: 'messageids()' },
					C1: { formula: 'execute("S2")' },
					D1: { formula: 'D1+1' }
				}
			});
			s2.sheet.load({ cells: { B2: { formula: 'B2+1' } } });
			machine.addStreamSheet(s2);
			machine.cycletime = 2000000;
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('D1').value).toBe(1);
			expect(s2.sheet.cellAt('B2').value).toBe(1);
			putMessages(s1, new Message({},'1'));
			await monitorS1.hasFinishedStep(1);
			expect(s1.inbox.peek().id).toBe('1');
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('D1').value).toBe(2);
			expect(s2.sheet.cellAt('B2').value).toBe(2);
			putMessages(s1, new Message({},'2'), new Message({},'3'), new Message({},'4'));
			await monitorS1.hasFinishedStep(4);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3,4');
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('D1').value).toBe(5);
			expect(s2.sheet.cellAt('B2').value).toBe(5);
		});
		it('should resume from execute sheet on manual steps', async () => {
			const { machine, s1 } = setup();
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
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const s2 = createStreamsheet({ name: 'S2', type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
			machine.addStreamSheet(s2);
			s1.trigger.update({ repeat: 'endless'});
			s1.updateSettings({ loop: { path: '[data]', enabled: true } });
			s1.sheet.loadCells({
				A1: { formula: 'A1+1' },
				A2: { formula: 'loopindices()' },
				A3: { formula: 'messageids()' },
				A4: { formula: 'execute("S2",1,,1)' },
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
			const { machine, s1 } = setup();
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
			const { machine, s1 } = setup();
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
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.start();
			putMessages(s1, new Message({},'1'));
			await monitorS1.hasFinishedStep(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.stop();
			putMessages(s1, new Message({},'2'));
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.start();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1,3');
			await machine.stop();
		});
		test('start - pause - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.start();
			putMessages(s1, new Message({},'1'));
			await monitorS1.hasFinishedStep(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.pause();
			putMessages(s1, new Message({},'2'));
			await machine.start();
			await monitorS1.hasFinishedStep(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2');
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(3);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3');
			await machine.stop();
		});
		test('pause - start - pause - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.pause();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.start();
			putMessages(s1, new Message({},'2'));
			await monitorS1.hasFinishedStep(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2');
			await machine.pause();
			putMessages(s1, new Message({},'3'));
			await machine.start();
			await monitorS1.hasFinishedStep(3);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3');
			await machine.stop();
		});
		test('pause - stop - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.pause();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.stop();
			putMessages(s1, new Message({},'2'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.start();
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(1);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('3');
			await machine.stop();
		});
		test('stop - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.stop();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.start();
			putMessages(s1, new Message({},'2'));
			await monitorS1.hasFinishedStep(1);
			await machine.stop();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('2');
		});
		test('stop - pause - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.stop();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.pause();
			putMessages(s1, new Message({},'2'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.start();
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(3);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3');
			await machine.stop();
		});
		test('stop - step - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.stop();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			putMessages(s1, new Message({},'2'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.start();
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(2);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1,3');
			await machine.stop();
		});
		test('pause - step - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.pause();
			putMessages(s1, new Message({},'1'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			putMessages(s1, new Message({},'2'));
			await wait(10);
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.start();
			putMessages(s1, new Message({},'3'));
			await monitorS1.hasFinishedStep(3);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3');
			await machine.stop();
		});
		test('step - start - stop', async () => {
			const { machine, s1 } = setup();
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			putMessages(s1, new Message({},'1'));
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			putMessages(s1, new Message({},'2'), new Message({},'3'));
			await machine.start();
			await wait(20);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.stop();
		});
		test('step - pause - start - stop', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			putMessages(s1, new Message({},'1'));
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.pause();
			putMessages(s1, new Message({},'2'), new Message({},'3'));
			await machine.start();
			await monitorS1.hasFinishedStep(4);
			expect(s1.sheet.cellAt('A1').value).toBe(5);
			expect(s1.sheet.cellAt('B1').value).toBe('1,2,3');
			await machine.stop();
		});
		test('step - stop - start - stop', async () => {
			const { machine, s1 } = setup();
			machine.cycletime = 2000000;
			s1.sheet.loadCells({ A1: { formula: 'A1+1' }, B1: { formula: 'messageids()' } });
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(2);
			expect(s1.sheet.cellAt('B1').value).toBe('');
			putMessages(s1, new Message({},'1'));
			await machine.step();
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.stop();
			putMessages(s1, new Message({},'2'), new Message({},'3'));
			await machine.start();
			await wait(20);
			expect(s1.sheet.cellAt('A1').value).toBe(3);
			expect(s1.sheet.cellAt('B1').value).toBe('1');
			await machine.stop();
		});
	});
	describe('update trigger', () => {
		it('should be possible to remove trigger', async () => {
			const { s1 } = setup();
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.trigger).toBeDefined();
			expect(s1.trigger.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			// remove trigger
			s1.trigger = undefined;
			expect(s1.trigger).toBeDefined();
			expect(s1.trigger.type).toBe(TriggerFactory.TYPE.NONE);
		});
		it('should stop message processing if another trigger is set', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const newTrigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
			const messages = Array.from({ length: 20 }, () => new Message());
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.pause();
			putMessages(s1, ...messages);
			await machine.start();
			await monitorS1.hasFinishedStep(3)
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			s1.trigger = newTrigger;
			await wait(100);
			// still at 4
			expect(s1.sheet.cellAt('A1').value).toBe(4);
			await wait(100);
			await machine.stop();
			// expect(s1.sheet.cellAt('A1').value).toBeGreaterThan(4);
			expect(s1.sheet.cellAt('A1').value).toBe(4);
		});
		it('should stop message processing in "repeat until..." if new trigger is set', async () => {
			const { machine, s1 } = setup();
			const monitorS1 = monitorStreamSheet(s1);
			const newTrigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
			s1.trigger.update({ repeat: 'endless' });
			createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
			expect(s1.sheet.cellAt('A1').value).toBe(1);
			await machine.start();
			putMessages(s1, new Message());
			await monitorS1.hasPassedRepeatStep(3)
			expect(s1.sheet.cellAt('A1').value).toBeGreaterThanOrEqual(4);
			s1.trigger = newTrigger;
			const s1a1 = s1.sheet.cellAt('A1').value;
			await wait(50);
			expect(s1.sheet.cellAt('A1').value).toBe(s1a1);
			await machine.stop();
		});

	});
	describe('serialize', () => {
		it('should be possible to save trigger settings to JSON', () => {
			let json = TriggerFactory.create({ type: TriggerFactory.TYPE.ARRIVAL }).toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			expect(json.repeat).toBe('once');
			json = TriggerFactory.create({ type: TriggerFactory.TYPE.ARRIVAL, repeat: 'endless' }).toJSON();
			expect(json).toBeDefined();
			expect(json.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			expect(json.repeat).toBe('endless');
		});
		it('should be possible to restore trigger from JSON', () => {
			let trigger = TriggerFactory.create(
				TriggerFactory.create({ type: TriggerFactory.TYPE.ARRIVAL }).toJSON()
			);
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			expect(trigger.isEndless).toBe(false);
			trigger = TriggerFactory.create(
				TriggerFactory.create({ type: TriggerFactory.TYPE.ARRIVAL, repeat: 'endless' }).toJSON()
			);
			expect(trigger).toBeDefined();
			expect(trigger.type).toBe(TriggerFactory.TYPE.ARRIVAL);
			expect(trigger.isEndless).toBe(true);
		});
	});
});
