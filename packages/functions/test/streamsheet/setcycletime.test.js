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
const { SETCYCLETIME } = require('../../src/functions');
const { Term } = require('@cedalo/parser');
const { Machine, SheetIndex, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const setup = (cycletime = 1000) => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.cycletime = cycletime;
	machine.addStreamSheet(streamsheet);
	return { sheet: streamsheet.sheet, machine };
};

describe('setcycletime', () => {
	it('should set machine cycletime', async () => {
		const cells = { A1: { formula: 'A1+1' }, B1: { formula: 'getcycletime()' } };
		const { sheet, machine } = setup();
		sheet.load({ cells });
		await machine.step();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1000);
		machine.cycletime = 50;
		await machine.step();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(50);
	});
	it('should not be possible to set a cycletime < 1', () => {
		const { sheet } = setup();
		expect(SETCYCLETIME(sheet, Term.fromNumber(0)).code).toBe(ERROR.VALUE);
		expect(SETCYCLETIME(sheet, Term.fromNumber(-1)).code).toBe(ERROR.VALUE);
	});
	it('should return error if no valid parameters are provided', () => {
		const { sheet } = setup();
		const invalidSheet = new StreamSheet().sheet;
		expect(SETCYCLETIME().code).toBe(ERROR.ARGS);
		expect(SETCYCLETIME(sheet).code).toBe(ERROR.ARGS);
		expect(SETCYCLETIME(invalidSheet, Term.fromNumber(4000)).code).toBe(ERROR.NO_MACHINE);
		expect(SETCYCLETIME(sheet, Term.fromString('abc')).code).toBe(ERROR.VALUE);
	});
});
