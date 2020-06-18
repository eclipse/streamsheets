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
// const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, SheetParser, StreamSheet } = require('@cedalo/machine-core');
const { createCellAt } = require('../utilities');
const { pendingRequest, runFunction } = require('../../src/utils');

// const ERROR = FunctionErrors.code;

const noop = () => {};

const testRequest = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.run(() => pendingRequest.create2(sheet, testRequest.context, () => new Promise(noop)));
SheetParser.context.functions['TEST.REQUEST'] = testRequest;


describe('pendingRequest utilities', () => {
	it('should register dispose listener only once', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ A1: { formula: 'test.request()' }	});
		const context = sheet.cellAt('A1').term.context;
		await machine.step();
		expect(context.getDisposeListeners().length).toBe(1);
		await machine.step();
		await machine.step();
		await machine.step();
		expect(context.getDisposeListeners().length).toBe(1);
	});
	it('should remove request from sheets pending list on replace or delete', async () => {
		const machine = new Machine();
		const sheet = new StreamSheet().sheet;
		machine.addStreamSheet(sheet.streamsheet);
		sheet.loadCells({ 
			A1: { formula: 'test.request()' },
			A2: { formula: 'test.request()' }
		});
		await machine.step();
		const reqId1 = sheet.cellAt('A1').value;
		const reqId2 = sheet.cellAt('A2').value;
		expect(sheet.getPendingRequests().get(reqId1).status).toBe('pending');
		expect(sheet.getPendingRequests().get(reqId2).status).toBe('pending');
		createCellAt('A1', 'replacedA1', sheet);
		expect(sheet.cellAt('A1').value).toBe('replacedA1');
		expect(sheet.getPendingRequests().get(reqId1)).toBeUndefined();
		expect(sheet.getPendingRequests().get(reqId2).status).toBe('pending');
		await machine.step();
		createCellAt('A2', 'replacedA2', sheet);
		expect(sheet.cellAt('A2').value).toBe('replacedA2');
		expect(sheet.getPendingRequests().get(reqId1)).toBeUndefined();
		expect(sheet.getPendingRequests().get(reqId2)).toBeUndefined();
	});
});