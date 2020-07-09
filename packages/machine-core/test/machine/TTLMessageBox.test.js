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
const { sleep } = require('@cedalo/commons');
const TTLMessageBox = require('../../src/machine/TTLMessageBox');
const { Message } = require('../..');

const TTL_5 = 5;
const addMessage = (box, ttl, id) => box.put(new Message({}, id), undefined, ttl);
const countTimeouts = (box) => Object.keys(box.timeouts).length;
const createTTLBox = () => {
	const box = new TTLMessageBox();
	// set outbox to active so that messages are removed
	box.isActive = true;
	return box;
};

describe('TTLMessageBox', () => {
	it('should automatically remove message with an expired ttl', async () => {
		const box = createTTLBox();
		addMessage(box, TTL_5);
		addMessage(box, TTL_5);
		expect(box.size).toBe(2);
		await sleep(10);
		expect(box.size).toBe(0);
		addMessage(box, TTL_5);
		expect(box.size).toBe(1);
		await sleep(10, () => addMessage(box, 5));
		expect(box.size).toBe(1);
	});
	it('should keep all messages without a ttl', async () => {
		const box = createTTLBox();
		addMessage(box);
		addMessage(box, TTL_5);
		addMessage(box);
		addMessage(box, TTL_5);
		expect(box.size).toBe(4);
		await sleep(10);
		expect(box.size).toBe(2);
		await sleep(10);
		expect(box.size).toBe(2);
	});
	it('should use provided ttl for each message ', async () => {
		const box = createTTLBox();
		addMessage(box, undefined, 'id1');
		addMessage(box, TTL_5, 'id2');
		expect(box.size).toBe(2);
		await sleep(10);
		expect(box.size).toBe(1);
		expect(box.peek().id).toBe('id1');
		addMessage(box, TTL_5, 'id3');
		addMessage(box, TTL_5 * 10, 'id4');
		expect(box.size).toBe(3);
		await sleep(10);
		expect(box.size).toBe(2);
		expect(box.peek('id1')).toBeDefined();
		expect(box.peek('id4')).toBeDefined();
	});
	it('should replace existing message and update its ttl', async () => {
		const box = createTTLBox();
		box.put(new Message({ value: 1 }, 'id1'));
		box.put(new Message({ value: 2 }, 'id2'));
		box.put(new Message({ value: 3 }, 'id3'));
		expect(box.size).toBe(3);
		box.replaceMessage(new Message({}, 'id2'), 5);
		await sleep(10);
		expect(box.size).toBe(2);
		expect(box.peek('id1')).toBeDefined();
		expect(box.peek('id3')).toBeDefined();
		box.replaceMessage(new Message({}, 'id1'));
		await sleep(10);
		expect(box.size).toBe(2);
		expect(box.peek('id1').data).toEqual({});
		expect(box.peek('id3')).toBeDefined();
		box.replaceMessage(new Message({}, 'id1'), 5);
		box.replaceMessage(new Message({}, 'id3'), 5);
		await sleep(10);
		expect(box.size).toBe(0);
	});

	it('should remove timeout callback if corresponding message was deleted', async () => {
		const box = createTTLBox();
		addMessage(box, undefined, 'id1');
		addMessage(box, TTL_5 * 100, 'id2');
		expect(box.size).toBe(2);
		expect(countTimeouts(box)).toBe(1);
		await sleep(10);
		expect(box.size).toBe(2);
		expect(countTimeouts(box)).toBe(1);
		box.pop('id2');
		expect(box.size).toBe(1);
		expect(countTimeouts(box)).toBe(0);
	});
});
