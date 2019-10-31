const MESSAGES = require('../_data/messages.json');
const { createTerm } = require('../utils');
const { FunctionErrors: Error } = require('@cedalo/error-codes');
const { Cell, Machine, Message, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

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
	it('should return length of loop element', () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
	});
	it('should return 0 if loop element has no length', () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// steps process first message, second one has loop with no elements...
		machine.step();
		machine.step();
		machine.step();
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(0);
	});
	it(`should return ${Error.code.NA} if no loop is defined`, () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
	});
	it(`should return ${Error.code.NA} if no loop is active`, () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
	});
});
describe('loopindex', () => {
	it('should return current loop index', () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(1);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
	});
	it(`should return ${Error.code.NA} if no loop is defined`, () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
	});
	it(`should return ${Error.code.NA} if no loop is active`, () => {
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
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		// frst step will attach and set index to first element...
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
		machine.step();
		expect(sheet.cellAt('A1').value).toBe(Error.code.NA);
	});
});
