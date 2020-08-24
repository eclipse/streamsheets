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
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, Message, SheetParser, StreamSheet } = require('@cedalo/machine-core');
const { NullTerm, Term } = require('@cedalo/parser');
const MSG = require('../_data/messages.json');
const SHEETS = require('../_data/sheets.json');
const { WRITE } = require('../../src/functions');
const {
	createCellAt,
	createCellTerm,
	createCellRangeTerm,
	createFuncTerm,
	createParamTerms,
	createTerm
} = require('../utilities');

const ERROR = FunctionErrors.code;

const setup = () => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	streamsheet.sheet.load({ cells: SHEETS.SIMPLE });
	return { machine, streamsheet };
};

describe('write', () => {
	it('should copy values from sheet to outbox', () => {
		const { machine, streamsheet } = setup();
		const outbox = machine.outbox;
		const sheet = streamsheet.sheet;
		sheet.processor._isProcessing = true;
		const outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Kunde'));
		expect(WRITE(sheet, outboxdata, createCellTerm('B1', sheet), Term.fromString('String'))).toBe('Kunde');
		const message = outbox.peek('out1');
		expect(message).toBeDefined();
		expect(message.data.Kunde).toBe('B1');
	});
	it('should copy specified value to outbox', () => {
		const { machine, streamsheet } = setup();
		const outbox = machine.outbox;
		const sheet = streamsheet.sheet;
		sheet.processor._isProcessing = true;
		const outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'KundenNr'));

		expect(WRITE(sheet, outboxdata, Term.fromNumber(42), Term.fromString('Number'))).toBe('KundenNr');
		expect(outbox.peek('out1').data.KundenNr).toBe(42);
	});
	it('should be possible to create message with loop data', () => {
		const { machine, streamsheet } = setup();
		const outbox = machine.outbox;
		const sheet = streamsheet.sheet;
		sheet.processor._isProcessing = true;
		// create some loop data
		let outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Loop'));
		expect(WRITE(sheet, outboxdata, new NullTerm(), Term.fromString('Array'))).toBe('Loop');
		outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Loop', 0));
		expect(WRITE(sheet, outboxdata, new NullTerm(), Term.fromString('Dictionary'))).toBe('0');
		outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Loop', 0, 'Pos'));
		expect(WRITE(sheet, outboxdata, Term.fromNumber(23), Term.fromString('Number'))).toBe('Pos');
		const message = outbox.peek('out1');
		expect(message.data.Loop).toBeDefined();
		expect(message.data.Loop.length).toBe(1);
		expect(message.data.Loop[0].Pos).toBe(23);
	});
	// DL-1724
	it('should return last part of provided path', () => {
		const { streamsheet } = setup();
		const sheet = streamsheet.sheet;
		// create some loop data
		expect(createTerm('write(outboxdata("out1", "Loop"),"one","String")', sheet).value).toBe('Loop');
		expect(createTerm('WRITE(OUTBOXDATA("out1","Key1"),,"Dictionary")', sheet).value).toBe('Key1');
		expect(createTerm('WRITE(OUTBOXDATA("out1","Key1", "Key2"),A1,"String")', sheet).value).toBe('Key2');
	});
	// DL-4231
	it('should be possible to use number as key', async () => {
		const machine = new Machine();
		const outbox = machine.outbox;
 		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: 1594065440,
			A2: 'St.Peter',
			A3: { formula: 'write(outboxdata("Index","Messages",A1 & "_" & A2),"Hello","String")' },
		});
		await machine.step();
		let msg = outbox.peek('Index');
		expect(sheet.cellAt('A3').value).toBe('1594065440_St.Peter');
		// expect an object !!
		expect(msg.data.Messages).toEqual({ '1594065440_St.Peter': 'Hello' });
		createCellAt('A3', { formula: 'write(outboxdata("Index2","Messages","2"),"Hello2","String")' }, sheet);
		await machine.step();
		msg = outbox.peek('Index2');
		expect(sheet.cellAt('A3').value).toBe('2');
		// expect an array !!
		expect(msg.data.Messages).toEqual([undefined, undefined, 'Hello2']);
	});
	// DL-4229
	it('should support TTL parameter', async () => {
		const machine = new Machine();
		const outbox = machine.outbox;
 		const sheet = new StreamSheet().sheet;
		// set outbox to active so that messages are removed
		outbox.isActive = true;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'write(outboxdata("Index","value"),42,,0.005)' },
			A2: { formula: 'write(outboxdata("Index2","value"),23)' },
			A3: { formula: 'read(outboxdata("Index","value"),B3,,,TRUE)' },
			A4: { formula: 'read(outboxdata("Index2","value"),B4)' }
		});
		await machine.step();
		expect(outbox.size).toBe(2);
		expect(sheet.cellAt('B3').value).toBe(42);
		expect(sheet.cellAt('B4').value).toBe(23);
		createCellAt('A1', { formula: 'write(outboxdata("Index3","value"),18)' }, sheet);
		await machine.step();
		expect(outbox.size).toBe(3);
		await sleep(100);
		await machine.step();
		expect(outbox.size).toBe(2);
		expect(sheet.cellAt('B3').value).toBe(ERROR.NA);
		expect(sheet.cellAt('B4').value).toBe(23);
	});
	describe('creation of simple message', () => {
		it('should add an empty message to outbox', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1'));
			expect(WRITE(sheet, outkey, new NullTerm(), Term.fromString('Dictionary'))).toBe('out1');
			const message = outbox.pop('out1');
			expect(message.data).toEqual({});
		});
		it('should add a message with an an empty array to outbox', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Orders'));
			expect(WRITE(sheet, outkey, new NullTerm(), Term.fromString('Array'))).toBe('Orders');
			const message = outbox.pop('out1');
			expect(message.data.Orders).toEqual([]);
		});
		it('should add a message with an an empty object to outbox', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Orders'));
			expect(WRITE(sheet, outkey, Term.fromString(''), Term.fromString('Dictionary'))).toBe('Orders');
			const message = outbox.pop('out1');
			expect(message.data.Orders).toEqual({});
		});
		it('should add a message with a single string value to outbox', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Kunde'));
			expect(WRITE(sheet, outkey, Term.fromString('Max'), Term.fromString('String'))).toBe('Kunde');
			const message = outbox.pop('out1');
			expect(message.data.Kunde).toEqual('Max');
		});
		it('should add a message with a single number value to outbox', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Index'));
			expect(WRITE(sheet, outkey, Term.fromNumber(42), Term.fromString('Number'))).toBe('Index');
			const message = outbox.pop('out1');
			expect(message.data.Index).toEqual(42);
		});
	});
	describe('with dictionary parameter', () => {
		it('should add an object to message', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			const outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos'));
			const dictionary = createFuncTerm(sheet, 'dictionary', [createCellRangeTerm('A1:C2', sheet)]);
			expect(WRITE(sheet, outboxdata, dictionary, Term.fromString('Array'))).toBe('Pos');
			const message = outbox.pop('out1');
			expect(message.data.Pos).toBeDefined();
			expect(message.data.Pos[0].A1).toBe('B1');
			expect(message.data.Pos[0].A2).toBe('B2');
			expect(message.data.Pos[1].A1).toBe('C1');
			expect(message.data.Pos[1].A2).toBe('C2');
		});
	});
	describe('with array parameter', () => {
		it('should add an array to message', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			const outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos'));
			const dictionary = createFuncTerm(sheet, 'array', [createCellRangeTerm('A1:A3', sheet)]);
			expect(WRITE(sheet, outboxdata, dictionary, Term.fromString('Array'))).toBe('Pos');
			const message = outbox.pop('out1');
			expect(message.data.Pos).toBeDefined();
			expect(message.data.Pos[0]).toBe('A1');
			expect(message.data.Pos[1]).toBe('A2');
			expect(message.data.Pos[2]).toBe('A3');
		});
		it('should add a nested array to message', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			const outboxdata = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos'));
			const dictionary = createFuncTerm(sheet, 'array', [createCellRangeTerm('A1:C3', sheet)]);
			expect(WRITE(sheet, outboxdata, dictionary, Term.fromString('Array'))).toBe('Pos');
			const message = outbox.pop('out1');
			expect(message.data.Pos).toBeDefined();
			expect(message.data.Pos[0]).toEqual(['A1', 'B1', 'C1']);
			expect(message.data.Pos[1]).toEqual(['A2', 'B2', 'C2']);
			expect(message.data.Pos[2]).toEqual(['A3', 'B3', 'C3']);
		});
		it('should replace array within an already existing message', async () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.setCells({ 'A5': { formula: 'write(outboxdata("msg", "newItem"),array(A1:C3),"Array")' } });
			await machine.step();
			expect(outbox.size).toBe(1);
			let message = outbox.peek('msg');
			expect(outbox.size).toBe(1);
			expect(message.data.newItem).toEqual([['A1', 'B1', 'C1'],['A2', 'B2', 'C2'],['A3', 'B3', 'C3']]);
			sheet.setCells({ 'A5': { formula: 'write(outboxdata("msg", "newItem"),array(A1:C3,,"flat"),"Array")' } });
			await machine.step();
			message = outbox.peek('msg');
			expect(outbox.size).toBe(1);
			expect(message.data.newItem).toEqual(['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3']);
		});
	});
	describe('working with other functions as parameter', () => {
		it('should work with subtree', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos'));
			const inboxdata = createFuncTerm(sheet, 'inboxdata', createParamTerms('', '', 'Positionen'));
			// data is provided by subtree...
			const data = createFuncTerm(sheet, 'subtree', [inboxdata]);
			expect(WRITE(sheet, outkey, data, Term.fromString('Array'))).toBe('Pos');
			const message = outbox.pop('out1');
			expect(message.data.Pos).toBeDefined();
			expect(message.data.Pos[0]).toEqual({ PosNr: 1, Artikelnr: 1234, Preis: 80.00 });
			expect(message.data.Pos[1]).toEqual({ PosNr: 2, Artikelnr: 12345, Preis: 59.99 });
			expect(message.data.Pos[2]).toEqual({ PosNr: 3, Artikelnr: 4535, Preis: 45.32 });
		});
		it('should work with inboxjson', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			streamsheet.name = 'T1';
			streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
			streamsheet.inbox.put(new Message(Object.assign({}, MSG.SIMPLE.data)));
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Messages'));
			// data is provided by inboxjson...
			const data = createFuncTerm(sheet, 'inboxjson', [Term.fromString('T1')]);
			expect(WRITE(sheet, outkey, data, Term.fromString('Array'))).toBe('Messages');
			const message = outbox.pop('out1');
			expect(message.data.Messages).toBeDefined();
			expect(message.data.Messages.length).toBe(2);
			expect(message.data.Messages[0]).toEqual(MSG.SIMPLE.data);
			expect(message.data.Messages[1]).toEqual(MSG.SIMPLE.data);
		});
	});
	describe('implicit parent creation', () => {
		it('should create an array parent implicitly', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos', '0', 'Kunde'));
			expect(WRITE(sheet, outkey, Term.fromString('Max'), Term.fromString('String'))).toBe('Kunde');
			// check
			const message = outbox.pop('out1');
			expect(message.data.Pos[0].Kunde).toBe('Max');
		});
		// dl-1455
		it('should not convert parent type if already set', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			expect(createTerm('write(outboxdata("out1","Pos"),,"dictionary")', sheet).value).toBe('Pos');
			expect(createTerm('write(outboxdata("out1","Pos", "Key1"),"hello","String")', sheet).value).toBe('Key1');
			// now accidentally add another entry under Key1
			expect(createTerm('write(outboxdata("out1","Pos", "Key1", "Key2"),"hy","String")', sheet).value).toBe(ERROR.INVALID_PATH);
			const message = outbox.pop('out1');
			expect(message.data.Pos).toBeDefined();
			expect(message.data.Pos.Key1).toBe('hello');
			expect(message.data.Pos.Key1).toBe('hello');
		});
	});
	describe('use default according to type if no value is given', () => {
		it('should create an array as default', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Orders'));
			expect(WRITE(sheet, outkey, null, Term.fromString('array'))).toBe('Orders');
			const message = outbox.pop('out1');
			expect(message.data.Orders).toEqual([]);
		});
		it('should create a dictionary as default', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Customer'));
			expect(WRITE(sheet, outkey, null, Term.fromString('dictionary'))).toBe('Customer');
			const message = outbox.pop('out1');
			expect(message.data.Customer).toEqual({});
		});
		it('should create a string as default', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Path'));
			expect(WRITE(sheet, outkey, null, Term.fromString('String'))).toBe('Path');
			const message = outbox.pop('out1');
			expect(message.data.Path).toEqual('');
		});
		it('should create a number as default', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			const outkey = createFuncTerm(sheet, 'outboxdata', createParamTerms('out1', 'Pos'));
			expect(WRITE(sheet, outkey, null, Term.fromString('number'))).toBe('Pos');
			const message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(0);
		});
	});
	// DL-1455
	describe('type parameter', () => {
		it('should convert number, boolean & string values as string if specified by type parameter', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			expect(createTerm('write(outboxdata("out1","Pos"),"hello","string")', sheet).value).toBe('Pos');
			let message = outbox.pop('out1');
			expect(message.data.Pos).toEqual('hello');
			expect(createTerm('write(outboxdata("out1","Pos"),true,"string")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual('true');
			expect(createTerm('write(outboxdata("out1","Pos"),12345,"string")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual('12345');
			expect(createTerm('write(outboxdata("out1","Pos"),"","string")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual('');
			expect(createTerm('write(outboxdata("out1","Pos"),,"string")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual('');
		});
		it('should write any value as number if specified by type parameter', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			expect(createTerm('write(outboxdata("out1","Pos"),"1234","number")', sheet).value).toBe('Pos');
			let message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(1234);
			expect(createTerm('write(outboxdata("out1","Pos"),true,"number")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(1);
			expect(createTerm('write(outboxdata("out1","Pos"),false,"number")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(0);
			expect(createTerm('write(outboxdata("out1","Pos"),12345,"number")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(12345);
			expect(createTerm('write(outboxdata("out1","Pos"),"","number")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(0);
			expect(createTerm('write(outboxdata("out1","Pos"),,"number")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(0);
		});
		it('should write any value as boolean if specified by type parameter', () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			expect(createTerm('write(outboxdata("out1","Pos"),true,"boolean")', sheet).value).toBe('Pos');
			let message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(true);
			expect(createTerm('write(outboxdata("out1","Pos"),false,"boolean")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(false);
			expect(createTerm('write(outboxdata("out1","Pos"),12345,"boolean")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(true);
			expect(createTerm('write(outboxdata("out1","Pos"),"","boolean")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(false);
			expect(createTerm('write(outboxdata("out1","Pos"),,"boolean")', sheet).value).toBe('Pos');
			message = outbox.pop('out1');
			expect(message.data.Pos).toEqual(false);
		});
		// DL-1455
		it('should return an error if value cannot convert to specified type', () => {
			const { streamsheet } = setup();
			const sheet = streamsheet.sheet;
			sheet.processor._isProcessing = true;
			// build a message:
			expect(createTerm('write(outboxdata("out1","Pos"),json(A1:B2),"array")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:C2),"dictionary")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:B2),"array")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),array(A1:B2, ,"flat"),"dictionary")', sheet).value).toBe(ERROR.TYPE_PARAM);

			expect(createTerm('write(outboxdata("out1","Pos"),json(A1:B2),"string")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:C2),"string")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:B2),"string")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),array(A1:B2, ,"flat"),"string")', sheet).value).toBe(ERROR.TYPE_PARAM);

			expect(createTerm('write(outboxdata("out1","Pos"),json(A1:B2),"number")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:C2),"number")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:B2),"number")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),array(A1:B2, ,"flat"),"number")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),"hello","number")', sheet).value).toBe(ERROR.TYPE_PARAM);

			expect(createTerm('write(outboxdata("out1","Pos"),json(A1:B2),"boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:C2),"boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),dictionary(A1:B2),"boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),array(A1:B2, ,"flat"),"boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
			expect(createTerm('write(outboxdata("out1","Pos"),"hello","boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
			// expect(createTerm('write(outboxdata("out1","Pos"),12345,"boolean")', sheet).value).toBe(ERROR.TYPE_PARAM);
		});
		it('should return an error if specified type is unknown', () => {
			const { streamsheet } = setup();
			const sheet = streamsheet.sheet;
			expect(createTerm('write(outboxdata("out1"),"one","hello")', sheet).value).toBe(ERROR.INVALID_PARAM);
			expect(createTerm('write(outboxdata("out1"),"one","StringIt")', sheet).value).toBe(ERROR.INVALID_PARAM);
			expect(createTerm('write(outboxdata("out1"),"one","arry")', sheet).value).toBe(ERROR.INVALID_PARAM);
			expect(createTerm('write(outboxdata("out1"),"one","Date")', sheet).value).toBe(ERROR.INVALID_PARAM);
		});
	});

	describe('write metadata', () => {
		it('should be possible to write metadata of an outbox message', async () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			createCellAt('A1', { formula: 'write(OUTBOXMETADATA("out1","Service"), "hello", "String")' }, sheet);
			expect(sheet.cellAt('A1').value).toBe('Service');
			await machine.step();
			const message = outbox.peek('out1');
			expect(message).toBeDefined();
			expect(message.metadata.Service).toBe('hello');
		});
		it('should be possible to write a json to metadata', async () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			const jsobj = { givenname: 'Max', familyname: 'Mustermann' };
			SheetParser.context.functions.JS_OBJ = () => jsobj;			
			createCellAt('A3', { formula: 'write(OUTBOXMETADATA("out1","tags"), JS_OBJ(), "Dictionary")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe('tags');
			await machine.step();
			let message = outbox.peek('out1');
			expect(message.metadata.tags).toEqual({givenname: 'Max', familyname: 'Mustermann'});
			// change original:
			jsobj.givenname = 'John';
			jsobj.familyname = 'Doe';
			message = outbox.peek('out1');
			expect(message.metadata.tags).toEqual({givenname: 'Max', familyname: 'Mustermann'});
			SheetParser.context.functions.JS_OBJ = undefined;
		});
		it('should be possible to write a json to metadata', async () => {
			const { machine, streamsheet } = setup();
			const outbox = machine.outbox;
			const sheet = streamsheet.sheet;
			const jsarr = ['Max', 'Mustermann'];
			SheetParser.context.functions.JS_ARR = () => jsarr;			
			createCellAt('A3', { formula: 'write(OUTBOXMETADATA("out1","tags"), JS_ARR(), "ARRAY")' }, sheet);
			expect(sheet.cellAt('A3').value).toBe('tags');
			await machine.step();
			let message = outbox.peek('out1');
			expect(message.metadata.tags).toEqual(['Max', 'Mustermann']);
			// change original:
			jsarr[0] = 'John';
			jsarr[1] = 'Doe';
			message = outbox.peek('out1');
			expect(message.metadata.tags).toEqual(['Max', 'Mustermann']);
			SheetParser.context.functions.JS_ARR = undefined;

		});
	});
});
