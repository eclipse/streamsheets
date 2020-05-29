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
const { SheetIndex, StreamSheet } = require('@cedalo/machine-core');


describe('goto', () => {
	it('should jump to defined cell', () => {
		/* eslint-disable */
		const cells = {
			A1: { formula: 'goto(A2)' }, B1: { formula: 'B1+1' }, C1: { formula: 'C1+1' }, D1: { formula: 'goto(C2)' },
			A2: { formula: 'goto(C1)' }, B2: { formula: 'B2+1' }, C2: { formula: 'C2+1' }, D2: { formula: 'goto(C3)' },
			A3: { formula: 'A3+1' }, B3: { formula: 'B3+1'}, C3: { formula: 'C3+1' }, D3: { formula: 'D3+1' }, E3: { formula: 'goto(A4)' },
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
	it('should jump to IF col', () => {
		/* eslint-disable */
		const cells = {
			IF1: true, B1: { formula: 'B1+1' }, C1: { formula: 'goto(IF3)' },
			IF2: { formula: 'goto(IF4)' }, B2: { formula: 'B2+1' }, C2: { formula: 'C2+1' },
			IF3: { formula: 'goto(IF2)' }, B3: { formula: 'B3+1' }, C3: { formula: 'C3+1' },
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
});
