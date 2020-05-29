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
const { celljson } = require('./utils');
const { SheetIndex, StreamSheet, StreamSheetTrigger } = require('../..');


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
});
