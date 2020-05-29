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
const MSG = require('../_data/messages.json');
const { SUBTREE } = require('../../src/functions/streamsheet').functions;
const { createCellAt, createFuncTerm, createParamTerms } = require('../utilities');
const { Machine, Message, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const createMessage = (msgjson) => {
	const message = new Message(Object.assign({}, msgjson.data));
	message.metadata = Object.assign(message.metadata, msgjson.metadata);
	return message;
};

describe('subtree', () => {
	it('should extract json data from specified json element', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		streamsheet.setLoopPath('[data][Positionen]');
		streamsheet.inbox.put(createMessage(MSG.SIMPLE));
		// eslint-disable-next-line
		const inboxdata = createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Kundenname', 'Vorname'));
		expect(SUBTREE(sheet, inboxdata)).toBe('Max');
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Kundenname'))))
			.toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen'))))
			.toEqual(MSG.SIMPLE.data.Positionen);
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen', 0))))
			.toEqual({ PosNr: 1, Artikelnr: 1234, Preis: 80.00 });
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen', 1))))
			.toEqual({ PosNr: 2, Artikelnr: 12345, Preis: 59.99 });
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen', 2))))
			.toEqual({ PosNr: 3, Artikelnr: 4535, Preis: 45.32 });
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen', 3))))
			.toBe(ERROR.NO_MSG_DATA);
		expect(SUBTREE(sheet, createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen', 1, 'PosNr'))))
			.toBe(2);
	});
	it('should extract data from specified message in inbox', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		const msg1 = createMessage(MSG.SIMPLE);
		const msg2 = createMessage(MSG.SIMPLE2);
		streamsheet.inbox.put(msg1);
		streamsheet.inbox.put(msg2);
		createCellAt('A1', { formula: `subtree(inboxdata(,"${msg2.id}","Kundenname","Vorname"))` }, sheet);
		expect(sheet.cellAt('A1').value).toBe('Anton');
		createCellAt('B1', { formula: `subtree(inboxdata(,"${msg2.id}","Kundenname"))` }, sheet);
		expect(sheet.cellAt('B1').value).toEqual({ Anrede: 'Herr', Vorname: 'Anton', Nachname: 'Mustermann' });
		createCellAt('C1', { formula: `subtree(inboxdata(,"${msg2.id}","Kundennummer"))` }, sheet);
		expect(sheet.cellAt('C1').value).toBe(987654321);
		createCellAt('D1', { formula: `subtree(inboxdata(,"${msg2.id}","Positionen"))` }, sheet);
		expect(sheet.cellAt('D1').value).toEqual([]);

		createCellAt('A2', { formula: `subtree(inboxdata(,"${msg1.id}","Kundenname","Vorname"))` }, sheet);
		expect(sheet.cellAt('A2').value).toBe('Max');
		createCellAt('B2', { formula: `subtree(inboxdata(,"${msg1.id}","Kundenname"))` }, sheet);
		expect(sheet.cellAt('B2').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
		createCellAt('C2', { formula: `subtree(inboxdata(,"${msg1.id}","Positionen"))` }, sheet);
		expect(sheet.cellAt('C2').value).toEqual(msg1.data.Positionen);
	});
	it('should extract metadata from specified message in inbox', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		const msg1 = createMessage(MSG.SIMPLE);
		const msg2 = createMessage(MSG.SIMPLE2);
		streamsheet.inbox.put(msg1);
		streamsheet.inbox.put(msg2);
		createCellAt('A1', { formula: `subtree(inboxmetadata(,"${msg2.id}","name"))` }, sheet);
		expect(sheet.cellAt('A1').value).toBe('SIMPLE2');
		createCellAt('B1', { formula: `subtree(inboxmetadata(,"${msg2.id}","sender"))` }, sheet);
		expect(sheet.cellAt('B1').value).toBe('Cedalo');
		createCellAt('C1', { formula: `subtree(inboxmetadata(,"${msg2.id}","Teile"))` }, sheet);
		expect(sheet.cellAt('C1').value).toEqual(msg2.metadata.Teile);

		createCellAt('A2', { formula: `subtree(inboxmetadata(,"${msg1.id}","name"))` }, sheet);
		expect(sheet.cellAt('A2').value).toBe('SIMPLE');
		createCellAt('B2', { formula: `subtree(inboxmetadata(,"${msg1.id}","sender"))` }, sheet);
		expect(sheet.cellAt('B2').value).toBe('Cedalo');
	});
	it('should extract from current message in inbox if no message id was specified', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		streamsheet.inbox.put(createMessage(MSG.SIMPLE));
		createCellAt('A1', { formula: 'subtree(inboxdata(,,"Kundenname","Vorname"))' }, sheet);
		expect(sheet.cellAt('A1').value).toBe('Max');
		createCellAt('B1', { formula: 'subtree(inboxdata(,,"Kundenname"))' }, sheet);
		expect(sheet.cellAt('B1').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
		createCellAt('C1', { formula: 'subtree(inboxdata(,,"Positionen"))' }, sheet);
		expect(sheet.cellAt('C1').value).toEqual(MSG.SIMPLE.data.Positionen);
		createCellAt('D1', { formula: 'subtree(inboxmetadata(,,"name"))' }, sheet);
		expect(sheet.cellAt('D1').value).toBe('SIMPLE');
		createCellAt('E1', { formula: 'subtree(inboxmetadata(,,"sender"))' }, sheet);
		expect(sheet.cellAt('E1').value).toBe('Cedalo');
	});
	it('should extract data from a message in outbox', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		const message = createMessage(MSG.SIMPLE);
		machine.addStreamSheet(streamsheet);
		machine.outbox.put(message);
		createCellAt('A1', { formula: `subtree(outboxdata("${message.id}","Kundenname","Vorname"))` }, sheet);
		expect(sheet.cellAt('A1').value).toBe('Max');
		createCellAt('B1', { formula: `subtree(outboxdata("${message.id}","Kundenname"))` }, sheet);
		expect(sheet.cellAt('B1').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
		createCellAt('C1', { formula: `subtree(outboxdata("${message.id}","Positionen"))` }, sheet);
		expect(sheet.cellAt('C1').value).toEqual(MSG.SIMPLE.data.Positionen);
	});
	it('should be possible to extract loop element from an inbox message', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		streamsheet.setLoopPath('[data][Positionen]');
		streamsheet.inbox.put(createMessage(MSG.SIMPLE));
		createCellAt('A1', { formula: 'subtree(inboxdata(,,"Positionen"))' }, sheet);
		expect(sheet.cellAt('A1').value).toEqual(MSG.SIMPLE.data.Positionen);
		createCellAt('B1', { formula: 'subtree(inboxdata(,,"Positionen", "0"))' }, sheet);
		expect(sheet.cellAt('B1').value).toEqual({ PosNr: 1, Artikelnr: 1234, Preis: 80.00 });
		createCellAt('C1', { formula: 'subtree(inboxdata(,,"Positionen", "1"))' }, sheet);
		expect(sheet.cellAt('C1').value).toEqual({ PosNr: 2, Artikelnr: 12345, Preis: 59.99 });
		createCellAt('D1', { formula: 'subtree(inboxdata(,,"Positionen", "2"))' }, sheet);
		expect(sheet.cellAt('D1').value).toEqual({ PosNr: 3, Artikelnr: 4535, Preis: 45.32 });
	});
	it('should return a complete specified message from inbox', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		const message = createMessage(MSG.SIMPLE);
		streamsheet.inbox.put(createMessage(message));
		createCellAt('A1', { formula: 'subtree(inbox(,))' }, sheet);
		let cellval = sheet.cellAt('A1').value;
		expect(cellval).toBeDefined();
		expect(cellval.data).toEqual(MSG.SIMPLE.data);
		expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
		expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
		createCellAt('B1', { formula: `subtree(inbox(,"${message.id}"))` }, sheet);
		cellval = sheet.cellAt('B1').value;
		expect(cellval).toBeDefined();
		expect(cellval.data).toEqual(MSG.SIMPLE.data);
		expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
		expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
	});
	it('should return complete outbox message', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		const msg1 = createMessage(MSG.SIMPLE);
		const msg2 = createMessage(MSG.SIMPLE2);
		machine.addStreamSheet(streamsheet);
		machine.outbox.put(msg1);
		machine.outbox.put(msg2);
		createCellAt('A1', { formula: `subtree(outbox("${msg1.id}"))` }, sheet);
		createCellAt('B1', { formula: `subtree(outbox("${msg2.id}"))` }, sheet);
		let cellval = sheet.cellAt('A1').value;
		expect(cellval).toBeDefined();
		expect(cellval.data).toEqual(MSG.SIMPLE.data);
		expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
		expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
		cellval = sheet.cellAt('B1').value;
		expect(cellval).toBeDefined();
		expect(cellval.data).toEqual(MSG.SIMPLE2.data);
		expect(cellval.metadata.name).toBe(MSG.SIMPLE2.metadata.name);
		expect(cellval.metadata.sender).toBe(MSG.SIMPLE2.metadata.sender);
	});
	it('should return #NO_MSG if extracting from an unknown message', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		createCellAt('A1', { formula: 'subtree(inbox(,))' }, sheet);
		createCellAt('B1', { formula: 'subtree(inbox(,"123"))' }, sheet);
		createCellAt('C1', { formula: 'subtree(inboxdata(,,"Kundenname"))' }, sheet);
		createCellAt('D1', { formula: 'subtree(inboxdata(,"1234","Kundenname"))' }, sheet);
		expect(sheet.cellAt('A1').value).toBe(ERROR.NO_MSG);
		expect(sheet.cellAt('B1').value).toBe(ERROR.NO_MSG);
		expect(sheet.cellAt('C1').value).toBe(ERROR.NO_MSG);
		expect(sheet.cellAt('D1').value).toBe(ERROR.NO_MSG);
	});
	it('should return #NO_MSG_DATA if extracting from an unknown message data or metadata', () => {
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet;
		streamsheet.inbox.put(createMessage(MSG.SIMPLE));
		createCellAt('A1', { formula: 'subtree(inboxdata(,,"Kundenvorname"))' }, sheet);
		expect(sheet.cellAt('A1').value).toBe(ERROR.NO_MSG_DATA);
	});
	// DL-1115
	describe('optional 2nd parameter to return parent JSON key', () => {
		it('should return JSON object with key if 2nd parameter is TRUE and read from outbox', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			// const msg2 = createMessage(MSG.SIMPLE2);
			machine.addStreamSheet(streamsheet);
			machine.outbox.put(msg1);
			// machine.outbox.put(msg2);
			createCellAt('A1', { formula: `subtree(outboxdata("${msg1.id}","Kundenname","Vorname"), TRUE)` }, sheet);
			let cellvalue = sheet.cellAt('A1').value;
			expect(cellvalue.Vorname).toBe('Max');
			createCellAt('B1', { formula: `subtree(outboxdata("${msg1.id}","Kundenname"), TRUE)` }, sheet);
			cellvalue = sheet.cellAt('B1').value;
			expect(cellvalue.Kundenname).toBeDefined();
			expect(cellvalue.Kundenname).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
			createCellAt('C1', { formula: `subtree(outboxdata("${msg1.id}","Positionen"), TRUE)` }, sheet);
			cellvalue = sheet.cellAt('C1').value;
			expect(cellvalue.Positionen).toBeDefined();
			expect(cellvalue.Positionen).toEqual(MSG.SIMPLE.data.Positionen);
			createCellAt('D1', { formula: `subtree(outboxdata("${msg1.id}"), TRUE)` }, sheet);
			cellvalue = sheet.cellAt('D1').value;
			expect(cellvalue.Data).toBeDefined();
			expect(cellvalue.Data).toEqual(MSG.SIMPLE.data);
		});
		it('should return JSON object with key if 2nd parameter is TRUE and read from inbox', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			// const msg2 = createMessage(MSG.SIMPLE2);
			machine.addStreamSheet(streamsheet);
			streamsheet.inbox.put(msg1);
			// machine.outbox.put(msg2);
			createCellAt('A1', { formula: 'subtree(inboxdata(,,"Kundenname","Vorname"), TRUE)' }, sheet);
			let cellvalue = sheet.cellAt('A1').value;
			expect(cellvalue.Vorname).toBe('Max');
			createCellAt('B1', { formula: 'subtree(inboxdata(,,"Kundenname"), TRUE)' }, sheet);
			cellvalue = sheet.cellAt('B1').value;
			expect(cellvalue.Kundenname).toBeDefined();
			expect(cellvalue.Kundenname).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
			createCellAt('C1', { formula: 'subtree(inboxdata(,,"Positionen"), TRUE)' }, sheet);
			cellvalue = sheet.cellAt('C1').value;
			expect(cellvalue.Positionen).toBeDefined();
			expect(cellvalue.Positionen).toEqual(MSG.SIMPLE.data.Positionen);
			createCellAt('D1', { formula: 'subtree(inboxdata(,), TRUE)' }, sheet);
			cellvalue = sheet.cellAt('D1').value;
			expect(cellvalue.Data).toBeDefined();
			expect(cellvalue.Data).toEqual(MSG.SIMPLE.data);
			// metadata
			createCellAt('E1', { formula: 'subtree(inboxmetadata(,,"name"), TRUE)' }, sheet);
			cellvalue = sheet.cellAt('E1').value;
			expect(cellvalue.name).toBe('SIMPLE');
			createCellAt('F1', { formula: 'subtree(inboxmetadata(,), TRUE)' }, sheet);
			cellvalue = sheet.cellAt('F1').value;
			expect(cellvalue.Metadata).toBeDefined();
			expect(cellvalue.Metadata.name).toBe('SIMPLE');
			expect(cellvalue.Metadata.sender).toBe('Cedalo');
		});
		it('should return JSON object without key if complete message is requested & 2nd parameter is TRUE', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			const msg2 = createMessage(MSG.SIMPLE2);
			machine.addStreamSheet(streamsheet);
			machine.outbox.put(msg1);
			streamsheet.inbox.put(msg2);
			createCellAt('A1', { formula: `subtree(outbox("${msg1.id}"), TRUE)` }, sheet);
			createCellAt('B1', { formula: 'subtree(inbox(,), TRUE)' }, sheet);
			let cellval = sheet.cellAt('A1').value;
			expect(cellval).toBeDefined();
			expect(cellval).toBeDefined();
			expect(cellval.data).toBeDefined();
			expect(cellval.data).toEqual(MSG.SIMPLE.data);
			expect(cellval.metadata).toBeDefined();
			expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
			expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
			cellval = sheet.cellAt('B1').value;
			expect(cellval).toBeDefined();
			expect(cellval).toBeDefined();
			expect(cellval.data).toBeDefined();
			expect(cellval.data).toEqual(MSG.SIMPLE2.data);
			expect(cellval.metadata).toBeDefined();
			expect(cellval.metadata.name).toBe(MSG.SIMPLE2.metadata.name);
			expect(cellval.metadata.sender).toBe(MSG.SIMPLE2.metadata.sender);
		});
		// currently we simply return message in this case, but we are prepared already ;-)
		// it('should return JSON object with message ID as key if 2nd parameter is TRUE and complete message', () => {
		// 	const machine = new Machine();
		// 	const streamsheet = new StreamSheet();
		// 	const sheet = streamsheet.sheet;
		// 	const msg1 = createMessage(MSG.SIMPLE);
		// 	const msg2 = createMessage(MSG.SIMPLE2);
		// 	machine.addStreamSheet(streamsheet);
		// 	machine.outbox.put(msg1);
		// 	streamsheet.inbox.put(msg2);
		// 	createCellAt('A1', { formula: `subtree(outbox("${msg1.id}"), TRUE)` }, sheet);
		// 	createCellAt('B1', { formula: 'subtree(inbox(,), TRUE)' }, sheet);
		// 	let cellval = sheet.cellAt('A1').value;
		// 	expect(cellval).toBeDefined();
		// 	expect(cellval[msg1.id]).toBeDefined();
		// 	expect(cellval[msg1.id].data).toBeDefined();
		// 	expect(cellval[msg1.id].data).toEqual(MSG.SIMPLE.data);
		// 	expect(cellval[msg1.id].metadata).toBeDefined();
		// 	expect(cellval[msg1.id].metadata.name).toBe(MSG.SIMPLE.metadata.name);
		// 	expect(cellval[msg1.id].metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
		// 	cellval = sheet.cellAt('B1').value;
		// 	expect(cellval).toBeDefined();
		// 	expect(cellval[msg2.id]).toBeDefined();
		// 	expect(cellval[msg2.id].data).toBeDefined();
		// 	expect(cellval[msg2.id].data).toEqual(MSG.SIMPLE2.data);
		// 	expect(cellval[msg2.id].metadata).toBeDefined();
		// 	expect(cellval[msg2.id].metadata.name).toBe(MSG.SIMPLE2.metadata.name);
		// 	expect(cellval[msg2.id].metadata.sender).toBe(MSG.SIMPLE2.metadata.sender);
		// });
	});
});
