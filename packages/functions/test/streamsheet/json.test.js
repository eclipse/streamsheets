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
const { clone } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Cell, Machine, Message, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { createTerm, createCellAt } = require('../utilities');
const MSG = require('../_data/messages.json');

const ERROR = FunctionErrors.code;

const createMessage = (msgjson) => {
	const message = new Message(clone(msgjson.data));
	message.metadata = Object.assign(message.metadata, msgjson.metadata);
	return message;
};
const setup = (transconfig) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet(transconfig);
	machine.addStreamSheet(streamsheet);
	return streamsheet;
};

describe('json', () => {
	it('should create a JSON from a given cell range', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const sheet = t1.sheet.load({ cells: { A1: 'a', B1: 'hello', A2: 'b', B2: 'world' } });
		const json = createTerm('json(A1:B2)', sheet);
		sheet.setCellAt('C1', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('C1').value;
		expect(result).toBeDefined();
		expect(result.a).toBe('hello');
		expect(result.b).toBe('world');
		expect(result.c).toBeUndefined();
	});
	it('should create an empty JSON if given cell range has no cell', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.MACHINE_START } });
		const sheet = t1.sheet; // .load({ cells: { A1: 'a', B1: 'hello', A2: 'b', B2: 'world' } });
		const json = createTerm('json(A1:B2)', sheet);
		sheet.setCellAt('C1', new Cell(null, json));
		t1.step();
		expect(sheet.cellAt('C1').value).toEqual({});
	});
	it('should use first cells with key and last non empty cells as value', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		// eslint-disable-next-line max-len
		const sheet = t1.sheet.load({ cells: { A1: 'a', B1: 'none', C1: 'hello', C2: 'b', E2: 'world', B3: 21, C3: '!' } });
		const json = createTerm('json(A1:G5)', sheet);
		sheet.setCellAt('A6', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A6').value;
		expect(result).toBeDefined();
		expect(result.a).toBe('hello');
		expect(result.b).toBe('world');
		expect(result[21]).toBe('!');
	});
	it('should create values of types string, boolean and number', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'a', B1: 'hello',
			A2: 'b', B2: 42,
			A3: 'c', B3: { type: 'number', value: '23' },
			A4: 'd', B4: false,
			A5: 'e', B5: { type: 'bool', value: 'TRUE' }
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:B5)', sheet);
		sheet.setCellAt('A6', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A6').value;
		expect(result).toBeDefined();
		expect(result.a).toBe('hello');
		expect(result.b).toBe(42);
		expect(result.c).toBe(23);
		expect(result.d).toBe(false);
		expect(result.e).toBe(true);
	});
	it('should create values of type array', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'a',
			A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
			A3: { type: 'number', value: 1, level: 1}, B3: 'world',
			A4: { type: 'number', value: 2, level: 1}, B4: false,
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:B4)', sheet);
		sheet.setCellAt('A6', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A6').value;
		expect(result).toBeDefined();
		expect(result.a).toBeDefined();
		expect(result.a.length).toBe(3);
		expect(result.a[0]).toBe('hello');
		expect(result.a[1]).toBe('world');
		expect(result.a[2]).toBe(false);
	});
	it('should create values of type array with nested objects', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'a',
			A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
			A3: { type: 'number', value: 1, level: 1},
			A4: { type: 'string', value: 'title', level: 2}, B4: 'Dr.',
			A5: { type: 'string', value: 'name', level: 2}, B5: 'Strange',
			A6: { type: 'number', value: 2, level: 1},
			A7: { type: 'string', value: 'person', level: 2},
			A8: { type: 'string', value: 'name', level: 3}, B8: 'foo',
			A9: { type: 'string', value: 'age', level: 3}, B9: 42,
			A10: { type: 'string', value: 'phones', level: 3},
			A11: { type: 'number', value: 0, level: 4}, B11: '800-123-4567',
			A12: { type: 'number', value: 1, level: 4},
			A13: { type: 'string', value: 'prefix', level: 5}, B13: '+49',
			A14: { type: 'string', value: 'number', level: 5}, B14: '1234-5678-9'
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:H15)', sheet);
		sheet.setCellAt('A16', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A16').value;
		expect(result).toBeDefined();
		expect(result.a).toBeDefined();
		expect(result.a.length).toBe(3);
		expect(result.a[0]).toBe('hello');
		expect(result.a[1]).toBeDefined();
		expect(result.a[1].title).toBe('Dr.');
		expect(result.a[1].name).toBe('Strange');
		expect(result.a[2]).toBeDefined();
		expect(result.a[2].person).toBeDefined();
		expect(result.a[2].person.age).toBe(42);
		expect(result.a[2].person.name).toBe('foo');
		expect(result.a[2].person.phones).toBeDefined();
		expect(result.a[2].person.phones.length).toBe(2);
		expect(result.a[2].person.phones[0]).toBe('800-123-4567');
		expect(result.a[2].person.phones[1]).toBeDefined();
		expect(result.a[2].person.phones[1].prefix).toBe('+49');
		expect(result.a[2].person.phones[1].number).toBe('1234-5678-9');
	});
	it('should create values of type dictionary', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'person',
			A2: { type: 'string', value: 'name', level: 1}, C2: 'hans',
			A3: { type: 'string', value: 'family-name', level: 1}, C3: 'wurst',
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:E7)', sheet);
		sheet.setCellAt('A8', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A8').value;
		expect(result).toBeDefined();
		expect(result.person).toBeDefined();
		expect(result.person.name).toBe('hans');
		expect(result.person['family-name']).toBe('wurst');
	});
	// DL-2767
	it('should support keys without values', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 1,
			A2: { type: 'string', value: 'test1', level: 1}, B2: 'hello',
			A3: 2,
			A4: { type: 'string', value: 'test2', level: 1}, B4: 'world',
		} });
		/* eslint-enable */
		let json = createTerm('json(A1:B4)', sheet);
		sheet.setCellAt('A8', new Cell(null, json));
		t1.step();
		let result = sheet.cellAt('A8').value;
		expect(result).toBeDefined();
		expect(result[1]).toBeDefined();
		expect(result[1].test1).toBe('hello');
		expect(result[2]).toBeDefined();
		expect(result[2].test2).toBe('world');
		json = createTerm('json(A1:B3)', sheet);
		sheet.setCellAt('A8', new Cell(null, json));
		t1.step();
		result = sheet.cellAt('A8').value;
		expect(result).toBeDefined();
		expect(result[1]).toBeDefined();
		expect(result[1].test1).toBe('hello');
		// key exists but has no value
		expect(result[2]).toBe(null);
	});
	it('should be possible to create nested dictionaries', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'person',
			A2: { type: 'string', value: 'id', level: 1}, C2: '1234',
			A3: { type: 'string', value: 'phones', level: 1},
			A4: { type: 'string', value: 'home', level: 2}, D4: '800-123-4567',
			A7: { type: 'string', value: 'age', level: 1}, C7: 45,
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:E7)', sheet);
		sheet.setCellAt('A8', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A8').value;
		expect(result).toBeDefined();
		expect(result.person).toBeDefined();
		expect(result.person.id).toBe('1234');
		expect(result.person.age).toBe(45);
		expect(result.person.phones).toBeDefined();
		expect(result.person.phones.home).toBe('800-123-4567');
	});
	it('should be possible to mix arrays and dictionaries', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'person',
			A2: { type: 'string', value: 'id', level: 1}, C2: '1234',
			A3: { type: 'string', value: 'phones', level: 1},
			A4: { type: 'string', value: 'home', level: 2}, D4: '800-123-4567',
			A5: { type: 'string', value: 'work-de', level: 2}, 
			A6: { type: 'string', value: 'prefix', level: 3}, E6: '+49',
			A7: { type: 'string', value: 'number', level: 3}, E7: '1234-5678-9',
			A8: { type: 'string', value: 'emails', level: 1},
			A9: { type: 'number', value: 0, level: 2}, D9: 'jd@example.org',
			A10: { type: 'string', value: 'age', level: 1}, C10: 45
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:E10)', sheet);
		sheet.setCellAt('A11', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A11').value;
		expect(result).toBeDefined();
		expect(result.person).toBeDefined();
		expect(result.person.id).toBe('1234');
		expect(result.person.age).toBe(45);
		expect(result.person.phones).toBeDefined();
		expect(result.person.phones.home).toBe('800-123-4567');
		expect(result.person.phones['work-de']).toBeDefined();
		expect(result.person.phones['work-de'].prefix).toBe('+49');
		expect(result.person.phones['work-de'].number).toBe('1234-5678-9');
		expect(result.person.emails).toBeDefined();
		expect(result.person.emails[0]).toBe('jd@example.org');
		expect(result.person.emails[1]).toBeUndefined();
	});
	it('should create a json with multiple dictionaries', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'A',
			A2: { type: 'string', value: 'B', level: 1}, B2: 'gone',
			A3: { type: 'string', value: 'C', level: 2}, B3: 'hi',
			A4: { type: 'string', value: 'D', level: 2}, B4: '',
			A5: { type: 'string', value: 'E', level: 3}, B5: 'you',
			A6: { type: 'string', value: 'F', level: 1},
			A7: { type: 'string', value: 'G', level: 2}, B7: 23,
			A8: { type: 'string', value: 'H', level: 1}, B8: 42,
		} });
		/* eslint-enable */
		const json = createTerm('json(A1:B8)', sheet);
		sheet.setCellAt('A9', new Cell(null, json));
		t1.step();
		const result = sheet.cellAt('A9').value;
		expect(result).toBeDefined();
		expect(result.A).toBeDefined();
		expect(result.A.B).toBeDefined();
		expect(result.A.B.C).toBe('hi');
		expect(result.A.B.D).toBeDefined();
		expect(result.A.B.D.E).toBe('you');
		expect(result.A.F).toBeDefined();
		expect(result.A.F.G).toBe(23);
		expect(result.A.H).toBe(42);
	});
	it('can be used as parameter to write()', () => {
		const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
		const outbox = t1.machine.outbox;
		/* eslint-disable */
		const sheet = t1.sheet.load({ cells: {
			A1: 'person',
			A2: { type: 'string', value: 'id', level: 1}, C2: '1234',
			A3: { type: 'string', value: 'phones', level: 1},
			A4: { type: 'string', value: 'home', level: 2}, D4: '800-123-4567',
			A5: { type: 'string', value: 'emails', level: 1},
			A6: { type: 'number', value: 0, level: 2}, D6: 'jd@example.org',
			A7: { type: 'string', value: 'age', level: 1}, C7: 45
		} });
		/* eslint-enable */
		const write = createTerm('write(outbox("Message"),json(A1:E7),"Dictionary")', sheet);
		sheet.setCellAt('A8', new Cell(null, write));
		t1.step();
		expect(sheet.cellAt('A8').value).toBe('Message');
		const message = outbox.peek();
		expect(message).toBeDefined();
		expect(message.data.person).toBeDefined();
		expect(message.data.person.id).toBe('1234');
		expect(message.data.person.age).toBe(45);
		expect(message.data.person.phones).toBeDefined();
		expect(message.data.person.phones.home).toBe('800-123-4567');
		expect(message.data.person.emails).toBeDefined();
		expect(message.data.person.emails.length).toBe(1);
		expect(message.data.person.emails[0]).toBe('jd@example.org');
	});
	it('should simply return a passed json value', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', '{ "Kunde": { "Name": "Paul", "Alter": 42 } }', sheet);
		createCellAt('A2', { formula: 'json(A1)' }, sheet);
		expect(createTerm('json(A2)', sheet).value).toEqual({ Kunde: { Name: 'Paul', Alter: 42 } });
		expect(createTerm('json(A2,true)', sheet).value).toBe('{"Kunde":{"Name":"Paul","Alter":42}}');
	});
	// DL-3977: string handling
	it('should create a JSON from a given string', () => {
		const sheet = new StreamSheet().sheet;
		let str = '{\\"name\\": \\"mustermann\\"}';
		const json = createTerm(`json("${str}")`, sheet).value;
		expect(json).toBeDefined();
		expect(json).toEqual({ name: 'mustermann' });
		str = '{\\"Kunde\\":{\\"Name\\":\\"Peter\\", \\"Alter\\": 55, \\"Adresse\\": { \\"Ort\\": \\"Freiburg\\", \\"Strasse\\": \\"Hauptstrasse\\", \\"Hausnummer\\": 7}}}';
		expect(createTerm(`json("${str}")`, sheet).value).toEqual({
			Kunde: {
				Name: 'Peter',
				Alter: 55,
				Adresse: { Ort: 'Freiburg', Strasse: 'Hauptstrasse', Hausnummer: 7 }
			}
		});
		createCellAt('A1', '{ "greet": "hello" }', sheet);
		createCellAt('A2', { formula: 'json(A1)' }, sheet);
		expect(sheet.cellAt('A2').value).toEqual({ greet: 'hello' });
	});
	it('should create a JSON from a given string with null values', () => {
		const sheet = new StreamSheet().sheet;
		const str = '{\\"name\\": null}';
		const json = createTerm(`json("${str}")`, sheet).value;
		expect(json).toBeDefined();
		expect(json).toEqual({ name: null });
		createCellAt('A1', '{ "Kunde": { "Name": null, "Alter": 42 } }', sheet);
		createCellAt('A2', { formula: 'json(A1)' }, sheet);
		expect(sheet.cellAt('A2').value).toEqual({ Kunde: { Name: null, Alter: 42} });
	});
	it('should create an empty JSON if given string is empty', () => {
		const sheet = new StreamSheet().sheet;
		const json = createTerm('json("")', sheet).value;
		expect(json).toBeDefined();
		expect(json).toEqual({});
		createCellAt('A1', '', sheet);
		createCellAt('A2', { formula: 'json(A1)' }, sheet);
		expect(sheet.cellAt('A2').value).toEqual({});
	});
	it('should return created json as string if optional parameter is set to true', () => {
		const sheet = new StreamSheet().sheet;
		const json = createTerm('json("{}", true)', sheet).value;
		expect(json).toBeDefined();
		expect(json).toBe("{}");
		const str = '{\\"Kunde\\":{\\"Name\\":\\"Peter\\", \\"Alter\\": 55, \\"Adresse\\": { \\"Ort\\": \\"Freiburg\\", \\"Strasse\\": \\"Hauptstrasse\\", \\"Hausnummer\\": 7}}}';
		const result = '{"Kunde":{"Name":"Peter","Alter":55,"Adresse":{"Ort":"Freiburg","Strasse":"Hauptstrasse","Hausnummer":7}}}';
		expect(createTerm(`json("${str}", true)`, sheet).value).toBe(result);
		createCellAt('A1', '{ "Kunde": { "Name": null, "Alter": 42 } }', sheet);
		createCellAt('A2', { formula: 'json(A1, true)' }, sheet);
		expect(sheet.cellAt('A2').value).toBe('{"Kunde":{"Name":null,"Alter":42}}');
		// with range:
		sheet.load({ cells: { A1: 'a', B1: 'hello', A2: 'b', B2: 'world' } });
		createCellAt('A4', { formula: 'json(A1:B2, true)' }, sheet);
		expect(sheet.cellAt('A4').value).toBe('{"a":"hello","b":"world"}');
	});
	it(`should return ${ERROR.VALUE} error if no json could be created`, () => {
		const sheet = new StreamSheet().sheet;
		expect(createTerm('json(,)', sheet).value).toBe(ERROR.VALUE);
		expect(createTerm('json(I33)', sheet).value).toBe(ERROR.VALUE);
	});
	// DL-1305
	describe('converting to JSON array', () => {
		// DL-1336: change keys can be numbers...
		it('should convert to array only if all keys define number values', () => {
			const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
			/* eslint-disable */
			const sheet = t1.sheet.load({ cells: {
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1}, B3: 'world',
				// A4: { type: 'boolean', value: false, level: 1}, B3: 'world',
			} });
			/* eslint-enable */
			let json = createTerm('json(A1:B3)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			let result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			expect(result.a.length).toBe(2);
			expect(result.a[0]).toBe('hello');
			expect(result.a[1]).toBe('world');
			expect(result.a[2]).toBeUndefined();
			/* eslint-disable */
			sheet.load({ cells: {
				// following should result in a dictionary...
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1}, B3: 'world',
				A4: { type: 'string', value: '2', level: 1}, B4: '!',
			} });
			/* eslint-enable */
			json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			expect(result.a.length).toBe(3);
			expect(result.a[0]).toBe('hello');
			expect(result.a[1]).toBe('world');
			expect(result.a[2]).toBe('!');
		});
		it('should convert to array only if all keys are consecutively and starting with 0', () => {
			const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
			/* eslint-disable */
			const sheet = t1.sheet.load({ cells: {
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1}, B3: 'world',
				A4: { type: 'number', value: 2, level: 1}, B4: '!',
			} });
			/* eslint-enable */
			let json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			let result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			expect(result.a.length).toBe(3);
			expect(result.a[0]).toBe('hello');
			expect(result.a[1]).toBe('world');
			expect(result.a[2]).toBe('!');
			/* eslint-disable */
			sheet.load({ cells: {
				// following should result in a dictionary...
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 1, level: 1}, B3: 'world',
				A4: { type: 'number', value: 3, level: 1}, B4: '!',
			} });
			/* eslint-enable */
			json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			// no array!
			expect(result.a.length).toBeUndefined();
			expect(result.a['0']).toBe('hello');
			expect(result.a['1']).toBe('world');
			expect(result.a['3']).toBe('!');
			/* eslint-disable */
			sheet.load({ cells: {
				// following should result in a dictionary...
				A1: 'a',
				A2: { type: 'number', value: -1, level: 1}, B2: 'hello',
				A3: { type: 'number', value: 0, level: 1}, B3: 'world',
				A4: { type: 'number', value: 1, level: 1}, B4: '!',
			} });
			/* eslint-enable */
			json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			// no array!
			expect(result.a.length).toBeUndefined();
			expect(result.a['-1']).toBe('hello');
			expect(result.a['0']).toBe('world');
			expect(result.a['1']).toBe('!');
			/* eslint-disable */
			sheet.load({ cells: {
				// following should result in a dictionary...
				A1: 'a',
				A2: { type: 'number', value: 0, level: 1}, B2: 'hello',
				A3: { type: 'string', value: '1a', level: 1}, B3: 'world',
				A4: { type: 'number', value: 2, level: 1}, B4: '!',
			} });
			/* eslint-enable */
			json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			// no array!
			expect(result.a.length).toBeUndefined();
			expect(result.a['0']).toBe('hello');
			expect(result.a['1a']).toBe('world');
			expect(result.a['2']).toBe('!');
		});
		// DL-1336: explicitly check
		it('should create an array too if indices are textual number representation', () => {
			const t1 = setup({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
			/* eslint-disable */
			const sheet = t1.sheet.load({ cells: {
				A1: 'a',
				A2: { type: 'string', value: '0', level: 1}, B2: 'hello',
				A3: { type: 'string', value: '1', level: 1}, B3: 'world',
				A4: { type: 'string', value: '2', level: 1}, B4: '!',
				// A4: { type: 'boolean', value: false, level: 1}, B3: 'world',
			} });
			/* eslint-enable */
			const json = createTerm('json(A1:B4)', sheet);
			sheet.setCellAt('A6', new Cell(null, json));
			t1.step();
			const result = sheet.cellAt('A6').value;
			expect(result).toBeDefined();
			expect(result.a).toBeDefined();
			expect(result.a.length).toBe(3);
			expect(result.a[0]).toBe('hello');
			expect(result.a[1]).toBe('world');
			expect(result.a[2]).toBe('!');
		});
	});
	// DL-4228
	describe('using inbox/outbox parameter', () => {
		it('should convert complete outbox message to json', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			const msg2 = createMessage(MSG.SIMPLE2);
			machine.addStreamSheet(streamsheet);
			machine.outbox.put(msg1);
			machine.outbox.put(msg2);
			createCellAt('A1', { formula: `json(outbox("${msg1.id}"))` }, sheet);
			createCellAt('B1', { formula: `json(outbox("${msg2.id}"))` }, sheet);
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
		it('should extract data from a message in outbox', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const message = createMessage(MSG.SIMPLE);
			machine.addStreamSheet(streamsheet);
			machine.outbox.put(message);
			createCellAt('A1', { formula: `json(outboxdata("${message.id}","Kundenname","Vorname"))` }, sheet);
			expect(sheet.cellAt('A1').value).toBe('Max');
			createCellAt('B1', { formula: `json(outboxdata("${message.id}","Kundenname"))` }, sheet);
			expect(sheet.cellAt('B1').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
			createCellAt('C1', { formula: `json(outboxdata("${message.id}","Positionen"))` }, sheet);
			expect(sheet.cellAt('C1').value).toEqual(MSG.SIMPLE.data.Positionen);
		});
		it('should return a complete specified message from inbox', () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const message = createMessage(MSG.SIMPLE);
			streamsheet.inbox.put(createMessage(message));
			createCellAt('A1', { formula: 'json(inbox(,))' }, sheet);
			let cellval = sheet.cellAt('A1').value;
			expect(cellval).toBeDefined();
			expect(cellval.data).toEqual(MSG.SIMPLE.data);
			expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
			expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
			createCellAt('B1', { formula: `json(inbox(,"${message.id}"))` }, sheet);
			cellval = sheet.cellAt('B1').value;
			expect(cellval).toBeDefined();
			expect(cellval.data).toEqual(MSG.SIMPLE.data);
			expect(cellval.metadata.name).toBe(MSG.SIMPLE.metadata.name);
			expect(cellval.metadata.sender).toBe(MSG.SIMPLE.metadata.sender);
		});
		it('should extract data from specified message in inbox', () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			const msg2 = createMessage(MSG.SIMPLE2);
			streamsheet.inbox.put(msg1);
			streamsheet.inbox.put(msg2);
			createCellAt('A1', { formula: `json(inboxdata(,"${msg2.id}","Kundenname","Vorname"))` }, sheet);
			expect(sheet.cellAt('A1').value).toBe('Anton');
			createCellAt('B1', { formula: `json(inboxdata(,"${msg2.id}","Kundenname"))` }, sheet);
			expect(sheet.cellAt('B1').value).toEqual({ Anrede: 'Herr', Vorname: 'Anton', Nachname: 'Mustermann' });
			createCellAt('C1', { formula: `json(inboxdata(,"${msg2.id}","Kundennummer"))` }, sheet);
			expect(sheet.cellAt('C1').value).toBe(987654321);
			createCellAt('D1', { formula: `json(inboxdata(,"${msg2.id}","Positionen"))` }, sheet);
			expect(sheet.cellAt('D1').value).toEqual([]);
			createCellAt('A2', { formula: `json(inboxdata(,"${msg1.id}","Kundenname","Vorname"))` }, sheet);
			expect(sheet.cellAt('A2').value).toBe('Max');
			createCellAt('B2', { formula: `json(inboxdata(,"${msg1.id}","Kundenname"))` }, sheet);
			expect(sheet.cellAt('B2').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
			createCellAt('C2', { formula: `json(inboxdata(,"${msg1.id}","Positionen"))` }, sheet);
			expect(sheet.cellAt('C2').value).toEqual(msg1.data.Positionen);
		});
		it('should be possible to extract loop element from an inbox message', () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			streamsheet.setLoopPath('[data][Positionen]');
			streamsheet.inbox.put(createMessage(MSG.SIMPLE));
			createCellAt('A1', { formula: 'json(inboxdata(,,"Positionen"))' }, sheet);
			expect(sheet.cellAt('A1').value).toEqual(MSG.SIMPLE.data.Positionen);
			createCellAt('B1', { formula: 'json(inboxdata(,,"Positionen", "0"))' }, sheet);
			expect(sheet.cellAt('B1').value).toEqual({ PosNr: 1, Artikelnr: 1234, Preis: 80.00 });
			createCellAt('C1', { formula: 'json(inboxdata(,,"Positionen", "1"))' }, sheet);
			expect(sheet.cellAt('C1').value).toEqual({ PosNr: 2, Artikelnr: 12345, Preis: 59.99 });
			createCellAt('D1', { formula: 'json(inboxdata(,,"Positionen", "2"))' }, sheet);
			expect(sheet.cellAt('D1').value).toEqual({ PosNr: 3, Artikelnr: 4535, Preis: 45.32 });
		});
		it('should extract metadata from specified message in inbox', () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			const msg1 = createMessage(MSG.SIMPLE);
			const msg2 = createMessage(MSG.SIMPLE2);
			streamsheet.inbox.put(msg1);
			streamsheet.inbox.put(msg2);
			createCellAt('A1', { formula: `json(inboxmetadata(,"${msg2.id}","name"))` }, sheet);
			expect(sheet.cellAt('A1').value).toBe('SIMPLE2');
			createCellAt('B1', { formula: `json(inboxmetadata(,"${msg2.id}","sender"))` }, sheet);
			expect(sheet.cellAt('B1').value).toBe('Cedalo');
			createCellAt('C1', { formula: `json(inboxmetadata(,"${msg2.id}","Teile"))` }, sheet);
			expect(sheet.cellAt('C1').value).toEqual(msg2.metadata.Teile);
			createCellAt('A2', { formula: `json(inboxmetadata(,"${msg1.id}","name"))` }, sheet);
			expect(sheet.cellAt('A2').value).toBe('SIMPLE');
			createCellAt('B2', { formula: `json(inboxmetadata(,"${msg1.id}","sender"))` }, sheet);
			expect(sheet.cellAt('B2').value).toBe('Cedalo');
		});
		it('should extract from current message in inbox if no message id was specified', () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			streamsheet.inbox.put(createMessage(MSG.SIMPLE));
			createCellAt('A1', { formula: 'json(inboxdata(,,"Kundenname","Vorname"))' }, sheet);
			expect(sheet.cellAt('A1').value).toBe('Max');
			createCellAt('B1', { formula: 'json(inboxdata(,,"Kundenname"))' }, sheet);
			expect(sheet.cellAt('B1').value).toEqual({ Vorname: 'Max', Nachname: 'Mustermann' });
			createCellAt('C1', { formula: 'json(inboxdata(,,"Positionen"))' }, sheet);
			expect(sheet.cellAt('C1').value).toEqual(MSG.SIMPLE.data.Positionen);
			createCellAt('D1', { formula: 'json(inboxmetadata(,,"name"))' }, sheet);
			expect(sheet.cellAt('D1').value).toBe('SIMPLE');
			createCellAt('E1', { formula: 'json(inboxmetadata(,,"sender"))' }, sheet);
			expect(sheet.cellAt('E1').value).toBe('Cedalo');
		});
	});
	// DL-4228
	describe('using inbox parameter', () => {

	});
	// DL-4228
	describe('using inboxdata parameter', () => {

	});
	// DL-4228
	describe('using inboxmetadata parameter', () => {
		it(`should return ${ERROR.VALUE} if extracting from an unknown message`, () => {
			const streamsheet = new StreamSheet();
			const sheet = streamsheet.sheet;
			createCellAt('A1', { formula: 'json(inbox(,))' }, sheet);
			createCellAt('B1', { formula: 'json(inbox(,"123"))' }, sheet);
			createCellAt('C1', { formula: 'json(inboxdata(,,"Kundenname"))' }, sheet);
			createCellAt('D1', { formula: 'json(inboxdata(,"1234","Kundenname"))' }, sheet);
			expect(sheet.cellAt('A1').value).toBe(ERROR.VALUE);
			expect(sheet.cellAt('B1').value).toBe(ERROR.VALUE);
			expect(sheet.cellAt('C1').value).toBe(ERROR.VALUE);
			expect(sheet.cellAt('D1').value).toBe(ERROR.VALUE);
		});
	});
});
