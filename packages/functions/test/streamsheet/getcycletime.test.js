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
const { GETCYCLETIME } = require('../../src/functions/streamsheet').functions;
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

describe('getcycletime', () => {
	it('should return machine cycletime currently used', () => {
		const { sheet, machine } = setup();
		// by default a machine has a cycletime of 1000ms
		expect(GETCYCLETIME(sheet)).toBe(1000);
		machine.cycletime = 4000;
		expect(GETCYCLETIME(sheet)).toBe(4000);
	});
	it('should work inside a sheet', () => {
		const cells = { A1: { formula: 'A1+1' }, B1: { formula: 'getcycletime()' } };
		const { sheet, machine } = setup();
		sheet.load({ cells });
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(2);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(1000);
		machine.cycletime = 50;
		sheet.startProcessing();
		expect(sheet.cellAt(SheetIndex.create('A1')).value).toBe(3);
		expect(sheet.cellAt(SheetIndex.create('B1')).value).toBe(50);
	});
	it('should return error if no sheet or no machine available', () => {
		const sheet = new StreamSheet().sheet;
		expect(GETCYCLETIME()).toBe(ERROR.ARGS);
		expect(GETCYCLETIME(sheet)).toBe(ERROR.NO_MACHINE);
	});
});
