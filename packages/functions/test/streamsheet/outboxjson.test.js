const MSG = require('../_data/messages.json');
const { OUTBOXJSON } = require('../../src/functions/streamsheet');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');


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
});
