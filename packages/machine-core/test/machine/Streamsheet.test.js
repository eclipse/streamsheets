const { celljson } = require('./utils');
const { Machine, Message, SheetIndex, StreamSheet, StreamSheetTrigger } = require('../..');

describe('StreamSheet', () => {
	describe('load', () => {
		it('should load cell definitions', () => {
			const streamsheet = new StreamSheet();
			/* eslint-disable */
			const cells = {
				A1: 'A1', B1: 'B1', C1: 'C1',
				A2: 'A2', B2: 'B2', C2: 'C2',
				A3: 'A3', B3: 'B3', C3: 'C3'
			};
			/* eslint-enable */
			const sheet = streamsheet.sheet.load({ cells });
			const lastCell = sheet.cellAt(SheetIndex.create('C3'));
			const firstCell = sheet.cellAt(SheetIndex.create('A1'));
			expect(lastCell).toBeDefined();
			expect(lastCell.value).toBe('C3');
			expect(firstCell).toBeDefined();
			expect(firstCell.value).toBe('A1');
			let cellcounter = 0;
			sheet.iterate(() => {
				cellcounter += 1;
			});
			expect(cellcounter).toBe(9);
		});
	});

	describe('IO', () => {
		describe('toJSON()', () => {
			it('should create a JSON object', () => {
				const streamsheet = new StreamSheet();
				const json = streamsheet.toJSON();
				expect(json).toBeDefined();
				expect(json.id).toBeDefined();
				expect(json.name).toBe('');
				expect(json.inbox).toBeDefined();
				expect(json.trigger).toBeDefined();
				expect(json.loop).toBeDefined();
				expect(json.sheet).toBeDefined();
			});
			it('should contain settings', () => {
				const streamsheet = new StreamSheet();
				// streamsheet.inbox.addStream(new)
				streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.TIMER, interval: 2000 });
				streamsheet.setLoopPath('Position');
				streamsheet.sheet.load({ cells: { A1: 'A1', IF1: '-A1' } });
				const json = streamsheet.toJSON();
				expect(json.trigger.type).toBe(StreamSheetTrigger.TYPE.TIMER);
				expect(json.trigger.interval).toBe(2000);
				expect(json.loop.path).toBe('Position');
				expect(json.sheet.cells).toBeDefined();
				expect(celljson(json.sheet.cells.A1).isEqualTo({ value: 'A1', type: 'string' })).toBeTruthy();
				expect(celljson(json.sheet.cells.IF1).isEqualTo({ value: '-A1', type: 'string' })).toBeTruthy();
			});
			it('should create a StreamSheet instance from given JSON', () => {
				const streamsheet = new StreamSheet();
				streamsheet.name = 'T1';
				streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.TIMER, interval: 2000 });
				streamsheet.setLoopPath('Position');
				streamsheet.sheet.load({ cells: { A1: 'A1', IF1: '-A1' } });
				const json = streamsheet.toJSON();
				const streamsheet2 = new StreamSheet();
				streamsheet2.load(json);
				expect(streamsheet2).toBeDefined();
				expect(streamsheet2.id).toBe(streamsheet.id);
				expect(streamsheet2.name).toBe(streamsheet.name);
				expect(streamsheet2.trigger.type).toBe(StreamSheetTrigger.TYPE.TIMER);
				expect(streamsheet2.trigger.interval).toBe(streamsheet.trigger.interval);
				expect(streamsheet2.getLoopPath()).toBe(streamsheet.getLoopPath());
				expect(streamsheet2.sheet.cellAt(SheetIndex.create('A1')).value).toBe('A1');
				expect(streamsheet2.sheet.cellAt(SheetIndex.create('IF1')).value).toBe('-A1');
			});
		});
	});

	test('message processing', () => {
		// process message step by step...
		const cells = {
			A1: { formula: 'read(inboxdata(,,"Kundenname","Vorname"), B1)' },
			A2: { formula: 'read(inboxdata(,,"Kundennummer"), B2)' },
			A3: { formula: 'read(inboxdata(,,, "PosNr"), B3)' },
			C3: { formula: 'read(inboxdata(,,, "ArtikelNr"), D3)' },
			E3: { formula: 'read(inboxdata(,,, "Preis"), F3)' }
		};
		const msg = new Message({
			Kundenname: { Vorname: 'Max', Nachname: 'Mustermann' },
			Kundennummer: 1234,
			Positionen: [
				{ PosNr: 1, ArtikelNr: 23, Preis: 23.34 },
				{ PosNr: 2, ArtikelNr: 42, Preis: 87.67 },
				{ PosNr: 3, ArtikelNr: 13, Preis: 17.58 }
			]
		});
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		const sheet = streamsheet.sheet.load({ cells });
		machine.addStreamSheet(streamsheet);
		streamsheet.updateSettings({
			loop: { path: '[Data][Positionen]', enabled: true },
			trigger: StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS })
		});
		streamsheet.inbox.put(msg);
		streamsheet.step();
		// check cells
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('Max');
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1234);
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(23);
		expect(sheet.cellAt(SheetIndex.create('F3')).value).toBe(23.34);
		streamsheet.step();
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(42);
		expect(sheet.cellAt(SheetIndex.create('F3')).value).toBe(87.67);
		streamsheet.step();
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(3);
		expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(13);
		expect(sheet.cellAt(SheetIndex.create('F3')).value).toBe(17.58);
	});
});
