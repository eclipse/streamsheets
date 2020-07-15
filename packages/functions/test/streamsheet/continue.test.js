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
const { Machine, Message, SheetIndex, StreamSheet } = require('@cedalo/machine-core');
const MESSAGES = require('../_data/messages.json');

const setupSheetInbox = () => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	const sheet = streamsheet.sheet;
	machine.addStreamSheet(streamsheet);
	const msg1 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.data))), 'msg-simple');
	Object.assign(msg1.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE.metadata)));
	const msg2 = new Message(Object.assign({}, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.data))), 'msg-simple2');
	Object.assign(msg2.metadata, JSON.parse(JSON.stringify(MESSAGES.SIMPLE2.metadata)));
	streamsheet.inbox.put(msg1);
	streamsheet.inbox.put(msg2);
	return sheet;
};

describe('continue', () => {
	it('should continue evaluation at defined cell', () => {
		/* eslint-disable */
		const cells = {
			A1: { formula: 'continue(A2)' }, B1: { formula: 'B1+1' }, C1: { formula: 'C1+1' }, D1: { formula: 'continue(C2)' },
			A2: { formula: 'continue(C1)' }, B2: { formula: 'B2+1' }, C2: { formula: 'C2+1' }, D2: { formula: 'continue(C3)' },
			A3: { formula: 'A3+1' }, B3: { formula: 'B3+1'}, C3: { formula: 'C3+1' }, D3: { formula: 'D3+1' }, E3: { formula: 'continue(A4)' },
			A4: { formula: 'A4+1' }
		};/* eslint-enable */
		const sheet = new StreamSheet().sheet.load({ cells });
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('D1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('D2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('E3')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A4')).value).toBe(1);
		// next step:
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('D1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('D2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('D3')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('E3')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A4')).value).toBe(2);
	});
	it('should be possible to continue evaluation at IF col', () => {
		/* eslint-disable */
		const cells = {
			IF1: true, B1: { formula: 'B1+1' }, C1: { formula: 'continue(IF3)' },
			IF2: { formula: 'continue(IF4)' }, B2: { formula: 'B2+1' }, C2: { formula: 'C2+1' },
			IF3: { formula: 'continue(IF2)' }, B3: { formula: 'B3+1' }, C3: { formula: 'C3+1' },
			IF4: true, A4: { formula: 'A4+1' }
		};/* eslint-enable */
		const sheet = new StreamSheet().sheet.load({ cells });
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('IF2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('IF3')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('A4')).value).toBe(1);
		// next step:
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('IF2')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('IF3')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('B3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('C3')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('A4')).value).toBe(2);
	});
	it('should not consume message if continue jumps backwards', async () => {
		const sheet = setupSheetInbox();
		const machine = sheet.machine;
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'if(A1>2,continue(A7),false)' },
			A5: { formula: 'read(inboxdata(,,"Kundenname","Vorname"), B5)' },
			A6: { formula: 'continue(A1)' },
			A7: { formula: 'A7+1' },
			A8: { formula: 'read(inboxdata(,,"Kundenname","Vorname"), B8)' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(false);
		expect(sheet.cellAt('A5').value).toBe('Vorname');
		expect(sheet.cellAt('A6').value).toBe(true);
		expect(sheet.cellAt('A7').value).toBe(1);
		expect(sheet.cellAt('A8').value).toBe('Vorname');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B5').value).toBe('Max');
		expect(sheet.cellAt('A7').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B5').value).toBe('Max');
		expect(sheet.cellAt('A7').value).toBe(2);
		// still Max because new message is attached in next step...
		expect(sheet.cellAt('B8').value).toBe('Max');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B5').value).toBe('Max');
		expect(sheet.cellAt('A7').value).toBe(3);
		expect(sheet.cellAt('B8').value).toBe('Anton');
	});
	it('should not process next loop element if continue jumps backwards', async () => {
		const sheet = setupSheetInbox();
		const machine = sheet.machine;
		sheet.streamsheet.updateSettings({
			loop: { path: '[data][Positionen]', enabled: true },
			trigger: { type: 'always' }
		});
		sheet.loadCells({
			A1: { formula: 'A1+1' },
			A2: { formula: 'if(A1>2,continue(A7),false)' },
			A5: { formula: 'read(inboxdata(,,,"PosNr"), B5)' },
			A6: { formula: 'continue(A1)' },
			A7: { formula: 'A7+1' },
			A8: { formula: 'read(inboxdata(,,,"PosNr"), B8)' }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe(false);
		expect(sheet.cellAt('A5').value).toBe('PosNr');
		expect(sheet.cellAt('B5').value).toBe(1);
		expect(sheet.cellAt('A6').value).toBe(true);
		expect(sheet.cellAt('A7').value).toBe(1);
		expect(sheet.cellAt('A8').value).toBe('PosNr');
		expect(sheet.cellAt('B8').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B5').value).toBe(1);
		expect(sheet.cellAt('A7').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('B5').value).toBe(1);
		expect(sheet.cellAt('A7').value).toBe(2);
		// note: next loop element is used on next step
		expect(sheet.cellAt('B8').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B5').value).toBe(1);
		expect(sheet.cellAt('A7').value).toBe(3);
		expect(sheet.cellAt('B8').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(5);
		expect(sheet.cellAt('B5').value).toBe(1);
		expect(sheet.cellAt('A7').value).toBe(4);
		expect(sheet.cellAt('B8').value).toBe(3);
	});
	it('should handle if target cell is not defined yet', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1'},
			A2: { formula: 'if(iseven(A1),continue(A5), "go on")'},
			A4: { formula: 'A4+1'},
			A6: { formula: 'A6+1'}
		})
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe('go on');
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.cellAt('A6').value).toBe(1);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.cellAt('A6').value).toBe(2);
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.cellAt('A6').value).toBe(3);
	});
	// DL-4251
	it('should handle if target cell is undefined and beyond last defined cell', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({
			A1: { formula: 'A1+1'},
			A2: { formula: 'if(iseven(A1),continue(A5), "go on")'},
			A4: { formula: 'A4+1'}, B4: 'hello'
		})
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('A2').value).toBe('go on');
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.cellAt('B4').value).toBe('hello');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('A4').value).toBe(1);
		expect(sheet.cellAt('B4').value).toBe('hello');
		await machine.step();
		expect(sheet.cellAt('A1').value).toBe(3);
		expect(sheet.cellAt('A4').value).toBe(2);
		expect(sheet.cellAt('B4').value).toBe('hello');
	});
});
