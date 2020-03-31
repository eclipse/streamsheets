const MESSAGES = require('../_data/messages.json');
const { createTerm } = require('../utilities');
const { Cell, Machine, Message, SheetIndex, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const setup = (config) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet({ name: config.streamsheetName });
	machine.addStreamSheet(streamsheet);
	const msg1 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.data))), 'msg-simple');
	Object.assign(msg1.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.metadata)));
	const msg2 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.data))), 'msg-simple2');
	Object.assign(msg2.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.metadata)));
	streamsheet.inbox.put(msg1);
	streamsheet.inbox.put(msg2);
	return streamsheet.sheet;
};

describe('read', () => {
	describe('read single values', () => {
		it('should copy values from current inbox message to sheet', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(createTerm('read(inboxdata("T1",,"Kundenname","Vorname"),C2, "String")', sheet).value).toBe('Vorname');
			expect(sheet.cellAt('C2').value).toBe('Max');
		});
		it('should copy values from current outbox message to sheet', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const outbox = sheet.streamsheet.machine.outbox;
			outbox.put(new Message(Object.assign({}, MESSAGES.SIMPLE2.data), 'out1'));
			expect(createTerm('read(OUTBOXDATA("out1","Kundenname","Vorname"),A1,"String")', sheet).value).toBe('Vorname');
			expect(sheet.cellAt('A1').value).toBe('Anton');
		});
		it('should work with a json property containing points', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const KEY = 'Ust.Identnr.';
			const message = new Message(Object.assign({}, MESSAGES.SIMPLE.data), 'msg-key');
			message.data[KEY] = 'DE123456789';
			sheet.streamsheet.inbox.put(message);
			expect(createTerm(`read(inboxdata("T1","msg-key","${KEY}"),B1,"String")`, sheet).value).toBe(`${KEY}`);
			expect(sheet.cellAt('B1').value).toBe('DE123456789');
		});
	});
	describe('copy from inbox', () => {
		it('should copy current loop element to cell range', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1","msg-simple",),B2:C4,"Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1234);
			expect(sheet.cellAt(SheetIndex.create('B4')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('C4')).value).toBe(80.00);
		});
		it('should copy loop object to a cell range if absolute path is specified', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 0),B2:C4,"Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1234);
			expect(sheet.cellAt(SheetIndex.create('B4')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('C4')).value).toBe(80.00);
		});
		it('should copy complete loop object to a cell range', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata(,,),B2:C4,"Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1234);
			expect(sheet.cellAt(SheetIndex.create('B4')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('C4')).value).toBe(80.00);
		});
		it('should work with special characters like "[", "]" or "." and reading complete dictionary', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet({ name: 'S1' });
			const sheet = streamsheet.sheet;
			streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SPECIAL_CHARS.data), 'msg'));
			machine.addStreamSheet(streamsheet);
			expect(createTerm('read(inboxdata(,),B1:C10,"Dictionary")', sheet).value).toBe('Data');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('[0:0]');
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(-0.616);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('[0:0].ID');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('[0:0]');
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('[0:0].Name');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe('Virtual\\Sin(T())');
			expect(sheet.cellAt(SheetIndex.create('B4')).value).toBe('[0:0].Unit');
			expect(sheet.cellAt(SheetIndex.create('C4')).value).toBe('UnitName');
			expect(sheet.cellAt(SheetIndex.create('B5')).value).toBe('[1:0]');
			expect(sheet.cellAt(SheetIndex.create('C5')).value).toBe(-0.616);
			expect(sheet.cellAt(SheetIndex.create('B6')).value).toBe('[1:0].ID');
			expect(sheet.cellAt(SheetIndex.create('C6')).value).toBe('[1:0]');
			expect(sheet.cellAt(SheetIndex.create('B7')).value).toBe('[1:0].Name');
			expect(sheet.cellAt(SheetIndex.create('C7')).value).toBe('Sin(T())');
			expect(sheet.cellAt(SheetIndex.create('B8')).value).toBe('[1:0].Unit');
			expect(sheet.cellAt(SheetIndex.create('C8')).value).toBe('');
			expect(sheet.cellAt(SheetIndex.create('B9')).value).toBe('Timestamp');
			expect(sheet.cellAt(SheetIndex.create('C9')).value).toBe('2020-03-30T10:35:23.9805224Z');
			expect(sheet.cellAt(SheetIndex.create('B10')).value).toBe('Identifier');
			expect(sheet.cellAt(SheetIndex.create('C10')).value).toBe('ibaPDAMQTTstore200309122136');
		});
		it('should work with special characters like "[", "]" or "." and reading each single value', () => {
			const machine = new Machine();
			const streamsheet = new StreamSheet({ name: 'S1' });
			const sheet = streamsheet.sheet;
			streamsheet.inbox.put(new Message(Object.assign({}, MESSAGES.SPECIAL_CHARS.data), 'msg'));
			machine.addStreamSheet(streamsheet);
			expect(createTerm('read(inboxdata(,,"[0:0]"),B1,"Number")', sheet).value).toBe('[0:0]');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(-0.616);
			expect(createTerm('read(inboxdata(,,"[0:0].ID"),B1,"String")', sheet).value).toBe('[0:0].ID');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('[0:0]');
			expect(createTerm('read(inboxdata(,,"[0:0].Name"),B1,"String")', sheet).value).toBe('[0:0].Name');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('Virtual\\Sin(T())');
			expect(createTerm('read(inboxdata(,,"[0:0].Unit"),B1,"String")', sheet).value).toBe('[0:0].Unit');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('UnitName');
			expect(createTerm('read(inboxdata(,,"[1:0]"),B1,"Number")', sheet).value).toBe('[1:0]');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(-0.616);
			expect(createTerm('read(inboxdata(,,"[1:0].ID"),B1,"String")', sheet).value).toBe('[1:0].ID');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('[1:0]');
			expect(createTerm('read(inboxdata(,,"[1:0].Name"),B1,"String")', sheet).value).toBe('[1:0].Name');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('Sin(T())');
			expect(createTerm('read(inboxdata(,,"[1:0].Unit"),B1,"String")', sheet).value).toBe('[1:0].Unit');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('');
			expect(createTerm('read(inboxdata(,,"Timestamp"),B1,"String")', sheet).value).toBe('Timestamp');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('2020-03-30T10:35:23.9805224Z');
			expect(createTerm('read(inboxdata(,,"Identifier"),B1,"String")', sheet).value).toBe('Identifier');
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe('ibaPDAMQTTstore200309122136');
		});
		it('should copy single loop values if specified relative', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1","msg-simple",,"PosNr"),A1,"Number")', sheet).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(1);
			expect(createTerm('read(inboxdata("T1","msg-simple",,"Artikelnr"),A1,"Number")', sheet).value).toBe('Artikelnr');
			expect(sheet.cellAt('A1').value).toBe(1234);
			expect(createTerm('read(inboxdata("T1","msg-simple",,"Preis"),A1,"Number")', sheet).value).toBe('Preis');
			expect(sheet.cellAt('A1').value).toBe(80.00);
		});
		it('should copy single loop values if specified absolute', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1","msg-simple","Positionen",1,"PosNr"),A1,"Number")', sheet).value).toBe('PosNr');
			expect(sheet.cellAt('A1').value).toBe(2);
			expect(createTerm('read(inboxdata("T1","msg-simple","Positionen",1,"Artikelnr"),A1,"Number")', sheet).value).toBe('Artikelnr');
			expect(sheet.cellAt('A1').value).toBe(12345);
			expect(createTerm('read(inboxdata("T1","msg-simple","Positionen",1,"Preis"),A1,"Number")', sheet).value).toBe('Preis');
			expect(sheet.cellAt('A1').value).toBe(59.99);
		});
		// DL-1528
		it('should read loop elements if loop is [Data] and data is an array', () => {
			const machine = new Machine();
			const t1 = new StreamSheet();
			const sheet = t1.sheet;
			machine.addStreamSheet(t1);
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS });
			t1.updateSettings({ loop: { path: '[Data]', enabled: true } });
			t1.inbox.put(new Message([
				{ Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Yellow' } },
				{ Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Red' } },
				{ Duration: 1000, States: { Ampel1: 'RedYellow', Ampel2: 'Red' } },
				{ Duration: 0, States: { Ampel1: 'Green', Ampel2: 'Red' } }
			]));
			sheet.setCellAt('A4',
				new Cell(null, createTerm('read(inboxdata(, , , "Duration"), B4, "String")', sheet)));
			sheet.setCellAt('A5',
				new Cell(null, createTerm('read(inboxdata(, , , "States", "Ampel1"), B5, "String")', sheet)));
			sheet.setCellAt('A6',
				new Cell(null, createTerm('read(inboxdata(, , , "States", "Ampel2"), B6, "String")', sheet)));
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][0]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('Red');
			expect(sheet.cellAt('B6').value).toBe('Yellow');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][1]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('Red');
			expect(sheet.cellAt('B6').value).toBe('Red');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][2]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('RedYellow');
			expect(sheet.cellAt('B6').value).toBe('Red');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][3]');
			expect(sheet.cellAt('B4').value).toBe(0);
			expect(sheet.cellAt('B5').value).toBe('Green');
			expect(sheet.cellAt('B6').value).toBe('Red');
		});
		// DL-1528
		it('should read loop elements if loop is [Data] and data is a dictionary', () => {
			const machine = new Machine();
			const t1 = new StreamSheet();
			const sheet = t1.sheet;
			machine.addStreamSheet(t1);
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS });
			t1.updateSettings({ loop: { path: '[Data]', enabled: true } });
			t1.inbox.put(new Message({
				Step1: { Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Yellow' } },
				Step2: { Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Red' } },
				Step3: { Duration: 1000, States: { Ampel1: 'RedYellow', Ampel2: 'Red' } },
				Step4: { Duration: 0, States: { Ampel1: 'Green', Ampel2: 'Red' } }
			}));
			sheet.setCellAt('A4',
				new Cell(null, createTerm('read(inboxdata(, , , "Duration"), B4, "String")', sheet)));
			sheet.setCellAt('A5',
				new Cell(null, createTerm('read(inboxdata(, , , "States", "Ampel1"), B5, "String")', sheet)));
			sheet.setCellAt('A6',
				new Cell(null, createTerm('read(inboxdata(, , , "States", "Ampel2"), B6, "String")', sheet)));
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step1]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('Red');
			expect(sheet.cellAt('B6').value).toBe('Yellow');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step2]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('Red');
			expect(sheet.cellAt('B6').value).toBe('Red');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step3]');
			expect(sheet.cellAt('B4').value).toBe(1000);
			expect(sheet.cellAt('B5').value).toBe('RedYellow');
			expect(sheet.cellAt('B6').value).toBe('Red');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step4]');
			expect(sheet.cellAt('B4').value).toBe(0);
			expect(sheet.cellAt('B5').value).toBe('Green');
			expect(sheet.cellAt('B6').value).toBe('Red');
		});
		// DL-1528
		it('should read next loop element in endless mode only if sheet returns', () => {
			const machine = new Machine();
			const t1 = new StreamSheet();
			const sheet = t1.sheet.loadCells({
				A1: { formula: 'read(inboxdata(, , , "Duration"), B1, "String")' },
				A2: { formula: 'read(inboxdata(, , , "States", "Ampel1"), B2, "String")' },
				A3: { formula: 'read(inboxdata(, , , "States", "Ampel2"), B3, "String")' },
				A4: { formula: 'A4+1' },
				A5: { formula: 'if(A4>2, return(setvalue(A4>2, 0, A4)), false)' }
			});
			machine.addStreamSheet(t1);
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			t1.updateSettings({ loop: { path: '[Data]', enabled: true } });
			t1.inbox.put(new Message({
				Step1: { Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Yellow' } },
				Step2: { Duration: 1000, States: { Ampel1: 'Red', Ampel2: 'Red' } },
				Step3: { Duration: 1000, States: { Ampel1: 'RedYellow', Ampel2: 'Red' } },
				Step4: { Duration: 0, States: { Ampel1: 'Green', Ampel2: 'Red' } }
			}));
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step1]');
			expect(sheet.cellAt('A4').value).toBe(2);
			expect(sheet.cellAt('A5').value).toBe(false);
			expect(sheet.cellAt('B1').value).toBe(1000);
			expect(sheet.cellAt('B2').value).toBe('Red');
			expect(sheet.cellAt('B3').value).toBe('Yellow');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step1]');
			expect(sheet.cellAt('A4').value).toBe(0);
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('B1').value).toBe(1000);
			expect(sheet.cellAt('B2').value).toBe('Red');
			expect(sheet.cellAt('B3').value).toBe('Yellow');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step2]');
			expect(sheet.cellAt('A4').value).toBe(1);
			expect(sheet.cellAt('A5').value).toBe(false);
			expect(sheet.cellAt('B1').value).toBe(1000);
			expect(sheet.cellAt('B2').value).toBe('Red');
			expect(sheet.cellAt('B3').value).toBe('Red');
			t1.step();
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step2]');
			expect(sheet.cellAt('A4').value).toBe(0);
			expect(sheet.cellAt('A5').value).toBe(true);
			expect(sheet.cellAt('B1').value).toBe(1000);
			expect(sheet.cellAt('B2').value).toBe('Red');
			expect(sheet.cellAt('B3').value).toBe('Red');
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step3]');
			expect(sheet.cellAt('A4').value).toBe(1);
			expect(sheet.cellAt('A5').value).toBe(false);
			expect(sheet.cellAt('B1').value).toBe(1000);
			expect(sheet.cellAt('B2').value).toBe('RedYellow');
			expect(sheet.cellAt('B3').value).toBe('Red');
			t1.step();
			t1.step();
			t1.step();
			expect(t1.getCurrentLoopPath()).toBe('[Data][Step4]');
			expect(sheet.cellAt('A4').value).toBe(1);
			expect(sheet.cellAt('A5').value).toBe(false);
			expect(sheet.cellAt('B1').value).toBe(0);
			expect(sheet.cellAt('B2').value).toBe('Green');
			expect(sheet.cellAt('B3').value).toBe('Red');
		});
		// DL-578
		it(`should set target cell to ${ERROR.NA} for processed message and corresponding param is set to true`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const streamsheet = sheet.streamsheet;
			// only for special triggers like MACHINE_START/STOP and RANDOM or TIMER...
			streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			// by default we return the value:
			const read = createTerm('read(inboxdata(,,"Kundenname", "Vorname"), C1, "String")', sheet);
			const readNA = createTerm('read(inboxdata(,,"Kundenname", "Vorname"), C2, "String",,TRUE)', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			sheet.setCellAt('A2', new Cell(null, readNA));
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Max');
			expect(sheet.cellAt('A2').value).toBe('Vorname');
			expect(sheet.cellAt('C2').value).toBe('Max');
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Vorname');
			expect(sheet.cellAt('C2').value).toBe('Anton');
			// we are in endless mode, so we keep last message, but target value is not available...
			streamsheet.step();
			streamsheet.step();
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Vorname');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
		});
		// DL-966
		it(`should set target cell to ${ERROR.NA} if requested message data is not available`, () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const streamsheet = sheet.streamsheet;
			// only for special triggers like MACHINE_START/STOP and RANDOM or TIMER...
			streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			sheet.streamsheet.updateSettings({
				loop: {
					enabled: false,
					path: '[data][Positionen]'
				}
			});
			// sheet.streamsheet.setLoopPath('[data][Positionen]');
			// by default we return the value:
			const read = createTerm('read(inboxdata(, , "Kundenname", "Vorname"), C1, "String")', sheet);
			const readNA = createTerm('read(inboxdata(, , "Kundenname", "Anrede"), C2, "String",,TRUE)', sheet);
			const readNA2 = createTerm('read(inboxdata(, , , "MwSt"), C3, "String",,TRUE)', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			sheet.setCellAt('A2', new Cell(null, readNA));
			sheet.setCellAt('A3', new Cell(null, readNA2));
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Max');
			expect(sheet.cellAt('A2').value).toBe('Anrede');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C3').value).toBe(ERROR.NA);
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Anrede');
			expect(sheet.cellAt('C2').value).toBe('Herr');
			expect(sheet.cellAt('C3').value).toBe(ERROR.NA);
			// we are in endless mode, so we keep last message, but target value is not available...
			streamsheet.step();
			streamsheet.step();
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Anrede');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C3').value).toBe(ERROR.NA);
		});
		// DL-966 & DL-578
		// eslint-disable-next-line
		it('should set target cell to last read value or default value if no message or message data is available', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const streamsheet = sheet.streamsheet;
			// only for special triggers like MACHINE_START/STOP and RANDOM or TIMER...
			streamsheet.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			sheet.streamsheet.updateSettings({
				loop: {
					enabled: false,
					path: '[data][Positionen]'
				}
			});
			// by default we return the value:
			const read = createTerm('read(inboxdata(, , "Kundenname", "Vorname"), C1, "String")', sheet);
			const readBool = createTerm('read(inboxdata(, , "Kundenname", "Geburtsdatum"), C2, "Boolean")', sheet);
			const readNumber = createTerm('read(inboxdata(, , "Kundenname", "Geburtsdatum"), C3, "Number")', sheet);
			// all others should be treated as string...
			const readString = createTerm('read(inboxdata(, , "Kundenname", "Anrede"), C4)', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			sheet.setCellAt('A2', new Cell(null, readBool));
			sheet.setCellAt('A3', new Cell(null, readNumber));
			sheet.setCellAt('A4', new Cell(null, readString));
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Max');
			expect(sheet.cellAt('A2').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C2').value).toBe(false);
			expect(sheet.cellAt('A3').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C3').value).toBe(0);
			expect(sheet.cellAt('A4').value).toBe('Anrede');
			expect(sheet.cellAt('C4').value).toBe('');
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C2').value).toBe(false);
			expect(sheet.cellAt('A3').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C3').value).toBe(0);
			expect(sheet.cellAt('A4').value).toBe('Anrede');
			expect(sheet.cellAt('C4').value).toBe('Herr');
			// we keep last read value
			streamsheet.step();
			streamsheet.step();
			streamsheet.step();
			expect(sheet.cellAt('A1').value).toBe('Vorname');
			expect(sheet.cellAt('C1').value).toBe('Anton');
			expect(sheet.cellAt('A2').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C2').value).toBe(false);
			expect(sheet.cellAt('A3').value).toBe('Geburtsdatum');
			expect(sheet.cellAt('C3').value).toBe(0);
			expect(sheet.cellAt('A4').value).toBe('Anrede');
			expect(sheet.cellAt('C4').value).toBe('Herr');
		});
		// DL-2144:
		it('should not replace formula of target cell', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			const streamsheet = sheet.streamsheet;
			sheet.loadCells({ C2: { formula: 'concat(C2,"-ABC")' } });
			expect(sheet.cellAt('C2').value).toBe("-ABC");
			expect(createTerm('read(inboxdata("T1",,"Kundenname","Vorname"),C2, "String")', sheet).value).toBe('Vorname');
			expect(sheet.cellAt('C2').value).toBe('Max');
			streamsheet.step();
			expect(sheet.cellAt('C2').value).toBe('Max-ABC');
		});
		// eslint-disable-next-line
		it(`should return ${ERROR.NA} if 5. parameter is set to true and data not available or last read data if 5. parameter is false `, () => {
			// DL-966: try to mimic scenario from issue
			const machine = new Machine();
			const t1 = new StreamSheet({ name: 'T1' });
			const sheet = t1.sheet;
			const msg1 = new Message({ Kunde: { Vorname: 'Max', Nachname: 'Mustermann' } });
			const msg2 = new Message({ Kunde: { Anrede: 'Herr', Vorname: 'Anton', Nachname: 'Punkt' } });
			machine.addStreamSheet(t1);
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			const read = createTerm('read(inboxdata(, , "Kunde", "Anrede"), C1, "String")', sheet);
			const readNA = createTerm('read(inboxdata(, , "Kunde", "Anrede"), C2, "String",,TRUE)', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			sheet.setCellAt('A2', new Cell(null, readNA));
			// we alternate messages and read inbetween...
			t1.inbox.put(msg1);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			t1.inbox.put(msg2);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('Herr');
			expect(sheet.cellAt('C2').value).toBe('Herr');
			t1.inbox.put(msg1);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('Herr');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			t1.inbox.put(msg2);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('Herr');
			expect(sheet.cellAt('C2').value).toBe('Herr');
			t1.inbox.put(msg1);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('Herr');
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
		});
	});
	describe('return value', () => {
		it('should return json path if target is defined', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen"),A1,"Number")', sheet).value).toBe('Positionen');
			expect(createTerm('read(inboxdata("T1","msg-simple","Positionen",1,"PosNr"),A1,"Number")', sheet).value).toBe('PosNr');
		});
		it('should return value from json path if no target is specified', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen",1,"Preis"))', sheet).value).toBe(59.99);
			expect(createTerm('read(inboxdata("T1",,"Positionen"))', sheet).value).toEqual(MESSAGES.SIMPLE.data.Positionen);
			expect(createTerm('read(inboxdata("T1",,"Positionen",0))', sheet).value).toEqual(MESSAGES.SIMPLE.data.Positionen[0]);
		});
		// DL-1080: part of this issue specifies that READ() should return number value...
		it('should return number if last json path part is represents a number', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 0), A1)', sheet).value).toBe(0);
			expect(createTerm('read(inboxdata("T1",,"Positionen", 1), A1)', sheet).value).toBe(1);
		});
	});

	describe('copy of array data to cell range', () => {
		it('should copy an array in vertical orientation if range height > range width', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Warenkorb"), A1:B3, "Array")', sheet).value).toBe('Warenkorb');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('A3')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(3);
		});
		it('should copy an array in vertical orientation if range height == range width', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Warenkorb"), A1:B2, "Array")', sheet).value).toBe('Warenkorb');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
		});
		it('should copy an array in horizontal orientation if range width > range height', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Warenkorb"), A1:C2, "Array")', sheet).value).toBe('Warenkorb');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(3);
		});
		it('should copy an array in horizontal orientation', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Warenkorb"), A1:C2, "Array", true)', sheet).value).toBe('Warenkorb');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(3);
		});
		it('should copy an array in vertical orientation', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Warenkorb"), A1:C2, "Array", false)', sheet).value).toBe('Warenkorb');
			expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(2);
		});
	});
	describe('copy of dictionary data to cell range', () => {
		it('should copy an object in vertical orientation if range height > range width', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 0), B2:C4, "Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1234);
			expect(sheet.cellAt(SheetIndex.create('B4')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('C4')).value).toBe(80.00);
		});
		it('should copy an object in vertical orientation if range height == range width', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 0), B2:C3, "Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1234);
		});
		it('should copy an object in horizontal orientation if range width > range height', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 1), B2:D3, "Dictionary")', sheet).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('D2')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(12345);
			expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(59.99);
		});
		it('should copy an object in horizontal orientation', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 1), B2:D3, "Dictionary", true)', sheet).value).toBe(1);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('D2')).value).toBe('Preis');
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(12345);
			expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(59.99);
		});
		it('should copy an object in vertical orientation', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[data][Positionen]');
			expect(createTerm('read(inboxdata("T1",,"Positionen", 2), B2:D3, "Dictionary", false)', sheet).value).toBe(2);
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('PosNr');
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('Artikelnr');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(3);
			expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(4535);
			// current implementation will simply fill up range => add values again...
			// expect(sheet.cellAt(SheetIndex.create('D2')).value).toBeUndefined();
			// expect(sheet.cellAt(SheetIndex.create('D3')).value).toBeUndefined();
		});
		// DL-1714
		it('should read dictionary and keep last values if current message has not requested data', () => {
			const machine = new Machine();
			const t1 = new StreamSheet({ name: 'T1' });
			machine.addStreamSheet(t1);
			// only for special triggers like MACHINE_START/STOP and RANDOM or TIMER...
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			const sheet = t1.sheet;
			const read = createTerm('read(inboxdata(, ,"RawValue"),C1:D3, "Dictionary")', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			// add some messages to consume...
			t1.inbox.put(new Message({
				RawValue: { dataType: 'Float', arrayType: 'Scalar', value: 0 }
			}));
			t1.inbox.put(new Message({
				UnknownValue: { dataType: 'Boolean', arrayType: 'Scalar', value: false }
			}));
			t1.inbox.put(new Message({
				RawValue: { dataType: 'Integer', arrayType: 'Scalar', value: 1 }
			}));
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Float');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(0);
			// we should keep last read...
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Float');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(0);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Integer');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(1);
			t1.step();
			t1.step();
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Integer');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(1);
		});
		it(`should read dictionary and return ${ERROR.NA} if current message has not requested data`, () => {
			const machine = new Machine();
			const t1 = new StreamSheet({ name: 'T1' });
			machine.addStreamSheet(t1);
			// only for special triggers like MACHINE_START/STOP and RANDOM or TIMER...
			t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' });
			const sheet = t1.sheet;
			const read = createTerm('read(inboxdata(, ,"RawValue"),C1:D3, "Dictionary", ,true)', sheet);
			sheet.setCellAt('A1', new Cell(null, read));
			// add some messages to consume...
			t1.inbox.put(new Message({
				RawValue: { dataType: 'Float', arrayType: 'Scalar', value: 0 }
			}));
			t1.inbox.put(new Message({
				UnknownValue: { dataType: 'Boolean', arrayType: 'Scalar', value: false }
			}));
			t1.inbox.put(new Message({
				RawValue: { dataType: 'Integer', arrayType: 'Scalar', value: 1 }
			}));
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Float');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(0);
			// we should keep last read...
			t1.step();
			expect(sheet.cellAt('C1').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D1').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C3').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D3').value).toBe(ERROR.NA);
			t1.step();
			expect(sheet.cellAt('C1').value).toBe('dataType');
			expect(sheet.cellAt('D1').value).toBe('Integer');
			expect(sheet.cellAt('C2').value).toBe('arrayType');
			expect(sheet.cellAt('D2').value).toBe('Scalar');
			expect(sheet.cellAt('C3').value).toBe('value');
			expect(sheet.cellAt('D3').value).toBe(1);
			t1.step();
			t1.step();
			t1.step();
			expect(sheet.cellAt('C1').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D1').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D2').value).toBe(ERROR.NA);
			expect(sheet.cellAt('C3').value).toBe(ERROR.NA);
			expect(sheet.cellAt('D3').value).toBe(ERROR.NA);
		});
	});

	describe('read inboxmetadata', () => {
		it('should read simple metadata properties', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(createTerm('read(INBOXMETADATA(,,"name"), A1, "String")', sheet).value).toBe('name');
			expect(sheet.cellAt('A1').value).toBe('SIMPLE');
			expect(createTerm('read(INBOXMETADATA(,,"sender"), A2, "String")', sheet).value).toBe('sender');
			expect(sheet.cellAt('A2').value).toBe('Cedalo');
		});
		it('should read from metadata loop element', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[metadata][Teile]');
			expect(createTerm('read(INBOXMETADATA(,"msg-simple2",,"Nr"), A1, "Number")', sheet).value).toBe('Nr');
			expect(sheet.cellAt('A1').value).toBe(1);
			expect(createTerm('read(INBOXMETADATA(,"msg-simple2",,"Preis"), A2, "Number")', sheet).value).toBe('Preis');
			expect(sheet.cellAt('A2').value).toBe(11.11);
		});
		it('should read complete loop element from metadata', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			sheet.streamsheet.setLoopPath('[metadata][Teile]');
			expect(createTerm('read(INBOXMETADATA(,"msg-simple2",),B2:C3, "Dictionary")', sheet).value).toBe(0);
			expect(sheet.cellAt('B2').value).toBe('Nr');
			expect(sheet.cellAt('C2').value).toBe(1);
			expect(sheet.cellAt('B3').value).toBe('Preis');
			expect(sheet.cellAt('C3').value).toBe(11.11);
		});
		it('should read complete data object', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(createTerm('read(inboxdata(,"msg-simple2"),B2:C3, "Dictionary")', sheet).value).toBe('Data');
			expect(sheet.cellAt('B2').value).toBe('Kundenname');
			expect(sheet.cellAt('B3').value).toBe('Kundennummer');
			expect(sheet.cellAt('C3').value).toBe(987654321);
		});
		it('should read complete metadata object', () => {
			const sheet = setup({ streamsheetName: 'T1' });
			expect(createTerm('read(INBOXMETADATA(,"msg-simple2"),B2:C3, "Dictionary")', sheet).value).toBe('Metadata');
			expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe('id');
			expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe('msg-simple2');
			expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe('arrivalTime');
		});
	});
	describe('JIRA bugs :-)', () => {
		describe('@cedalo/DL-1122', () => {
			it('should read a list of dictionaries and spread it to given range', () => {
				const machine = new Machine();
				// eslint-disable-next-line
				const t1 = new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
				const sheet = t1.sheet;
				machine.addStreamSheet(t1);
				machine.outbox.put(new Message([
					{ Name: 'Wurst', Vorname: 'Hans', Alter: 23 },
					{ Name: 'Gluck', Vorname: 'Hans', Alter: 42 }], 'out1'));

				const read = createTerm('read(OUTBOXDATA("out1"),A2:C4, , true)', sheet);
				sheet.setCellAt('A1', new Cell(null, read));
				t1.step();
				expect(sheet.cellAt('A2').value).toBe('Name');
				expect(sheet.cellAt('B2').value).toBe('Vorname');
				expect(sheet.cellAt('C2').value).toBe('Alter');
				expect(sheet.cellAt('A3').value).toBe('Wurst');
				expect(sheet.cellAt('B3').value).toBe('Hans');
				expect(sheet.cellAt('C3').value).toBe(23);
				expect(sheet.cellAt('A4').value).toBe('Gluck');
				expect(sheet.cellAt('B4').value).toBe('Hans');
				expect(sheet.cellAt('C4').value).toBe(42);
				// same with vertical align
				const read2 = createTerm('read(OUTBOXDATA("out1"),A2:C4, , false)', sheet);
				sheet.setCellAt('A1', new Cell(null, read2));
				t1.step();
				expect(sheet.cellAt('A2').value).toBe('Name');
				expect(sheet.cellAt('A3').value).toBe('Vorname');
				expect(sheet.cellAt('A4').value).toBe('Alter');
				expect(sheet.cellAt('B2').value).toBe('Wurst');
				expect(sheet.cellAt('B3').value).toBe('Hans');
				expect(sheet.cellAt('B4').value).toBe(23);
				expect(sheet.cellAt('C2').value).toBe('Gluck');
				expect(sheet.cellAt('C3').value).toBe('Hans');
				expect(sheet.cellAt('C4').value).toBe(42);
			});
			it('should read an object of objects from inbox and spread it to given range', () => {
				const machine = new Machine();
				// eslint-disable-next-line
				const t1 = new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
				const sheet = t1.sheet;
				machine.addStreamSheet(t1);
				t1.inbox.put(new Message({
					0: { Art: 'Umsatz', Jan: 71, Feb: 74, Mar: 56 },
					1: { Art: 'Kosten', Jan: 69, Feb: 0, Mar: 70 },
					2: { Art: 'Ertrag', Jan: 6, Feb: 91, Mar: 67 }
				}));
				const read = createTerm('read(INBOXDATA(,),A4:D7,, true)', sheet);
				sheet.setCellAt('A1', new Cell(null, read));
				t1.step();
				expect(sheet.cellAt('A4').value).toBe('Art');
				expect(sheet.cellAt('B4').value).toBe('Jan');
				expect(sheet.cellAt('C4').value).toBe('Feb');
				expect(sheet.cellAt('D4').value).toBe('Mar');
				expect(sheet.cellAt('A5').value).toBe('Umsatz');
				expect(sheet.cellAt('B5').value).toBe(71);
				expect(sheet.cellAt('C5').value).toBe(74);
				expect(sheet.cellAt('D5').value).toBe(56);
				expect(sheet.cellAt('A6').value).toBe('Kosten');
				expect(sheet.cellAt('B6').value).toBe(69);
				expect(sheet.cellAt('C6').value).toBe(0);
				expect(sheet.cellAt('D6').value).toBe(70);
				expect(sheet.cellAt('A7').value).toBe('Ertrag');
				expect(sheet.cellAt('B7').value).toBe(6);
				expect(sheet.cellAt('C7').value).toBe(91);
				expect(sheet.cellAt('D7').value).toBe(67);
			});
			it('should read a list of objects from inbox and spread it to given range', () => {
				const machine = new Machine();
				// eslint-disable-next-line
				const t1 = new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
				const sheet = t1.sheet;
				machine.addStreamSheet(t1);
				t1.inbox.put(new Message([
					['Art', 'Jan', 'Feb', 'Mar'],
					['Umsatz', 71, 74, 56],
					['Kosten', 69, 0, 70],
					['Ertrag', 6, 91, 67]
				]));
				const read = createTerm('read(INBOXDATA(,),A4:D7,, false)', sheet);
				sheet.setCellAt('A1', new Cell(null, read));
				t1.step();
				expect(sheet.cellAt('A4').value).toBe('Art');
				expect(sheet.cellAt('B4').value).toBe('Umsatz');
				expect(sheet.cellAt('C4').value).toBe('Kosten');
				expect(sheet.cellAt('D4').value).toBe('Ertrag');
				expect(sheet.cellAt('A5').value).toBe('Jan');
				expect(sheet.cellAt('B5').value).toBe(71);
				expect(sheet.cellAt('C5').value).toBe(69);
				expect(sheet.cellAt('D5').value).toBe(6);
				expect(sheet.cellAt('A6').value).toBe('Feb');
				expect(sheet.cellAt('B6').value).toBe(74);
				expect(sheet.cellAt('C6').value).toBe(0);
				expect(sheet.cellAt('D6').value).toBe(91);
				expect(sheet.cellAt('A7').value).toBe('Mar');
				expect(sheet.cellAt('B7').value).toBe(56);
				expect(sheet.cellAt('C7').value).toBe(70);
				expect(sheet.cellAt('D7').value).toBe(67);
			});
			// DL-1272
			it('should read metadata of specified message and not any other', () => {
				// create machine with 2 streamsheets:
				const machine = new Machine();
				// eslint-disable-next-line
				const t1 = new StreamSheet({ name: 'T1', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
				// eslint-disable-next-line
				const t2 = new StreamSheet({ name: 'T2', trigger: { type: StreamSheetTrigger.TYPE.ONCE, repeat: 'endless' } });
				machine.removeAllStreamSheets();
				machine.addStreamSheet(t1);
				machine.addStreamSheet(t2);
				// add message to t2:
				t2.inbox.put(new Message({ name: 'test' }, 'Message'));
				const read1 = createTerm('read(INBOXMETADATA(,,"id"),B1,,)', t1.sheet);
				const read2 = createTerm('read(INBOXMETADATA("T1",,"id"),B2,,)', t1.sheet);
				const read3 = createTerm('read(INBOXMETADATA("T2",,"id"),B3,,)', t1.sheet);
				t1.sheet.setCellAt('A1', new Cell(null, read1));
				t1.sheet.setCellAt('A2', new Cell(null, read2));
				t1.sheet.setCellAt('A3', new Cell(null, read3));
				t1.step();
				expect(t1.sheet.cellAt('B1').value).toBe('');
				expect(t1.sheet.cellAt('B2').value).toBe('');
				expect(t1.sheet.cellAt('B3').value).toBe('Message');
			});
		});
	});

	describe('process message', () => {
		it('should process message step by step', () => {
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
});
