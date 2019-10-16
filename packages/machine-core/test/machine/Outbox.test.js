const { Outbox } = require('../..');

describe('Outbox', () => {
	describe('creation', () => {
		it('should create an outbox with an id and no messages', () => {
			const outbox = new Outbox();
			expect(outbox).toBeDefined();
			expect(outbox.id).toBeDefined();
			expect(outbox.size).toBe(0);
			expect(outbox.messages).toBeDefined();
		});
	});
	describe('message handling', () => {
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
			expect(outbox.messages[0]).toBe(msg1);
			expect(outbox.messages[1]).toBe(msg2);
			expect(outbox.pop(msg1.id)).toBe(msg1);
			expect(outbox.messages.length).toBe(1);
			expect(outbox.messages[0]).toBe(msg2);
			expect(outbox.pop(msg2.id)).toBe(msg2);
			expect(outbox.messages.length).toBe(0);
		});
	});
	describe('event emit', () => {
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
});
