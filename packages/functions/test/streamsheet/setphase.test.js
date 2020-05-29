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
const { createCellAt, createTerm } = require('../utilities');
const { Machine, StreamSheet } = require('@cedalo/machine-core');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

describe('setphase', () => {
	it('should only execute if sheet is processed', () => {
		const sheet = new StreamSheet().sheet;
		createCellAt('A1', true, sheet);
		createCellAt('B1', 'Hello', sheet);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(true);
		expect(sheet.cellAt('B1').value).toBe('Hello');
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(true);
		expect(sheet.cellAt('B1').value).toBe('phase1');
	});
	it('should set given text to specified cell reference if its condition is true', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', true, sheet);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(true);
		expect(sheet.cellAt('B1').value).toBe('phase1');
		createCellAt('A1', false, sheet);
		// should not change phase...
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(false);
		expect(sheet.cellAt('B1').value).toBe('phase1');
	});
	// DL-2142
	it('should not overwrite formula of target cell by default', () => {
		const machine = new Machine();
		const t1 = new StreamSheet();
		const sheet = t1.sheet.loadCells({
			A1: true, B1: { formula: 'B1+1' }, C1: { formula: 'B1' },
			A2: { formula: 'setphase(A1, "phase1", C1)' }
		});
		machine.addStreamSheet(t1);
		t1.step(true);
		expect(sheet.cellAt('B1').value).toBe(2);
		expect(sheet.cellAt('C1').value).toBe('phase1');
		expect(sheet.cellAt('C1').formula).toBe('B1');
		// set A1 to false => condition not fulfilled => C1 will use value from formula
		createCellAt('A1', false, sheet);
		t1.step(true);
		expect(sheet.cellAt('B1').value).toBe(3);
		expect(sheet.cellAt('C1').value).toBe(3);
		expect(sheet.cellAt('C1').formula).toBe('B1');
	});
	it('should overwrite formula of target cell if specified by overwrite parameter', () => {
		const machine = new Machine();
		const t1 = new StreamSheet();
		const sheet = t1.sheet.loadCells({
			A1: true, B1: { formula: 'B1+1' }, C1: { formula: 'B1' },
			A2: { formula: 'setphase(A1, "phase1", C1, true)' }
		});
		machine.addStreamSheet(t1);
		t1.step(true);
		expect(sheet.cellAt('B1').value).toBe(2);
		expect(sheet.cellAt('C1').value).toBe('phase1');
		expect(sheet.cellAt('C1').formula).toBeUndefined();
		createCellAt('A1', false, sheet);
		t1.step(true);
		expect(sheet.cellAt('B1').value).toBe(3);
		expect(sheet.cellAt('C1').value).toBe('phase1');
	});
	it('should do nothing if condition is not fulfilled', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		createCellAt('A1', false, sheet);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(false);
		expect(sheet.cellAt('B1')).toBeUndefined();
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(false);
		expect(sheet.cellAt('B1')).toBeUndefined();
		createCellAt('A1', true, sheet);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(true);
		expect(sheet.cellAt('B1').value).toBe('phase1');
		createCellAt('A1', false, sheet);
		expect(createTerm('setphase(A1, "phase1", B1)', sheet).value).toBe(false);
		expect(sheet.cellAt('B1').value).toBe('phase1');
	});
	it('should return error codes if called with not sufficient arguments', () => {
		const sheet = new StreamSheet().sheet;
		// simulate sheet processing...
		sheet.forceExecution(true);
		expect(createTerm('setphase()', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('setphase(A1)', sheet).value).toBe(ERROR.ARGS);
		expect(createTerm('setphase(A1, "phase2")', sheet).value).toBe(ERROR.ARGS);
	});
});
