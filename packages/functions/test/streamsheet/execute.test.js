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
const MSG = require('../_data/messages.json');
const { createCellAt, wait } = require('../utilities');
const { Machine, Message, SheetIndex, StreamSheet, TriggerFactory } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const random = (nr = 10) => Math.floor(Math.random() * Math.floor(nr));
const createMessage = () => new Message([
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() }
]);

// let machine;
// beforeEach(() => {
// 	machine = new Machine();
// 	machine.removeAllStreamSheets();
// 	const t1 = new StreamSheet();
// 	const t2 = new StreamSheet();
// 	t1.name = 'T1';
// 	t2.name = 'T2';
// 	machine.addStreamSheet(t1);
// 	machine.addStreamSheet(t2);
// });
const setup = ({ switched = false } = {}) => {
	const machine = new Machine();
	const s1 = new StreamSheet({ name: 'S1' });
	const s2 = new StreamSheet({ name: 'S2' });
	s1.trigger = TriggerFactory.create({
		type: switched ? TriggerFactory.TYPE.EXECUTE : TriggerFactory.TYPE.CONTINUOUSLY
	});
	s2.trigger = TriggerFactory.create({
		type: switched ? TriggerFactory.TYPE.CONTINUOUSLY : TriggerFactory.TYPE.EXECUTE
	});
	machine.removeAllStreamSheets();
	machine.addStreamSheet(s1);
	machine.addStreamSheet(s2);
	machine.cycletime = 50;
	return { machine, s1, s2 };
};


