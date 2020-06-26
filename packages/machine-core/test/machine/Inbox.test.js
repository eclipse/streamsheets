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
const { Stream, Inbox, Machine, Message } = require('../..');

// beforeAll(() => {
// 	QueueService.clear();
// 	QueueService.defineQueue({ name: 'Q1' });
// 	QueueService.defineQueue({ name: 'Q2' });
// });
//
// beforeEach(() => {
// 	// simply dispose to remove all added inboxes => maybe to hard...
// 	QueueService.getQueue('Q1').dispose();
// 	QueueService.getQueue('Q2').dispose();
// });

// const createMessage = (id, data, metadata = {}) => {
// 	const msg = new Message(data, id);
// 	msg.metadata = Object.assign(msg.metadata, metadata);
// 	return msg;
// };

describe('Inbox', () => {
	it('should be possible to create an empty Inbox', () => {
		const inbox = new Inbox();
		expect(inbox).toBeDefined();
		expect(inbox.id).toBeDefined();
		expect(inbox.type).toBe('Inbox');
		expect(inbox.isEmpty()).toBeTruthy();
		expect(inbox.queue).toBeUndefined();
	});
	it('should be possible to create an Inbox with config object', () => {
		const inbox = new Inbox({ id: '123', type: 'CustomInbox', max: 500 });
		expect(inbox).toBeDefined();
		expect(inbox.max).toBe(500);
		expect(inbox.type).toBe('CustomInbox');
		expect(inbox.isEmpty()).toBeTruthy();
	});
	it('should not be possible to change inbox id or max messages setting', () => {
		const inbox = new Inbox({ id: '123', max: 47 });
		inbox.max = 100;
		inbox.id = '1234';
		expect(inbox.max).toBe(47);
		expect(inbox.id).not.toBe('1234');
	});
	it.skip('should be possible to register a stream', () => {
		const inbox = new Inbox();
		// const queue = new Queue({ name: 'Q1' });
		// inbox.stream = queue;
		expect(inbox.isEmpty()).toBeTruthy();
		// expect(inbox.stream).toBe(queue);
	});
	it.skip('should receive messages of subscribed stream', () => {
		const inbox = new Inbox();
		// const queue = new Queue({ name: 'Q1' });
		const message = new Message({ temperature: 23 });
		// inbox.stream = queue;
		inbox.subscribe(); // have to subscribe manually here, because it actually depends on machine state...
		expect(inbox.isEmpty()).toBeTruthy();
		// queue._messages.push(message);
		// queue.tick();
		expect(inbox.isEmpty()).toBeFalsy();
		expect(inbox.pop()).toBe(message);
		expect(inbox.isEmpty()).toBeTruthy();
	});
	// no multiple streams!!
	// it('should receive messages of mulitiple subscribed stream', () => {
	// 	const inbox = new Inbox();
	// 	const queue1 = new Queue({ name: 'Q1' });
	// 	const queue2 = new Queue({ name: 'Q2' });
	// 	inbox.addStream(queue1);
	// 	inbox.addStream(queue2);
	// 	queue1._messages.push(new Message({ src: '1' }));
	// 	queue2._messages.push(new Message({ src: '2' }));
	// 	expect(inbox.isEmpty()).toBeTruthy();
	// 	queue1.tick();
	// 	expect(inbox.isEmpty()).toBeFalsy();
	// 	expect(inbox.pop().data.src).toBe('1');
	// 	queue2.tick();
	// 	expect(inbox.pop().data.src).toBe('2');
	// 	expect(inbox.isEmpty()).toBeTruthy();
	// });
	it.skip('should be possible to unregister stream', () => {
		const inbox = new Inbox();
		// const queue = new Queue({ name: 'Q1' });
		// inbox.stream = queue;
		inbox.subscribe();  // have to subscribe manually here, because it actually depends on machine state...
		// expect(inbox.stream).toBe(queue);
		inbox.stream = undefined;
		expect(inbox.stream).toBeUndefined();
	});
	it.skip('should not receive messages of unregister stream', () => {
		const inbox = new Inbox();
		// const queue = new Queue({ name: 'Q1' });
		// inbox.stream = queue;
		inbox.subscribe();  // have to subscribe manually here, because it actually depends on machine state...
		inbox.stream = null;
		// queue._messages.push(new Message({ length: '20cm' }));
		// queue.tick();
		expect(inbox.isEmpty()).toBeTruthy();
	});

	describe('IO', () => {
		// const queue = new Queue({ name: 'Q1' });
		const inbox = new Inbox({ id: 'unique-id', type: 'MyCustomInbox', max: 1000 });
		// inbox.stream = queue;

		describe('toJSON()', () => {
			it('should create a JSON object', () => {
				const json = inbox.toJSON();
				expect(json).toBeDefined();
				expect(json.id).toBe('unique-id');
				// expect(json.max).toBe(1000);
				expect(json.type).toBe('MyCustomInbox');
				// expect(json.stream).toBeDefined();
				// expect(json.stream.id).toBe(queue.id);
				// expect(json.stream.type).toBe(queue.type);
			});
			// skip due to global queue handling (QueueService);
			it('should create an Inbox instance from given JSON', () => {
				const json = inbox.toJSON();
				const _inbox = new Inbox(json);
				_inbox.load(json);
				expect(_inbox).toBeDefined();
				expect(_inbox.id).toBe('unique-id');
				// expect(_inbox.max).toBe(1000);
				expect(_inbox.type).toBe('MyCustomInbox');
				// expect(_inbox.stream).toBe(queue);
			});

			it('should load an Inbox instance from given JSON', () => {
				const json = inbox.toJSON();
				const _inbox = new Inbox();
				_inbox.load(json);
				expect(_inbox).toBeDefined();
				expect(_inbox.id).toBe('unique-id');
				// expect(_inbox.max).toBe(1000);
				expect(_inbox.type).toBe('MyCustomInbox');
				// expect(_inbox.stream).toBe(queue);
			});

			// skip due to global data-source handling (Stream- & QueueService);
			it.skip('loaded() should throw an Error if required stream could not be created', () => {
				const machine = new Machine();
				// add a DataSouce, which will cause loaded to fail...
				inbox.stream = new Stream();
				const json = inbox.toJSON();
				const _inbox = Inbox.fromJSON(json);
				expect(json.stream).toBeDefined();
				expect(() => _inbox.loaded(json, machine)).toThrow();
			});
		});
	});
});
