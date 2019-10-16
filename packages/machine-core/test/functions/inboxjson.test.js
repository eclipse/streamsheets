const { Machine, Message, StreamSheet } = require('../..');
const { INBOXJSON } = require('../../src/functions');
const { Term } = require('@cedalo/parser');
const MSG = require('./data/messages.json');


describe('inboxjson', () => {
	it('should create an array of all messages in inbox', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		streamsheet.name = 'T1';
		streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		const messages = INBOXJSON(streamsheet.sheet, Term.fromString('T1'));
		expect(messages).toBeDefined();
		expect(messages.length).toBe(1);
		expect(messages[0]).toEqual(MSG.SIMPLE.data);
	});

	it('should create an empty array if inbox is empty', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		streamsheet.name = 'T1';
		const messages = INBOXJSON(streamsheet.sheet, Term.fromString('T1'));
		expect(messages).toBeDefined();
		expect(messages.length).toBe(0);
	});

	it('should include metadata if specified', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		const message = new Message({ ...MSG.SIMPLE.data });
		machine.addStreamSheet(streamsheet);
		streamsheet.name = 'T1';
		streamsheet.inbox.put(message);
		const messages = INBOXJSON(streamsheet.sheet, Term.fromString('T1'), Term.fromBoolean(true));
		expect(messages).toBeDefined();
		expect(messages.length).toBe(1)
		expect(messages[0]).toEqual({ ...MSG.SIMPLE.data, id: message.id, arrivalTime: message.metadata.arrivalTime });
	});
});
