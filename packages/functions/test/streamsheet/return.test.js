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
const { RETURN } = require('../../src/functions/streamsheet').functions;
const { Machine, SheetIndex, StreamSheet } = require('@cedalo/machine-core');

let sheet;
beforeEach(() => {
	const machine = new Machine();
	const t1 = new StreamSheet();
	t1.name = 'T1';
	machine.removeAllStreamSheets();
	machine.addStreamSheet(t1);
	sheet = t1.sheet;
});

describe('return', () => {
	it('should return true on success and no return value', () => {
		// simulate processing:
		sheet.processor._isProcessing = true;
		expect(RETURN(sheet)).toBe(true);
	});
	it('should stop current processing', () => {
		/* eslint-disable */
		const cells = {
			A1: 'A1', B1: { formula: 'B1+1' }, C1: { formula: 'return()' },
			A2: { formula: 'A2+1' }, B2: { formula: 'B2+1' }
		};/* eslint-enable */
		sheet.load({ cells });
		sheet.startProcessing();
		expect(sheet.isProcessing).toBe(false);
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe('A1');
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('C1')).value).toBe(true);
		expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(1);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(1);
	});
	it('should return a provided value', () => {
		/* eslint-disable */
		const cells = {
			A1: 'A1', B1: { formula: 'B1+1' },
			A2: { formula: 'A2+1' }, B2: { formula: 'B2+1' }, C2: { formula: 'return(B2)' }
		};/* eslint-enable */
		sheet.load({ cells });
		const result = sheet.startProcessing();
		expect(result).toBe(2);
		expect(sheet.isProcessing).toBe(false);
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe('A1');
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('A2')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('B2')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('C2')).value).toBe(2);
	});
	it('should do nothing if sheet is not processed', () => {
		expect(RETURN(sheet)).toBe(true);
	});
});
