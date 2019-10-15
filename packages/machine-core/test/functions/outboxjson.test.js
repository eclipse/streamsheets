const { Machine, Message, StreamSheet } = require('../..');
const { OUTBOXJSON } = require('../../src/functions');
const MSG = require('./data/messages.json');


describe('outboxjson', () => {
	it('should create an array of all messages in outbox', () => {
		const machine = new Machine();
		machine.addStreamSheet(new StreamSheet());
		machine.outbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
		const messages = OUTBOXJSON(machine.streamsheets[0].sheet);
		expect(messages).toBeDefined();
		expect(messages.length).toBe(1);
		expect(messages[0]).toEqual(MSG.SIMPLE.data);
	});

	it('should create an empty array if outbox is empty', () => {
		const machine = new Machine();
		machine.addStreamSheet(new StreamSheet());
		const messages = OUTBOXJSON(machine.streamsheets[0].sheet);
		expect(messages).toBeDefined();
		expect(messages.length).toBe(0);
	});

	// how to include metadata? within data or extra?
	it.skip('should include metadata if specified', () => {
	});
});
