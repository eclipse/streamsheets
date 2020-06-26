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
const MESSAGES = require('../_data/messages.json');
const { createTerm } = require('../utilities');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, Machine, Message, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const setup = (config) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet({ name: config.name });
	if (config.trigger) streamsheet.trigger = config.trigger;
	machine.addStreamSheet(streamsheet);
	const msg1 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.data))), 'msg-simple');
	Object.assign(msg1.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.metadata)));
	const msg2 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.data))), 'msg-simple2');
	Object.assign(msg2.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.metadata)));
	streamsheet.inbox.put(msg1);
	streamsheet.inbox.put(msg2);
	return streamsheet;
};

describe('loopcount', () => {
	it.skip('should return length of loop element', async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '[data][Positionen]',
				enabled: true
			}
		});
		const loopcount = createTerm('loopcount()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopcount));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
	});
	it('should return 0 if loop element has no length', async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '[data][Positionen]',
				enabled: true
			}
		});
		const loopcount = createTerm('loopcount()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopcount));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// steps process first message, second one has loop with no elements...
		await machine.step();
		await machine.step();
		await machine.step();
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
	});
	it(`should return ${ERROR.NA} if no loop is defined`, async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '',
				enabled: true
			}
		});
		const loopcount = createTerm('loopcount()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopcount));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
	});
	it(`should return ${ERROR.NA} if no loop is active`, async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '[data][Positionen]',
				enabled: false
			}
		});
		const loopcount = createTerm('loopcount()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopcount));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
	});
});
describe('loopindex', () => {
	it('should return current loop index', async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.MACHINE_START })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '[data][Positionen]',
				enabled: true
			}
		});
		const loopindex = createTerm('loopindex()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopindex));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
	});
	it(`should return ${ERROR.NA} if no loop is defined`, async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '',
				enabled: true
			}
		});
		const loopindex = createTerm('loopindex()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopindex));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
	});
	it(`should return ${ERROR.NA} if no loop is active`, async () => {
		const t1 = setup({
			name: 'T1',
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE })
		});
		const sheet = t1.sheet;
		const machine = t1.machine;
		sheet.streamsheet.updateSettings({
			loop: {
				path: '[data][Positionen]',
				enabled: false
			}
		});
		const loopindex = createTerm('loopindex()', sheet);
		sheet.setCellAt('A1', new Cell(null, loopindex));
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		// frst step will attach and set index to first element...
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(ERROR.NA);
	});
});
