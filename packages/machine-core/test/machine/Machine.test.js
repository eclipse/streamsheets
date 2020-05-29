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
const {
	State,
	Machine,
	StreamSheet,
	SheetParser,
	StreamSheetTrigger
} = require('../..');

const wait = ms => new Promise((resolve) => setTimeout(resolve, ms));

describe('Machine', () => {
	it('should be possible to create a machine with config', () => {
		const machine = new Machine();
		machine.load({ id: '123', name: 'test', state: State.RUNNING });
		expect(machine.id).toBe('123');
		expect(machine.name).toBe('test');
		expect(machine.state).toBe(State.RUNNING);
	});
	it('should be possible to start a machine', () => {
		const machine = new Machine();
		expect.assertions(1);
		return machine
			.start()
			.then(() => expect(machine.state).toBe(State.RUNNING));
	});
	it('should be possible to stop a running machine', () => {
		const machine = new Machine();
		expect.assertions(1);
		return machine
			.start()
			.then(() =>
				machine
					.stop()
					.then(() => expect(machine.state).toBe(State.STOPPED))
			);
	});
	it('should be possible to pause a running machine', () => {
		const machine = new Machine();
		expect.assertions(1);
		return machine
			.start()
			.then(() =>
				machine
					.pause()
					.then(() => expect(machine.state).toBe(State.PAUSED))
			);
	});
	it('should send events on settings change', () => {
		const machine = new Machine();
		const counts = { name: 0, state: 0 };
		machine.load({ name: 'test' });
		machine.on('update', (...args) => {
			counts[args[0]] += 1;
		});
		machine.name = 'machine';
		expect.assertions(2);
		expect(counts.name).toBe(1);
		return machine
			.start()
			.then(() =>
				machine.stop().then(() => expect(counts.state).toBe(2))
			);
	});
	it('should be able to add streamsheet', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		machine.addStreamSheet(new StreamSheet());
		expect(machine.streamsheets.length).toBe(1);
	});
	it('should be not be possible to add same streamsheet twice', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		machine.addStreamSheet(streamsheet);
		expect(machine.streamsheets.length).toBe(1);
	});
	it('should be able to delete streamsheet', () => {
		const machine = new Machine();
		machine.removeAllStreamSheets();
		expect(machine.streamsheets.length).toBe(0);
		const streamsheet = new StreamSheet();
		machine.removeStreamSheet(streamsheet);
		expect(machine.streamsheets.length).toBe(0);
		machine.addStreamSheet(streamsheet);
		machine.removeStreamSheet(streamsheet);
		expect(machine.streamsheets.length).toBe(0);
	});
	it('should be possible to get added streamsheet', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.addStreamSheet(streamsheet);
		expect(machine.getStreamSheet(streamsheet.id)).toBe(streamsheet);
	});
	it('should return undefined when asking for unknown streamsheet', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		expect(machine.getStreamSheet(streamsheet.id)).toBeUndefined();
		machine.addStreamSheet(streamsheet);
		expect(machine.getStreamSheet('unknown')).toBeUndefined();
	});

	it('should not reset step count on start if machine was paused', async () => {
		const machine = new Machine();
		machine.cycletime = 1000;
		expect(machine.stats.steps).toBe(0);
		await machine.start();
		await machine.pause();
		expect(machine.stats.steps).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(machine.stats.steps).toBe(4);
		await machine.start();
		await wait(2000);
		await machine.pause();
		expect(machine.stats.steps).toBeGreaterThanOrEqual(6);
		await machine.stop();
	});
	describe('IO', () => {
		const machine = new Machine();
		const streamsheet = new StreamSheet();
		machine.load({ id: '123', name: 'test', state: State.RUNNING });
		machine.removeAllStreamSheets();
		streamsheet.load({ type: StreamSheetTrigger.TYPE.TIMER, interval: 3000 });
		machine.addStreamSheet(streamsheet);
		describe('toJSON', () => {
			it('should create a JSON object', () => {
				const jsonobj = machine.toJSON();
				expect(jsonobj).toBeDefined();
				expect(jsonobj.id).toBe('123');
				expect(jsonobj.name).toBe('test');
				expect(jsonobj.state).toBe(State.RUNNING);
				expect(jsonobj.streamsheets.length).toBe(1);
				expect(jsonobj.streamsheets[0].id).toBe(streamsheet.id);
				expect(jsonobj.streamsheets[0].trigger.type).toBe(
					streamsheet.trigger.type
				);
				expect(jsonobj.streamsheets[0].trigger.interval).toBe(
					streamsheet.trigger.interval
				);
			});
			it('should create a Machine instance from given JSON', () => {
				const newMachine = new Machine();
				newMachine.load(machine.toJSON());
				expect(newMachine).toBeDefined();
				expect(newMachine.id).toBe('123');
				expect(newMachine.name).toBe('test');
				expect(newMachine.state).toBe(State.RUNNING);
				// check StreamSheet
				const newStreamSheet = newMachine.getStreamSheet(streamsheet.id);
				expect(newStreamSheet).toBeDefined();
				expect(newStreamSheet.id).toBe(streamsheet.id);
				expect(newStreamSheet.trigger.type).toBe(
					streamsheet.trigger.type
				);
				expect(newStreamSheet.trigger.interval).toBe(
					streamsheet.trigger.interval
				);
			});
			// DL-1076:
			it('should save & load sheet named cells to & from machine JSON', () => {
				const aMachine = new Machine();
				const t1 = new StreamSheet();
				const sheet = t1.sheet;
				aMachine.removeAllStreamSheets();
				aMachine.addStreamSheet(t1);
				sheet.namedCells.set(
					'Name1',
					SheetParser.createCell({ formula: 'A1:A2' }, sheet)
				);
				// create JSON
				const jsonobj = aMachine.toJSON();
				// check for named cell:
				expect(jsonobj.streamsheets[0].sheet.namedCells).toBeDefined();
				expect(
					jsonobj.streamsheets[0].sheet.namedCells.Name1
				).toBeDefined();
				// store it to string, since this is done by machine communication as well
				const jsonstr = JSON.stringify(jsonobj);
				expect(jsonstr).toBeDefined();
				const copyjson = JSON.parse(jsonstr);
				expect(copyjson.streamsheets[0].sheet.namedCells).toBeDefined();
				expect(
					copyjson.streamsheets[0].sheet.namedCells.Name1
				).toBeDefined();
				// new machine to load json:
				const newMachine = new Machine();
				newMachine.load(copyjson);
				// check for named cell:
				const newT1 = newMachine.getStreamSheet(t1.id);
				expect(newT1).toBeDefined();
				expect(newT1.sheet.namedCells.has('Name1')).toBeTruthy();
			});
		});
	});
});
