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
const { Message } = require('../..');
const MessageBox = require('../../src/machine/MessageBox');
const MSG = require('../_data/messages.json');

const counter = { put: 0, pop: 0 };
const putListener = () => {
	counter.put += 1;
};
const popListener = () => {
	counter.pop += 1;
};

beforeEach(() => {
	counter.pop = 0;
	counter.put = 0;
});

describe('MessageBox', () => {
	describe('creation', () => {
		it('should be possible to create an empty MessageBox', () => {
			const box = new MessageBox();
			expect(box).toBeDefined();
			expect(box.isEmpty()).toBeTruthy();
		});
	});
	describe('size', () => {
		it('should return 0 for an empty MessageBox', () => {
			const box = new MessageBox();
			expect(box.size).toBe(0);
		});
		it('should return numbers of messages currently contained', () => {
			const box = new MessageBox();
			box.put(new Message());
			box.put(new Message());
			expect(box.size).toBe(2);
			box.pop();
			expect(box.size).toBe(1);
			box.pop();
			expect(box.size).toBe(0);
			box.pop();
			expect(box.size).toBe(0);
		});
	});
	describe('on/off', () => {
		it('should notify observer on message put/pop', () => {
			const box = new MessageBox();
			box.on('message_put', putListener);
			box.on('message_pop', popListener);
			box.put(new Message());
			box.put(new Message());
			expect(counter.put).toBe(2);
			box.pop();
			expect(counter.pop).toBe(1);
			box.pop();
			expect(counter.pop).toBe(2);
		});
		it('should not notify pop observer if MessageBox is empty', () => {
			const box = new MessageBox();
			box.on('message_put', putListener);
			box.on('message_pop', popListener);
			box.pop();
			expect(counter.pop).toBe(0);
			box.put(new Message());
			box.put(new Message());
			expect(counter.put).toBe(2);
			box.pop();
			box.pop();
			expect(counter.pop).toBe(2);
			box.pop();
			expect(counter.pop).toBe(2);
		});
		it('should not notify unregistered observer on message put/pop', () => {
			const box = new MessageBox();
			box.on('message_put', putListener);
			box.on('message_pop', popListener);
			box.put(new Message());
			box.pop();
			expect(counter.put).toBe(1);
			expect(counter.pop).toBe(1);
			box.off('message_put', putListener);
			box.off('message_pop', popListener);
			box.put(new Message());
			box.pop();
			expect(counter.put).toBe(1);
			expect(counter.pop).toBe(1);
		});
	});

	describe('clear', () => {
		it('should remove all messages', () => {
			const box = new MessageBox();
			box.on('clear', popListener);
			box.put(new Message());
			box.put(new Message());
			box.put(new Message());
			expect(box.size).toBe(3);
			box.clear();
			expect(box.size).toBe(0);
			expect(counter.pop).toBe(1);
			box.put(new Message());
			expect(box.size).toBe(1);
			box.clear();
			expect(box.size).toBe(0);
			expect(counter.pop).toBe(2);
		});
		it('should have no effect if box is empty', () => {
			const box = new MessageBox();
			box.on('clear', popListener);
			expect(box.size).toBe(0);
			box.clear();
			expect(box.size).toBe(0);
			expect(counter.pop).toBe(0);
		});
	});
	describe('put', () => {
		it('should add a message', () => {
			const box = new MessageBox();
			expect(box.size).toBe(0);
			box.put(new Message());
			expect(box.size).toBe(1);
		});
	});
	describe('peek', () => {
		it('should get first message', () => {
			const box = new MessageBox();
			const pivot = new Message();
			box.put(pivot);
			box.put(new Message());
			box.put(new Message());
			const peekedMessage = box.peek();
			expect(peekedMessage).toBeDefined();
			expect(peekedMessage.id).toBe(pivot.id);
		});
		it('should be possible to peek a message by id', () => {
			const box = new MessageBox();
			const pivot = new Message();
			box.put(new Message());
			box.put(new Message());
			box.put(pivot);
			box.put(new Message());
			const peekedMessage = box.peek(pivot.id);
			expect(peekedMessage).toBeDefined();
			expect(peekedMessage.id).toBe(pivot.id);
		});
	});
	describe('pop', () => {
		it('should pop off first message', () => {
			const box = new MessageBox();
			const pivot = new Message();
			box.put(pivot);
			box.put(new Message());
			box.put(new Message());
			expect(box.size).toBe(3);
			const peekedMessage = box.pop();
			expect(box.size).toBe(2);
			expect(peekedMessage).toBeDefined();
			expect(peekedMessage.id).toBe(pivot.id);
		});
		it('should pop off a message by id', () => {
			const box = new MessageBox();
			const pivot = new Message();
			box.put(new Message());
			box.put(new Message());
			box.put(pivot);
			box.put(new Message());
			box.put(new Message());
			expect(box.size).toBe(5);
			const peekedMessage = box.pop(pivot.id);
			expect(box.size).toBe(4);
			expect(peekedMessage).toBeDefined();
			expect(peekedMessage.id).toBe(pivot.id);
		});
	});
	describe('find', () => {
		it('should return first message which matches given selector json', () => {
			const box = new MessageBox();
			const pivot = new Message(MSG.SIMPLE.data);
			box.put(pivot);
			box.put(new Message(MSG.SIMPLE2.data));
			const selector = {};
			selector.Kundenname = {};
			selector.Kundenname.Nachname = 'Mustermann';
			const result = box.find(selector);
			expect(result).toBeDefined();
			expect(result.id).toBe(pivot.id);
			expect(result.data.Kundenname.Vorname).toBe('Max');
		});
		it('should respect all keys in selector json', () => {
			const box = new MessageBox();
			const pivot = new Message(MSG.SIMPLE2.data);
			box.put(new Message(MSG.SIMPLE.data));
			box.put(pivot);
			const selector = {};
			selector.Kundenname = {};
			selector.Kundenname.Vorname = 'Anton';
			selector.Kundenname.Nachname = 'Mustermann';
			const result = box.find(selector);
			expect(result).toBeDefined();
			expect(result.id).toBe(pivot.id);
			expect(result.data.Kundenname.Vorname).toBe('Anton');
		});
		it('should return undefined if message could not be found', () => {
			const box = new MessageBox();
			expect(box.find()).toBeUndefined();
			expect(box.find('')).toBeUndefined();
			box.put(new Message(MSG.SIMPLE.data));
			const selector = {};
			selector.Kundenname = {};
			selector.Kundenname.Vorname = 'Fritz';
			selector.Kundenname.Nachname = 'Mustermann';
			expect(box.find(selector)).toBeUndefined();
		});
	});
});