describe.skip('execute', () => {
	it('should return error code of passed message term', () => {
		const { s1 } = setup();
		createCellAt('A1', { formula: 'EXECUTE("S2",2,SUBTREE(OUTBOXDATA("Message")))'}, s1.sheet);
		expect(s1.sheet.cellAt('A1').value).toBe(ERROR.NO_MSG);
	});
	it('should trigger execution of a streamsheet from another one', async () => {
		const { machine, s1, s2 } = setup();
		const sheet1 = s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } }
		});
		const sheet2 = s2.sheet.load({ cells: { B1: { formula: 'B1+1' } } });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(false);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(false);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(3);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(3);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(4);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(false);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(4);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(4);
	});
	it('should trigger execution as often as defined by repeat parameter', async () => {
		const { machine, s1, s2 } = setup();
		const sheet1 = s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 3)' }, A3: { formula: 'A3+1' } }
		});
		const sheet2 = s2.sheet.load({ cells: { B1: { formula: 'B1+1' } } });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(3);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(false);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(4);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(5);
	});
	it('should restart repeated execution after machine stop', async () => {
		const { machine, s1, s2 } = setup();
		const sheet1 = s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 3)' }, A3: { formula: 'A3+1' } }
		});
		const sheet2 = s2.sheet.load({ cells: { B1: { formula: 'B1+1' } } });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(1);
		// set to pause, so that we can later stop!
		await machine.pause();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(3);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(4);
		// now stop and step again...
		await machine.stop();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B1')).value).toBe(5);
	});
	// DL-710:
	it('should go on with next loop element after resume from repeated execute', async () => {
		const { machine, s1, s2 } = setup();
		s2.sheet.load({ cells: { B1: { formula: 'B1+1' } } });
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } }
		});
		s1.updateSettings({ loop: { path: '[data][Positionen]', enabled: true } });
		s1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		s1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.getLoopIndex()).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(1);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(2);
		// does not change in following steps, because we keep last processed message...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		expect(s1.getLoopIndex()).toBe(2);
	});
	// DL-3719
	it('should not go on with next loop element if execute resumed in same cycle', async () => {
		const { machine, s1, s2 } = setup();
		const sheet1 = s1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				A2: { formula: 'read(inboxdata(,,),B2:C4,"Dictionary")' },
				A3: { formula: 'execute("S2")' },
				A4: { formula: 'loopindex()' }
			}
		});
		s1.updateSettings({ loop: { path: '[data][Positionen]', enabled: true } });
		s1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		s1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		s2.sheet.load({ cells: { B1: { formula: 'B1+1' } } });
		expect(s1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('C2').value).toBe(1);
		expect(sheet1.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		expect(sheet1.cellAt('A1').value).toBe(3);
		expect(sheet1.cellAt('C2').value).toBe(2);
		expect(sheet1.cellAt('A4').value).toBe(2);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		expect(sheet1.cellAt('A1').value).toBe(4);
		expect(sheet1.cellAt('C2').value).toBe(3);
		expect(sheet1.cellAt('A4').value).toBe(3);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(5);
		expect(sheet1.cellAt('C2').value).toBe(1);
		expect(sheet1.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		expect(sheet1.cellAt('A1').value).toBe(6);
		expect(sheet1.cellAt('C2').value).toBe(2);
		expect(sheet1.cellAt('A4').value).toBe(2);
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		expect(sheet1.cellAt('A1').value).toBe(7);
		expect(sheet1.cellAt('C2').value).toBe(3);
		expect(sheet1.cellAt('A4').value).toBe(3);
		// note the loop index will not pass its bounds!
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.getLoopIndex()).toBe(2);
		expect(sheet1.cellAt('A1').value).toBe(10);
		expect(sheet1.cellAt('C2').value).toBe(3);
		expect(sheet1.cellAt('A4').value).toBe(3);
	});
	it('should trigger execution in endless mode until return is called', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } }
		});
		s2.sheet.load({ cells: { B1: { formula: 'B1+1' }, B2: { formula: 'if(B1==5,return(true), false)' } } });
		s2.trigger.update({ repeat: 'endless' });
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe(false);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(4);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe(false);
		// now S1 resumes from S2 => in same cycle
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(true);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(5);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe(true);
		// ...and again from beginning...
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(6);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe(false);
	});
	it('should trigger execution as often as defined by repeat parameter and resume with return on each', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 3)' }, A3: { formula: 'A3+1' } }
		});
		s2.sheet.load({
			cells: {
				B1: { formula: 'getcycle()' },
				B2: { formula: 'if(B1==3,return("hello"), "run")' },
				B3: { formula: 'B3+1' }
			}
		});
		s2.trigger.update({ repeat: 'endless' });
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(0);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(2);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(3);
		// now s2 resumes and is called directly again (2. repetition) => s1 still waits!!
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(3);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(3);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(4);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(5);
		// now s2 resumes and is called directly again (3. repetition) => s1 still waits!!
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(3);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(5);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(6);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(7);
		// now s2 resumes
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe('hello');
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(3);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(7);
		// ...and once again from beginning...
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(s1.sheet.cellAt(SheetIndex.create('A2')).value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(8);
	});
	it('should display return value after execution in endless mode', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2")' }, A3: { formula: 'A3+1' } }
		});
		s1.trigger.update({ repeat: 'endless' });
		s2.sheet.load({
			cells: {
				B1: { formula: 'B1+1' },
				B2: { formula: 'if(B1==3,return("hello"), "run")' },
				B3: { formula: 'B3+1' }
			}
		});
		s2.trigger.update({ repeat: 'endless' });
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBe('run');
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B2').value).toBe('run');
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe('hello');
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(3);
		expect(s2.sheet.cellAt('B2').value).toBe('hello');
		expect(s2.sheet.cellAt('B3').value).toBe(2);
		// execute again...
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(4);
		expect(s2.sheet.cellAt('B2').value).toBe('run');
		expect(s2.sheet.cellAt('B3').value).toBe(3);
		// will never return
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(7);
		expect(s2.sheet.cellAt('B2').value).toBe('run');
		expect(s2.sheet.cellAt('B3').value).toBe(6);
	});
	it('should not be triggered by machine step', async () => {
		const { machine, s2 } = setup();
		const sheet2 = s2.sheet;
		createCellAt('A1', { formula: 'A1+1' }, sheet2);
		expect(sheet2.cellAt(SheetIndex.create('A1')).value).toBe(1);
		await machine.step();
		expect(sheet2.cellAt(SheetIndex.create('A1')).value).toBe(1);
	});
	it('should not trigger execution if repeat counter is 0', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 0)' }, A3: { formula: 'A3+1' } }
		});
		s1.trigger.update({ repeat: 'endless' });
		s2.sheet.load({
			cells: { B1: { formula: 'B1+1' } }
		});

		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(3);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt(SheetIndex.create('A1')).value).toBe(4);
		expect(s1.sheet.cellAt(SheetIndex.create('A3')).value).toBe(4);
		expect(s2.sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
	});
	// DL-678: try to simulate what might went wrong:
	it('should handle replacing execute term while running', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({ cells: { A1: { formula: 'execute("S2", 5)' }, A2: { formula: 'A2+1' } } });
		s1.trigger.update({ repeat: 'endless' });
		s2.sheet.load({ cells: { B1: { formula: 'getcycle()' }, B2: { formula: 'if(B1==2,return(), false)' } } });
		s2.trigger.update({ repeat: 'endless' });
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(0);
		expect(s2.sheet.cellAt('B2').value).toBe(false);
		await machine.step();
		await machine.step();	// <-- resumes and directly repeats execute() again
		expect(s1.sheet.cellAt('A1').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		// change A1 resumes S1
		createCellAt('A1', { formula: 'A1+1', value: 1 }, s1.sheet);
		await machine.step();	// applies resume
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(2);
		// last getcycle() value is kept, change it?
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		// and after next steps:
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(5);
		expect(s1.sheet.cellAt('A2').value).toBe(5);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
	});
	it('should be possible to pass data to triggered streamsheet', async () => {
		const { machine, s1, s2 } = setup();
		const data = '{\\"Kundenname\\":{\\"Vorname\\":\\"Hans\\",\\"Nachname\\":\\"Fuchs\\"}}';
		s1.sheet.load({ cells: { A1: { formula: `execute("S2",1,json("${data}")))` } } });
		s2.sheet.load({
			cells: {
				B1: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B2)' },
				B3: { formula: 'B3+1' }
			}
		});
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		await machine.step();
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('Hans');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(2);
	});
	// DL-1075
	it('should be possible to pass a complete message to triggered streamsheet', async () => {
		const { machine, s1, s2 } = setup();
		const message = new Message({ user: 'guest' });
		machine.outbox.put(message);
		s1.sheet.load({ cells: { A1: { formula: `execute("S2",1,outbox("${message.id}"))` } } });
		s2.sheet.load({
			cells: { B1: { formula: 'read(inboxdata(, , "user"), B2)' }, B3: { formula: 'B3+1' } }
		});
		expect(s2.sheet.cellAt(SheetIndex.create('B2')).value).toBe('');
		expect(s2.sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s2.sheet.cellAt('B2').value).toBe('guest');
		expect(s2.sheet.cellAt('B3').value).toBe(2);
	});
	// DL-1835
	it('should extend metadata of passed message with source and trigger properties', async () => {
		const { machine, s1, s2 } = setup();
		// setup outbox message
		machine.outbox.put(new Message({ user: 'guest' }));
		s1.sheet.setCells({ 'A1': { formula: 'execute("S2", 1, outbox())' } });
		s2.sheet.load({
			cells: {
				B1: { formula: 'read(inboxmetadata(, , "source"), C1)' },
				B2: { formula: 'read(inboxmetadata(, , "trigger"), C2)' },
				B3: { formula: 'read(inboxdata(, , "user"), C3)' }
			}
		});
		expect(s2.inbox.size).toBe(0);
		await machine.step();
		expect(s2.inbox.size).toBe(1);
		expect(s2.sheet.cellAt('C1').value).toBe('S1');
		expect(s2.sheet.cellAt('C2').value).toBe('EXECUTE');
		expect(s2.sheet.cellAt('C3').value).toBe('guest');
		// it should work even if only data is send
		s1.sheet.setCells({ 'A1': { formula: 'execute("S2", 1, "MyData")' } });
		createCellAt('B3', { formula: 'read(inboxdata(, ,0), C3)' }, s2.sheet);
		await machine.step();
		expect(s2.inbox.size).toBe(1);
		expect(s2.sheet.cellAt('C1').value).toBe('S1');
		expect(s2.sheet.cellAt('C2').value).toBe('EXECUTE');
		expect(s2.sheet.cellAt('C3').value).toBe('MyData');
	});
	it('should handle message with loop element',async  () => {
		const { machine, s1, s2 } = setup();
		// setup outbox message
		const message = new Message({ user: 'guest', loop: ['hello', 'world'] });
		machine.outbox.put(message);
		s1.trigger.update({ repeat: 'endless' });
		s1.sheet.load({
			cells: { A1: { formula: `execute("S2", 2, outbox("${message.id}"))` }, A2: { formula: 'A2+1' } }
		});
		s2.sheet.load({ cells: { B1: { formula: 'B1+1' }, B2: { formula: 'read(inboxdata(,,),C2)'} } });
		s2.sheet.streamsheet.updateSettings({ loop: { enabled: true, path: '[data][loop]' } });
		// initial check
		expect(s1.sheet.cellAt('A1').value).toBe(true);
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(1);
		expect(s2.sheet.cellAt('C2').value).toBe('');
		expect(s2.stats.executesteps).toBe(0);
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.sheet.cellAt('C2').value).toBe('hello');
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.sheet.cellAt('C2').value).toBe('world');
		// next repeat execute:
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s2.stats.executesteps).toBe(2);
		expect(s2.sheet.cellAt('C2').value).toBe('hello');
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(1);
		expect(s2.stats.executesteps).toBe(2);
		expect(s2.sheet.cellAt('C2').value).toBe('world');
		// S1 is endless, so it begins again
		await machine.step();
		expect(s1.stats.repeatsteps).toBe(2);
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.sheet.cellAt('C2').value).toBe('hello');
	});
	// DL-1528
	it('should read next loop element in endless mode only if sheet returns', async () => {
		const { machine, s1, s2 } = setup();
		// setup streamsheets:
		s1.sheet.load({ cells: { A1: { formula: 'execute("S2", 2)' }, A2: { formula: 'A2+1' } } });
		s2.trigger.update({ repeat: 'endless' });
		s2.updateSettings({	loop: { enabled: true, path: '[Data]' }	});
		s2.sheet.loadCells({
			// A1: { formula: 'repeatindex()' },
			B1: { formula: 'read(inboxdata(, , , "States", "Ampel1"), C1, "String")' },
			B2: { formula: 'B2+1' },
			B3: { formula: 'if(B2>2, return(setvalue(true, 1, B2)), false)' }
		});
		s2.inbox.put(new Message({
			Step1: { Duration: 1000, States: { Ampel1: 'Red' } },
			Step2: { Duration: 500, States: { Ampel1: 'Yellow' } },
			Step3: { Duration: 100, States: { Ampel1: 'Green' } }
		}));
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		expect(s2.sheet.cellAt('B3').value).toBe(false);
		expect(s2.sheet.cellAt('C1').value).toBe('Red');
		await machine.step();	// resumes S2 -> next loop element
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(s2.sheet.cellAt('B2').value).toBe(1);
		expect(s2.sheet.cellAt('B3').value).toBe(true);
		expect(s2.sheet.cellAt('C1').value).toBe('Red');
		await machine.step();
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		expect(s2.sheet.cellAt('B3').value).toBe(false);
		expect(s2.sheet.cellAt('C1').value).toBe('Yellow');
		await machine.step();	// resumes S2 -> next loop element
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(s2.sheet.cellAt('B2').value).toBe(1);
		expect(s2.sheet.cellAt('B3').value).toBe(true);
		expect(s2.sheet.cellAt('C1').value).toBe('Yellow');
		await machine.step();
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		expect(s2.sheet.cellAt('B3').value).toBe(false);
		expect(s2.sheet.cellAt('C1').value).toBe('Green');
		await machine.step();	// resumes S2 -> next repetition
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(s2.sheet.cellAt('B2').value).toBe(1);
		expect(s2.sheet.cellAt('B3').value).toBe(true);
		expect(s2.sheet.cellAt('C1').value).toBe('Green');
		await machine.step();
		expect(s2.stats.executesteps).toBe(2);
		// S2 has no more messages, so stay at last loop
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(s2.sheet.cellAt('B2').value).toBe(2);
		expect(s2.sheet.cellAt('B3').value).toBe(false);
		expect(s2.sheet.cellAt('C1').value).toBe('Green');
		await machine.step();	// resumes from last repetition
		expect(s1.sheet.cellAt('A2').value).toBe(2);
		expect(s2.stats.executesteps).toBe(2);
		// S2 has no more messages, so stay at last loop
		expect(s2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(s2.sheet.cellAt('B2').value).toBe(1);
		expect(s2.sheet.cellAt('B3').value).toBe(true);
		expect(s2.sheet.cellAt('C1').value).toBe('Green');
	});
	it('should return true even if no data to process is available', async () => {
		const { machine, s1 } = setup();
		s1.sheet.load({ cells: { A1: { formula: 'execute("S2")' } } });
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(false);
	});
	it('should return false if target trigger is not set correctly', async () => {
		const { machine, s1, s2 } = setup();
		s1.sheet.load({ cells: { A1: { formula: 'execute("S2",1,"data")' } } });
		s2.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.CONTINUOUSLY });
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(false);
	});
	// DL-3731:
	test('check passed message', async () => {
		const { machine, s1, s2 } = setup({switched: true });
		s2.sheet.load({ cells: { A2: 'tests', B2: 'tests', A4: { formula: 'execute("S1", 1, JSON(A2:B2))' } } });
		expect(s1.inbox.size).toBe(0);
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		const msg = s1.inbox.peek();
		expect(msg).toBeDefined();
		expect(msg.data.tests).toBe('tests');
	});
	// DL-4035: reading message before and after execute() is called
	it('should not go to next loop element on execute resume if step is not finished', async () => {
		const { machine, s1 } = setup();
		s1.sheet.load({
			cells: {
				A1: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B1)' },
				A2: { formula: 'A2+1' },
				A3: { formula: 'execute("T2")' },
				A4: { formula: 'A4+1' },
				A5: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B5)' },
				A6: { formula: 'A6+1' },
			}
		});
		s1.sheet.streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(s1.sheet.cellAt('A2').value).toBe(1);
		expect(s1.sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('B1').value).toBe('Max');
		expect(s1.sheet.cellAt('A2').value).toBe(2);
		expect(s1.sheet.cellAt('A4').value).toBe(2);
		expect(s1.sheet.cellAt('B5').value).toBe('Max');
		expect(s1.sheet.cellAt('A6').value).toBe(2);
	});
	it('should not go to next loop element if executed after processed', async () => {
		const { machine, s2 } = setup({ switched: true });
		// analog to above but different execution order, i.e. T2 executes T1 !!!
		s2.sheet.load({
			cells: {
				A1: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B1)' },
				A2: { formula: 'A2+1' },
				A3: { formula: 'execute("T1")' },
				A4: { formula: 'A4+1' },
				A5: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B5)' },
				A6: { formula: 'A6+1' },
			}
		});
		s2.sheet.streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(s2.sheet.cellAt('A2').value).toBe(1);
		expect(s2.sheet.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(s2.sheet.cellAt('B1').value).toBe('Max');
		expect(s2.sheet.cellAt('A2').value).toBe(2);
		expect(s2.sheet.cellAt('A4').value).toBe(2);
		expect(s2.sheet.cellAt('B5').value).toBe('Max');
		expect(s2.sheet.cellAt('A6').value).toBe(2);
	});
	it('should execute endlessly in "repeat until..." but respect sleep()', async () => {
		const { machine, s1, s2 } = setup();
		s2.trigger.update({ repeat: 'endless' });
		createCellAt('A1', { formula: 'A1+1' }, s1.sheet);
		createCellAt('A2', { formula: 'execute("S2")' }, s1.sheet);
		createCellAt('A3', { formula: 'A3+1' }, s1.sheet);
		createCellAt('B1', { formula: 'B1+1' }, s2.sheet);
		createCellAt('B2', { formula: 'sleep(0.1)' }, s2.sheet);
		await machine.start();
		await wait(500);
		await machine.stop();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBeGreaterThan(2);
		expect(s2.sheet.cellAt('B1').value).toBeLessThanOrEqual(6);
	});
});
describe('concatenated execute() usage', () => {
	// DL-1114
	it.skip('should be possible to trigger a streamsheet which triggers another streamsheet', async () => {
		const { machine, s1, s2 } = setup();
		const s3 = new StreamSheet({ name: 'S3' });
		machine.addStreamSheet(s3);
		// setup 3 streamsheets: S1 -> executes -> S2 -> executes -> S3
		s1.trigger.update({ repeat: 'endless' });
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 2)' }, A3: { formula: 'A3+1' } }
		});
		s2.sheet.load({
			cells: { B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3", 3)' }, B3: { formula: 'B3+1' } }
		});
		s3.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.EXECUTE });
		s3.sheet.load({ cells: { C1: { formula: 'C1+1' } } });
		// initial values:
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(2);
		expect(s3.stats.executesteps).toBe(1);
		await machine.step();
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s2.stats.executesteps).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(3);
		expect(s3.stats.executesteps).toBe(2);
		await machine.step();	// S3 called 3x => S2 resumes
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(false);
		expect(s2.sheet.cellAt('B3').value).toBe(2);
		expect(s2.stats.executesteps).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(4);
		expect(s3.stats.executesteps).toBe(3);
		await machine.step();	// S2 next repetition
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(3);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(2);
		expect(s2.stats.executesteps).toBe(2);
		expect(s3.sheet.cellAt('C1').value).toBe(5);
		expect(s3.stats.executesteps).toBe(1);
		await machine.step();
		await machine.step();	// S3 called 3x => S2 resumes => S1 resumes
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(false);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(3);
		expect(s2.sheet.cellAt('B2').value).toBe(false);
		expect(s2.sheet.cellAt('B3').value).toBe(3);
		expect(s2.stats.executesteps).toBe(2);
		expect(s3.sheet.cellAt('C1').value).toBe(7);
		expect(s3.stats.executesteps).toBe(3);
		await machine.step();	// S1 is endless so it starts again
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(4);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(3);
		expect(s2.stats.executesteps).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(8);
		expect(s3.stats.executesteps).toBe(1);
	});
	// DL-1663
	it('should not calculate twice if streamsheet is triggered by execute and endless mode in one step', async () => {
		const { machine, s1, s2 } = setup();
		const s3 = new StreamSheet({ name: 'S3' });
		s3.trigger = TriggerFactory.create({ type: TriggerFactory.TYPE.EXECUTE, repeat: 'endless' });
		// ORDER IS IMPORTANT!!!
		machine.removeAllStreamSheets();
		machine.addStreamSheet(s2);
		machine.addStreamSheet(s3);
		machine.addStreamSheet(s1);

		// setup 3 streamsheets: S1 -> executes S2 -> executes -> S3
		s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, A2: { formula: 'execute("S2", 1)' }, A3: { formula: 'A3+1' } }
		});
		s2.sheet.load({
			cells: { B1: { formula: 'B1+1' }, B2: { formula: 'execute("S3", 1)' }, B3: { formula: 'B3+1' } }
		});
		s2.updateSettings({ loop: { path: '[data][Program]', enabled: true } });
		s2.inbox.put(new Message({ Program: [{ val: 1 }, { val: 2 }] }));
		s3.sheet.load({
			cells: {
				C1: { formula: 'C1+1' }, C2: { formula: 'getcycle()' },
				// placed in one row to express that its execution depends on IF4 !!!
				IF4: { formula: 'C1>3' }, C4: { formula: 'setvalue(C1>3, 1, C1)' },	D4: { formula: 'return(true)' }
			}
		});

		// initial values:
		expect(s1.sheet.cellAt('A1').value).toBe(1);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(1);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(1);
		expect(s3.sheet.cellAt('C2').value).toBe(0);
		await machine.step();
		expect(s2.getLoopIndex()).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(2);
		expect(s3.sheet.cellAt('C2').value).toBe(1);
		await machine.step();
		expect(s2.getLoopIndex()).toBe(0);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(1);
		expect(s3.sheet.cellAt('C1').value).toBe(3);
		expect(s3.sheet.cellAt('C2').value).toBe(2);
		await machine.step();	// <-- return S3 -> S2 resumes step
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(2);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		expect(s2.sheet.cellAt('B3').value).toBe(2);
		expect(s3.sheet.cellAt('C1').value).toBe(1);
		expect(s3.sheet.cellAt('C2').value).toBe(3);
		await machine.step();	// S2 -> executes S3 again, because of loop element
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(3);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(2);
		expect(s3.sheet.cellAt('C1').value).toBe(2);
		expect(s3.sheet.cellAt('C2').value).toBe(1);
		await machine.step();
		await machine.step();	// <-- return S3 -> S2 resumes step -> S1 resumes step
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(2);
		expect(s1.sheet.cellAt('A2').value).toBe(true);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(3);
		expect(s2.sheet.cellAt('B2').value).toBe(true);
		expect(s2.sheet.cellAt('B3').value).toBe(3);
		expect(s3.sheet.cellAt('C1').value).toBe(1);
		expect(s3.sheet.cellAt('C2').value).toBe(3);
		await machine.step()	// and from the beginning...
		expect(s2.getLoopIndex()).toBe(1);
		expect(s1.sheet.cellAt('A1').value).toBe(3);
		expect(s1.sheet.cellAt('A2').value).toBe(ERROR.NA);
		expect(s1.sheet.cellAt('A3').value).toBe(2);
		expect(s2.sheet.cellAt('B1').value).toBe(4);
		expect(s2.sheet.cellAt('B2').value).toBe(ERROR.NA);
		expect(s2.sheet.cellAt('B3').value).toBe(3);
		expect(s3.sheet.cellAt('C1').value).toBe(2);
		expect(s3.sheet.cellAt('C2').value).toBe(1);
	});
});
// based on DL-1763
describe.skip('execute stream sheet which has own message stream', () => {
	it('should not add first received message twice on first machine step', async () => {
		const { machine, s1, s2 } = setup({ switched: true });
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.load({ cells: { B1: { formula: 'execute("S1",1)' } } });
		expect(s1.inbox.size).toBe(0);
		s1.inbox.put(createMessage());
		expect(s1.inbox.size).toBe(1);
		await machine.step();
		expect(s1.stats.steps).toBe(1);
		expect(s2.stats.steps).toBe(1);
		expect(s2.sheet.cellAt('B1').value).toBe(true);
		expect(s1.inbox.size).toBe(1);
	});
	it('should use next message if current one is processed', async () => {
		const { machine, s1, s2 } = setup({ switched: true });
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.load({ cells: { B1: { formula: 'execute("S1",1)' } } });
		// add messages:
		s1.inbox.put(createMessage());
		s1.inbox.put(createMessage());
		expect(s1.inbox.size).toBe(2);
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.stats.steps).toBe(1);
		expect(s2.stats.steps).toBe(1);
		await machine.step();
		// previous message removed from inbox
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(2);
		// S2 runs endless so never increase step counter
		expect(s2.stats.steps).toBe(1);
		await machine.step();
		// NOTE: last message is kept
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(3);
		expect(s2.stats.steps).toBe(1);
		await machine.start();
		expect(s1.stats.steps).toBe(3);
		expect(s2.stats.steps).toBe(2);
		await wait(80);
		expect(s1.stats.steps).toBeGreaterThanOrEqual(4);
		expect(s2.stats.steps).toBe(2);
		await machine.stop();
	});
	it('should use next message if current one is processed with loop', async () => {
		const { machine, s1, s2 } = setup({ switched: true });
		s1.updateSettings({ loop: { path: '[Data]', enabled: true } });
		s2.trigger.update({ repeat: 'endless' });
		s2.sheet.load({ cells: { B1: { formula: 'execute("S1",1)' } } });
		// add messages:
		s1.inbox.put(createMessage());
		s1.inbox.put(createMessage());
		s1.inbox.put(createMessage());
		expect(s1.inbox.size).toBe(3);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(3);
		expect(s1.stats.steps).toBe(3);
		expect(s2.stats.steps).toBe(1);
		await machine.step(); // we pop current message from inbox:
		expect(s1.inbox.size).toBe(2);
		expect(s1.stats.steps).toBe(4);
		expect(s2.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(2);
		expect(s1.stats.steps).toBe(6);
		expect(s2.stats.steps).toBe(1);
		await machine.step(); // we pop current message from inbox:
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(7);
		expect(s2.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		// NOTE: last message is kept
		expect(s1.inbox.size).toBe(1);
		expect(s1.stats.steps).toBe(10);
		expect(s2.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(s1.inbox.size).toBe(1);
		// no new message, so S1 & S2 both step
		expect(s1.stats.steps).toBe(13);
		expect(s2.stats.steps).toBe(1);
	});
});
