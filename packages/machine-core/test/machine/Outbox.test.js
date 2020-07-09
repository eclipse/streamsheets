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
const { Message, Outbox } = require('../..');

describe('Outbox', () => {
	describe.skip('creation', () => {
		it('should create an outbox with an id and no messages', () => {
			const outbox = new Outbox();
			expect(outbox).toBeDefined();
			expect(outbox.id).toBeDefined();
			expect(outbox.size).toBe(0);
			expect(outbox.messages).toBeDefined();
		});
	});
	describe.skip('message handling', () => {
		it('should be possible to add messages', () => {
			const outbox = new Outbox();
			outbox.peek('msg1', true);
			expect(outbox.size).toBe(1);
			outbox.peek('msg3', true);
			expect(outbox.size).toBe(2);
			outbox.peek('msg1', true);
			expect(outbox.size).toBe(2);
		});
		it('should be possible to remove messages', () => {
			const outbox = new Outbox();
			expect(outbox.size).toBe(0);
			expect(outbox.pop('msg1')).toBeUndefined();
			expect(outbox.size).toBe(0);
			const msg1 = outbox.peek('msg1', true);
			const msg2 = outbox.peek('msg2', true);
			expect(outbox.size).toBe(2);
			expect(outbox.pop('msg2')).toBe(msg2);
			expect(outbox.size).toBe(1);
			expect(outbox.messages[0]).toBe(msg1);
			expect(outbox.pop('msg1')).toBe(msg1);
			expect(outbox.size).toBe(0);
			expect(outbox.pop('msg2')).toBeUndefined();
			expect(outbox.size).toBe(0);
		});
		it('should be possible to get all messages', () => {
			const outbox = new Outbox();
			expect(outbox.messages).toBeDefined();
			expect(outbox.messages.length).toBe(0);
			const msg1 = outbox.peek('msg1', true);
			const msg2 = outbox.peek('msg2', true);
			expect(outbox.messages.length).toBe(2);
			// note: reversed order:
			expect(outbox.messages[0]).toBe(msg2);
			expect(outbox.messages[1]).toBe(msg1);
			expect(outbox.pop(msg1.id)).toBe(msg1);
			expect(outbox.messages.length).toBe(1);
			expect(outbox.messages[0]).toBe(msg2);
			expect(outbox.pop(msg2.id)).toBe(msg2);
			expect(outbox.messages.length).toBe(0);
		});
		it('should add new messages in reversed order, i.e. new message on top', () => {
			const outbox = new Outbox();
			const msg1 = new Message('hello', 'ID1');
			const msg2 = new Message('world', 'ID2');
			const msg3 = new Message('!!!', 'ID3');
			const msg4 = new Message(42, 'ID4');
			outbox.put(msg1);
			outbox.put(msg2);
			outbox.put(msg3);
			outbox.put(msg4);
			expect(outbox.size).toBe(4);
			expect(outbox.messages[0]).toBe(msg4);
			expect(outbox.messages[1]).toBe(msg3);
			expect(outbox.messages[2]).toBe(msg2);
			expect(outbox.messages[3]).toBe(msg1);
			outbox.pop();
			expect(outbox.messages[0]).toBe(msg3);
			expect(outbox.messages[1]).toBe(msg2);
			expect(outbox.messages[2]).toBe(msg1);
			outbox.pop('ID2');
			expect(outbox.messages[0]).toBe(msg3);
			expect(outbox.messages[1]).toBe(msg1);
			outbox.pop('ID3');
			expect(outbox.messages[0]).toBe(msg1);
		});
		it('should be possible to combine message data', () => {
			const outbox = new Outbox();
			const msg = new Message({ value: 42 }, 'ID1');
			outbox.put(msg);
			expect(outbox.size).toBe(1);
			outbox.setMessageData('ID1', { key: 'key', value: 23 });
			// should not add new message
			expect(outbox.size).toBe(1);
			const newmsg = outbox.pop();
			expect(newmsg.id).toBe('ID1');
			expect(newmsg.data.value).toBe(23);
			expect(newmsg.data.key).toBe('key');
		});
		it('should replace data if old data is an array', () => {
			const outbox = new Outbox();
			const msg = new Message([23, 42], 'ID1');
			outbox.put(msg);
			expect(outbox.size).toBe(1);
			expect(Array.isArray(outbox.peek().data)).toBe(true);
			outbox.setMessageData('ID1', { key: 'key' });
			// should not add new message
			expect(outbox.size).toBe(1);
			const newmsg = outbox.pop();
			expect(newmsg.id).toBe('ID1');
			expect(newmsg.data.key).toBe('key');
			expect(Array.isArray(newmsg.data)).toBe(false);
		});
		it('should replace data if new data is an array', () => {
			const outbox = new Outbox();
			const msg = new Message({ value: 'hi' }, 'ID1');
			outbox.put(msg);
			expect(outbox.size).toBe(1);
			expect(Array.isArray(outbox.peek().data)).toBe(false);
			outbox.setMessageData('ID1', [23, 42]);
			// should not add new message
			expect(outbox.size).toBe(1);
			const newmsg = outbox.pop();
			expect(Array.isArray(newmsg.data)).toBe(true);
			expect(newmsg.id).toBe('ID1');
			expect(newmsg.data[0]).toBe(23);
			expect(newmsg.data[1]).toBe(42);
			expect(newmsg.data.value).toBeUndefined();
		});
		it('should be possible to replace message', () => {
			const outbox = new Outbox();
			const msg1 = new Message({ value: 'hello' }, 'ID1');
			const msg2 = new Message('world', 'ID1');
			const msg3 = new Message([23, 42], 'ID1');
			outbox.put(msg1);
			expect(outbox.size).toBe(1);
			outbox.replaceMessage(msg2);
			expect(outbox.size).toBe(1);
			let newmsg = outbox.peek();
			expect(newmsg.id).toBe('ID1');
			expect(newmsg.data.value).toBe('world');
			outbox.replaceMessage(msg3);
			expect(outbox.size).toBe(1);
			newmsg = outbox.peek();
			expect(newmsg.id).toBe('ID1');
			expect(newmsg.data[0]).toBe(23);
			expect(newmsg.data[1]).toBe(42);
			expect(newmsg.data.value).toBeUndefined();
		});
	});
	describe.skip('event emit', () => {
		it('should send event on message add', () => {
			let counter = 0;
			const outbox = new Outbox();
			outbox.on('message_put', () => { counter += 1; });
			outbox.peek('msg1', true);
			expect(counter).toBe(1);
			outbox.peek('msg2', true);
			outbox.peek('msg3', true);
			expect(counter).toBe(3);
			outbox.peek('msg2', true);
			outbox.peek('msg3', true);
			expect(counter).toBe(3);
		});
		it('should send event on message change', () => {
			let counter = 0;
			const outbox = new Outbox();
			outbox.on('message_changed', () => { counter += 1; });
			outbox.peek('msg1', true);
			outbox.setMessageData('msg1', { Kunde: {} });
			expect(counter).toBe(1);
			outbox.setMessageData('msg1', { Kunde: { Name: 'Max' } });
			outbox.setMessageData('msg1', { Kunde: { Name: 'Max', Nachname: 'Mustermann' } });
			expect(counter).toBe(3);
		});
		it('should send event on message delete', () => {
			let counter = 0;
			const outbox = new Outbox();
			outbox.on('message_put', () => { counter += 1; });
			outbox.on('message_pop', () => { counter -= 1; });
			outbox.peek('msg1', true);
			outbox.peek('msg2', true);
			outbox.peek('msg3', true);
			expect(counter).toBe(3);
			outbox.pop('msg2');
			expect(counter).toBe(2);
			outbox.pop('msg1');
			outbox.pop('msg3');
			expect(counter).toBe(0);
			outbox.pop('msg1');
			outbox.pop('msg3');
			expect(counter).toBe(0);
		});
	});
	describe('TTL', () => {

	});
});
