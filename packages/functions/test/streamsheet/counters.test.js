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
const { GETCYCLE, GETEXECUTESTEP, GETMACHINESTEP, GETSTEP } = require('../../src/functions/streamsheet').functions;
const { createTerm } = require('../utilities');
const { Cell, Machine, Message, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const createStreamSheet = (name, trigger, cells) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	streamsheet.name = name;
	streamsheet.trigger = trigger;
	streamsheet.sheet.load({ cells });
	machine.removeAllStreamSheets();
	machine.addStreamSheet(streamsheet);
	return streamsheet;
};


describe('counter', () => {
	it('should increment a given value', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counter = createTerm('counter(0, 1)', sheet);
		sheet.setCellAt('A1', new Cell(null, counter));
		expect(sheet.cellAt('A1').value).toBe(0);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(1);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		machine.step();
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
	});
	it('should decrement a given value if step is negative', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counter = createTerm('counter(6, -2)', sheet);
		sheet.setCellAt('A1', new Cell(null, counter));
		expect(sheet.cellAt('A1').value).toBe(6);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		machine.step();
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(-4);
	});
	it('should work with cell references', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counter = createTerm('counter(A1, B1)', sheet);
		sheet.setCellAt('A1', new Cell(1));
		sheet.setCellAt('B1', new Cell(2));
		sheet.setCellAt('A2', new Cell(null, counter));
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(2);
		expect(sheet.cellAt('A2').value).toBe(1);
		machine.step();
		expect(sheet.cellAt('A2').value).toBe(3);
		machine.step();
		expect(sheet.cellAt('A2').value).toBe(5);
		machine.step();
		machine.step();
		machine.step();
		expect(sheet.cellAt('A2').value).toBe(11);
	});
	it('should increment a given value until end is reached', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counter = createTerm('counter(0, 1, 3)', sheet);
		sheet.setCellAt('A1', new Cell(null, counter));
		expect(sheet.cellAt('A1').value).toBe(0);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(1);
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		// we reached end
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
	});
	it('should decrement a given value until end is reached', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counter = createTerm('counter(4, -2, 0)', sheet);
		sheet.setCellAt('A1', new Cell(null, counter));
		expect(sheet.cellAt('A1').value).toBe(4);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
		// we reached end
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
	});
	it('should not increase or decrease if given value already reached end', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counterA = createTerm('counter(3, 2, 0)', sheet);
		const counterB = createTerm('counter(5, -1, 10)', sheet);
		sheet.setCellAt('A1', new Cell(null, counterA));
		sheet.setCellAt('B1', new Cell(null, counterB));
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(5);
		// start values are already above/below end
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(5);
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(5);
	});
	it('should not increase or decrease value if reset param is always TRUE', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counterA = createTerm('counter(3, 2, ,TRUE)', sheet);
		const counterB = createTerm('counter(10, -3, ,TRUE)', sheet);
		sheet.setCellAt('A1', new Cell(null, counterA));
		sheet.setCellAt('B1', new Cell(null, counterB));
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
		machine.step();
		// reset is always true, so we keep start :-)
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
		machine.step();
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
	});
	it('should reset value to start if reset param is TRUE', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counterA = createTerm('counter(3, 2, ,getstep() % 2 == 0)', sheet);
		const counterB = createTerm('counter(10, -3, ,getstep() % 2 == 0)', sheet);
		sheet.setCellAt('A1', new Cell(null, counterA));
		sheet.setCellAt('B1', new Cell(null, counterB));
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B1').value).toBe(7);
		machine.step();
		// should done reset:
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B1').value).toBe(7);
	});
	it('should reset value to start if reset param is TRUE independent of end value', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		const machine = t1.machine;
		const counterA = createTerm('counter(3, 2, 7, getstep() == 4)', sheet);
		const counterB = createTerm('counter(10, -3, 0, getstep() == 5)', sheet);
		sheet.setCellAt('A1', new Cell(null, counterA));
		sheet.setCellAt('B1', new Cell(null, counterB));
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(10);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B1').value).toBe(7);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(7);
		expect(sheet.cellAt('B1').value).toBe(4);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(7);
		expect(sheet.cellAt('B1').value).toBe(1);
		machine.step();
		// resets counterA
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B1').value).toBe(1);
		machine.step();
		// resets counterB
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B1').value).toBe(10);
	});
	it(`should return ${ERROR.ARGS} if number of parameters is wrong`, () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }), {});
		const sheet = t1.sheet;
		sheet.setCellAt('A1', new Cell(null, createTerm('counter()', sheet)));
		sheet.setCellAt('B1', new Cell(null, createTerm('counter(2)', sheet)));
		sheet.setCellAt('C1', new Cell(null, createTerm('counter(2,,)', sheet)));
		sheet.setCellAt('D1', new Cell(null, createTerm('counter(2,)', sheet)));
		sheet.setCellAt('E1', new Cell(null, createTerm('counter(,,)', sheet)));
		expect(sheet.cellAt('A1').value).toBe(ERROR.ARGS);
		expect(sheet.cellAt('B1').value).toBe(ERROR.ARGS);
		expect(sheet.cellAt('C1').value).toBe(ERROR.ARGS);
		expect(sheet.cellAt('D1').value).toBe(ERROR.ARGS);
		expect(sheet.cellAt('E1').value).toBe(ERROR.ARGS);
	});
});

