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
const { EXECUTE, GETEXECUTESTEP } = require('../../src/functions/streamsheet').functions;
const { createCellAt, createTerm } = require('../utilities');
const { Term } = require('@cedalo/parser');
const { Cell, Machine, Message, SheetIndex, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const random = (nr = 10) => Math.floor(Math.random() * Math.floor(nr));
const createMessage = () => new Message([
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() },
	{ "0": random(), "1": random() }
]);

let machine;
beforeEach(() => {
	machine = new Machine();
	machine.removeAllStreamSheets();
	const t1 = new StreamSheet();
	const t2 = new StreamSheet();
	t1.name = 'T1';
	t2.name = 'T2';
	machine.addStreamSheet(t1);
	machine.addStreamSheet(t2);
});

describe('execute', () => {
	it('should trigger execution of a streamsheet from another one', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 3)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({ cells: { B2: { formula: 'B2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(1);
		// T1 will stop at execute
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(3);
		// now T1 resumes from T2 => in same cycle
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(false);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(4);
		// ...and again from beginning...
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(5);
	});
	it('should trigger execution as often as defined by repeat parameter', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 3)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(3);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(4);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(5);
	});
	it('should restart repeated execution after machine stop', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 3)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		// set to pause, so that we can later stop!
		await machine.pause();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(3);
		// now stop and step again...
		await machine.stop();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(4);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(5);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(6);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(4);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(7);
	});
	// DL-710:
	it('should go on with next loop element after resume from repeated execute', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 3)' },
				C1: { formula: 'C1+1' }
			}
		});
		t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'always' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		t1.updateSettings({ loop: { path: '[data][Positionen]', enabled: true } });
		t1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		await machine.step();
		expect(t1.getLoopIndex()).toBe(0);
		expect(GETEXECUTESTEP(t2.sheet)).toBe(1);
		await machine.step();
		expect(t1.getLoopIndex()).toBe(0);
		// next step will resume from execute and should go to next loop index...
		await machine.step();
		expect(t1.getLoopIndex()).toBe(1);
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
		await machine.step();
		expect(t1.getLoopIndex()).toBe(1);
		expect(GETEXECUTESTEP(t2.sheet)).toBe(1);
		await machine.step();
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2);
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2); // loop index is always bound to avaialble loop elements...
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
		// does not change in following steps, because we keep last processed message...
		await machine.step();
		await machine.step();
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2); // loop index is always bound to avaialble loop elements...
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
	});
	// DL-3719
	it('should not go on with next loop element if execute resumed in same cycle', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'read(inboxdata(,,),B2:C4,"Dictionary")' },
				A5: { formula: 'execute("T2", 1)' },
				A6: { formula: 'loopindex()' }
			}
		});
		t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'always' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		t1.updateSettings({ loop: { path: '[data][Positionen]', enabled: true } });
		t1.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(t1.getLoopIndex()).toBe(0);
		await machine.step();
		expect(t1.getLoopIndex()).toBe(1);
		expect(t1.sheet.cellAt('C2').value).toBe(1);
		expect(t1.sheet.cellAt('A6').value).toBe(1);
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2);
		expect(t1.sheet.cellAt('C2').value).toBe(2);
		expect(t1.sheet.cellAt('A6').value).toBe(2);
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2);
		expect(t1.sheet.cellAt('C2').value).toBe(3);
		expect(t1.sheet.cellAt('A6').value).toBe(3);
		// note the loop index will not pass its bounds!
		await machine.step();
		await machine.step();
		await machine.step();
		expect(t1.getLoopIndex()).toBe(2);
		expect(t1.sheet.cellAt('C2').value).toBe(3);
		expect(t1.sheet.cellAt('A6').value).toBe(3);
	});
	it('should trigger execution in endless mode until return is called', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 1)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({
			cells: {
				B2: { formula: 'B2+1' },
				C2: { formula: 'if(B2==5,return(true), false)' }
			}
		});
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'endless' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(false);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(4);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(false);
		// now T1 resumes from T2 => in same cycle
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(5);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(true);
		// ...and again from beginning...
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(6);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(false);
	});
	it('should trigger execution as often as defined by repeat parameter and resume with return on each', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 3)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({
			cells: {
				A2: { formula: 'getcycle()' },
				B2: { formula: 'if(A2==2,return("hello"), "run")' },
				C2: { formula: 'C2+1' }
			}
		});
		t1.trigger = StreamSheetTrigger.create({ type: 'always' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'endless' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(0);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(1);
		// start T2
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(2);
		// now T2 should resume first time => T1 still waits!!
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(2);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(3);
		// now T2 should resume second time => T1 still waits!!
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(3);
		await machine.step();
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(4);
		// now T2 should resume last time => T1 calcs too!!
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe('hello');
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('hello');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(4);
		// ...and once again from beginning...
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('run');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(5);
	});
	it('should display return value after execution in endless mode', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 1)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({
			cells: {
				B2: { formula: 'B2+1' },
				C2: { formula: 'if(B2==5,return("hello"), "run")' }
			}
		});
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'endless' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe('run');
		await machine.step();
		await machine.step();
		await machine.step();
		// now T1 resumes from T2 => in same cycle
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe('hello');
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(5);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe('hello');
		// ...and again from beginning...
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('B1')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(6);
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe('run');
	});
	it('should not be triggered by machine step', async () => {
		const t2 = machine.getStreamSheetByName('T2');
		const sheet2 = t2.sheet;
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		createCellAt('A1', { formula: 'A1+1' }, sheet2);
		expect(sheet2.cellAt(SheetIndex.create('A1')).value).toBe(1);
		await machine.step();
		expect(sheet2.cellAt(SheetIndex.create('A1')).value).toBe(1);
	});
	it('should not trigger execution if repeat counter is 0', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 0)' },
				C1: { formula: 'C1+1' }
			}
		});
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(3);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(4);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(4);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(1);
	});
	// DL-678: try to simulate what might went wrong:
	it('should handle replacing execute term while running', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = t1.sheet.load({ cells: { A1: { formula: 'execute("T2", 5)' }, C1: { formula: 'C1+1' } } });
		const sheet2 = t2.sheet.load({
			cells: {
				A2: { formula: 'getcycle()' },
				B2: { formula: 'if(a2==3, return(), false)' }
			}
		});
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'endless' });
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(true);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(0);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(false);
		await machine.step();
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(ERROR.NA);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(2);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(false);
		// change A1
		// sheet1.cellAt('A1').value = 1; // removed ERROR.NA :-)
		createCellAt('A1', { formula: 'A1+1', value: 1 }, sheet1);
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(1);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(2);
		// getcycle counts streamsheet steps not machine steps!! => T2 returns here!
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(3);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(true);
		// and after next step:
		await machine.step();
		expect(sheet1.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet1.cellAt(SheetIndex.create('C1')).value).toBe(3);
		expect(sheet2.cellAt(SheetIndex.create('A2')).value).toBe(3);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe(true);
	});
	it('should be possible to select inbox message of triggered streamsheet', () => {
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		const sheet2 = t2.sheet.load({
			cells: {
				A2: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B2)' },
				C2: { formula: 'C2+1' }
			}
		});
		const inbox2 = t2.inbox;
		const target = Term.fromString('T2');
		const repeat = Term.fromNumber(1);
		const selector = { Kundenname: { Vorname: 'Anton', Nachname: 'Mustermann' } };
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		inbox2.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		inbox2.put(new Message(Object.assign({}, MSG.SIMPLE2.data)));
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(1);
		// simulate function term and machine step
		EXECUTE.term = {};
		sheet1.processor._isProcessing = true;
		expect(EXECUTE(sheet1, target, repeat, null, { value: selector })).toBe(true);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('Anton');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(2);
	});
	it('should be possible to pass data to triggered streamsheet', () => {
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		const sheet2 = t2.sheet.load({
			cells: {
				A2: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B2)' },
				C2: { formula: 'C2+1' }
			}
		});
		const target = Term.fromString('T2');
		const repeat = Term.fromNumber(1);
		const data = { Kundenname: { Vorname: 'Hans', Nachname: 'Fuchs' } };
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(1);
		// simulate function term and machine step
		EXECUTE.term = {};
		sheet1.processor._isProcessing = true;
		expect(EXECUTE(sheet1, target, repeat, { value: data })).toBe(true);
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('Hans');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(2);
	});
	// DL-1075
	it('should be possible to pass a complete message to triggered streamsheet', async () => {
		// setup streamsheets:
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'once' });
		const t2 = machine.getStreamSheetByName('T2');
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		const sheet1 = t1.sheet;
		const sheet2 = t2.sheet.load({
			cells: { A2: { formula: 'read(inboxdata(, , "user"), B2)' }, C2: { formula: 'C2+1' } }
		});
		// setup outbox message
		const message = new Message({ user: 'guest' });
		machine.outbox.put(message);
		// execute term:
		const execute = createTerm(`execute("T2", 1, outbox("${message.id}"))`, sheet1);
		sheet1.setCellAt('A1', new Cell(null, execute));
		expect(sheet2.cellAt(SheetIndex.create('B2')).value).toBe('');
		expect(sheet2.cellAt(SheetIndex.create('C2')).value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet2.cellAt('B2').value).toBe('guest');
		expect(sheet2.cellAt('C2').value).toBe(2);
	});
	// DL-1835
	it('should extend metadata of passed message with source and trigger properties', async () => {
		// setup streamsheet:
		const t2 = machine.getStreamSheetByName('T2');
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		// setup outbox message
		machine.outbox.put(new Message({ user: 'guest' }));
		sheet1.setCells({ 'A1': { formula: 'execute("T2", 1, outbox())' } });
		expect(t2.inbox.size).toBe(0);
		await machine.step();
		expect(t2.inbox.size).toBe(1);
		let msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.metadata).toBeDefined();
		expect(msg.metadata.source).toBe('T1');
		expect(msg.metadata.trigger).toBe('EXECUTE');
		// it should work even if only data is send
		sheet1.setCells({ 'A1': { formula: 'execute("T2", 1, "MyData")' } });
		expect(t2.inbox.size).toBe(0);
		await machine.step();
		expect(t2.inbox.size).toBe(1);
		msg = t2.inbox.pop();
		expect(msg).toBeDefined();
		expect(msg.metadata).toBeDefined();
		expect(msg.metadata.source).toBe('T1');
		expect(msg.metadata.trigger).toBe('EXECUTE');
		// it should work even if only data is send
		// const data = { Kundenname: { Vorname: 'Hans', Nachname: 'Fuchs' } };
		sheet1.setCellAt('A1', new Cell(null, createTerm(`execute("T2", 1, "MY DATA"))`, sheet1)));
	});
	it('should pass message to triggered streamsheet only on next repeat step', async () => {
		// setup streamsheets:
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });

		const t2 = machine.getStreamSheetByName('T2');
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		sheet2.streamsheet.updateSettings({
			trigger: { type: 'execute' },
			loop: { enabled: true, path: '[data][loop]' }
		});

		// setup outbox message
		const message = new Message({ user: 'guest', loop: ['hello', 'world'] });
		machine.outbox.put(message);
		const sheet1 = t1.sheet.load({
			cells: { A1: { formula: `execute("T2", 2, outbox("${message.id}"))` }, B1: { formula: 'B1+1' } }
		});
		// initial check
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(1);
		expect(t2.inbox.size).toBe(0);
		expect(t2.stats.executesteps).toBe(0);

		await machine.step(); // hello
		expect(t2.inbox.size).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		await machine.step(); // world
		expect(t2.inbox.size).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		await machine.step(); // hello
		expect(t2.inbox.size).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		await machine.step(); // world
		expect(t2.inbox.size).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		await machine.step(); // hello
		expect(t2.inbox.size).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
	});
	it('should handle message with loop element',async  () => {
		// setup streamsheets:
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });

		const t2 = machine.getStreamSheetByName('T2');
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' } } });
		sheet2.streamsheet.updateSettings({
			trigger: { type: 'execute' },
			loop: { enabled: true, path: '[data][loop]' }
		});

		// setup outbox message
		const message = new Message({ user: 'guest', loop: ['hello', 'world'] });
		machine.outbox.put(message);
		const sheet1 = t1.sheet.load({
			cells: { A1: { formula: `execute("T2", 2, outbox("${message.id}"))` }, B1: { formula: 'B1+1' } }
		});
		// initial check
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(1);
		expect(t2.stats.executesteps).toBe(0);

		await machine.step(); // hello
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(2);
		expect(t2.stats.executesteps).toBe(1);
		await machine.step(); // world
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(3);
		expect(t2.stats.executesteps).toBe(1);
		await machine.step(); // hello
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(sheet2.cellAt('A2').value).toBe(4);
		expect(t2.stats.executesteps).toBe(2);
		await machine.step(); // world
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(2); // <-- resumed!
		expect(sheet2.cellAt('A2').value).toBe(5);
		expect(t2.stats.executesteps).toBe(2);
		await machine.step(); // hello
		expect(sheet1.cellAt('A1').value).toBe(true);
		expect(sheet1.cellAt('B1').value).toBe(2);
		expect(sheet2.cellAt('A2').value).toBe(6);
		expect(t2.stats.executesteps).toBe(1);
	});
	// DL-1528
	it('should read next loop element in endless mode only if sheet returns', async () => {
		// setup streamsheets:
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'always' });
		const sheet1 = t1.sheet.load({ cells: { A1: { formula: 'execute("T2", 2)' }, B1: { formula: 'B1+1' } } });
		const t2 = machine.getStreamSheetByName('T2');
		t2.updateSettings({
			trigger: { type: 'execute', repeat: 'endless' },
			loop: { enabled: true, path: '[Data]' }
		});
		const sheet2 = t2.sheet.loadCells({
			// A1: { formula: 'repeatindex()' },
			A3: { formula: 'read(inboxdata(, , , "States", "Ampel1"), B3, "String")' },
			A4: { formula: 'A4+1' },
			A5: { formula: 'if(A4>2, return(setvalue(true, 1, A4)), false)' }
		});
		t2.inbox.put(new Message({
			Step1: { Duration: 1000, States: { Ampel1: 'Red' } },
			Step2: { Duration: 500, States: { Ampel1: 'Yellow' } },
			Step3: { Duration: 100, States: { Ampel1: 'Green' } }
		}));
		await machine.step();
		expect(sheet1.cellAt('A1').value).toBe(ERROR.NA);
		expect(sheet1.cellAt('B1').value).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Red');
		await machine.step();
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(sheet2.cellAt('B3').value).toBe('Red');
		await machine.step();
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Yellow');
		await machine.step();
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(sheet2.cellAt('B3').value).toBe('Yellow');
		await machine.step();
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Green');
		await machine.step(); // will RETURN here
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(sheet2.cellAt('B3').value).toBe('Green');
		await machine.step();	// NEXT REPEAT
		expect(t2.stats.executesteps).toBe(2);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Red');
		await machine.step();
		await machine.step();
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Yellow');
		await machine.step();
		await machine.step();
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step3]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Green');
		await machine.step();
		await machine.step();
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(sheet2.cellAt('B3').value).toBe('Red');
		expect(t2.stats.executesteps).toBe(1);
	});
	it('should read same loop element in endless mode from passed message until return', async () => {
		// setup streamsheets:
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'always' });
		t1.sheet.load({ cells: {
			/* eslint-disable */
			A1: { value: 'Step1', level: 1 }, B2: { value: 'TDD', level: 2 }, C2: 'Red',
			A3: { value: 'Step2', level: 1 }, B4: { value: 'TDD', level: 2 }, C4: 'Green',
			A8: { formula: 'execute("T2", 2, JSON(A1:C4))' }, B8: { formula: 'B8+1' } }
			/* eslint-enable */
		});
		// { formula: 'execute("T2", 2)' }, B1: { formula: 'B1+1' } } });
		const t2 = machine.getStreamSheetByName('T2');
		t2.updateSettings({
			trigger: { type: 'execute', repeat: 'endless' },
			loop: { enabled: true, path: '[Data]' }
		});
		const sheet2 = t2.sheet.loadCells({
			// A1: { formula: 'repeatindex()' },
			A3: { formula: 'read(inboxdata(, , , "TDD"), B3, "String")' },
			A4: { formula: 'A4+1' },
			A5: { formula: 'if(A4>2, return(setvalue(true, 1, A4)), false)' }
		});
		await machine.step();
		let lastMessageId = t2.inbox.peek().id;
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('B3').value).toBe('Red');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step(); // will invoke RETURN() -> on next step we take next loop element
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('B3').value).toBe('Red');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('B3').value).toBe('Green');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();  // will invoke RETURN() -> on next step we take next loop element
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('B3').value).toBe('Green');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('B3').value).toBe('Red');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(t2.inbox.peek().id).not.toBe(lastMessageId);
		lastMessageId = t2.inbox.peek().id;
		await machine.step();  // will invoke RETURN() -> on next step we take next loop element
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step1]');
		expect(sheet2.cellAt('B3').value).toBe('Red');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('B3').value).toBe('Green');
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('A5').value).toBe(false);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();  // will invoke RETURN() -> on next step we take next loop element
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(2);
		expect(t2.getCurrentLoopPath()).toBe('[Data][Step2]');
		expect(sheet2.cellAt('B3').value).toBe('Green');
		expect(sheet2.cellAt('A4').value).toBe(1);
		expect(sheet2.cellAt('A5').value).toBe(true);
		expect(t2.inbox.peek().id).toBe(lastMessageId);
		await machine.step();
		expect(t2.inbox.messages.length).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(t2.inbox.peek().id).not.toBe(lastMessageId);
	});
	it('should return true even if no data to process is available', () => {
		const t2 = machine.getStreamSheetByName('T2');
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		const target = Term.fromString('T2');
		const repeat = Term.fromNumber(1);
		// simulate function term and machine step
		EXECUTE.term = {};
		sheet1.processor._isProcessing = true;
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		expect(EXECUTE(sheet1, target, repeat)).toBe(false);
	});
	it('should return false if target trigger is not set correctly', () => {
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		const target = Term.fromString('T2');
		const repeat = Term.fromNumber(1);
		// simulate function term and machine step
		EXECUTE.term = {};
		sheet1.processor._isProcessing = true;
		expect(EXECUTE(sheet1, target, repeat, Term.fromString('data'))).toBe(false);
	});
	// DL-3731:
	test('check passed message', async () => {
		const t1 = machine.getStreamSheetByName('T1');
		const t2 = machine.getStreamSheetByName('T2');
		t1.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once'  });
		t2.trigger = StreamSheetTrigger.create({ type: 'always' });
		t2.sheet.load({ cells: { A2: 'tests', B2: 'tests', A4: { formula: 'execute("T1", 1, JSON(A2:B2))' } } });
		expect(t1.inbox.size).toBe(0);
		await machine.step();
		const msg = t1.inbox.peek();
		expect(msg).toBeDefined();
		expect(msg.data.tests).toBe('tests');
	});
	// DL-4035: reading message before and after execute() is called
	it('should not go to next loop element on execute resume if step is not finished', async () => {
		const sheet1 = machine.getStreamSheetByName('T1').sheet.load({
			cells: {
				A1: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B1)' },
				A2: { formula: 'A2+1' },
				A3: { formula: 'execute("T2")' },
				A4: { formula: 'A4+1' },
				A5: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B5)' },
				A6: { formula: 'A6+1' },
			}
		});
		const t2 = machine.getStreamSheetByName('T2');
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		sheet1.streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(sheet1.cellAt('A2').value).toBe(1);
		expect(sheet1.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet1.cellAt('B1').value).toBe('Max');
		expect(sheet1.cellAt('A2').value).toBe(2);
		expect(sheet1.cellAt('A4').value).toBe(2);
		expect(sheet1.cellAt('B5').value).toBe('Max');
		expect(sheet1.cellAt('A6').value).toBe(2);
	});
	it('should not go to next loop element if executed after processed', async () => {
		// analog to above but different execution order, i.e. T2 executes T1 !!!
		const sheet2 = machine.getStreamSheetByName('T2').sheet.load({
			cells: {
				A1: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B1)' },
				A2: { formula: 'A2+1' },
				A3: { formula: 'execute("T1")' },
				A4: { formula: 'A4+1' },
				A5: { formula: 'read(inboxdata(, , "Kundenname","Vorname"), B5)' },
				A6: { formula: 'A6+1' },
			}
		});
		const t1 = machine.getStreamSheetByName('T1');
		t1.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		sheet2.streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		expect(sheet2.cellAt('A2').value).toBe(1);
		expect(sheet2.cellAt('A4').value).toBe(1);
		await machine.step();
		expect(sheet2.cellAt('B1').value).toBe('Max');
		expect(sheet2.cellAt('A2').value).toBe(2);
		expect(sheet2.cellAt('A4').value).toBe(2);
		expect(sheet2.cellAt('B5').value).toBe('Max');
		expect(sheet2.cellAt('A6').value).toBe(2);
	});
});
describe('concatenated execute() usage', () => {
	// DL-1114
	it('should be possible to trigger a streamsheet which triggers another streamsheet', async () => {
		// setup 3 streamsheets: T1 executes T2 executes T3
		const t1 = machine.getStreamSheetByName('T1');
		const sheet1 = machine.getStreamSheetByName('T1').sheet;
		t1.trigger = StreamSheetTrigger.create({ type: 'once', repeat: 'endless' });
		sheet1.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T2", 2)' },
				C1: { formula: 'C1+1' }
			}
		});

		const t2 = machine.getStreamSheetByName('T2');
		const sheet2 = machine.getStreamSheetByName('T2').sheet;
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		sheet2.load({
			cells: {
				A1: { formula: 'A1+1' },
				B1: { formula: 'execute("T3", 3)' },
				C1: { formula: 'C1+1' }
			}
		});

		const t3 = new StreamSheet({ name: 'T3' });
		const sheet3 = t3.sheet;
		t3.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		machine.addStreamSheet(t3);
		sheet3.load({ cells: { A1: { formula: 'A1+1' } } });

		// initial values:
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(1);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(1);
		expect(sheet3.cellAt('A1').value).toBe(1);

		await machine.step(); // 1
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(sheet3.cellAt('A1').value).toBe(2);
		expect(t3.stats.executesteps).toBe(1);

		await machine.step();  // 2
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(1);
		expect(t2.stats.executesteps).toBe(1);
		expect(sheet3.cellAt('A1').value).toBe(3);
		expect(t3.stats.executesteps).toBe(2);

		await machine.step();  // 3
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(2);
		expect(sheet2.cellAt('B1').value).toBe(false);
		expect(sheet2.cellAt('C1').value).toBe(2);
		expect(t2.stats.executesteps).toBe(1);
		expect(sheet3.cellAt('A1').value).toBe(4);
		expect(t3.stats.executesteps).toBe(3);

		await machine.step();  // 4
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(3);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(2);
		expect(t2.stats.executesteps).toBe(2);
		expect(sheet3.cellAt('A1').value).toBe(5);
		expect(t3.stats.executesteps).toBe(1);

		await machine.step();  // 5
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(1);
		expect(sheet2.cellAt('A1').value).toBe(3);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(2);
		expect(t2.stats.executesteps).toBe(2);
		expect(sheet3.cellAt('A1').value).toBe(6);
		expect(t3.stats.executesteps).toBe(2);

		await machine.step();  // 6
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(false);
		expect(sheet1.cellAt('C1').value).toBe(2);
		expect(sheet2.cellAt('A1').value).toBe(3);
		expect(sheet2.cellAt('B1').value).toBe(false);
		expect(sheet2.cellAt('C1').value).toBe(3);
		expect(t2.stats.executesteps).toBe(2);
		expect(sheet3.cellAt('A1').value).toBe(7);
		expect(t3.stats.executesteps).toBe(3);

		await machine.step();  // 7
		expect(sheet1.cellAt('A1').value).toBe(3);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet1.cellAt('C1').value).toBe(2);
		expect(sheet2.cellAt('A1').value).toBe(4);
		expect(sheet2.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('C1').value).toBe(3);
		expect(t2.stats.executesteps).toBe(1);
		expect(sheet3.cellAt('A1').value).toBe(8);
		expect(t3.stats.executesteps).toBe(1);
	});

	// DL-1663
	it('should not calculate twice if streamsheet is triggered by execute and endless mode in one step', async () => {
		machine.removeAllStreamSheets();
		// setup 3 streamsheets: T1 executes T2 executes T3
		const t1 = new StreamSheet({ name: 'T1' });
		const sheet1 = t1.sheet.load({ cells: { A1: { formula: 'A1+1' }, B1: { formula: 'execute("T2", 1)' } } });
		t1.trigger = StreamSheetTrigger.create({ type: 'once' });

		const t2 = new StreamSheet({ name: 'T2' });
		const sheet2 = t2.sheet.load({ cells: { A2: { formula: 'A2+1' }, B2: { formula: 'execute("T3", 1)' }, C2: { formula: 'C2+1' } } });
		t2.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'once' });
		t2.updateSettings({ loop: { path: '[data][Program]', enabled: true } });
		t2.inbox.put(new Message({ Program: [{ val: 1 }, { val: 2 }] }));

		const t3 = new StreamSheet({ name: 'T3' });
		const sheet3 = t3.sheet.load({
			cells: {
				A3: { formula: 'A3+1' }, B3: { formula: 'getcycle()' },
				// placed in one row to express that its execution depends on IF4 !!!
				IF4: { formula: 'A3>3' }, A4: { formula: 'setvalue(A3>3, 1, A3)' },	B4: { formula: 'return(true)' }
			}
		});
		t3.trigger = StreamSheetTrigger.create({ type: 'execute', repeat: 'endless' });
		// ORDER IS IMPORTANT!!!
		machine.addStreamSheet(t2);
		machine.addStreamSheet(t3);
		machine.addStreamSheet(t1);

		// initial values:
		expect(sheet1.cellAt('A1').value).toBe(1);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(1);
		expect(sheet2.cellAt('B2').value).toBe(true);
		expect(sheet3.cellAt('A3').value).toBe(1);
		expect(sheet3.cellAt('B3').value).toBe(0);
		expect(sheet3.cellAt('A4').value).toBe(true);
		expect(sheet3.cellAt('B4').value).toBe(true);

		await machine.step();
		expect(t2.getLoopIndex()).toBe(0);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(2);
		expect(sheet2.cellAt('B2').value).toBe(ERROR.NA);
		expect(sheet2.cellAt('C2').value).toBe(1);
		expect(sheet3.cellAt('A3').value).toBe(2);
		expect(sheet3.cellAt('B3').value).toBe(1);
		await machine.step();
		expect(t2.getLoopIndex()).toBe(0);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(2);
		expect(sheet2.cellAt('B2').value).toBe(ERROR.NA);
		expect(sheet2.cellAt('C2').value).toBe(1);
		expect(sheet3.cellAt('A3').value).toBe(3);
		expect(sheet3.cellAt('B3').value).toBe(2);
		// will cause T3 to return
		await machine.step();
		expect(t2.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(3);
		// not true because execute is directly triggered again with next loop element
		expect(sheet2.cellAt('B2').value).toBe(ERROR.NA);
		expect(sheet2.cellAt('C2').value).toBe(2);
		expect(sheet3.cellAt('A3').value).toBe(2);
		expect(sheet3.cellAt('B3').value).toBe(1);
		await machine.step();
		expect(t2.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(3);
		expect(sheet2.cellAt('B2').value).toBe(ERROR.NA);
		expect(sheet2.cellAt('C2').value).toBe(2);
		expect(sheet3.cellAt('A3').value).toBe(3);
		expect(sheet3.cellAt('B3').value).toBe(2);
		// will cause  T3 to return
		await machine.step();
		expect(t2.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(3);
		// here we get true now, because no loop-element or message left in T2
		expect(sheet2.cellAt('B2').value).toBe(true);
		expect(sheet2.cellAt('C2').value).toBe(3);
		expect(sheet3.cellAt('A3').value).toBe(1);
		expect(sheet3.cellAt('B3').value).toBe(3);
		// next step will do nothing since T1 is only triggered once...
		await machine.step();
		expect(t2.getLoopIndex()).toBe(1);
		expect(sheet1.cellAt('A1').value).toBe(2);
		expect(sheet1.cellAt('B1').value).toBe(true);
		expect(sheet2.cellAt('A2').value).toBe(3);
		expect(sheet2.cellAt('B2').value).toBe(true);
		expect(sheet2.cellAt('C2').value).toBe(3);
		expect(sheet3.cellAt('A3').value).toBe(1);
		expect(sheet3.cellAt('B3').value).toBe(3);
	});
});
// based on DL-1763
describe('execute stream sheet which has own message stream', () => {
	it('should not add first received message twice on first machine step', async () => {
		machine.getStreamSheetByName('T1').updateSettings({ trigger: { type: 'execute', repeat: 'once' } });
		machine.getStreamSheetByName('T2').updateSettings({ trigger: { type: 'start', repeat: 'endless' } });
		machine.getStreamSheetByName('T2').sheet.load({ cells: { B4: { formula: 'execute("T1",1)' } } });
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(0);
		// add messages:
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		// step
		await machine.step();
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(1);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(1);
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
	});
	it('should use next message if current one is processed', async () => {
		machine.getStreamSheetByName('T1').updateSettings({ trigger: { type: 'execute', repeat: 'once' } });
		machine.getStreamSheetByName('T2').updateSettings({ trigger: { type: 'start', repeat: 'endless' } });
		machine.getStreamSheetByName('T2').sheet.load({ cells: { B4: { formula: 'execute("T1",1)' } } });
		// add messages:
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(2);
		await machine.step();
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(1);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(1);
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(2);
		await machine.step();
		// previous message removed from inbox
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(2);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(2);
		await machine.step();
		// NOTE: last message is kept
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(3);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(3);
	});
	it('should use next message if current one is processed with loop', async () => {
		machine.getStreamSheetByName('T1').updateSettings({
			trigger: { type: 'execute', repeat: 'once' },
			loop: {	path: '[Data]',	enabled: true }
		});
		machine.getStreamSheetByName('T2').updateSettings({ trigger: { type: 'start', repeat: 'endless' } });
		machine.getStreamSheetByName('T2').sheet.load({ cells: { B4: { formula: 'execute("T1",1)' } } });
		// add some messages:
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		machine.getStreamSheetByName('T1').inbox.put(createMessage());
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(3);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(3);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(3);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(1); // NOTE: T2 steps only if T1 is fully executed!!
		await machine.step(); // we pop current message from inbox:
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(2);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(4);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(2);
		await machine.step();
		await machine.step();
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(2);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(6);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(2);
		await machine.step(); // we pop current message from inbox:
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(7);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(3);
		await machine.step();
		await machine.step();
		await machine.step();
		// NOTE: last message is kept
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(10);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(4);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(machine.getStreamSheetByName('T1').inbox.size).toBe(1);
		// no new message, so T1 & T2 both step
		expect(machine.getStreamSheetByName('T1').stats.steps).toBe(13);
		expect(machine.getStreamSheetByName('T2').stats.steps).toBe(7);
	});
});
