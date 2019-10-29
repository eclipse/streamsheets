const { createTerm } = require('../utils');
const { Cell, Machine, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

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
	it('should create a json with multiplpe dictionaries', () => {
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
});