describe('getcycle', () => {
	it('should increase if streamsheet trigger is in endless mode', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }),
			{ A1: 'A1+1' });
		t1.inbox.put(new Message());
		expect(GETCYCLE(t1.sheet)).toBe(0);
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(1);
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(3);
	});
	it('should not increase if sheet is triggered normally', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }),
			{ A1: 'A1+1' });
		expect(GETCYCLE(t1.sheet)).toBe(0);
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(0);
		t1.inbox.put(new Message());
		t1.step(); // will not trigger anymore (DL-1334) !!!
		expect(GETCYCLE(t1.sheet)).toBe(0);
		// endless mode will increase getcycle
		t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(1);
		// normal mode will NOT increase getcycle
		t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE });
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(1);
	});
	it('should start at 1 on each initial sheet trigger', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }),
			{ A1: { formula: 'A1+1' }, B1: { formula: 'if(a1==3 | a1==5, return(), false)' } });
		expect(GETCYCLE(t1.sheet)).toBe(0);
		t1.inbox.put(new Message());
		t1.step();
		expect(t1.sheet.cellAt('A1').value).toBe(2);
		expect(GETCYCLE(t1.sheet)).toBe(1);
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(2);
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(0);
		expect(t1.sheet.cellAt('A1').value).toBe(3);
		t1.inbox.put(new Message());
		t1.step();
		expect(t1.sheet.cellAt('A1').value).toBe(4);
		expect(GETCYCLE(t1.sheet)).toBe(1);
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(2);
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(0);
		expect(t1.sheet.cellAt('A1').value).toBe(5);
		t1.inbox.put(new Message());
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(1);
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(3);
	});
	it('should reset on machine stop', () => {
		const machine = new Machine();
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL, repeat: 'endless' }),
			{ A1: 'A1+1' });
		machine.addStreamSheet(t1);
		t1.inbox.put(new Message());
		// pause machine so that we can stop it...
		machine.pause();
		t1.step();
		t1.step();
		t1.step();
		expect(GETCYCLE(t1.sheet)).toBe(3);
		machine.stop();
		expect(GETCYCLE(t1.sheet)).toBe(0);
	});
	it('should return error if no sheet or no streamsheet available', () => {
		const sheet = new StreamSheet().sheet;
		expect(GETCYCLE()).toBe(ERROR.ARGS);
		sheet.streamsheet = undefined;
		expect(GETCYCLE(sheet)).toBe(ERROR.NO_STREAMSHEET);
	});
});
describe('getexecutestep', () => {
	it('should return 0 if streamsheet is not triggered', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		const t1 = createStreamSheet('T1', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }));
		const t2 = createStreamSheet('T2', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
		machine.addStreamSheet(t1);
		machine.addStreamSheet(t2);
		t1.step();
		t1.step();
		t1.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(0);
	});
	it('should return increase by 1 after each step', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }),
			{ A1: { formula: 'execute("T2", 3)' } });
		const t2 = createStreamSheet('T2', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
		machine.addStreamSheet(t1);
		machine.addStreamSheet(t2);
		machine.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(1);
		machine.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(2);
		machine.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
	});
	it('should reset if repeat count is processed', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' }),
			{ A1: { formula: 'execute("T2", 3)' } });
		const t2 = createStreamSheet('T2', StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.EXECUTE }));
		machine.addStreamSheet(t1);
		machine.addStreamSheet(t2);
		machine.step();
		machine.step();
		machine.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(3);
		// now step again:
		machine.step();
		expect(GETEXECUTESTEP(t2.sheet)).toBe(1);
	});
	it('should return error if no sheet or no streamsheet available', () => {
		const sheet = new StreamSheet().sheet;
		expect(GETEXECUTESTEP()).toBe(ERROR.ARGS);
		sheet.streamsheet = undefined;
		expect(GETEXECUTESTEP(sheet)).toBe(ERROR.NO_STREAMSHEET);
	});
});
describe('getmachinestep', () => {
	it('should return current machine steps', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		expect(GETMACHINESTEP(streamsheet.sheet)).toBe(0);
		machine.step();
		expect(GETMACHINESTEP(streamsheet.sheet)).toBe(1);
		machine.step();
		machine.step();
		machine.step();
		expect(GETMACHINESTEP(streamsheet.sheet)).toBe(4);
	});
	it('should be reseted on machine stop', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		// pause machine so that we can stop it...
		machine.pause();
		machine.step();
		machine.step();
		machine.step();
		machine.step();
		expect(GETMACHINESTEP(streamsheet.sheet)).toBe(4);
		machine.stop();
		expect(GETMACHINESTEP(streamsheet.sheet)).toBe(0);
	});
	it('should return error if no sheet or no machine available', () => {
		const sheet = new StreamSheet().sheet;
		expect(GETMACHINESTEP()).toBe(ERROR.ARGS);
		expect(GETMACHINESTEP(sheet)).toBe(ERROR.NO_MACHINE);
		sheet.streamsheet = undefined;
		expect(GETMACHINESTEP(sheet)).toBe(ERROR.NO_MACHINE);
	});
});
describe('getstep', () => {
	it('should return 0 if streamsheet is not triggered', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ARRIVAL }),
			{ A1: 'A1+1' });
		t1.step();
		t1.step();
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(0);
	});
	it('should return 1 after one step', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE }),
			{ A1: 'A1+1' });
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(1);
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(1);
	});
	it('should increase by 1 after each step', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS }),
			{ A1: 'A1+1' });
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(1);
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(2);
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(3);
	});
	it('should be 0 after streamsheet reset', () => {
		const t1 = createStreamSheet('T1',
			StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS }),
			{ A1: 'A1+1' });
		t1.step();
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(2);
		t1.reset();
		expect(GETSTEP(t1.sheet)).toBe(0);
		t1.step();
		expect(GETSTEP(t1.sheet)).toBe(1);
	});
	it('should return error if no sheet or no streamsheet available', () => {
		const sheet = new StreamSheet().sheet;
		expect(GETSTEP()).toBe(ERROR.ARGS);
		sheet.streamsheet = undefined;
		expect(GETSTEP(sheet)).toBe(ERROR.NO_STREAMSHEET);
	});
});
