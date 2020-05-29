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
const { TRIGGERSTEP } = require('../../src/functions');
const { FunctionErrors } = require('@cedalo/error-codes');
const { Machine, StreamSheet } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

describe('triggerstep', () => {
	it('should return an error if used in sheet directly', () => {
		const sheet = new StreamSheet().sheet.load({
			cells: { A1: { formula: 'A1+1' }, B1: { formula: 'triggerstep()' }, C1: { formula: 'if(1,triggerstep())' } }
		});
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(ERROR.INVALID);
		expect(sheet.cellAt('C1').value).toBe(ERROR.INVALID);
	});
	it('should perform a step on sheet', () => {
		const m1 = new Machine();
		const s1 = new StreamSheet();
		const sheet = s1.sheet.load({
			cells: { A1: { formula: 'A1+1' }, B1: { formula: 'getstep()' } }
		});
		m1.addStreamSheet(s1); 
		expect(sheet.cellAt('A1').value).toBe(1);
		expect(sheet.cellAt('B1').value).toBe(0);
		TRIGGERSTEP(sheet);
		expect(sheet.cellAt('A1').value).toBe(2);
		expect(sheet.cellAt('B1').value).toBe(1);
		TRIGGERSTEP(sheet);
		TRIGGERSTEP(sheet);
		expect(sheet.cellAt('A1').value).toBe(4);
		expect(sheet.cellAt('B1').value).toBe(3);
	});
});
