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
const { createTerm, createCellAt } = require('../utilities');
const { Cell, Machine, StreamSheet, StreamSheetTrigger } = require('@cedalo/machine-core');

const setup = () => {
	const machine = new Machine();
	const streamsheet = new StreamSheet();
	machine.addStreamSheet(streamsheet);
	return { sheet: streamsheet.sheet, machine };
};
const step = (machine) => {
	machine.stats.steps += 1;
};

const stepAfter = (ms, machine) => new Promise((resolve) => {
	const stepIt = () => {
		step(machine);
		resolve(machine);
	};
	setTimeout(stepIt, ms);
});

describe('detectchange', () => {
	it('should not return FALSE on first run if condition is true', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeDefined();
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
	});
	it('returns TRUE if condition result changes from FALSE to TRUE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeUndefined();
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeDefined();
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
	});
	it('does not matter if period is set to 0 or not set at all', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeUndefined();
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		expect(sheet.cellAt('A4')).toBeDefined();
	});
	it('should still return TRUE if condition is FALSE but current calculation is in specified period ms ', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detectchange = createTerm('detectchange(A1, 40000, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
	});
	it('should return FALSE if condition is FALSE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeUndefined();
	});
	it('should return FALSE if condition is FALSE and next calculation is in specified period ms ', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 4000, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		expect(sheet.cellAt('A4')).toBeUndefined();
	});
	it('should return FALSE if condition is TRUE and last result was TRUE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
	});
	it('should return TRUE after a specified delay', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4, 1000)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
	});
	it('should still return TRUE if condition is FALSE but current calculation is in specified period ms', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detectchange = createTerm('detectchange(A1, 40000, A3, A4)', sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
		step(machine);
		expect(detectchange.value).toBe(true);
		expect(sheet.cellAt('A3').value).toBe(true);
	});

	it('should return TRUE after a specified delay and for as long as given period', async () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 2000, A3, A4, 1000)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		await stepAfter(2000, machine);
		expect(detectchange.value).toBe(true);
		await stepAfter(2000, machine);
		expect(detectchange.value).toBe(false);
	});
	it('should return TRUE only once after a specified delay if no period is given', async () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detectchange = createTerm('detectchange(A1, 0, A3, A4, 1000)', sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detectchange.value).toBe(false);
		expect(sheet.cellAt('A3').value).toBe(true);
		await stepAfter(1500, machine);
		expect(detectchange.value).toBe(true);
		step(machine);
		expect(detectchange.value).toBe(false);
	});
	// DL-1311
	it('should write timestamp to specified cell if TRUE is detected', () => {
		const t1 = new StreamSheet();
		const sheet = t1.sheet.load({ cells: { 
			A1: { formula: 'IF(A2>5,TRUE,FALSE)' }, 
			A2: 5, C2: { formula: 'DETECTCHANGE(A1,,A4,A5)' }
		} });
		const machine = new Machine();
		machine.addStreamSheet(t1);
		// sheet.processor._isProcessing = true;
		t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS });
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(5);
		expect(sheet.cellAt('A1').value).toBe(false);
		expect(sheet.cellAt('C2').value).toBe(false);
		expect(sheet.cellAt('A4').value).toBe(false);
		expect(sheet.cellAt('A5')).toBeUndefined();
		t1.step();
		sheet.setCellAt('A2', new Cell(6));
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(6);
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C2').value).toBe(true);
		expect(sheet.cellAt('A4').value).toBe(true);
		expect(sheet.cellAt('A5').value).toBeDefined();
		// timestamp is reset since detectchange fired
		expect(sheet.cellAt('A5').value).toBe(-1);
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(6);
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C2').value).toBe(false);
		expect(sheet.cellAt('A4').value).toBe(true);
		expect(sheet.cellAt('A5').value).toBeDefined();
		// timestamp same since no change detected
		expect(sheet.cellAt('A5').value).toBe(-1);
	});
});
describe('edge.detect', () => {
	it('should not return FALSE on first run if condition is true', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detect = createTerm('edge.detect(A1, 0)', sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(false);
	});
	it('returns TRUE if condition result changes from FALSE to TRUE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, 0)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
	});
	it('does not matter if period is set to 0 or not set at all', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, 0)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
	});
	it('should still return TRUE if condition is FALSE but current calculation is in specified period ms ', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detect = createTerm('edge.detect(A1, 40000)', sheet);
		step(machine);
		expect(detect.value).toBe(true);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(true);
	});
	it('should return FALSE if condition is FALSE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
	});
	it('should return FALSE if condition is FALSE and next calculation is in specified period ms ', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, 4000)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
	});
	it('should return FALSE if condition is TRUE and last result was TRUE', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detect = createTerm('edge.detect(A1)', sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(false);
		step(machine);
		expect(detect.value).toBe(false);
	});
	it('should return TRUE after a specified delay', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, , 1000)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(false);
	});
	it('should still return TRUE if condition is FALSE but current calculation is in specified period ms', () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', true, sheet);
		const detect = createTerm('edge.detect(A1, 40000)', sheet);
		step(machine);
		expect(detect.value).toBe(true);
		createCellAt('A1', false, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(true);
	});
	it('should return TRUE after a specified delay and for as long as given period', async () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, 2000, 1000)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(false);
		await stepAfter(2000, machine);
		expect(detect.value).toBe(true);
		await stepAfter(2000, machine);
		expect(detect.value).toBe(false);
	});
	it('should return TRUE only once after a specified delay if no period is given', async () => {
		const { machine, sheet } = setup();
		sheet.processor._isProcessing = true;
		createCellAt('A1', false, sheet);
		const detect = createTerm('edge.detect(A1, 0, 1000)', sheet);
		step(machine);
		expect(detect.value).toBe(false);
		createCellAt('A1', true, sheet);
		step(machine);
		expect(detect.value).toBe(false);
		await stepAfter(1500, machine);
		expect(detect.value).toBe(true);
		step(machine);
		expect(detect.value).toBe(false);
	});
	// DL-1311
	it('should write timestamp to specified cell if TRUE is detected', () => {
		const t1 = new StreamSheet();
		const sheet = t1.sheet.load({ cells: { 
			A1: { formula: 'IF(A2>5,TRUE,FALSE)' }, 
			A2: 5, C2: { formula: 'edge.detect(A1)' }
		} });
		const machine = new Machine();
		machine.addStreamSheet(t1);
		// sheet.processor._isProcessing = true;
		t1.trigger = StreamSheetTrigger.create({ type: StreamSheetTrigger.TYPE.ALWAYS });
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(5);
		expect(sheet.cellAt('A1').value).toBe(false);
		expect(sheet.cellAt('C2').value).toBe(false);
		t1.step();
		sheet.setCellAt('A2', new Cell(6));
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(6);
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C2').value).toBe(true);
		t1.step();
		expect(sheet.cellAt('A2').value).toBe(6);
		expect(sheet.cellAt('A1').value).toBe(true);
		expect(sheet.cellAt('C2').value).toBe(false);
	});
});
